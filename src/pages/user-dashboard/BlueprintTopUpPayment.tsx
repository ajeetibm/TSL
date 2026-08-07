import { ArrowLeft, CheckCircle2, CreditCard, Minus, Plus, Zap } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { paymentApi, subscriptionApi } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import { openMockPaymentCheckout } from '../../services/mockPaymentClient'
import { setPageMetadata } from '../../services/metadata'
import './Dashboard.css'
import './CounselTopUpPayment.css'

const PRICE_PER_UNIT = 250
const VAT_RATE = 0.15
const MIN_UNITS = 1
const MAX_UNITS = 100

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

export type BlueprintTopUpLocationState = {
  units: number
  blueprintName: string
  pricePerUnit?: number
}

export default function BlueprintTopUpPayment() {
  const location = useLocation()
  const navigate = useNavigate()

  const state = location.state as BlueprintTopUpLocationState | null
  const pricePerUnit = state?.pricePerUnit ?? PRICE_PER_UNIT
  const blueprintName = state?.blueprintName ?? 'Blueprint'
  const minimumUnits = Math.max(MIN_UNITS, state?.units ?? MIN_UNITS)

  setPageMetadata('Purchase Blueprint Credits', 'Top up your Blueprint Units to continue.')

  const [qty, setQty] = useState(minimumUnits)
  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState('')

  // Guard: must arrive with state
  if (!state) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const clamp = (n: number) => Math.max(minimumUnits, Math.min(MAX_UNITS, n))

  const subtotal = pricePerUnit * qty
  const vat = Math.round(subtotal * VAT_RATE)
  const total = subtotal + vat

  function handleQtyInput(raw: string) {
    const n = parseInt(raw, 10)
    if (!Number.isNaN(n)) setQty(clamp(n))
    else if (raw === '') setQty(minimumUnits)
  }

  async function handleProceedToPay() {
    if (isPaying) return
    setError('')
    setIsPaying(true)

    const email = getStoredUserEmail()
    const useMock = import.meta.env.VITE_USE_MOCK_PAYMENT === 'true'

    let reference = ''
    let paymentStatus: 'success' | 'failed' | 'cancelled' = 'failed'
    let paymentMessage = ''

    if (useMock) {
      const result = await openMockPaymentCheckout({
        amount: total,
        currency: 'ZAR',
        email,
        plan: 'Blueprint Top-Up',
        paymentMethod: 'Credit/Debit Cards',
        selectedWizards: [],
      })
      reference = result.reference
      paymentStatus = result.status
      paymentMessage = result.message
    } else {
      const result = await openPaystackCheckout({
        amount: total,
        currency: 'ZAR',
        email,
        plan: 'Blueprint Top-Up',
        paymentMethod: 'card',
        selectedWizards: [],
        totalWizards: 0,
      })
      reference = result.reference
      paymentStatus = result.status
      paymentMessage = result.message
    }

    if (paymentStatus === 'cancelled') {
      setError('Payment cancelled. You can try again when ready.')
      setIsPaying(false)
      return
    }

    if (paymentStatus === 'failed') {
      setError(paymentMessage || 'Payment failed. Please try again.')
      setIsPaying(false)
      return
    }

    // Verify payment with backend
    const verification = await paymentApi.verifyPaystack({
      reference,
      plan: 'Blueprint Top-Up',
      credits: qty,
      amountPaid: total,
      type: 'blueprint-topup',
    })

    if (!verification.success) {
      setError(verification.message || 'We could not verify the payment. No units were added.')
      setIsPaying(false)
      return
    }

    // Credit units on the subscription
    const topUp = await subscriptionApi.topUpBlueprintRuns(qty)
    if (!topUp.success) {
      setError(topUp.message || 'Payment received but units could not be credited. Please contact support.')
      setIsPaying(false)
      return
    }

    setIsPaying(false)
    navigate('/dashboard', {
      replace: true,
      state: { blueprintTopUpSuccess: true, unitsAdded: qty },
    })
  }

  return (
    <DashboardShell activeSection="Wizards">
      <main className="counsel-topup-payment">
        <header className="counsel-topup-payment__header">
          <span className="counsel-topup-payment__header-marker" aria-hidden="true">
            <Zap size={18} />
          </span>
          <div>
            <h1>Purchase Blueprint Credits</h1>
            <p>Top up your Blueprint Units to continue</p>
          </div>
        </header>

        <div className="counsel-topup-payment__content">
          <button
            type="button"
            className="counsel-topup-payment__back"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </button>

          <div className="counsel-topup-payment__layout">

            {/* ── Blueprint info card ── */}
            <section className="counsel-topup-payment__plan-card">
              <h2>Blueprint Details</h2>
              <div className="counsel-topup-payment__plan-name">{blueprintName}</div>

              <ul className="counsel-topup-payment__plan-details">
                <li>
                  <span>Minimum units required</span>
                  <strong>{minimumUnits}</strong>
                </li>
                <li>
                  <span>Price per Blueprint Unit</span>
                  <strong>{fmtZAR(pricePerUnit)}</strong>
                </li>
                <li>
                  <span>Units to purchase</span>
                  <strong>{qty}</strong>
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
                <span className="counsel-topup-payment__qty-label">Blueprint Credits to purchase</span>
                <div className="counsel-topup-payment__qty-controls">
                  <button
                    type="button"
                    className="counsel-topup-payment__qty-btn"
                    aria-label="Remove one unit"
                    disabled={qty <= minimumUnits || isPaying}
                    onClick={() => setQty((q) => clamp(q - 1))}
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    type="number"
                    className="counsel-topup-payment__qty-input"
                    min={minimumUnits}
                    max={MAX_UNITS}
                    value={qty}
                    disabled={isPaying}
                    aria-label="Number of Blueprint Units"
                    onChange={(e) => handleQtyInput(e.target.value)}
                    onBlur={() => setQty(clamp(qty))}
                  />
                  <button
                    type="button"
                    className="counsel-topup-payment__qty-btn"
                    aria-label="Add one unit"
                    disabled={qty >= MAX_UNITS || isPaying}
                    onClick={() => setQty((q) => clamp(q + 1))}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>

              {/* Order breakdown */}
              <ul className="counsel-topup-payment__summary-rows">
                <li>
                  <span>Blueprint Credits ({qty} × {fmtZAR(pricePerUnit)})</span>
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
