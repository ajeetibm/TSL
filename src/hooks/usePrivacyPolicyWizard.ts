/**
 * usePrivacyPolicyWizard.ts
 *
 * All persistence goes through wizardService.
 * Switch VITE_WIZARD_STORAGE=api to use the real backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

/* ─── Types ─────────────────────────────────────────────── */
export interface PrivacyPolicyWizardData {
  // Step 1 – Business Information
  companyName: string
  website: string
  businessEmail: string
  physicalAddress: string
  contactNumber: string

  // Step 2 – Information Collected (checkboxes)
  collectsPersonalInfo: boolean
  collectsContactDetails: boolean
  collectsPaymentInfo: boolean
  collectsTechnicalInfo: boolean
  collectsCookies: boolean

  // Step 3 – Purpose of Collection (checkboxes)
  purposeServiceDelivery: boolean
  purposeMarketing: boolean
  purposeAnalytics: boolean
  purposeCustomerSupport: boolean
  purposeLegalCompliance: boolean

  // Step 4 – Data Sharing (checkboxes)
  sharesThirdPartyProviders: boolean
  sharesPaymentGateways: boolean
  sharesMarketingPlatforms: boolean
  sharesGovernmentAuthorities: boolean

  // Step 5 – User Rights (checkboxes)
  rightAccess: boolean
  rightCorrection: boolean
  rightDeletion: boolean
  rightObjection: boolean
  rightDataPortability: boolean

  // Step 6 – Security & Retention
  dataStorage: string
  retentionPeriod: string
  securityMeasures: string
}

export type PrivacyPolicyWizardStatus = 'idle' | 'inProgress' | 'completed'

export interface PrivacyPolicyWizardState {
  status: PrivacyPolicyWizardStatus
  /** Last fully-completed step (0 = nothing done) */
  step: number
  /** Progress 0-100 based on required fields filled */
  progress: number
  data: PrivacyPolicyWizardData
  startedAt: string | null
  completedAt: string | null
}

/* ─── Required fields ─────────────────────────────────── */
const REQUIRED_FIELDS: (keyof PrivacyPolicyWizardData)[] = [
  'companyName', 'website', 'businessEmail', 'physicalAddress', 'contactNumber',
  'dataStorage', 'retentionPeriod', 'securityMeasures',
]

export const PP_TOTAL_REQUIRED = REQUIRED_FIELDS.length // 8

/** Returns 0-100 based on how many required fields contain a non-empty value */
export function calcPrivacyPolicyProgress(data: PrivacyPolicyWizardData): number {
  const filled = REQUIRED_FIELDS.filter((key) => {
    const val = data[key]
    return typeof val === 'boolean' ? true : typeof val === 'string' && val.trim() !== ''
  }).length
  return Math.round((filled / PP_TOTAL_REQUIRED) * 100)
}

/* ─── Defaults ──────────────────────────────────────────── */
export const PP_EMPTY_DATA: PrivacyPolicyWizardData = {
  companyName: '', website: '', businessEmail: '', physicalAddress: '', contactNumber: '',
  collectsPersonalInfo: true, collectsContactDetails: true, collectsPaymentInfo: false,
  collectsTechnicalInfo: true, collectsCookies: true,
  purposeServiceDelivery: true, purposeMarketing: false, purposeAnalytics: true,
  purposeCustomerSupport: true, purposeLegalCompliance: true,
  sharesThirdPartyProviders: false, sharesPaymentGateways: false,
  sharesMarketingPlatforms: false, sharesGovernmentAuthorities: false,
  rightAccess: true, rightCorrection: true, rightDeletion: true,
  rightObjection: true, rightDataPortability: true,
  dataStorage: '', retentionPeriod: '', securityMeasures: '',
}

const defaultState: PrivacyPolicyWizardState = {
  status: 'idle', step: 0, progress: 0,
  data: PP_EMPTY_DATA, startedAt: null, completedAt: null,
}

const LOCAL_KEY = 'tsl-privacy-policy-wizard-state'

function draftToState(draft: WizardDraft<PrivacyPolicyWizardData>): PrivacyPolicyWizardState {
  const data = { ...PP_EMPTY_DATA, ...draft.data }
  return {
    status: draft.status as PrivacyPolicyWizardStatus,
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

/* ─── Hook ──────────────────────────────────────────────── */
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
      // Always mirror to localStorage directly (wizardService also does this, but we use a custom key)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(draft))
    }
    if (immediate) { flush(); return }
    saveTimerRef.current = setTimeout(flush, 400)
  }, [])

  const startWizard = useCallback(() => {
    setState((prev) => {
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

  // On mount, if API mode, try to sync from server
  useEffect(() => {
    if (wizardService.mode !== 'api') return
    wizardService.load<PrivacyPolicyWizardData>('privacy-policy').then((draft) => {
      if (draft) setState(draftToState(draft))
    })
  }, [])

  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
