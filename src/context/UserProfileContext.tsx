import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export const PROFILE_STORAGE_KEY = 'tsl-profile-data'

export interface UserProfile {
  companyName: string
  registrationNumber: string
  email: string
  phone: string
  physicalAddress: string
  contactPerson: string
}

interface UserProfileContextValue {
  profile: UserProfile
  updateProfile: (next: UserProfile) => void
}

function readFromStorage(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as UserProfile
  } catch { /* ignore */ }

  // Fall back to auth user data if profile not yet saved
  try {
    const authRaw = localStorage.getItem('tsl-auth-user')
    if (authRaw) {
      const auth = JSON.parse(authRaw) as { fullName?: string; email?: string }
      return {
        companyName: auth.fullName ?? '',
        registrationNumber: '',
        email: auth.email ?? '',
        phone: '',
        physicalAddress: '',
        contactPerson: '',
      }
    }
  } catch { /* ignore */ }

  return {
    companyName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    physicalAddress: '',
    contactPerson: '',
  }
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(readFromStorage)

  // Sync when another tab writes to localStorage
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROFILE_STORAGE_KEY) {
        setProfile(readFromStorage())
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const updateProfile = useCallback((next: UserProfile) => {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next))
    setProfile(next)
  }, [])

  return (
    <UserProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  )
}

export function useUserProfile() {
  const ctx = useContext(UserProfileContext)
  if (!ctx) throw new Error('useUserProfile must be used within UserProfileProvider')
  return ctx
}
