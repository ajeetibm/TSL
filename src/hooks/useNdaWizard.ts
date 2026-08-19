/**
 * useNdaWizard.ts
 *
 * All persistence goes through wizardService.
 * Switch VITE_WIZARD_STORAGE=api to use the real backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

/* ─── Address ────────────────────────────────────────────── */
export interface NdaAddress {
  street_number: string
  building: string
  street_name: string
  suburb: string
  city: string
  province: string
  postal_code: string
  country: string
}

export function emptyAddress(country = 'South Africa'): NdaAddress {
  return { street_number: '', building: '', street_name: '', suburb: '', city: '', province: '', postal_code: '', country }
}

/* ─── Party ──────────────────────────────────────────────── */
export type NdaEntityType = 'Company' | 'Close corporation' | 'Trust' | 'Partnership' | 'Individual'
export type NdaSignatoryCapacity = 'Director' | 'Member' | 'Trustee' | 'Partner' | 'Authorised representative'

export interface NdaParty {
  entity_type: NdaEntityType
  // Entity fields
  legal_name: string
  reg_number: string
  trading_name: string
  // Individual fields
  full_names: string
  id_number: string
  address: NdaAddress
  email: string
  phone: string
  // Signatory (entities only)
  signatory_name: string
  signatory_capacity: NdaSignatoryCapacity
}

export function emptyParty(entity_type: NdaEntityType = 'Company'): NdaParty {
  return {
    entity_type,
    legal_name: '', reg_number: '', trading_name: '',
    full_names: '', id_number: '',
    address: emptyAddress(),
    email: '', phone: '',
    signatory_name: '', signatory_capacity: 'Director',
  }
}

/* ─── Main wizard data ───────────────────────────────────── */
export interface NdaWizardData {
  // Step 1 – Parties
  agreement_type: 'Mutual' | 'One way'
  disclosing_party: 'Your company' | 'The other party'
  party_b_type: 'A company' | 'A close corporation' | 'A trust' | 'A partnership' | 'An individual'
  party_a: NdaParty
  party_b: NdaParty

  // Step 2 – Purpose & Scope
  purpose: string
  ci_definition: 'Broad with standard exclusions' | 'Specified categories only'
  ci_categories: string[]
  ci_exclusions: string[]
  marking_required: boolean

  // Step 3 – Obligations
  duration_years: number
  duration_start: 'Date of disclosure' | 'End of the agreement'
  permitted_recipients: string[]
  return_or_destroy: 'Return or destroy at the discloser election' | 'Return' | 'Destroy'
  archival_copy: boolean
  non_solicit: boolean
  non_solicit_months: number

  // Step 4 – Legal + Signing
  governing_law: string
  dispute_forum: 'Arbitration under AFSA rules' | 'South African courts'
  domicilium_a: NdaAddress
  domicilium_b: NdaAddress
  signature_method: 'Platform signature' | 'Print and sign'
  signing_order: 'Either order' | 'Your company first' | 'Other party first'
}

export type NdaWizardStatus = 'idle' | 'inProgress' | 'completed'

export interface NdaWizardState {
  status: NdaWizardStatus
  /** Last fully-completed step (0 = nothing done) */
  step: number
  /** Progress 0-100 */
  progress: number
  data: NdaWizardData
  startedAt: string | null
  completedAt: string | null
}

/* ─── Required fields per step ───────────────────────────── */
function isEntity(entity_type: NdaEntityType) {
  return entity_type !== 'Individual'
}

export function partyTypeToEntity(t: string): NdaEntityType {
  const map: Record<string, NdaEntityType> = {
    'A company': 'Company',
    'A close corporation': 'Close corporation',
    'A trust': 'Trust',
    'A partnership': 'Partnership',
    'An individual': 'Individual',
  }
  return map[t] ?? 'Company'
}

export function calcNdaProgress(data: NdaWizardData): number {
  const checks: boolean[] = [
    // Party A core
    isEntity(data.party_a.entity_type) ? !!data.party_a.legal_name.trim() : !!data.party_a.full_names.trim(),
    isEntity(data.party_a.entity_type) ? !!data.party_a.signatory_name.trim() : !!data.party_a.id_number.trim(),
    !!data.party_a.address.street_number.trim(),
    !!data.party_a.address.street_name.trim(),
    !!data.party_a.address.suburb.trim(),
    !!data.party_a.address.city.trim(),
    !!data.party_a.address.postal_code.trim(),
    !!data.party_a.email.trim(),
    // Party B core
    isEntity(partyTypeToEntity(data.party_b_type)) ? !!data.party_b.legal_name.trim() : !!data.party_b.full_names.trim(),
    isEntity(partyTypeToEntity(data.party_b_type)) ? !!data.party_b.signatory_name.trim() : !!data.party_b.id_number.trim(),
    !!data.party_b.address.street_number.trim(),
    !!data.party_b.address.street_name.trim(),
    !!data.party_b.address.suburb.trim(),
    !!data.party_b.address.city.trim(),
    !!data.party_b.address.postal_code.trim(),
    !!data.party_b.email.trim(),
    // Step 2
    !!data.purpose.trim(),
    // Step 3
    data.duration_years > 0,
    // Step 4
    !!data.governing_law.trim(),
    !!data.domicilium_a.street_number.trim(),
    !!data.domicilium_a.street_name.trim(),
    !!data.domicilium_a.suburb.trim(),
    !!data.domicilium_a.city.trim(),
    !!data.domicilium_a.postal_code.trim(),
    !!data.domicilium_b.street_number.trim(),
    !!data.domicilium_b.street_name.trim(),
    !!data.domicilium_b.suburb.trim(),
    !!data.domicilium_b.city.trim(),
    !!data.domicilium_b.postal_code.trim(),
  ]
  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

export const NDA_TOTAL_REQUIRED = 29 // kept for compat

/* ─── Defaults ──────────────────────────────────────────── */
export const NDA_EMPTY_DATA: NdaWizardData = {
  agreement_type: 'Mutual',
  disclosing_party: 'Your company',
  party_b_type: 'A company',
  party_a: emptyParty('Company'),
  party_b: emptyParty('Company'),

  purpose: '',
  ci_definition: 'Broad with standard exclusions',
  ci_categories: [],
  ci_exclusions: ['Already public', 'Independently developed', 'Lawfully received from a third party', 'Required to be disclosed by law'],
  marking_required: false,

  duration_years: 3,
  duration_start: 'Date of disclosure',
  permitted_recipients: ['Employees', 'Directors', 'Professional advisers'],
  return_or_destroy: 'Return or destroy at the discloser election',
  archival_copy: true,
  non_solicit: false,
  non_solicit_months: 12,

  governing_law: 'South African law',
  dispute_forum: 'Arbitration under AFSA rules',
  domicilium_a: emptyAddress(),
  domicilium_b: emptyAddress(),
  signature_method: 'Platform signature',
  signing_order: 'Either order',
}

const defaultState: NdaWizardState = {
  status: 'idle', step: 0, progress: 0,
  data: NDA_EMPTY_DATA, startedAt: null, completedAt: null,
}

function draftToState(draft: WizardDraft<NdaWizardData>): NdaWizardState {
  const data = { ...NDA_EMPTY_DATA, ...draft.data }
  const status: NdaWizardStatus = draft.completedAt ? 'completed' : draft.status as NdaWizardStatus
  return {
    status,
    step: draft.step,
    progress: calcNdaProgress(data),
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

  const persist = useCallback((nextState: NdaWizardState, immediate = false) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const flush = () => { wizardService.save(stateToDraft(nextState)) }
    if (immediate) { flush(); return }
    saveTimerRef.current = setTimeout(flush, 400)
  }, [])

  const startWizard = useCallback(() => {
    setState((prev) => {
      if (prev.status === 'completed') return prev
      const next: NdaWizardState = {
        ...prev,
        status: 'inProgress',
        startedAt: prev.startedAt ?? new Date().toISOString(),
      }
      persist(next, true)
      return next
    })
  }, [persist])

  const saveProgress = useCallback((step: number, data: NdaWizardData, immediate = false) => {
    setState((prev) => {
      const next: NdaWizardState = {
        ...prev,
        status: prev.status === 'completed' ? 'completed' : 'inProgress',
        step,
        data,
        progress: calcNdaProgress(data),
        startedAt: prev.startedAt ?? new Date().toISOString(),
        completedAt: prev.status === 'completed' ? prev.completedAt : null,
      }
      persist(next, immediate)
      return next
    })
  }, [persist])

  const completeWizard = useCallback(async () => {
    setState((prev) => {
      const completedAt = new Date().toISOString()
      const next: NdaWizardState = { ...prev, status: 'completed', completedAt }
      persist(next, true)
      wizardService.complete('nda', prev.data).then((serverTime) => {
        setState((s) => ({ ...s, completedAt: serverTime }))
        wizardService.save({ ...stateToDraft(next), completedAt: serverTime })
      })
      return next
    })
  }, [persist])

  const resetWizard = useCallback(() => {
    setState(defaultState)
    wizardService.reset('nda')
  }, [])

  useEffect(() => {
    if (wizardService.mode !== 'api') return
    wizardService.load<NdaWizardData>('nda').then((draft) => {
      if (draft) setState(draftToState(draft))
    })
  }, [])

  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
