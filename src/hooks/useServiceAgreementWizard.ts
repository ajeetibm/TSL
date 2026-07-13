/**
 * useServiceAgreementWizard.ts
 *
 * All persistence goes through localStorage (mirrors wizardService pattern).
 * Switch VITE_WIZARD_STORAGE=api to use the real backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

/* ─── Main data shape ────────────────────────────────────── */
export interface ServiceAgreementWizardData {
  // Step 1 – Parties
  providerName: string
  providerReg: string         // optional
  providerAddress: string
  clientName: string
  clientReg: string           // optional
  clientAddress: string
  contactName: string         // optional
  contactEmail: string        // optional
  contactPhone: string        // optional

  // Step 2 – Services
  servicesDescription: string
  scopeOfWork: string
  deliverables: string

  // Step 3 – Fees
  pricing: string
  paymentTerms: string
  billingFrequency: 'Monthly' | 'Quarterly' | 'Annually' | 'Milestone-Based' | 'On Completion' | ''

  // Step 4 – Service Levels
  availability: string
  responseTime: string
  resolutionTime: string
  supportHours: string

  // Step 5 – Responsibilities
  providerResponsibilities: string
  clientResponsibilities: string

  // Step 6 – Term & Termination
  startDate: string
  endDate: string
  renewal: 'Auto-Renew' | 'Manual Renewal' | 'Fixed Term' | ''
  terminationNotice: string

  // Step 7 – Legal
  confidentiality: string
  liability: string
  governingLaw: string
  jurisdiction: string
}

export type ServiceAgreementWizardStatus = 'idle' | 'inProgress' | 'completed'

export interface ServiceAgreementWizardState {
  status: ServiceAgreementWizardStatus
  step: number
  progress: number
  data: ServiceAgreementWizardData
  startedAt: string | null
  completedAt: string | null
}

/* ─── Progress calculation ───────────────────────────────── */
export function calcServiceAgreementProgress(data: ServiceAgreementWizardData): number {
  const checks: boolean[] = [
    // Step 1 – Parties (required: names + addresses)
    data.providerName.trim() !== '',
    data.providerAddress.trim() !== '',
    data.clientName.trim() !== '',
    data.clientAddress.trim() !== '',

    // Step 2 – Services
    data.servicesDescription.trim() !== '',
    data.scopeOfWork.trim() !== '',
    data.deliverables.trim() !== '',

    // Step 3 – Fees
    data.pricing.trim() !== '',
    data.paymentTerms.trim() !== '',
    data.billingFrequency !== '',

    // Step 4 – Service Levels
    data.availability.trim() !== '',
    data.responseTime.trim() !== '',
    data.resolutionTime.trim() !== '',
    data.supportHours.trim() !== '',

    // Step 5 – Responsibilities
    data.providerResponsibilities.trim() !== '',
    data.clientResponsibilities.trim() !== '',

    // Step 6 – Term & Termination
    data.startDate.trim() !== '',
    data.endDate.trim() !== '',
    data.renewal !== '',
    data.terminationNotice.trim() !== '',

    // Step 7 – Legal
    data.confidentiality.trim() !== '',
    data.liability.trim() !== '',
    data.governingLaw.trim() !== '',
    data.jurisdiction.trim() !== '',
  ]

  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

export const SA_TOTAL_CHECKS = 24

/* ─── Defaults ──────────────────────────────────────────── */
export const SA_EMPTY_DATA: ServiceAgreementWizardData = {
  providerName: '',
  providerReg: '',
  providerAddress: '',
  clientName: '',
  clientReg: '',
  clientAddress: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',

  servicesDescription: '',
  scopeOfWork: '',
  deliverables: '',

  pricing: '',
  paymentTerms: '',
  billingFrequency: '',

  availability: '',
  responseTime: '',
  resolutionTime: '',
  supportHours: '',

  providerResponsibilities: '',
  clientResponsibilities: '',

  startDate: '',
  endDate: '',
  renewal: '',
  terminationNotice: '',

  confidentiality: '',
  liability: '',
  governingLaw: 'South Africa',
  jurisdiction: 'Johannesburg',
}

const LOCAL_KEY = 'tsl-service-agreement-wizard-state'

const defaultState: ServiceAgreementWizardState = {
  status: 'idle', step: 0, progress: 0,
  data: SA_EMPTY_DATA, startedAt: null, completedAt: null,
}

function draftToState(draft: WizardDraft<ServiceAgreementWizardData>): ServiceAgreementWizardState {
  const data: ServiceAgreementWizardData = { ...SA_EMPTY_DATA, ...draft.data }
  return {
    status: draft.status as ServiceAgreementWizardStatus,
    step: draft.step,
    progress: calcServiceAgreementProgress(data),
    data,
    startedAt: draft.startedAt,
    completedAt: draft.completedAt,
  }
}

function stateToDraft(state: ServiceAgreementWizardState): WizardDraft<ServiceAgreementWizardData> {
  return {
    wizardType: 'service-agreement',
    status: state.status,
    step: state.step,
    progress: state.progress,
    data: state.data,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  }
}

/* ─── Hook ──────────────────────────────────────────────── */
export function useServiceAgreementWizard() {
  const [state, setState] = useState<ServiceAgreementWizardState>(() => {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      try {
        const draft = JSON.parse(raw) as WizardDraft<ServiceAgreementWizardData>
        return draftToState(draft)
      } catch { /* ignore */ }
    }
    return defaultState
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((nextState: ServiceAgreementWizardState, immediate = false) => {
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
      const next: ServiceAgreementWizardState = {
        ...prev,
        status: 'inProgress',
        startedAt: prev.startedAt ?? new Date().toISOString(),
      }
      persist(next, true)
      return next
    })
  }, [persist])

  const saveProgress = useCallback((step: number, data: ServiceAgreementWizardData, immediate = false) => {
    setState((prev) => {
      const next: ServiceAgreementWizardState = {
        ...prev,
        step,
        data,
        progress: calcServiceAgreementProgress(data),
      }
      persist(next, immediate)
      return next
    })
  }, [persist])

  const completeWizard = useCallback(async () => {
    setState((prev) => {
      const completedAt = new Date().toISOString()
      const next: ServiceAgreementWizardState = { ...prev, status: 'completed', completedAt }
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
    wizardService.load<ServiceAgreementWizardData>('service-agreement').then((draft) => {
      if (draft) setState(draftToState(draft))
    })
  }, [])

  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
