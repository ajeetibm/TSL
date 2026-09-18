import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

export interface EmploymentWizardData {
  company_id: string; employer_name: string
  'candidate.full_names': string; 'candidate.email': string
  job_title: string; reports_to: string; start_date: string; work_location: '' | 'On site' | 'Hybrid' | 'Remote'
  salary_amount: string; salary_period: '' | 'Per month' | 'Per annum'; salary_period_confirmed?: boolean
  benefits: string[]; benefits_detail: string; probation_months: string; restraint_flag: boolean | null
  conditions: string[]; medical_justification: string; work_permit_type: string; work_permit_expiry: string; offer_expiry: string
  /** Legacy output fields retained until the document builders are migrated. */
  companyName: string; companyReg: string; employerAddress: string; employerContactPerson: string; employerEmail: string
  employeeFullName: string; employeeIdNumber: string; employeeAddress: string; employeeEmail: string; employeePhone: string
  jobTitle: string; department: string; employmentType: string; startDate: string; probationPeriod: string; workingHours: string; workLocation: string
  salaryAmount: string; salaryFrequency: string; bonuses: string; leaveEntitlement: string; medicalBenefits: string; pension: string; otherBenefits: string
  noticePeriod: string; confidentialityClause: boolean; intellectualPropertyClause: boolean; nonCompeteClause: boolean; governingLaw: string
}
export type EmploymentWizardStatus = 'idle' | 'inProgress' | 'completed'
export interface EmploymentWizardState { status: EmploymentWizardStatus; step: number; progress: number; data: EmploymentWizardData; startedAt: string | null; completedAt: string | null }
/**
 * Progress reflects the actual required inputs for the current offer, rather
 * than the screen the user happens to be viewing.  Medical and work-
 * authorisation fields only enter the denominator when their corresponding
 * condition has been selected.
 */
export function calcEmploymentProgress(data: EmploymentWizardData) {
  const required: Array<keyof EmploymentWizardData> = [
    'company_id',
    'candidate.full_names',
    'candidate.email',
    'job_title',
    'reports_to',
    'start_date',
    'work_location',
    'salary_amount',
    'salary_period',
    'restraint_flag',
    'conditions',
    'offer_expiry',
  ]

  const hasMedicalAssessment = data.conditions.includes('Medical assessment')
  const hasWorkAuthorisation = data.conditions.includes('Valid work authorisation')
  if (hasMedicalAssessment) required.push('medical_justification')
  if (hasWorkAuthorisation) {
    required.push('work_permit_type')
    required.push('work_permit_expiry')
  }

  const complete = required.filter((key) => {
    if (key === 'salary_period') {
      return Boolean(data.salary_period && data.salary_period_confirmed)
    }
    const value = data[key]
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'string') return value.trim().length > 0
    return value !== null
  }).length

  return Math.round((complete / required.length) * 100)
}
export const EMPLOYMENT_EMPTY_DATA: EmploymentWizardData = { company_id: '', employer_name: '', 'candidate.full_names': '', 'candidate.email': '', job_title: '', reports_to: '', start_date: '', work_location: '', salary_amount: '', salary_period: '', benefits: [], benefits_detail: '', probation_months: '3', restraint_flag: null, conditions: [], medical_justification: '', work_permit_type: '', work_permit_expiry: '', offer_expiry: '', companyName: '', companyReg: '', employerAddress: '', employerContactPerson: '', employerEmail: '', employeeFullName: '', employeeIdNumber: '', employeeAddress: '', employeeEmail: '', employeePhone: '', jobTitle: '', department: '', employmentType: '', startDate: '', probationPeriod: '', workingHours: '', workLocation: '', salaryAmount: '', salaryFrequency: '', bonuses: '', leaveEntitlement: '', medicalBenefits: '', pension: '', otherBenefits: '', noticePeriod: '', confidentialityClause: true, intellectualPropertyClause: true, nonCompeteClause: false, governingLaw: 'South Africa' }
const base: EmploymentWizardState = { status: 'idle', step: 0, progress: 0, data: EMPLOYMENT_EMPTY_DATA, startedAt: null, completedAt: null }
function fromDraft(draft: WizardDraft<EmploymentWizardData>): EmploymentWizardState { const data = { ...EMPLOYMENT_EMPTY_DATA, ...draft.data }; return { status: draft.completedAt ? 'completed' : draft.status, step: draft.step, progress: calcEmploymentProgress(data), data, startedAt: draft.startedAt, completedAt: draft.completedAt } }
function toDraft(state: EmploymentWizardState): WizardDraft<EmploymentWizardData> { return { wizardType: 'employment', status: state.status, step: state.step, progress: state.progress, data: state.data, startedAt: state.startedAt, completedAt: state.completedAt } }
export function useEmploymentWizard() {
  const [state, setState] = useState<EmploymentWizardState>(() => { try { const saved = localStorage.getItem('tsl-employment-wizard-state'); return saved ? fromDraft(JSON.parse(saved)) : base } catch { return base } })
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persist = useCallback((next: EmploymentWizardState, immediate = false) => { if (timer.current) clearTimeout(timer.current); const save = () => { void wizardService.save(toDraft(next)) }; immediate ? save() : timer.current = setTimeout(save, 400) }, [])
  const startWizard = useCallback(() => setState((current) => { const next = { ...current, status: 'inProgress' as const, startedAt: current.startedAt ?? new Date().toISOString() }; persist(next, true); return next }), [persist])
  const saveProgress = useCallback((step: number, data: EmploymentWizardData, immediate = false) => setState((current) => { const next = { ...current, step, data, progress: calcEmploymentProgress(data) }; persist(next, immediate); return next }), [persist])
  const completeWizard = useCallback((completedData?: EmploymentWizardData) => setState((current) => { const completedAt = new Date().toISOString(); const data = completedData ?? current.data; const next = { ...current, data, status: 'completed' as const, completedAt }; persist(next, true); void wizardService.complete('employment', data); return next }), [persist])
  const resetWizard = useCallback(() => { setState(base); void wizardService.reset('employment') }, [])
  useEffect(() => { if (wizardService.mode === 'api') void wizardService.load<EmploymentWizardData>('employment').then((draft) => { if (draft) setState(fromDraft(draft)) }) }, [])
  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
