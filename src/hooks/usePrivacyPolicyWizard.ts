/**
 * usePrivacyPolicyWizard.ts
 *
 * All persistence goes through wizardService.
 * Switch VITE_WIZARD_STORAGE=api to use the real backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

export interface PrivacyPurposeRow {
  purpose: string
  categories: string
  basis: '' | 'Consent' | 'Necessary for a contract' | 'Legal obligation' | 'Legitimate interest' | 'Public law duty'
  liStatement: string
}

export interface PrivacyRetentionRow {
  category: string
  period: string
  reason: string
}

export interface PrivacyThirdPartyRow {
  name: string
  purpose: string
  country: string
}

export interface PrivacyCookieRow {
  name: string
  purpose: string
  duration: string
  necessary: 'Yes' | 'No'
}

export interface PrivacyPolicyWizardData {
  responsibleParty: string
  responsiblePartyConfirmed: boolean
  officerFullNames: string
  officerIdNumber: string
  officerEmail: string
  privacyEmail: string
  domains: string[]
  piCategories: string[]
  specialPi: string[]
  specialPiBasis: '' | 'Explicit consent of the data subject' | 'Required to establish, exercise or defend a legal claim' | 'Required by law' | 'Historical, statistical or research purposes' | 'Information deliberately made public by the data subject'
  childrenData: boolean
  childrenConsent: string
  purposes: PrivacyPurposeRow[]
  retention: PrivacyRetentionRow[]
  thirdParties: PrivacyThirdPartyRow[]
  crossBorder: boolean
  crossBorderCountries: string[]
  transferBasis: '' | 'Data subject consent' | 'Necessary for the contract' | 'Binding agreement with the recipient'
  directMarketing: boolean
  cookies: PrivacyCookieRow[]
  cookieConsent: 'Banner with granular choice' | 'Banner with accept or reject only'
  analyticsProvider: string
  dsrChannel: string
  dsrDays: string
  securitySummary: string[]
  effectiveDate: string
  automatedDecisions: boolean
}

export type PrivacyPolicyWizardStatus = 'idle' | 'inProgress' | 'completed'

export interface PrivacyPolicyWizardState {
  status: PrivacyPolicyWizardStatus
  step: number
  progress: number
  data: PrivacyPolicyWizardData
  startedAt: string | null
  completedAt: string | null
}

export const PRIVACY_CATEGORY_OPTIONS = [
  'Identity',
  'Contact',
  'Financial and payment',
  'Device and usage',
  'Location',
  'Employment',
  'Marketing preferences',
] as const

export const PRIVACY_SPECIAL_PI_OPTIONS = [
  'Health',
  'Biometric',
  'Race or ethnic origin',
  'Religious belief',
  'Trade union membership',
  'Criminal behaviour',
] as const

export const PRIVACY_SECURITY_OPTIONS = [
  'Encryption in transit',
  'Encryption at rest',
  'Access control',
  'Staff training',
  'Backups',
  'Vendor due diligence',
] as const

export const PRIVACY_BASIS_OPTIONS = [
  'Consent',
  'Necessary for a contract',
  'Legal obligation',
  'Legitimate interest',
  'Public law duty',
] as const

export const PRIVACY_SPECIAL_PI_BASIS_OPTIONS = [
  'Explicit consent of the data subject',
  'Required to establish, exercise or defend a legal claim',
  'Required by law',
  'Historical, statistical or research purposes',
  'Information deliberately made public by the data subject',
] as const

export const PRIVACY_TRANSFER_BASIS_OPTIONS = [
  'Data subject consent',
  'Necessary for the contract',
  'Binding agreement with the recipient',
] as const

export function createEmptyPurpose(): PrivacyPurposeRow {
  return { purpose: '', categories: '', basis: '', liStatement: '' }
}

export function createEmptyRetention(): PrivacyRetentionRow {
  return { category: '', period: '', reason: '' }
}

export function createEmptyThirdParty(): PrivacyThirdPartyRow {
  return { name: '', purpose: '', country: '' }
}

export function createEmptyCookie(): PrivacyCookieRow {
  return { name: '', purpose: '', duration: '', necessary: 'No' }
}

function hasText(value: string) {
  return value.trim().length > 0
}

function hasFilledPurpose(row: PrivacyPurposeRow) {
  return hasText(row.purpose) && hasText(row.categories) && hasText(row.basis) && (row.basis !== 'Legitimate interest' || hasText(row.liStatement))
}

function hasFilledRetention(row: PrivacyRetentionRow) {
  return hasText(row.category) && hasText(row.period) && hasText(row.reason)
}

function hasFilledThirdParty(row: PrivacyThirdPartyRow) {
  return hasText(row.name) && hasText(row.purpose) && hasText(row.country)
}

function hasFilledCookie(row: PrivacyCookieRow) {
  return hasText(row.name) && hasText(row.purpose) && hasText(row.duration) && hasText(row.necessary)
}

export function calcPrivacyPolicyProgress(data: PrivacyPolicyWizardData): number {
  let total = 17
  let filled = 0

  if (data.responsiblePartyConfirmed) filled += 1
  if (hasText(data.officerFullNames)) filled += 1
  if (hasText(data.officerIdNumber)) filled += 1
  if (hasText(data.officerEmail)) filled += 1
  if (hasText(data.privacyEmail)) filled += 1
  if (data.domains.some(hasText)) filled += 1
  if (data.piCategories.length > 0) filled += 1
  if (!data.specialPi.length || hasText(data.specialPiBasis)) filled += 1
  if (!data.childrenData || hasText(data.childrenConsent)) filled += 1
  if (data.purposes.some(hasFilledPurpose)) filled += 1
  if (data.retention.some(hasFilledRetention)) filled += 1
  if (data.thirdParties.some(hasFilledThirdParty)) filled += 1
  if (!data.crossBorder || (data.crossBorderCountries.length > 0 && hasText(data.transferBasis))) filled += 1
  if (data.cookies.some(hasFilledCookie)) filled += 1
  if (hasText(data.cookieConsent)) filled += 1
  if (hasText(data.dsrChannel)) filled += 1
  if (data.securitySummary.length > 0) filled += 1
  if (hasText(data.effectiveDate)) filled += 1

  if (data.specialPi.length > 0) total += 1
  if (data.childrenData) total += 1
  if (data.crossBorder) total += 1

  return Math.round((filled / total) * 100)
}

export const PP_EMPTY_DATA: PrivacyPolicyWizardData = {
  responsibleParty: 'The Startup Legal (Pty) Ltd',
  responsiblePartyConfirmed: false,
  officerFullNames: '',
  officerIdNumber: '',
  officerEmail: '',
  privacyEmail: '',
  domains: [''],
  piCategories: [],
  specialPi: [],
  specialPiBasis: '',
  childrenData: false,
  childrenConsent: '',
  purposes: [createEmptyPurpose()],
  retention: [createEmptyRetention()],
  thirdParties: [createEmptyThirdParty()],
  crossBorder: false,
  crossBorderCountries: [],
  transferBasis: '',
  directMarketing: false,
  cookies: [createEmptyCookie()],
  cookieConsent: 'Banner with granular choice',
  analyticsProvider: '',
  dsrChannel: '',
  dsrDays: '30',
  securitySummary: [],
  effectiveDate: '',
  automatedDecisions: false,
}

export const PP_TOTAL_REQUIRED = 17

const defaultState: PrivacyPolicyWizardState = {
  status: 'idle',
  step: 0,
  progress: 0,
  data: PP_EMPTY_DATA,
  startedAt: null,
  completedAt: null,
}

const LOCAL_KEY = 'tsl-privacy-policy-wizard-state'

function draftToState(draft: WizardDraft<PrivacyPolicyWizardData>): PrivacyPolicyWizardState {
  const data = { ...PP_EMPTY_DATA, ...draft.data }
  const status: PrivacyPolicyWizardStatus = draft.completedAt ? 'completed' : draft.status as PrivacyPolicyWizardStatus
  return {
    status,
    step: draft.step,
    progress: calcPrivacyPolicyProgress(data),
    data,
    startedAt: draft.startedAt,
    completedAt: draft.completedAt,
  }
}

function stateToDraft(state: PrivacyPolicyWizardState): WizardDraft<PrivacyPolicyWizardData> {
  return {
    wizardType: 'privacy-policy',
    status: state.status,
    step: state.step,
    progress: state.progress,
    data: state.data,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  }
}

export function usePrivacyPolicyWizard() {
  const [state, setState] = useState<PrivacyPolicyWizardState>(() => {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      try {
        const draft = JSON.parse(raw) as WizardDraft<PrivacyPolicyWizardData>
        return draftToState(draft)
      } catch { /* ignore */ }
    }
    return defaultState
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((nextState: PrivacyPolicyWizardState, immediate = false) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const flush = () => {
      const draft = stateToDraft(nextState)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(draft))
    }
    if (immediate) { flush(); return }
    saveTimerRef.current = setTimeout(flush, 400)
  }, [])

  const startWizard = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'completed') return prev
      const next: PrivacyPolicyWizardState = {
        ...prev,
        status: 'inProgress',
        startedAt: prev.startedAt ?? new Date().toISOString(),
      }
      persist(next, true)
      return next
    })
  }, [persist])

  const saveProgress = useCallback((step: number, data: PrivacyPolicyWizardData, immediate = false) => {
    setState((prev) => {
      const next: PrivacyPolicyWizardState = {
        ...prev,
        step,
        data,
        progress: calcPrivacyPolicyProgress(data),
      }
      persist(next, immediate)
      return next
    })
  }, [persist])

  const completeWizard = useCallback(async () => {
    setState((prev) => {
      const completedAt = new Date().toISOString()
      const next: PrivacyPolicyWizardState = { ...prev, status: 'completed', completedAt }
      persist(next, true)
      return next
    })
  }, [persist])

  const resetWizard = useCallback(() => {
    setState(defaultState)
    localStorage.removeItem(LOCAL_KEY)
  }, [])

  useEffect(() => {
    if (wizardService.mode !== 'api') return
    wizardService.load<PrivacyPolicyWizardData>('privacy-policy').then((draft) => {
      if (draft) setState(draftToState(draft))
    })
  }, [])

  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
