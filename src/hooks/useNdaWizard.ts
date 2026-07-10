/**
 * useNdaWizard.ts
 *
 * All persistence goes through wizardService.
 * Switch VITE_WIZARD_STORAGE=api to use the real backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

/* ─── Types ─────────────────────────────────────────────── */
export interface NdaWizardData {
  ndaType: 'Mutual' | 'One-Way' | ''
  purpose: 'Investor Discussions' | 'Contractor/Supplier/Commercial' | ''
  disclosingName: string
  disclosingReg: string        // optional
  disclosingAddress: string
  receivingName: string
  receivingReg: string         // optional
  receivingAddress: string
  disclosurePurpose: string
  duration: '12 months' | '24 months' | '36 months' | 'Custom' | ''
  tradeSecrets: boolean        // optional
  permitEmployees: boolean     // optional
  returnDestroy: boolean       // optional
  governingLaw: string
  jurisdictionCity: string
  disclosingSignatoryName: string
  disclosingSignatoryTitle: string
  receivingSignatoryName: string
  receivingSignatoryTitle: string
}

export type NdaWizardStatus = 'idle' | 'inProgress' | 'completed'

export interface NdaWizardState {
  status: NdaWizardStatus
  /** Last fully-completed step (0 = nothing done; 5 = all steps done) */
  step: number
  /** Progress 0-100 based on required fields filled */
  progress: number
  data: NdaWizardData
  startedAt: string | null
  completedAt: string | null
}

/* ─── Required fields (14 total) ────────────────────────── */
const REQUIRED_FIELDS: (keyof NdaWizardData)[] = [
  'ndaType', 'purpose',
  'disclosingName', 'disclosingAddress',
  'receivingName', 'receivingAddress',
  'disclosurePurpose', 'duration',
  'governingLaw', 'jurisdictionCity',
  'disclosingSignatoryName', 'disclosingSignatoryTitle',
  'receivingSignatoryName', 'receivingSignatoryTitle',
]

export const NDA_TOTAL_REQUIRED = REQUIRED_FIELDS.length // 14

/** Returns 0-100 based on how many required fields contain a non-empty value */
export function calcNdaProgress(data: NdaWizardData): number {
  const filled = REQUIRED_FIELDS.filter((key) => {
    const val = data[key]
    return typeof val === 'string' ? val.trim() !== '' : true
  }).length
  return Math.round((filled / NDA_TOTAL_REQUIRED) * 100)
}

/* ─── Defaults ──────────────────────────────────────────── */
export const NDA_EMPTY_DATA: NdaWizardData = {
  ndaType: '', purpose: '',
  disclosingName: '', disclosingReg: '', disclosingAddress: '',
  receivingName: '', receivingReg: '', receivingAddress: '',
  disclosurePurpose: '', duration: '',
  tradeSecrets: true, permitEmployees: true, returnDestroy: true,
  governingLaw: 'South Africa', jurisdictionCity: 'Johannesburg',
  disclosingSignatoryName: '', disclosingSignatoryTitle: '',
  receivingSignatoryName: '', receivingSignatoryTitle: '',
}

const defaultState: NdaWizardState = {
  status: 'idle', step: 0, progress: 0,
  data: NDA_EMPTY_DATA, startedAt: null, completedAt: null,
}

function draftToState(draft: WizardDraft<NdaWizardData>): NdaWizardState {
  const data = { ...NDA_EMPTY_DATA, ...draft.data }
  return {
    status: draft.status as NdaWizardStatus,
    step: draft.step,
    progress: calcNdaProgress(data), // always recompute
    data,
    startedAt: draft.startedAt,
    completedAt: draft.completedAt,
  }
}

function stateToDraft(state: NdaWizardState): WizardDraft<NdaWizardData> {
  return {
    wizardType: 'nda',
    status: state.status,
    step: state.step,
    progress: state.progress,
    data: state.data,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  }
}

/* ─── Hook ──────────────────────────────────────────────── */
export function useNdaWizard() {
  const [state, setState] = useState<NdaWizardState>(() => {
    // Synchronously hydrate from localStorage on first render
    // (wizardService.load is async; we use localStorage directly for SSR-safe init)
    const raw = localStorage.getItem('tsl-nda-wizard-state')
    if (raw) {
      try {
        const draft = JSON.parse(raw) as WizardDraft<NdaWizardData>
        return draftToState(draft)
      } catch { /* ignore */ }
    }
    return defaultState
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Debounced persist — fires immediately for status/complete changes,
   * debounced 400 ms for field-level changes so fast typing doesn't spam the API.
   */
  const persist = useCallback((nextState: NdaWizardState, immediate = false) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const flush = () => { wizardService.save(stateToDraft(nextState)) }
    if (immediate) { flush(); return }
    saveTimerRef.current = setTimeout(flush, 400)
  }, [])

  const startWizard = useCallback(() => {
    setState((prev) => {
      const next: NdaWizardState = {
        ...prev,
        status: 'inProgress',
        startedAt: prev.startedAt ?? new Date().toISOString(),
      }
      persist(next, true)
      return next
    })
  }, [persist])

  /**
   * Save the current step number and form data.
   * Progress is always recomputed from actual field values.
   * Called on every field change (debounced) and on Next click (immediate).
   */
  const saveProgress = useCallback((step: number, data: NdaWizardData, immediate = false) => {
    setState((prev) => {
      const next: NdaWizardState = {
        ...prev,
        step,
        data,
        progress: calcNdaProgress(data),
      }
      persist(next, immediate)
      return next
    })
  }, [persist])

  const completeWizard = useCallback(async () => {
    setState((prev) => {
      const completedAt = new Date().toISOString()
      const next: NdaWizardState = { ...prev, status: 'completed', completedAt }
      // Fire complete through service (handles both local + API)
      wizardService.complete('nda', prev.data).then((serverTime) => {
        setState((s) => ({ ...s, completedAt: serverTime }))
        wizardService.save({ ...stateToDraft(next), completedAt: serverTime })
      })
      return next
    })
  }, [])

  const resetWizard = useCallback(() => {
    setState(defaultState)
    wizardService.reset('nda')
  }, [])

  // On mount, if API mode, refresh from server to sync across devices/tabs
  useEffect(() => {
    if (wizardService.mode !== 'api') return
    wizardService.load<NdaWizardData>('nda').then((draft) => {
      if (draft) setState(draftToState(draft))
    })
  }, [])

  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
