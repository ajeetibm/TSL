import { ArrowLeft, CheckCircle2, CreditCard, Minus, Plus, Scale } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { counselApi, paymentApi } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import { setPageMetadata } from '../../services/metadata'
import type { CounselCredits } from '../../services/dashboardTypes'
import type { TopUpPlan } from './CounselCreditsModal'
import './Dashboard.css'
import './CounselTopUpPayment.css'

const VAT_RATE = 0.15
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

export default function CounselTopUpPayment() {
  const location = useLocation()
  const navigate  = useNavigate()

  const plan    = location.state?.plan    as TopUpPlan      | undefined
  const credits = location.state?.credits as CounselCredits | undefined

  setPageMetadata('Top Up Credits', 'Purchase additional counsel credits.')

  const [qty,      setQty]      = useState(1)
  const [isPaying, setIsPaying] = useState(false)
  const [error,    setError]    = useState('')

  // Guard: if no plan was passed, redirect back
  if (!plan) {
    navigate('/dashboard/counsel', { replace: true })
    return null
  }

  // ── order calculations ───────────────────────────────────────────────────
  const unitPrice  = plan.ratePerCredit
  const subtotal   = unitPrice * qty
  const vat        = Math.round(subtotal * VAT_RATE)
  const total      = subtotal + vat

  // ── quantity handlers ────────────────────────────────────────────────────
  const clamp = (n: number) => Math.max(MIN_CREDITS, Math.min(MAX_CREDITS, n))

  function handleQtyInput(raw: string) {
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

    // Verify with backend — this records the transaction and activates credits
    const verification = await paymentApi.verifyPaystack({
      reference:  result.reference,
      plan:       plan!.name,
      credits:    qty,
      amountPaid: total,
      type:       'counsel-topup',
    })

    // Credit the account. If verification succeeded, the backend already added
    // credits inside verifyPayment (counsel-topup branch). We also call
    // topUpCredits explicitly so the credits GET reflects the new total
    // immediately — the handler is idempotent on duplicate references.
    if (verification.success) {
      await counselApi.topUpCredits({
        plan:       plan!.name,
        credits:    qty,
        amountPaid: total,
        currency:   'ZAR',
        reference:  result.reference,
      })
    }

    setIsPaying(false)

    navigate('/dashboard/counsel', {
      replace: true,
      state:   { topUpSuccess: true, creditsAdded: qty },
    })
  }

  return (
    <DashboardShell activeSection="Counsel">
      <main className="counsel-topup-payment">
        <header className="counsel-topup-payment__header">
          <span className="counsel-topup-payment__header-marker" aria-hidden="true">
            <Scale size={18} />
          </span>
          <div>
            <h1>Top Up Credits</h1>
            <p>Complete your credit purchase</p>
          </div>
        </header>

        <div className="counsel-topup-payment__content">
          <button
            type="button"
            className="counsel-topup-payment__back"
            onClick={() => navigate('/dashboard/counsel')}
          >
            <ArrowLeft size={16} />
            Back to Counsel
          </button>

          <div className="counsel-topup-payment__layout">

            {/* ── Plan summary card ── */}
            <section className="counsel-topup-payment__plan-card">
              <h2>Selected Plan</h2>
              <div className="counsel-topup-payment__plan-name">{plan.name}</div>

              <ul className="counsel-topup-payment__plan-details">
                {credits && (
                  <>
                    <li>
                      <span>Included monthly credits</span>
                      <strong>{credits.creditsTotal}</strong>
                    </li>
                    <li>
                      <span>Credits used</span>
                      <strong>{credits.creditsUsed}</strong>
                    </li>
                    <li>
                      <span>Credits remaining</span>
                      <strong>{credits.creditsRemaining}</strong>
                    </li>
                  </>
                )}
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
                  <button
                    type="button"
                    className="counsel-topup-payment__qty-btn"
                    aria-label="Remove one credit"
                    disabled={qty <= MIN_CREDITS || isPaying}
                    onClick={() => setQty((q) => clamp(q - 1))}
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    type="number"
                    className="counsel-topup-payment__qty-input"
                    min={MIN_CREDITS}
                    max={MAX_CREDITS}
                    value={qty}
                    disabled={isPaying}
                    aria-label="Number of credits"
                    onChange={(e) => handleQtyInput(e.target.value)}
                    onBlur={() => setQty(clamp(qty))}
                  />
                  <button
                    type="button"
                    className="counsel-topup-payment__qty-btn"
                    aria-label="Add one credit"
                    disabled={qty >= MAX_CREDITS || isPaying}
                    onClick={() => setQty((q) => clamp(q + 1))}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Order breakdown */}
              <ul className="counsel-topup-payment__summary-rows">
                <li>
                  <span>
                    {plan.name} Top-Up ({qty} credit{qty !== 1 ? 's' : ''} × {fmtZAR(unitPrice)})
                  </span>
                  <span>{fmtZAR(subtotal)}</span>
                </li>
                <li>
                  <span>VAT (15%)</span>
                  <span>{fmtZAR(vat)}</span>
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
                Secured via Paystack · ZAR · VAT incl.
              </p>
            </section>

          </div>
        </div>
      </main>
    </DashboardShell>
  )
}
