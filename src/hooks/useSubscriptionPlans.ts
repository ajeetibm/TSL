import { useEffect, useState } from 'react'
import type { SubscriptionPlan } from '../services/dashboardTypes'
import { subscriptionApi } from '../services/tslApi'

/**
 * The server-owned commercial catalogue. Components may add presentation-only
 * metadata (icons, badges, ordering) but must not duplicate plan values.
 */
export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    subscriptionApi.plans()
      .then((response) => {
        if (!active) return
        if (response.success && Array.isArray(response.data)) {
          setPlans(response.data)
          setError(null)
        } else {
          setError(response.message ?? 'Plan information is unavailable.')
        }
      })
      .catch(() => {
        if (active) setError('Plan information is unavailable.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  return { plans, loading, error }
}
