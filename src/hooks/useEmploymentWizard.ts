/**
 * useEmploymentWizard.ts
 *
 * All persistence goes through wizardService.
 * Switch VITE_WIZARD_STORAGE=api to use the real backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

/* ─── Types ──────────────────────────────────────────────── */
export interface EmploymentWizardData {
  // Step 1 – Employer Details
  companyName: string
  companyReg: string           // optional
  employerAddress: string
  employerContactPerson: string
  employerEmail: string

  // Step 2 – Employee Details
  employeeFullName: string
  employeeIdNumber: string
  employeeAddress: string
  employeeEmail: string
  employeePhone: string

  // Step 3 – Employment Information
  jobTitle: string
  department: string           // optional
  employmentType: 'Full-Time' | 'Part-Time' | 'Fixed-Term' | 'Contract' | ''
  startDate: string
  probationPeriod: string      // optional
  workingHours: string
  workLocation: string

  // Step 4 – Salary & Benefits
  salaryAmount: string
  salaryFrequency: 'Monthly' | 'Weekly' | 'Bi-Weekly' | 'Annual' | ''
  bonuses: string              // optional
  leaveEntitlement: string
  medicalBenefits: string      // optional
  pension: string              // optional
  otherBenefits: string        // optional

  // Step 5 – Contract Terms
  noticePeriod: string
  confidentialityClause: boolean
  intellectualPropertyClause: boolean
  nonCompeteClause: boolean
  governingLaw: string
}

export type EmploymentWizardStatus = 'idle' | 'inProgress' | 'completed'

export interface EmploymentWizardState {
  status: EmploymentWizardStatus
  /** Last fully-completed step (0 = nothing done; 5 = all steps done) */
  step: number
  /** Progress 0-100 based on required fields filled */
  progress: number
  data: EmploymentWizardData
  startedAt: string | null
  completedAt: string | null
}

/* ─── Required fields (19 total) ─────────────────────────── */
const REQUIRED_FIELDS: (keyof EmploymentWizardData)[] = [
  'companyName', 'employerAddress', 'employerContactPerson', 'employerEmail',
  'employeeFullName', 'employeeIdNumber', 'employeeAddress', 'employeeEmail', 'employeePhone',
  'jobTitle', 'employmentType', 'startDate', 'workingHours', 'workLocation',
  'salaryAmount', 'salaryFrequency', 'leaveEntitlement',
  'noticePeriod', 'governingLaw',
]

export const EMPLOYMENT_TOTAL_REQUIRED = REQUIRED_FIELDS.length // 19

/** Returns 0-100 based on how many required fields contain a non-empty value */
export function calcEmploymentProgress(data: EmploymentWizardData): number {
  const filled = REQUIRED_FIELDS.filter((key) => {
    const val = data[key]
    return typeof val === 'boolean' ? true : typeof val === 'string' && val.trim() !== ''
  }).length
  return Math.round((filled / EMPLOYMENT_TOTAL_REQUIRED) * 100)
}

/* ─── Defaults ──────────────────────────────────────────── */
export const EMPLOYMENT_EMPTY_DATA: EmploymentWizardData = {
  companyName: '', companyReg: '', employerAddress: '',
  employerContactPerson: '', employerEmail: '',
  employeeFullName: '', employeeIdNumber: '', employeeAddress: '',
  employeeEmail: '', employeePhone: '',
  jobTitle: '', department: '', employmentType: '', startDate: '',
  probationPeriod: '', workingHours: '', workLocation: '',
  salaryAmount: '', salaryFrequency: '', bonuses: '', leaveEntitlement: '',
  medicalBenefits: '', pension: '', otherBenefits: '',
  noticePeriod: '',
  confidentialityClause: true, intellectualPropertyClause: true, nonCompeteClause: false,
  governingLaw: 'South Africa',
}

const defaultState: EmploymentWizardState = {
  status: 'idle', step: 0, progress: 0,
  data: EMPLOYMENT_EMPTY_DATA, startedAt: null, completedAt: null,
}

function draftToState(draft: WizardDraft<EmploymentWizardData>): EmploymentWizardState {
  const data = { ...EMPLOYMENT_EMPTY_DATA, ...draft.data }
  return {
    status: draft.status as EmploymentWizardStatus,
    step: draft.step,
    progress: calcEmploymentProgress(data),
    data,
    startedAt: draft.startedAt,
    completedAt: draft.completedAt,
  }
}

function stateToDraft(state: EmploymentWizardState): WizardDraft<EmploymentWizardData> {
  return {
    wizardType: 'employment',
    status: state.status,
    step: state.step,
    progress: state.progress,
    data: state.data,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  }
}

/* ─── Hook ──────────────────────────────────────────────── */
export function useEmploymentWizard() {
  const [state, setState] = useState<EmploymentWizardState>(() => {
    const raw = localStorage.getItem('tsl-employment-wizard-state')
    if (raw) {
      try {
        const draft = JSON.parse(raw) as WizardDraft<EmploymentWizardData>
        return draftToState(draft)
      } catch { /* ignore */ }
    }
    return defaultState
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((nextState: EmploymentWizardState, immediate = false) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const flush = () => { wizardService.save(stateToDraft(nextState)) }
    if (immediate) { flush(); return }
    saveTimerRef.current = setTimeout(flush, 400)
  }, [])

  const startWizard = useCallback(() => {
    setState((prev) => {
      const next: EmploymentWizardState = {
        ...prev,
        status: 'inProgress',
        startedAt: prev.startedAt ?? new Date().toISOString(),
      }
      persist(next, true)
      return next
    })
  }, [persist])

  const saveProgress = useCallback((step: number, data: EmploymentWizardData, immediate = false) => {
    setState((prev) => {
      const next: EmploymentWizardState = {
        ...prev,
        step,
        data,
        progress: calcEmploymentProgress(data),
      }
      persist(next, immediate)
      return next
    })
  }, [persist])

  const completeWizard = useCallback(async () => {
    setState((prev) => {
      const completedAt = new Date().toISOString()
      const next: EmploymentWizardState = { ...prev, status: 'completed', completedAt }
      wizardService.complete('employment', prev.data).then((serverTime) => {
        setState((s) => ({ ...s, completedAt: serverTime }))
        wizardService.save({ ...stateToDraft(next), completedAt: serverTime })
      })
      return next
    })
  }, [])

  const resetWizard = useCallback(() => {
    setState(defaultState)
    wizardService.reset('employment')
  }, [])

  useEffect(() => {
    if (wizardService.mode !== 'api') return
    wizardService.load<EmploymentWizardData>('employment').then((draft) => {
      if (draft) setState(draftToState(draft))
    })
  }, [])

  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
