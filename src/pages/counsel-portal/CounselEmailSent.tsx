import { Link, useLocation } from 'react-router-dom'
import './CounselEmailSent.css'

type EmailSentState = {
  requestId?: string
  subject?: string
  to?: string
  cc?: string
  from?: string
  emailSubject?: string
  calendlyLink?: string
  availabilityWindow?: string
}

const fallbackEmailState: EmailSentState = {
  calendlyLink: 'https://calendly.com/CounselID/30min',
}

function readStoredEmailState() {
  try {
    return JSON.parse(sessionStorage.getItem('tsl-counsel-email-preview') ?? '{}') as EmailSentState
  } catch {
    return {}
  }
}

export default function CounselEmailSent() {
  const location = useLocation()
  const state = {
    ...fallbackEmailState,
    ...readStoredEmailState(),
    ...((location.state ?? {}) as EmailSentState),
  }

  return (
    <main className="counsel-email-sent">
      <section className="counsel-email-sent__content" aria-label="Email sent confirmation">
        <div className="counsel-email-sent__copy">
          <h1>Email</h1>
          <p>An email is sent to the user once the counsel accepts the request, including the meeting link.</p>
          <a href={state.calendlyLink} target="_blank" rel="noreferrer">
            {state.calendlyLink}
          </a>
        </div>

        <Link to="/counsel/dashboard" className="counsel-email-sent__back">
          Back to Dashboard
        </Link>
      </section>
    </main>
  )
}
