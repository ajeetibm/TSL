import { request } from './tslApi'

export type MockPaymentStatus = 'success' | 'failed' | 'cancelled'

export type MockPaymentPayload = {
  amount: number
  currency: string
  email: string
  plan: string
  paymentMethod: 'Bank Transfers' | 'E-wallets' | 'PayPal' | 'Credit/Debit Cards'
  selectedWizards: Array<{ title: string; quantity: number }>
}

type MockPaymentInitialization = {
  reference: string
  provider: 'paystack' | 'paypal'
  channel: string
  label: string
}

export type MockPaymentResult = {
  status: MockPaymentStatus
  reference: string
  message: string
}

/** Opens a browser-native confirmation for a local payment-provider simulation. */
export async function openMockPaymentCheckout(payload: MockPaymentPayload): Promise<MockPaymentResult> {
  const initialized = await request<MockPaymentInitialization>('/api/v1/sme/payments/mock/initialize', 'POST', payload)
  if (!initialized.success || !initialized.data) {
    return { status: 'failed', reference: '', message: initialized.message || 'Unable to start mock checkout.' }
  }

  const { reference, label } = initialized.data
  const confirmed = window.confirm(`Mock ${label}\n\nPay R${payload.amount.toFixed(2)} with ${payload.paymentMethod}?`)
  const outcome: MockPaymentStatus = confirmed ? 'success' : 'cancelled'
  const completed = await request<{ status: MockPaymentStatus }>('/api/v1/sme/payments/mock/complete', 'POST', { reference, outcome })

  if (!completed.success || !completed.data) {
    return { status: 'failed', reference, message: completed.message || 'Unable to complete mock checkout.' }
  }

  return {
    status: completed.data.status,
    reference,
    message: completed.message || (outcome === 'success' ? 'Mock payment approved.' : 'Payment cancelled.'),
  }
}
