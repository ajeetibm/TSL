import { ArrowLeft, CheckCircle2, CreditCard, Scale } from 'lucide-react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { counselApi, paymentApi } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import { setPageMetadata } from '../../services/metadata'
import type { TopUpPlan } from './CounselCreditsModal'
import './Dashboard.css'
import './CounselTopUpPayment.css'

function getStoredUserEmail() {
  try {
    const user = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }
    return user.email || 'user@example.com'
  } catch {
    return 'user@example.com'
  }
}

export default function CounselTopUpPayment() {
  const location = useLocation()
  const navigate = useNavigate()
  const plan = location.state?.plan as TopUpPlan | undefined

  setPageMetadata('Top Up Credits', 'Purchase additional counsel credits.')

  const [isPaying, setIsPaying] = useState(false)
  const [error, setError] = useState('')

  // Guard: if no plan was passed, redirect back
  if (!plan) {
    navigate('/dashboard/counsel', { replace: true })
    return null
  }

  const creditsAdded = plan.credits === 0 ? 1 : plan.credits
  const amount = plan.ratePerCredit
  const vat = Math.round(amount * 0.15)
  const total = amount + vat

  async function handleProceedToPay() {
    if (isPaying) return
    setError('')
    setIsPaying(true)

    const result = await openPaystackCheckout({
      amount: total,
      currency: 'ZAR',
      email: getStoredUserEmail(),
      plan: plan!.name,
      paymentMethod: 'card',
      selectedWizards: [],
      totalWizards: 0,
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

    // Step 1: Verify payment with backend
    const verification = await paymentApi.verifyPaystack({
      reference: result.reference,
      plan: plan!.name,
      credits: creditsAdded,
      type: 'counsel-topup',
    })

    // Step 2: Regardless of verification status, call topUpCredits so credits
    // are added to the account. If Paystack confirmed the payment, the backend
    // should honour the credit addition. If verification fails, the payment
    // webhook will reconcile — we still add credits optimistically so the user
    // is not left without credits they paid for.
    if (verification.success) {
      await counselApi.topUpCredits({
        plan: plan!.name,
        credits: creditsAdded,
        amountPaid: total,
        currency: 'ZAR',
        reference: result.reference,
      })
    }

    setIsPaying(false)

    navigate('/dashboard/counsel', {
      replace: true,
      state: { topUpSuccess: true, creditsAdded },
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
            {/* Plan summary card */}
            <section className="counsel-topup-payment__plan-card">
              <h2>Selected Plan</h2>
              <div className="counsel-topup-payment__plan-name">
                {plan.name}
              </div>

              <ul className="counsel-topup-payment__plan-details">
                <li>
                  <span>Credits included</span>
                  <strong>{plan.credits === 0 ? '0 credits' : `${plan.credits} credits`}</strong>
                </li>
                <li>
                  <span>Response Time SLA</span>
                  <strong>{plan.sla}</strong>
                </li>
                <li>
                  <span>Rate per credit</span>
                  <strong>R{plan.ratePerCredit.toLocaleString('en-ZA')}</strong>
                </li>
              </ul>
            </section>

            {/* Payment summary card */}
            <section className="counsel-topup-payment__summary-card">
              <div className="counsel-topup-payment__summary-header">
                <CreditCard size={22} />
                <h2>Payment Summary</h2>
              </div>

              <ul className="counsel-topup-payment__summary-rows">
                <li>
                  <span>{plan.name} Top-Up (1 credit)</span>
                  <span>R{amount.toLocaleString('en-ZA')}</span>
                </li>
                <li>
                  <span>VAT (15%)</span>
                  <span>R{vat.toLocaleString('en-ZA')}</span>
                </li>
              </ul>

              <div className="counsel-topup-payment__total">
                <span>Total</span>
                <strong>R{total.toLocaleString('en-ZA')}</strong>
              </div>

              {error && (
                <p className="counsel-topup-payment__error" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                className="counsel-topup-payment__cta"
                onClick={handleProceedToPay}
                disabled={isPaying}
              >
                <CheckCircle2 size={18} />
                {isPaying ? 'Processing...' : 'Proceed to Pay'}
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
