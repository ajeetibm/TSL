/**
 * useBillingSubscription — manages all state for the Billing & Subscription page.
 *
 * Provides:
 *  - subscription data (current plan, usage, billing, pendingDowngrade)
 *  - available plans list
 *  - upgrade preview data
 *  - async action handlers (upgrade, downgrade, cancelDowngrade)
 *  - modal open/close state
 *  - toast notifications
 *
 * Components stay presentational; all API calls go through this hook.
 *
 * Payment abstraction:
 *  The hook accepts an optional `payFn` callback so the Paystack-specific
 *  logic lives in the page, not in the hook. Swapping to a different payment
 *  provider only requires changing the page-level callback.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { subscriptionService } from '../services/subscriptionService'
import type {
  BillingHistoryInvoice,
  ProratedUpgradePreview,
  SubscriptionData,
  SubscriptionPlan,
  UpgradeResult,
  DowngradeResult,
} from '../services/dashboardTypes'

/**
 * payFn is injected by the page component.
 * It receives the amount to charge and returns either a payment reference
 * string (success) or null (cancelled / failed — error already shown by caller).
 */
export type UpgradePayFn = (amountZAR: number, planName: string) => Promise<string | null>

export type BillingModal =
  | 'none'
  | 'upgrade-plans'
  | 'compare-plans'
  | 'upgrade-confirm'
  | 'downgrade-confirm'
  | 'cancel-downgrade-confirm'

export interface BillingToast {
  message: string
  type: 'success' | 'error'
}

export function useBillingSubscription(payFn?: UpgradePayFn) {
  // ── Subscription data ──────────────────────────────────────────────────
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [subLoading, setSubLoading] = useState(true)   // true = loading on mount
  const [subError, setSubError] = useState<string | null>(null)

  // ── Plans list ─────────────────────────────────────────────────────────
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(false)
  const [plansError, setPlansError] = useState<string | null>(null)

  // ── Upgrade preview ────────────────────────────────────────────────────
  const [upgradePreview, setUpgradePreview] = useState<ProratedUpgradePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // ── Selected plan (for confirmation modals) ────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  // ── Modal state ────────────────────────────────────────────────────────
  const [activeModal, setActiveModal] = useState<BillingModal>('none')
  // Tracks which modal opened the confirm screen so Cancel can go back there
  const previousModalRef = useRef<BillingModal>('none')

  // ── Action loading ─────────────────────────────────────────────────────
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  // ── Toast ──────────────────────────────────────────────────────────────
  const [toast, setToast] = useState<BillingToast | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Upgrade result (for success banner) ───────────────────────────────
  const [upgradeResult, setUpgradeResult] = useState<UpgradeResult | null>(null)

  // ── Billing history invoices ───────────────────────────────────────────
  const [invoices, setInvoices] = useState<BillingHistoryInvoice[]>([])
  const [invoicesLoading, setInvoicesLoading] = useState(true)
  const [invoicesError, setInvoicesError] = useState<string | null>(null)

  function showToast(message: string, type: BillingToast['type'] = 'success') {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 5000)
  }

  // ── Initial data load ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false

    subscriptionService.getSubscription().then((res) => {
      if (cancelled) return
      setSubLoading(false)
      if (!res.success || !res.data) {
        setSubError(res.message ?? 'Failed to load subscription.')
        return
      }
      setSubscription(res.data)
    })

    subscriptionService.getInvoices().then((res) => {
      if (cancelled) return
      setInvoicesLoading(false)
      if (!res.success || !res.data) {
        setInvoicesError(res.message ?? 'Failed to load billing history.')
        return
      }
      setInvoices(res.data)
    })

    return () => { cancelled = true }
  }, [])

  // ── Refresh invoices from server ───────────────────────────────────────
  const refreshInvoices = useCallback(async () => {
    const res = await subscriptionService.getInvoices()
    if (res.success && res.data) setInvoices(res.data)
  }, [])

  // ── Shared plans loader ────────────────────────────────────────────────
  async function loadPlans() {
    if (plans.length > 0) return // already cached
    setPlansLoading(true)
    setPlansError(null)
    const res = await subscriptionService.getPlans()
    setPlansLoading(false)
    if (!res.success || !res.data) {
      setPlansError(res.message ?? 'Failed to load plans.')
      return
    }
    setPlans(res.data)
  }

  // ── Open Upgrade Plans modal (action modal — Upgrade/Downgrade buttons) ──
  const openUpgradePlans = useCallback(async () => {
    setActiveModal('upgrade-plans')
    await loadPlans()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length])

  // ── Open Compare Plans modal (read-only info modal) ────────────────────
  const openComparePlans = useCallback(async () => {
    setActiveModal('compare-plans')
    await loadPlans()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length])

  // ── Select a plan — remembers which modal triggered the confirm screen ──
  const selectPlan = useCallback(
    async (plan: SubscriptionPlan, action: 'upgrade' | 'downgrade') => {
      if (!subscription) return
      setSelectedPlan(plan)
      setActionError(null)

      // Remember the calling modal so Cancel can navigate back
      previousModalRef.current = activeModal

      if (action === 'upgrade') {
        setPreviewLoading(true)
        setPreviewError(null)
        setActiveModal('upgrade-confirm') // opens immediately; skeleton shown inside
        const res = await subscriptionService.getUpgradePreview(plan.planId)
        setPreviewLoading(false)
        if (!res.success || !res.data) {
          setPreviewError(res.message ?? 'Failed to load upgrade preview.')
          return
        }
        setUpgradePreview(res.data)
      } else {
        setActiveModal('downgrade-confirm')
      }
    },
    [subscription, activeModal],
  )

  // ── Confirm upgrade ────────────────────────────────────────────────────
  // Flow when payFn is provided (production path):
  //   1. Open Paystack checkout for the prorated amount
  //   2. On success, receive a payment reference
  //   3. POST /subscription/upgrade with reference — server verifies & activates
  // Flow when payFn is absent (direct mock path):
  //   POST /subscription/upgrade without reference — server simulates payment
  const confirmUpgrade = useCallback(async () => {
    if (!subscription || !selectedPlan || actionLoading) return
    setActionLoading(true)
    setActionError(null)

    // ── Step 1: collect payment when a payFn is injected ─────────────────
    let paymentReference: string | undefined
    if (payFn && upgradePreview) {
      const ref = await payFn(upgradePreview.totalDueToday, selectedPlan.name)
      if (ref === null) {
        // User cancelled or payment failed — payFn already showed an error
        setActionLoading(false)
        return
      }
      paymentReference = ref
    }

    // ── Step 2: activate the plan on the server ───────────────────────────
    const res = await subscriptionService.confirmUpgrade(
      subscription.planId,
      selectedPlan.planId,
      paymentReference,
    )
    setActionLoading(false)

    if (!res.success || !res.data) {
      setActionError(res.message ?? 'Upgrade failed. Please try again.')
      return
    }

    const result = res.data as UpgradeResult
    setUpgradeResult(result)

    // ── Step 3: update subscription state instantly — no page refresh ─────
    setSubscription((prev) =>
      prev
        ? {
            ...prev,
            planId: result.planId,
            planName: result.planName,
            price: result.price,
            tagline: result.tagline,
            wizardRuns: result.wizardRuns,
            teamMembers: result.teamMembers,
            usage: result.usage,
            nextBillingDate: result.nextBillingDate,
            pendingDowngrade: null,
          }
        : prev,
    )

    setActiveModal('none')
    setSelectedPlan(null)
    setUpgradePreview(null)
    showToast('Subscription upgraded successfully.')

    // Refresh billing history so the new invoice appears immediately
    void refreshInvoices()
  }, [subscription, selectedPlan, actionLoading, payFn, upgradePreview, refreshInvoices])

  // ── Confirm downgrade (schedule) ───────────────────────────────────────
  const confirmDowngrade = useCallback(async () => {
    if (!subscription || !selectedPlan || actionLoading) return
    setActionLoading(true)
    setActionError(null)

    const res = await subscriptionService.scheduleDowngrade(subscription.planId, selectedPlan.planId)
    setActionLoading(false)

    if (!res.success || !res.data) {
      setActionError(res.message ?? 'Failed to schedule downgrade. Please try again.')
      return
    }

    const result = res.data as DowngradeResult

    // Attach pending downgrade to subscription state — no page refresh
    setSubscription((prev) =>
      prev
        ? {
            ...prev,
            pendingDowngrade: {
              toPlanId: result.scheduledPlanId,
              toPlanName: result.scheduledPlanName,
              effectiveDate: result.effectiveDate,
            },
          }
        : prev,
    )

    setActiveModal('none')
    setSelectedPlan(null)
    showToast('Downgrade scheduled successfully.')
  }, [subscription, selectedPlan, actionLoading])

  // ── Cancel scheduled downgrade ────────────────────────────────────────
  const cancelDowngrade = useCallback(async () => {
    if (actionLoading) return
    setActionLoading(true)
    setActionError(null)

    const res = await subscriptionService.cancelScheduledDowngrade()
    setActionLoading(false)

    if (!res.success) {
      setActionError(res.message ?? 'Failed to cancel downgrade. Please try again.')
      return
    }

    setSubscription((prev) =>
      prev ? { ...prev, pendingDowngrade: null } : prev,
    )

    setActiveModal('none')
    showToast('Scheduled downgrade cancelled.')
  }, [actionLoading])

  // ── Close modal fully ──────────────────────────────────────────────────
  const closeModal = useCallback(() => {
    setActiveModal('none')
    setActionError(null)
    setPreviewError(null)
    previousModalRef.current = 'none'
  }, [])

  // ── Cancel upgrade confirm → go back to upgrade-plans if that's where
  //    the user came from, otherwise close fully ───────────────────────────
  const cancelUpgradeConfirm = useCallback(() => {
    setActionError(null)
    setPreviewError(null)
    setUpgradePreview(null)
    const back = previousModalRef.current
    previousModalRef.current = 'none'
    setActiveModal(back === 'upgrade-plans' ? 'upgrade-plans' : 'none')
  }, [])

  // ── Cancel downgrade confirm → same back-navigation logic ─────────────
  const cancelDowngradeConfirm = useCallback(() => {
    setActionError(null)
    const back = previousModalRef.current
    previousModalRef.current = 'none'
    setActiveModal(back === 'upgrade-plans' ? 'upgrade-plans' : 'none')
  }, [])

  return {
    // Data
    subscription,
    subLoading,
    subError,
    plans,
    plansLoading,
    plansError,
    upgradePreview,
    previewLoading,
    previewError,
    selectedPlan,
    upgradeResult,
    // Modal
    activeModal,
    closeModal,
    // Toast
    toast,
    // Action loading / error
    actionLoading,
    actionError,
    // Invoices
    invoices,
    invoicesLoading,
    invoicesError,
    refreshInvoices,
    // Handlers
    openUpgradePlans,
    openComparePlans,
    selectPlan,
    confirmUpgrade,
    confirmDowngrade,
    cancelUpgradeConfirm,
    cancelDowngradeConfirm,
    cancelDowngrade,
    openCancelDowngradeConfirm: () => setActiveModal('cancel-downgrade-confirm'),
  }
}
