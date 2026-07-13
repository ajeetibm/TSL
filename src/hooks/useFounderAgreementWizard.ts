/**
 * useFounderAgreementWizard.ts
 *
 * All persistence goes through localStorage (mirrors wizardService pattern).
 * Switch VITE_WIZARD_STORAGE=api to use the real backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

/* ─── Sub-types ──────────────────────────────────────────── */
export interface FAFounder {
  id: string
  name: string
  email: string
  role: string
  equity: string   // percentage as string, e.g. "50"
}

export interface FASignatory {
  id: string
  name: string
  title: string
}

/* ─── Main data shape ────────────────────────────────────── */
export interface FounderAgreementWizardData {
  // Step 1 – Company Information
  isIncorporated: 'Yes' | 'No' | ''
  companyName: string           // required when isIncorporated === 'Yes'
  registrationNumber: string    // required when isIncorporated === 'Yes'
  registeredAddress: string

  // Step 2 – Founders (dynamic list, minimum 2)
  founders: FAFounder[]

  // Step 3 – Governance & Decision Making
  decisionMakingModel: string
  reservedMatters: string[]     // dynamic list, minimum 1
  boardApprovalRequirements: string
  founderResponsibilities: string

  // Step 4 – Vesting & Share Rules
  vestingEnabled: 'Yes' | 'No' | ''
  cliffPeriod: string           // required when vestingEnabled === 'Yes'
  vestingPeriod: string         // required when vestingEnabled === 'Yes'
  shareTransferRestrictions: string
  buybackRights: string
  founderExitRules: string

  // Step 5 – Intellectual Property
  assignIpToCompany: 'Yes' | 'No' | ''
  hasExistingIp: 'Yes' | 'No' | ''
  existingIpDescription: string // required when hasExistingIp === 'Yes'
  existingIpAssignment: string  // required when hasExistingIp === 'Yes'

  // Step 6 – Legal & Signing
  confidentiality: string
  disputeResolution: 'Mediation' | 'Arbitration' | 'Litigation' | ''
  governingLaw: string
  jurisdiction: string
  signatories: FASignatory[]    // dynamic list, minimum 1
}

export type FounderAgreementWizardStatus = 'idle' | 'inProgress' | 'completed'

export interface FounderAgreementWizardState {
  status: FounderAgreementWizardStatus
  step: number
  progress: number
  data: FounderAgreementWizardData
  startedAt: string | null
  completedAt: string | null
}

/* ─── Equity helpers ─────────────────────────────────────── */
export function calcEquityTotal(founders: FAFounder[]): number {
  return founders.reduce((sum, f) => sum + (parseFloat(f.equity) || 0), 0)
}

export function equityValid(founders: FAFounder[]): boolean {
  return Math.abs(calcEquityTotal(founders) - 100) < 0.01
}

/* ─── Progress calculation ───────────────────────────────── */
export function calcFounderAgreementProgress(data: FounderAgreementWizardData): number {
  const checks: boolean[] = [
    // Step 1
    data.isIncorporated !== '',
    data.registeredAddress.trim() !== '',
    data.isIncorporated !== 'Yes' || data.companyName.trim() !== '',
    data.isIncorporated !== 'Yes' || data.registrationNumber.trim() !== '',

    // Step 2 — at least 1 founder with all fields filled, equity must total 100%
    data.founders.length >= 1,
    data.founders.every(f => f.name.trim() !== '' && f.email.trim() !== '' && f.role.trim() !== '' && f.equity.trim() !== ''),
    equityValid(data.founders),

    // Step 3
    data.decisionMakingModel.trim() !== '',
    data.reservedMatters.some(r => r.trim() !== ''),
    data.boardApprovalRequirements.trim() !== '',
    data.founderResponsibilities.trim() !== '',

    // Step 4
    data.vestingEnabled !== '',
    data.vestingEnabled !== 'Yes' || data.cliffPeriod.trim() !== '',
    data.vestingEnabled !== 'Yes' || data.vestingPeriod.trim() !== '',
    data.shareTransferRestrictions.trim() !== '',
    data.buybackRights.trim() !== '',
    data.founderExitRules.trim() !== '',

    // Step 5
    data.assignIpToCompany !== '',
    data.hasExistingIp !== '',
    data.hasExistingIp !== 'Yes' || data.existingIpDescription.trim() !== '',
    data.hasExistingIp !== 'Yes' || data.existingIpAssignment.trim() !== '',

    // Step 6
    data.confidentiality.trim() !== '',
    data.disputeResolution !== '',
    data.governingLaw.trim() !== '',
    data.jurisdiction.trim() !== '',
    data.signatories.length >= 1,
    data.signatories.every(s => s.name.trim() !== '' && s.title.trim() !== ''),
  ]

  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

export const FA_TOTAL_CHECKS = 27  // total items in the checks array above

/* ─── Defaults ──────────────────────────────────────────── */
const makeFounder = (id: string): FAFounder => ({ id, name: '', email: '', role: '', equity: '' })
const makeSignatory = (id: string): FASignatory => ({ id, name: '', title: '' })

export const FA_EMPTY_DATA: FounderAgreementWizardData = {
  isIncorporated: '',
  companyName: '',
  registrationNumber: '',
  registeredAddress: '',

  founders: [makeFounder('f1')],

  decisionMakingModel: '',
  reservedMatters: [''],
  boardApprovalRequirements: '',
  founderResponsibilities: '',

  vestingEnabled: '',
  cliffPeriod: '',
  vestingPeriod: '',
  shareTransferRestrictions: '',
  buybackRights: '',
  founderExitRules: '',

  assignIpToCompany: '',
  hasExistingIp: '',
  existingIpDescription: '',
  existingIpAssignment: '',

  confidentiality: '',
  disputeResolution: '',
  governingLaw: 'South Africa',
  jurisdiction: 'Johannesburg',
  signatories: [makeSignatory('s1')],
}

const LOCAL_KEY = 'tsl-founder-agreement-wizard-state'

const defaultState: FounderAgreementWizardState = {
  status: 'idle', step: 0, progress: 0,
  data: FA_EMPTY_DATA, startedAt: null, completedAt: null,
}

function draftToState(draft: WizardDraft<FounderAgreementWizardData>): FounderAgreementWizardState {
  const raw = draft.data as Partial<FounderAgreementWizardData>
  // Ensure arrays always exist (guard against old serialized drafts)
  const data: FounderAgreementWizardData = {
    ...FA_EMPTY_DATA,
    ...raw,
    founders: Array.isArray(raw.founders) && raw.founders.length >= 1
      ? raw.founders
      : FA_EMPTY_DATA.founders,
    reservedMatters: Array.isArray(raw.reservedMatters) && raw.reservedMatters.length >= 1
      ? raw.reservedMatters
      : FA_EMPTY_DATA.reservedMatters,
    signatories: Array.isArray(raw.signatories) && raw.signatories.length >= 1
      ? raw.signatories
      : FA_EMPTY_DATA.signatories,
  }
  return {
    status: draft.status as FounderAgreementWizardStatus,
    step: draft.step,
    progress: calcFounderAgreementProgress(data),
    data,
    startedAt: draft.startedAt,
    completedAt: draft.completedAt,
  }
}

function stateToDraft(state: FounderAgreementWizardState): WizardDraft<FounderAgreementWizardData> {
  return {
    wizardType: 'founder-agreement',
    status: state.status,
    step: state.step,
    progress: state.progress,
    data: state.data,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  }
}

/* ─── Hook ──────────────────────────────────────────────── */
export function useFounderAgreementWizard() {
  const [state, setState] = useState<FounderAgreementWizardState>(() => {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      try {
        const draft = JSON.parse(raw) as WizardDraft<FounderAgreementWizardData>
        return draftToState(draft)
      } catch { /* ignore */ }
    }
    return defaultState
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((nextState: FounderAgreementWizardState, immediate = false) => {
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
      const next: FounderAgreementWizardState = {
        ...prev,
        status: 'inProgress',
        startedAt: prev.startedAt ?? new Date().toISOString(),
      }
      persist(next, true)
      return next
    })
  }, [persist])

  const saveProgress = useCallback((step: number, data: FounderAgreementWizardData, immediate = false) => {
    setState((prev) => {
      const next: FounderAgreementWizardState = {
        ...prev,
        step,
        data,
        progress: calcFounderAgreementProgress(data),
      }
      persist(next, immediate)
      return next
    })
  }, [persist])

  const completeWizard = useCallback(async () => {
    setState((prev) => {
      const completedAt = new Date().toISOString()
      const next: FounderAgreementWizardState = { ...prev, status: 'completed', completedAt }
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
    wizardService.load<FounderAgreementWizardData>('founder-agreement').then((draft) => {
      if (draft) setState(draftToState(draft))
    })
  }, [])

  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
