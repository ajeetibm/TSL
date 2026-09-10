import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { counselPortalApi } from '../services/tslApi'

type Availability = 'available' | 'unavailable'

interface CounselAvailabilityContextValue {
  availability: Availability
  toggleAvailability: () => Promise<void>
}

const CounselAvailabilityContext = createContext<CounselAvailabilityContextValue | null>(null)

function getStoredEmail(): string {
  try {
    const user = JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }
    return user.email ?? ''
  } catch {
    return ''
  }
}

export function CounselAvailabilityProvider({ children }: { children: ReactNode }) {
  const [availability, setAvailability] = useState<Availability>('available')

  // Load the persisted availability from the server on mount
  useEffect(() => {
    let cancelled = false
    const email = getStoredEmail()
    counselPortalApi.dashboard(email).then((response) => {
      if (cancelled || !response.success) return
      const data = response.data as { availability?: string } | null
      if (data?.availability === 'unavailable') {
        setAvailability('unavailable')
      } else {
        setAvailability('available')
      }
    })
    return () => { cancelled = true }
  }, [])

  const toggleAvailability = useCallback(async () => {
    setAvailability((prev) => {
      const next: Availability = prev === 'available' ? 'unavailable' : 'available'
      // Fire-and-forget — optimistic update is already applied above
      counselPortalApi.availability(next).catch(() => {
        // Revert on failure
        setAvailability(prev)
      })
      return next
    })
  }, [])

  return (
    <CounselAvailabilityContext.Provider value={{ availability, toggleAvailability }}>
      {children}
    </CounselAvailabilityContext.Provider>
  )
}

export function useCounselAvailability() {
  const ctx = useContext(CounselAvailabilityContext)
  if (!ctx) throw new Error('useCounselAvailability must be used within CounselAvailabilityProvider')
  return ctx
}
