/**
 * pfReviewStore.ts
 *
 * Lightweight localStorage store for public-funding review requests submitted
 * from the Founders Agreement wizard.  Shared between Dashboard.tsx (writer)
 * and DashboardCounsel.tsx (reader) so all submissions appear in Request History
 * regardless of whether the backend list endpoint returns them.
 *
 * Each submission is stored under a unique `localId` (timestamp + random suffix)
 * so that multiple submissions that happen to receive the same `requestId` from
 * the backend (idempotent API behaviour) are still stored and displayed as
 * separate entries.
 */

export const PF_REVIEW_REQUESTS_KEY = 'tsl-pf-review-requests'

export type StoredPfRequest = {
  /** Unique local key — never collides even if requestId is reused by the backend. */
  localId: string
  /** The requestId returned by the backend (may be the same across submissions). */
  requestId: string
  subject: string
  status: string
  submittedAt: string
}

export function readPfReviewRequests(): StoredPfRequest[] {
  try {
    const raw = localStorage.getItem(PF_REVIEW_REQUESTS_KEY)
    return raw ? (JSON.parse(raw) as StoredPfRequest[]) : []
  } catch { return [] }
}

/** Always appends a new entry — uniqueness is on localId, not requestId. */
export function appendPfReviewRequest(entry: Omit<StoredPfRequest, 'localId'>): void {
  try {
    const existing = readPfReviewRequests()
    const localId = `pf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    localStorage.setItem(
      PF_REVIEW_REQUESTS_KEY,
      JSON.stringify([...existing, { localId, ...entry }]),
    )
  } catch { /* ignore */ }
}

/** Update the stored status for every entry that matches a given requestId. */
export function updatePfReviewStatus(requestId: string, status: string): void {
  try {
    const existing = readPfReviewRequests()
    const next = existing.map((r) =>
      r.requestId === requestId ? { ...r, status } : r,
    )
    localStorage.setItem(PF_REVIEW_REQUESTS_KEY, JSON.stringify(next))
  } catch { /* ignore */ }
}
