import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'

export const PROFILE_STORAGE_KEY = 'tsl-profile-data'

export interface UserProfile {
  companySnapshotId: string
  // Legacy summary fields kept for existing dashboard and admin views.
  companyName: string
  registrationNumber: string
  email: string
  phone: string
  physicalAddress: string
  contactPerson: string
  // Company Snapshot — the legal/business information reused by Blueprints.
  entityType: string
  legalName: string
  tradingName: string
  individualFullNames: string
  idNumber: string
  businessEmail: string
  businessPhone: string
  unitNumber: string
  building: string
  streetName: string
  suburb: string
  city: string
  province: string
  postalCode: string
  country: string
  signatoryName: string
  signatoryCapacity: string
}

interface UserProfileContextValue {
  profile: UserProfile
  updateProfile: (next: UserProfile) => void
}

function emptyProfile(): UserProfile {
  return {
    companySnapshotId: '',
    companyName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    physicalAddress: '',
    contactPerson: '',
    entityType: '',
    legalName: '',
    tradingName: '',
    individualFullNames: '',
    idNumber: '',
    businessEmail: '',
    businessPhone: '',
    unitNumber: '',
    building: '',
    streetName: '',
    suburb: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'South Africa',
    signatoryName: '',
    signatoryCapacity: '',
  }
}

function getAuthUser() {
  try {
    const authRaw = localStorage.getItem('tsl-auth-user')
    return authRaw ? (JSON.parse(authRaw) as { fullName?: string; email?: string }) : null
  } catch {
    return null
  }
}

function normalizeEmail(email?: string) {
  return String(email || '').trim().toLowerCase()
}

function getProfileStorageKey(email?: string) {
  const normalizedEmail = normalizeEmail(email || getAuthUser()?.email)
  return normalizedEmail ? `${PROFILE_STORAGE_KEY}:${normalizedEmail}` : PROFILE_STORAGE_KEY
}

function readFromStorage(): UserProfile {
  const auth = getAuthUser()

  try {
    const raw = localStorage.getItem(getProfileStorageKey(auth?.email))
    if (raw) return { ...emptyProfile(), ...(JSON.parse(raw) as Partial<UserProfile>) }
  } catch { /* ignore */ }

  if (auth) {
    return {
      companySnapshotId: '',
      companyName: auth.fullName ?? '',
      registrationNumber: '',
      email: auth.email ?? '',
      phone: '',
      physicalAddress: '',
      contactPerson: auth.fullName ?? '',
      entityType: '',
      legalName: '',
      tradingName: '',
      individualFullNames: '',
      idNumber: '',
      businessEmail: auth.email ?? '',
      businessPhone: '',
      unitNumber: '',
      building: '',
      streetName: '',
      suburb: '',
      city: '',
      province: '',
      postalCode: '',
      country: 'South Africa',
      signatoryName: auth.fullName ?? '',
      signatoryCapacity: '',
    }
  }

  return emptyProfile()
}

const UserProfileContext = createContext<UserProfileContextValue | null>(null)

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(readFromStorage)

  // Sync when auth changes in this tab or profile changes in another tab.
  useEffect(() => {
    const syncProfile = () => setProfile(readFromStorage())
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith(PROFILE_STORAGE_KEY) || e.key === 'tsl-auth-user') {
        syncProfile()
      }
    }

    window.addEventListener('storage', onStorage)
    window.addEventListener('tsl-auth-session-changed', syncProfile)
    syncProfile()

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('tsl-auth-session-changed', syncProfile)
    }
  }, [])

  const updateProfile = useCallback((next: UserProfile) => {
    localStorage.setItem(getProfileStorageKey(next.email), JSON.stringify(next))
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
