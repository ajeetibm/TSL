import { ArrowLeft, Briefcase, Building2, CheckCircle2, Code2, CreditCard, FileText, Minus, Plus, Shield, UsersRound, Zap } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { paymentApi, subscriptionApi } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import { openMockPaymentCheckout } from '../../services/mockPaymentClient'
import { setPageMetadata } from '../../services/metadata'
import './Dashboard.css'
import './BlueprintTopUpPayment.css'

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
  iconName?: string
}

const ICON_MAP: Record<string, LucideIcon> = {
  Shield,
  Briefcase,
  UsersRound,
  FileText,
  Code2,
  Building2,
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
    <DashboardShell activeSection="Blueprints">
      <main className="btu-page">

        {/* Back button — outside the card */}
        <button
          type="button"
          className="btu-back"
          onClick={() => navigate('/dashboard')}
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>

        {/* ── Outer single card ── */}
        <div className="btu-card">

          {/* ── Top section: two columns ── */}
          <div className="btu-body">

            {/* ── Left: Blueprint Details ── */}
            <section className="btu-col btu-col--left">
              <div className="btu-section-header">
                <span className="btu-icon-badge">
                  <FileText size={18} strokeWidth={1.8} />
                </span>
                <h2>Blueprint Details</h2>
              </div>

              {/* Plan name pill with dynamic icon matching the blueprint card */}
              <div className="btu-plan-pill">
                {(() => { const Icon = ICON_MAP[state?.iconName ?? ''] ?? Shield; return <Icon size={16} strokeWidth={2} /> })()}
                <span>{blueprintName}</span>
              </div>

              <ul className="btu-detail-rows">
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

            {/* ── Vertical divider ── */}
            <div className="btu-divider" aria-hidden="true" />

            {/* ── Right: Payment Summary ── */}
            <section className="btu-col btu-col--right">
              <div className="btu-section-header">
                <span className="btu-icon-badge">
                  <CreditCard size={18} strokeWidth={1.8} />
                </span>
                <h2>Payment Summary</h2>
              </div>

              {/* Quantity selector */}
              <div className="btu-qty-row">
                <span className="btu-qty-label">Blueprint Credits to purchase</span>
                <div className="btu-qty-controls">
                  <button
                    type="button"
                    className="btu-qty-btn"
                    aria-label="Remove one unit"
                    disabled={qty <= minimumUnits || isPaying}
                    onClick={() => setQty((q) => clamp(q - 1))}
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    className="btu-qty-input"
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
                    className="btu-qty-btn"
                    aria-label="Add one unit"
                    disabled={qty >= MAX_UNITS || isPaying}
                    onClick={() => setQty((q) => clamp(q + 1))}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Order breakdown */}
              <ul className="btu-summary-rows">
                <li>
                  <span>Blueprint Credits ({qty} × {fmtZAR(pricePerUnit)})</span>
                  <span>{fmtZAR(subtotal)}</span>
                </li>
                <li>
                  <span>VAT (15%)</span>
                  <span>{fmtZAR(vat)}</span>
                </li>
              </ul>

              <div className="btu-total">
                <span>Total</span>
                <strong>{fmtZAR(total)}</strong>
              </div>
            </section>
          </div>

          {/* ── Footer: CTA — full width, beige bg ── */}
          <div className="btu-footer">
            {error && (
              <p className="btu-error" role="alert">{error}</p>
            )}
            <button
              type="button"
              className="btu-cta"
              onClick={handleProceedToPay}
              disabled={isPaying}
            >
              <CheckCircle2 size={18} />
              {isPaying ? 'Processing…' : `Pay ${fmtZAR(total)}`}
            </button>
            <p className="btu-secure-note">
              Secured via Paystack · ZAR · VAT incl.
            </p>
          </div>

        </div>
      </main>
    </DashboardShell>
  )
}
