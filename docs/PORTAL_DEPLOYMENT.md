# TSL multi-domain deployment

One frontend build is served for all portal hostnames. The hostname selects the
portal; it is not a separate frontend codebase.

| Hostname | Entry point | Allowed session portal |
| --- | --- | --- |
| `thestartuplegal.co.za` | Marketing site | none |
| `app.thestartuplegal.co.za` | Client sign-in/dashboard | `sme` |
| `admin.thestartuplegal.co.za` | Admin sign-in/dashboard | `admin` |
| `counsel.thetsartuplegal.co.za` | Counsel sign-in/dashboard | `counsel` |

## Automatic role routing

Marketing-site sign-in is role-neutral. The API authenticates the account and
returns its server-owned `portal` value (`sme`, `admin`, or `counsel`). The
frontend then automatically redirects to the matching portal hostname:

```text
thestartuplegal.co.za sign-in
  → API resolves the account role
  → app.thestartuplegal.co.za       (sme)
  → admin.thestartuplegal.co.za     (admin)
  → counsel.thetsartuplegal.co.za   (counsel)
```

Before redirecting, the frontend requests a one-time, 60-second portal handoff
code. The destination exchanges the code for a fresh session. The JWT is never
included in the redirect URL. A production backend should implement the same
two endpoints: `POST /api/v1/auth/portal-handoffs` (authenticated) and
`POST /api/v1/auth/portal-handoffs/exchange` (one-time code).

`counsel.thetsartuplegal.co.za` is intentionally kept exactly as requested.
It is a different parent domain from `thestartuplegal.co.za`; if it is a typo,
change `VITE_COUNSEL_URL`, `PUBLIC_COUNSEL_URL`, DNS, and the CORS allowlist to
`https://counsel.thestartuplegal.co.za` together.

Because it is a different parent domain, a cookie for
`.thestartuplegal.co.za` cannot be shared with that counsel hostname. The
current bearer-token path supports it, but the recommended production hostname
is `counsel.thestartuplegal.co.za` so all portal sessions can use the same
first-party cookie policy.

## Frontend build environment

Set these during the CI build (Vite embeds `VITE_*` values into the bundle):

```dotenv
VITE_API_BASE_URL=https://api.thestartuplegal.co.za
VITE_MARKETING_URL=https://thestartuplegal.co.za
VITE_APP_URL=https://app.thestartuplegal.co.za
VITE_ADMIN_URL=https://admin.thestartuplegal.co.za
VITE_COUNSEL_URL=https://counsel.thetsartuplegal.co.za
```

For local development, use `VITE_API_BASE_URL=http://localhost:8080` and set
`VITE_PORTAL=marketing`, `sme`, `admin`, or `counsel` before running Vite.
This emulates a hostname on `localhost`.

## API / backend environment

The mock server demonstrates the production contract. Configure the real API
with the same public URLs and allow only these frontend origins for CORS:

```dotenv
PUBLIC_APP_URL=https://app.thestartuplegal.co.za
PUBLIC_ADMIN_URL=https://admin.thestartuplegal.co.za
PUBLIC_COUNSEL_URL=https://counsel.thetsartuplegal.co.za
AUTH_COOKIE_DOMAIN=.thestartuplegal.co.za
AUTH_COOKIE_SECURE=true
```

The backend must determine roles from its database/JWT and reject requests that
do not have the required role. Frontend route checks are convenience only; they
are not authorization.

## DevOps checklist

1. Create DNS records for the four frontend names and `api.thestartuplegal.co.za`.
2. Terminate TLS for each name. Serve the same built frontend files from all
   four frontend hosts, with an SPA fallback to `index.html`.
3. Deploy the API separately and set its CORS allowlist to the four HTTPS
   frontend origins. Do not use `*` with credentialed requests.
4. Build the frontend with the production `VITE_*` values and deploy the
   resulting `dist/` folder. A URL change requires a new frontend build.
5. Keep mock-server credentials and in-memory state out of production. Replace
   its service layer with database, password hashing, and real email delivery;
   keep the `/api/v1` response shapes unchanged.

The UI sends `credentials: 'include'` so a future backend can use an HttpOnly
session cookie. It also continues to send the mock server's bearer token during
the transition, so no frontend API consumer needs to change when the backend is
introduced.
