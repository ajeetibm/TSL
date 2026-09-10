import { CheckCircle2, CreditCard } from 'lucide-react'
import { BackButton } from '../../components/dashboard/BackButton'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { paymentApi } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import { setPageMetadata } from '../../services/metadata'
import type { CounselCredits } from '../../services/dashboardTypes'
import type { TopUpPlan } from './CounselCreditsModal'
import './Dashboard.css'
import './CounselTopUpPayment.css'

const MIN_CREDITS = 1
const MAX_CREDITS = 20
function getStoredUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }
    return user.email || 'user@example.com'
  } catch {
    return 'user@example.com'
  }
}

function fmtZAR(amount: number) {
  return `R${amount.toLocaleString('en-ZA')}`
}

export type CounselTopUpReturnState = {
  pathname: string
  state?: Record<string, unknown>
}

export default function CounselTopUpPayment() {
  const location = useLocation()
  const navigate  = useNavigate()

  const requestedPlan = location.state?.plan as TopUpPlan | undefined
  const credits = location.state?.credits as CounselCredits | undefined
  const returnTo = location.state?.returnTo as CounselTopUpReturnState | undefined
  // The selected tier comes from the plan configuration returned by the API.
  // It determines this one-off Counsel credit purchase only.
  const plan = requestedPlan

  setPageMetadata('Top Up Credits', 'Purchase additional counsel credits.')

  // Default qty to the plan's included credits (Operator=2, Boardroom=6) so the
  // user tops up the natural batch size for that tier. Floor at 1 for Launchpad (0 included).
  const defaultQty = Math.max(1, plan?.credits ?? 1)
  const [qty,      setQty]      = useState(defaultQty)
  const [isPaying, setIsPaying] = useState(false)
  const [error,    setError]    = useState('')

  // Guard: if no plan was passed, redirect back
  if (!plan || !requestedPlan) {
    navigate('/dashboard/counsel', { replace: true })
    return null
  }

  // ── order calculations ───────────────────────────────────────────────────
  const unitPrice = plan.ratePerCredit
  const total     = unitPrice * qty

  // ── quantity handlers ────────────────────────────────────────────────────
  const clamp = (n: number) => Math.max(MIN_CREDITS, Math.min(MAX_CREDITS, n))

  function _handleQtyInput(raw: string) {
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n)) setQty(clamp(n))
    else if (raw === '') setQty(MIN_CREDITS)
  }

  // ── payment handler ──────────────────────────────────────────────────────
  async function handleProceedToPay() {
    if (isPaying) return
    setError('')
    setIsPaying(true)

    const result = await openPaystackCheckout({
      amount:          total,
      currency:        'ZAR',
      email:           getStoredUserEmail(),
      plan:            plan!.name,
      paymentMethod:   'card',
      selectedWizards: [],
      totalWizards:    0,
    })

    if (result.status === 'cancelled') {
      setError('Payment cancelled. You can try again when ready.')
      setIsPaying(false)
      return
    }

    if (result.status === 'failed') {
      setError(result.message || 'Payment failed. Please try again.')
      setIsPaying(false)
      return
    }

    // A Counsel tier is a purchase choice, not a subscription upgrade. The
    // backend records the selected tier's rate while leaving the account plan unchanged.
    const verification = await paymentApi.verifyPaystack({
      reference:  result.reference,
      plan:       plan!.name,
      credits:    qty,
      amountPaid: total,
      type:       'counsel-topup',
    })

    if (!verification.success || verification.data?.status !== 'success') {
      setError(verification.message || 'We could not verify the payment. No credits were added.')
      setIsPaying(false)
      return
    }

    setIsPaying(false)

    if (credits) {
      const updatedCredits: CounselCredits = {
        ...credits,
        creditsRemaining: credits.creditsRemaining + qty,
      }
      sessionStorage.setItem('tsl-counsel-credits-session', JSON.stringify(updatedCredits))
    }

    navigate(returnTo?.pathname ?? '/dashboard/counsel', {
      replace: true,
      state: {
        ...(returnTo?.state ?? {}),
        topUpSuccess: true,
        creditsAdded: qty,
      },
    })
  }

  return (
    <DashboardShell activeSection="Counsel">
      <main className="counsel-topup-payment">
        <header className="counsel-topup-payment__header">
          <BackButton to="/dashboard/counsel" label="Back to Counsel" />
          <div>
            <h1>Top Up Credits</h1>
            <p>Complete your credit purchase</p>
          </div>
        </header>

        <div className="counsel-topup-payment__content">

          <div className="counsel-topup-payment__layout">

            {/* ── Plan summary card ── */}
            <section className="counsel-topup-payment__plan-card">
              <h2>Selected Counsel Tier</h2>
              <div className="counsel-topup-payment__plan-name">{plan.name}</div>

              <ul className="counsel-topup-payment__plan-details">
                <li>
                  <span>Included monthly credits</span>
                  <strong>{plan.credits}</strong>
                </li>
                <li>
                  <span>Credits used</span>
                  <strong>{credits?.creditsUsed ?? 0}</strong>
                </li>
                <li>
                  <span>Credits remaining</span>
                  <strong>{credits?.creditsRemaining ?? 0}</strong>
                </li>
                <li>
                  <span>Response Time SLA</span>
                  <strong>{plan.sla}</strong>
                </li>
                <li>
                  <span>Rate per credit</span>
                  <strong>{fmtZAR(plan.ratePerCredit)}</strong>
                </li>
              </ul>
            </section>

            {/* ── Payment summary card ── */}
            <section className="counsel-topup-payment__summary-card">
              <div className="counsel-topup-payment__summary-header">
                <CreditCard size={22} />
                <h2>Payment Summary</h2>
              </div>

              {/* Quantity selector */}
              <div className="counsel-topup-payment__qty-row">
                <span className="counsel-topup-payment__qty-label">Credits to purchase</span>
                <div className="counsel-topup-payment__qty-controls">
                  <span className="counsel-topup-payment__qty-input counsel-topup-payment__qty-input--static">{qty}</span>
                </div>
              </div>

              {/* Order breakdown */}
              <ul className="counsel-topup-payment__summary-rows">
                <li>
                  <span>
                    {plan.name} Top-Up ({qty} credit{qty !== 1 ? 's' : ''} × {fmtZAR(unitPrice)})
                  </span>
                  <span>{fmtZAR(total)}</span>
                </li>
              </ul>

              <div className="counsel-topup-payment__total">
                <span>Total</span>
                <strong>{fmtZAR(total)}</strong>
              </div>

              {error && (
                <p className="counsel-topup-payment__error" role="alert">{error}</p>
              )}

              <button
                type="button"
                className="counsel-topup-payment__cta"
                onClick={handleProceedToPay}
                disabled={isPaying}
              >
                <CheckCircle2 size={18} />
                {isPaying ? 'Processing…' : `Pay ${fmtZAR(total)}`}
              </button>

              <p className="counsel-topup-payment__secure-note">
                Secured via Paystack · ZAR
              </p>
            </section>

          </div>
        </div>
      </main>
    </DashboardShell>
  )
}
