/**
 * SubscriptionService — abstraction over the subscriptionApi.
 *
 * All upgrade / downgrade business logic lives here.
 * To switch from mock to production backend:
 *   1. Update VITE_API_BASE_URL in your .env
 *   2. No React component or hook changes are required.
 */

import { subscriptionApi } from './tslApi'
import type {
  BillingHistoryInvoice,
  DowngradeResult,
  ProratedUpgradePreview,
  SubscriptionData,
  SubscriptionPlan,
  UpgradeResult,
} from './dashboardTypes'
import type { ApiResponse } from './tslApi'

// ── Plan ordering (used by UI for upgrade / downgrade logic) ──────────────

const PLAN_ORDER: Record<string, number> = {
  launchpad: 0,
  operator: 1,
  boardroom: 2,
}

export function planTier(planId: string): number {
  return PLAN_ORDER[planId.toLowerCase()] ?? -1
}

export function isUpgrade(currentPlanId: string, targetPlanId: string): boolean {
  return planTier(targetPlanId) > planTier(currentPlanId)
}

export function isDowngrade(currentPlanId: string, targetPlanId: string): boolean {
  return planTier(targetPlanId) < planTier(currentPlanId)
}

// ── Service methods ───────────────────────────────────────────────────────

export const subscriptionService = {
  /**
   * Fetch the user's current subscription, usage, billing date, and any
   * pending downgrade in a single request.
   */
  getSubscription(): Promise<ApiResponse<SubscriptionData>> {
    return subscriptionApi.get()
  },

  /**
   * Fetch all available plans with their features.
   */
  getPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    return subscriptionApi.plans()
  },

  /**
   * Fetch a prorated upgrade preview before asking the user to confirm.
   * Shows days remaining, credit for unused time, prorated new charge, and
   * total due today.
   */
  getUpgradePreview(toPlanId: string): Promise<ApiResponse<ProratedUpgradePreview>> {
    return subscriptionApi.upgradePreview(toPlanId)
  },

  /**
   * Confirm an upgrade.  The mock server:
   *   – processes a simulated payment immediately
   *   – updates the subscription to the new plan
   *   – creates an invoice in billing history
   *   – returns the updated subscription state + invoice details
   */
  confirmUpgrade(
    currentPlanId: string,
    toPlanId: string,
    paymentReference?: string,
  ): Promise<ApiResponse<UpgradeResult>> {
    return subscriptionApi.upgrade({ currentPlanId, toPlanId, paymentReference })
  },

  /**
   * Schedule a downgrade.  The mock server:
   *   – does NOT change the current plan
   *   – does NOT charge anything
   *   – stores a pendingDowngrade record against the subscription
   *   – returns the scheduled plan + effective date
   */
  scheduleDowngrade(
    currentPlanId: string,
    toPlanId: string,
  ): Promise<ApiResponse<DowngradeResult>> {
    return subscriptionApi.downgrade({ currentPlanId, toPlanId })
  },

  /**
   * Cancel a previously scheduled downgrade.
   * The current plan continues unchanged.
   */
  cancelScheduledDowngrade(): Promise<ApiResponse<unknown>> {
    return subscriptionApi.cancelDowngrade()
  },

  /**
   * Fetch the full billing history for the current user.
   * Invoices are ordered most-recent first.
   */
  getInvoices(): Promise<ApiResponse<BillingHistoryInvoice[]>> {
    return subscriptionApi.invoices()
  },
}
