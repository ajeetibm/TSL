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
  fullNames: string
  idNumber: string
  role: string
  commitment: 'Full time' | 'Part time' | 'Advisory' | ''
  equityPct: string   // percentage as string, e.g. "50"
  capital: string
}

export interface FAPriorIp {
  id: string
  founder: string
  description: string
  dateCreated: string
  treatment: 'Assigned to the company' | 'Licensed to the company' | 'Excluded and retained' | ''
}

export interface FADigitalAsset {
  id: string
  asset: string
  currentHolder: string
  transferDate: string
}

export interface FASignatory {
  id: string
  name: string
  capacity: 'Founder' | 'Company (where incorporated)' | ''
}

/* ─── Main data shape ────────────────────────────────────── */
export interface FounderAgreementWizardData {
  // Screen 1 – Company status
  isIncorporated: 'Yes' | 'No' | ''
  companyName: string             // pre-filled when incorporated
  intendedName: string            // required when not incorporated
  targetIncorporation: string     // required when not incorporated

  // Screen 2 – Founders & equity
  founders: FAFounder[]

  // Screen 3 – Vesting
  vestingApplies: 'Yes' | 'No' | ''
  vestingMonths: string
  cliffMonths: string
  vestingFrequency: 'Monthly' | 'Quarterly' | ''
  acceleration: string
  goodLeaver: string[]
  badLeaverEffect: string

  // Screen 4 – Decisions & roles
  decisionModel: 'Unanimous for everything' | 'Majority with reserved matters unanimous' | 'Majority for everything' | ''
  reservedMatters: string[]
  debtThreshold: string
  removalProcess: string
  departureRole: string

  // Screen 5 – Intellectual property
  ipPreIncorporation: 'Yes' | 'No' | ''
  priorIp: FAPriorIp[]
  priorIpNil: boolean
  publiclyFunded: 'Yes' | 'No' | ''
  createdAtEmployer: 'Yes' | 'No' | ''
  digitalAssets: FADigitalAsset[]

  // Screen 6 – Protections & legal
  confidentiality: 'Yes' | 'No' | ''
  nonSolicit: 'Yes' | 'No' | ''
  restraint: 'Yes' | 'No' | ''
  restraintMonths: string
  restraintArea: 'South Africa' | 'Named provinces' | 'Worldwide' | ''
  deadlock: string
  disputeForum: string
  governingLaw: string
  signatories: FASignatory[]
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
  return founders.reduce((sum, f) => sum + (parseFloat(f.equityPct) || 0), 0)
}

export function equityValid(founders: FAFounder[]): boolean {
  return Math.abs(calcEquityTotal(founders) - 100) < 0.01
}

/* ─── Progress calculation ───────────────────────────────── */
export function calcFounderAgreementProgress(data: FounderAgreementWizardData): number {
  const checks: boolean[] = [
    // Screen 1
    data.isIncorporated !== '',
    data.isIncorporated !== 'No' || data.intendedName.trim() !== '',
    data.isIncorporated !== 'No' || data.targetIncorporation.trim() !== '',

    // Screen 2 — at least 1 founder with name + equity
    data.founders.length >= 1,
    data.founders.every(f => f.fullNames.trim() !== '' && f.equityPct.trim() !== ''),
    equityValid(data.founders),

    // Screen 3
    data.vestingApplies !== '',
    data.vestingApplies !== 'Yes' || data.vestingMonths.trim() !== '',
    data.vestingApplies !== 'Yes' || data.cliffMonths.trim() !== '',
    data.vestingApplies !== 'Yes' || data.vestingFrequency !== '',

    // Screen 4
    data.decisionModel !== '',
    data.removalProcess.trim() !== '',
    data.departureRole.trim() !== '',

    // Screen 5
    data.ipPreIncorporation !== '',
    data.priorIpNil || data.priorIp.some(p => p.founder.trim() !== ''),
    data.publiclyFunded !== '',
    data.createdAtEmployer !== '',

    // Screen 6
    data.confidentiality !== '',
    data.nonSolicit !== '',
    data.restraint !== '',
    data.restraint !== 'Yes' || data.restraintMonths.trim() !== '',
    data.restraint !== 'Yes' || data.restraintArea !== '',
    data.deadlock.trim() !== '',
    data.disputeForum.trim() !== '',
    data.signatories.length >= 1,
    data.signatories.every(s => s.name.trim() !== ''),
  ]

  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

export const FA_TOTAL_CHECKS = 26  // total items in the checks array above

/* ─── Defaults ──────────────────────────────────────────── */
export const makeFounder = (id: string): FAFounder => ({
  id, fullNames: '', idNumber: '', role: '', commitment: '', equityPct: '', capital: '',
})
export const makePriorIp = (id: string): FAPriorIp => ({
  id, founder: '', description: '', dateCreated: '', treatment: '',
})
export const makeDigitalAsset = (id: string): FADigitalAsset => ({
  id, asset: '', currentHolder: '', transferDate: '',
})
export const makeSignatory = (id: string): FASignatory => ({
  id, name: '', capacity: '',
})

export const FA_EMPTY_DATA: FounderAgreementWizardData = {
  isIncorporated: 'Yes',
  companyName: '',
  intendedName: '',
  targetIncorporation: '',

  founders: [makeFounder('f1')],

  vestingApplies: 'Yes',
  vestingMonths: '48',
  cliffMonths: '12',
  vestingFrequency: 'Monthly',
  acceleration: '',
  goodLeaver: [],
  badLeaverEffect: '',

  decisionModel: 'Majority with reserved matters unanimous',
  reservedMatters: [],
  debtThreshold: '',
  removalProcess: 'By unanimous vote of the other founders',
  departureRole: 'Resigns as director and employee',

  ipPreIncorporation: 'Yes',
  priorIp: [makePriorIp('ip1')],
  priorIpNil: false,
  publiclyFunded: 'No',
  createdAtEmployer: 'No',
  digitalAssets: [],

  confidentiality: 'Yes',
  nonSolicit: 'Yes',
  restraint: 'Yes',
  restraintMonths: '12',
  restraintArea: 'South Africa',
  deadlock: 'Mediation then arbitration',
  disputeForum: 'Arbitration under AFSA rules',
  governingLaw: 'South African law',
  signatories: [makeSignatory('s1')],
}

const LOCAL_KEY = 'tsl-founder-agreement-wizard-state'

const defaultState: FounderAgreementWizardState = {
  status: 'idle', step: 0, progress: 0,
  data: FA_EMPTY_DATA, startedAt: null, completedAt: null,
}

function draftToState(draft: WizardDraft<FounderAgreementWizardData>): FounderAgreementWizardState {
  const raw = draft.data as Partial<FounderAgreementWizardData>
  const data: FounderAgreementWizardData = {
    ...FA_EMPTY_DATA,
    ...raw,
    founders: Array.isArray(raw.founders) && raw.founders.length >= 1
      ? raw.founders
      : FA_EMPTY_DATA.founders,
    priorIp: Array.isArray(raw.priorIp) && raw.priorIp.length >= 1
      ? raw.priorIp
      : FA_EMPTY_DATA.priorIp,
    digitalAssets: Array.isArray(raw.digitalAssets) ? raw.digitalAssets : [],
    reservedMatters: Array.isArray(raw.reservedMatters) ? raw.reservedMatters : [],
    goodLeaver: Array.isArray(raw.goodLeaver) ? raw.goodLeaver : [],
    signatories: Array.isArray(raw.signatories) && raw.signatories.length >= 1
      ? raw.signatories
      : FA_EMPTY_DATA.signatories,
  }
  const status: FounderAgreementWizardStatus = draft.completedAt ? 'completed' : draft.status as FounderAgreementWizardStatus
  return {
    status,
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
      if (prev.status === 'completed') return prev
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
