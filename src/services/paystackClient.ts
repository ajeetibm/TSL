type PaystackCheckoutStatus = 'success' | 'failed' | 'cancelled'

export type PaystackCheckoutPayload = {
  amount: number
  currency: string
  email: string
  plan: string
  paymentMethod: string
  selectedWizards: Array<{ title: string; quantity: number }>
  totalWizards: number
}

export type PaystackCheckoutResult = {
  status: PaystackCheckoutStatus
  reference: string
  message: string
  transaction?: string
}

type PaystackCallbackResponse = {
  reference?: string
  transaction?: string
  status?: string
  message?: string
}

type PaystackSetupOptions = {
  key: string
  email: string
  amount: number
  currency: string
  ref: string
  metadata?: Record<string, unknown>
  callback: (response: PaystackCallbackResponse) => void
  onClose: () => void
}

type PaystackHandler = {
  openIframe: () => void
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => PaystackHandler
    }
  }
}

const PAYSTACK_SCRIPT_ID = 'paystack-inline-js'
const PAYSTACK_INLINE_SRC = 'https://js.paystack.co/v1/inline.js'

function getPaystackPublicKey() {
  return import.meta.env.VITE_PAYSTACK_PUBLIC_KEY as string | undefined
}

function loadPaystackInline() {
  if (window.PaystackPop) {
    return Promise.resolve()
  }

  const existingScript = document.getElementById(PAYSTACK_SCRIPT_ID) as HTMLScriptElement | null
  if (existingScript) {
    return new Promise<void>((resolve, reject) => {
      existingScript.addEventListener('load', () => resolve(), { once: true })
      existingScript.addEventListener('error', () => reject(new Error('Unable to load Paystack checkout.')), { once: true })
    })
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.id = PAYSTACK_SCRIPT_ID
    script.src = PAYSTACK_INLINE_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Unable to load Paystack checkout.'))
    document.body.appendChild(script)
  })
}

function createPaymentReference() {
  return `TSL_PAYSTACK_${Date.now()}_${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

function toLowestCurrencyUnit(amount: number) {
  return Math.round(amount * 100)
}

export async function openPaystackCheckout(payload: PaystackCheckoutPayload): Promise<PaystackCheckoutResult> {
  const publicKey = getPaystackPublicKey()
  const reference = createPaymentReference()

  if (!publicKey) {
    return {
      status: 'failed',
      reference,
      message: 'Paystack public key is missing. Add VITE_PAYSTACK_PUBLIC_KEY to your .env file.',
    }
  }

  try {
    await loadPaystackInline()
  } catch (error) {
    return {
      status: 'failed',
      reference,
      message: error instanceof Error ? error.message : 'Unable to load Paystack checkout.',
    }
  }

  if (!window.PaystackPop) {
    return {
      status: 'failed',
      reference,
      message: 'Paystack checkout is not available. Please try again.',
    }
  }

  return new Promise((resolve) => {
    let settled = false
    const settle = (result: PaystackCheckoutResult) => {
      if (settled) return
      settled = true
      resolve(result)
    }

    const handler = window.PaystackPop?.setup({
      key: publicKey,
      email: payload.email,
      amount: toLowestCurrencyUnit(payload.amount),
      currency: payload.currency,
      ref: reference,
      metadata: {
        plan: payload.plan,
        paymentMethod: payload.paymentMethod,
        totalWizards: payload.totalWizards,
        selectedWizards: payload.selectedWizards,
      },
      callback: (response) => {
        settle({
          status: 'success',
          reference: response.reference || reference,
          transaction: response.transaction,
          message: response.message || 'Payment approved by Paystack test checkout.',
        })
      },
      onClose: () => {
        settle({
          status: 'cancelled',
          reference,
          message: 'Payment cancelled. You can stay here and try again when ready.',
        })
      },
    })

    if (!handler) {
      settle({
        status: 'failed',
        reference,
        message: 'Unable to start Paystack checkout. Please try again.',
      })
      return
    }

    handler.openIframe()
  })
}
