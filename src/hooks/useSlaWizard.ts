/**
 * useSlaWizard.ts
 *
 * Persistence follows the same localStorage pattern as every other wizard hook.
 * Switch VITE_WIZARD_STORAGE=api to use the real backend.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { wizardService, type WizardDraft } from '../services/wizardService'

/* ─── Severity target row ────────────────────────────────── */
export interface SeverityTarget {
  severity: string
  description: string
  responseTarget: string
  resolutionTarget: string
}

/* ─── Escalation contact row ────────────────────────────── */
export interface EscalationContact {
  name: string
  role: string
  email: string
  telephone: string
}

/* ─── Credit tier row ────────────────────────────────────── */
export interface CreditTier {
  uptimeBelow: string
  creditPct: string
}

/* ─── Signatory row ─────────────────────────────────────── */
export interface SlaSignatory {
  name: string
  title: string
}

/* ─── Party block (Section 8 shared component) ───────────── */
export type PartyEntityType = 'Company' | 'Close corporation' | 'Trust' | 'Partnership' | 'Individual' | ''
export type SignatoryCapacity = 'Director' | 'Member' | 'Trustee' | 'Partner' | 'Authorised representative' | ''

export interface PartyBlock {
  entityType: PartyEntityType
  legalName: string            // entities only
  regNumber: string            // entities only, optional for SLA
  tradingName: string          // entities only, optional
  fullNames: string            // individuals only
  idNumber: string             // individuals only, optional
  email: string
  phone: string                // optional
  signatoryName: string        // entities only
  signatoryCapacity: SignatoryCapacity  // entities only
}

/* ─── Main data shape ────────────────────────────────────── */
export interface SlaWizardData {
  // Screen 1 – Basics
  providerConfirmed: boolean    // snapshot confirm toggle
  // Provider party block (pre-filled from Company Snapshot)
  provider: PartyBlock
  // Customer party block
  customer: PartyBlock
  // Legacy flat fields kept for backward-compat with existing drafts
  /** @deprecated use customer.legalName */
  customerName: string
  /** @deprecated use customer.regNumber */
  customerReg: string
  /** @deprecated use customer.email */
  customerEmail: string
  /** @deprecated use provider.legalName */
  providerName: string
  /** @deprecated use provider.regNumber */
  providerReg: string
  /** @deprecated use provider.email */
  providerEmail: string
  /** @deprecated use customer.address */
  customerAddress: string
  /** @deprecated use provider.address */
  providerAddress: string
  serviceDescription: string
  startDate: string
  termType: 'Ongoing until terminated' | 'Fixed end date' | ''
  endDate: string               // conditional: termType === 'Fixed end date'

  // Screen 2 – Modules
  modules: string[]             // multi-select of active module names

  // Screen 3 – Availability (conditional)
  uptimeTarget: string
  uptimePeriod: 'Monthly' | 'Quarterly' | ''
  uptimeExclusions: string[]

  // Screen 4 – Support (conditional)
  supportHours: 'Business hours' | '24/7' | 'Custom' | ''
  supportHoursCustom: string    // conditional: supportHours === 'Custom'
  supportChannels: string[]
  supportChannelOther: string   // conditional: Other in supportChannels

  // Screen 5 – Incident Response (conditional)
  useSeverityModel: boolean
  severityTargets: SeverityTarget[]
  incidentNarrative: string     // conditional: useSeverityModel === false
  escalationContacts: EscalationContact[]

  // Screen 6 – Maintenance (conditional)
  maintenanceWindow: string
  maintenanceNoticeHours: string
  emergencyMaintenance: boolean

  // Screen 7 – Backups & Restore (conditional)
  backupFrequency: 'Daily' | 'Weekly' | 'Continuous' | 'Custom' | ''
  rtoHours: string
  rpoHours: string
  backupRetentionDays: string

  // Screen 8 – Security (conditional)
  securityCommitments: string[]
  breachNoticeHours: string

  // Screen 9 – Service Credits (conditional)
  creditTiers: CreditTier[]
  creditCapPct: string
  creditClaimDays: string
  creditsSoleRemedy: boolean

  // Screen 10 – Legal & Signing
  governingLaw: string
  disputeForum: 'Arbitration under AFSA rules' | 'South African courts' | ''
  jurisdictionCity: string      // conditional: disputeForum === 'South African courts'
  signatureMethod: 'Platform signature' | 'Print and sign' | ''
  signingOrder: 'Either order' | 'Your company first' | 'Other party first' | ''  // conditional: signatureMethod = Platform signature
  signatories: SlaSignatory[]
}

export type SlaWizardStatus = 'idle' | 'inProgress' | 'completed'

export interface SlaWizardState {
  status: SlaWizardStatus
  step: number
  progress: number
  data: SlaWizardData
  startedAt: string | null
  completedAt: string | null
}

/* ─── Progress calculation ───────────────────────────────── */
export function calcSlaProgress(data: SlaWizardData): number {
  const hasModule = (m: string) => data.modules.includes(m)

  // Resolve customer and provider names from the new Party block or fall back to
  // the legacy flat fields so that saved drafts without the party block still work.
  const customerName = data.customer?.legalName?.trim() || data.customer?.fullNames?.trim() || data.customerName?.trim() || ''
  const providerName = data.provider?.legalName?.trim() || data.provider?.fullNames?.trim() || data.providerName?.trim() || ''

  const checks: boolean[] = [
    // Screen 1 – Basics (always required)
    data.providerConfirmed === true,
    customerName !== '',
    providerName !== '',
    data.serviceDescription.trim() !== '',
    data.startDate.trim() !== '',
    data.termType !== '',

    // Screen 2 – Modules
    data.modules.length > 0,

    // Screen 3 – Availability
    !hasModule('Availability') || data.uptimeTarget.trim() !== '',
    !hasModule('Availability') || data.uptimePeriod !== '',
    !hasModule('Availability') || data.uptimeExclusions.length > 0,

    // Screen 4 – Support
    !hasModule('Support') || data.supportHours !== '',
    !hasModule('Support') || data.supportChannels.length > 0,

    // Screen 5 – Incident Response
    !hasModule('Incident response') || data.escalationContacts.length > 0,
    !hasModule('Incident response') || (data.useSeverityModel ? data.severityTargets.length > 0 : data.incidentNarrative.trim().length >= 200),

    // Screen 6 – Maintenance
    !hasModule('Maintenance') || data.maintenanceWindow.trim() !== '',
    !hasModule('Maintenance') || data.maintenanceNoticeHours.trim() !== '',

    // Screen 7 – Backups & Restore
    !hasModule('Backups and restore') || data.backupFrequency !== '',
    !hasModule('Backups and restore') || data.rtoHours.trim() !== '',
    !hasModule('Backups and restore') || data.rpoHours.trim() !== '',
    !hasModule('Backups and restore') || data.backupRetentionDays.trim() !== '',

    // Screen 8 – Security
    !hasModule('Security') || data.securityCommitments.length > 0,
    !hasModule('Security') || data.breachNoticeHours.trim() !== '',

    // Screen 9 – Service Credits
    !hasModule('Service credits') || data.creditTiers.length > 0,
    !hasModule('Service credits') || data.creditCapPct.trim() !== '',
    !hasModule('Service credits') || data.creditClaimDays.trim() !== '',

    // Screen 10 – Legal
    data.governingLaw.trim() !== '',
    data.disputeForum !== '',
    data.signatureMethod !== '' && data.signatureMethod != null,
    // At least one signatory with a name filled — 2 empty-row default must not pass
    data.signatories.some((s) => s.name.trim() !== ''),
  ]

  const filled = checks.filter(Boolean).length
  return Math.round((filled / checks.length) * 100)
}

export const SLA_TOTAL_CHECKS = 29

/* ─── Default severity targets ──────────────────────────── */
const DEFAULT_SEVERITY_TARGETS: SeverityTarget[] = [
  { severity: 'Sev1 – Critical', description: 'Service completely unavailable', responseTarget: '1 hour', resolutionTarget: '4 hours' },
  { severity: 'Sev2 – High', description: 'Major feature unavailable', responseTarget: '4 hours', resolutionTarget: '1 business day' },
  { severity: 'Sev3 – Medium', description: 'Minor feature impaired', responseTarget: '1 business day', resolutionTarget: '3 business days' },
  { severity: 'Sev4 – Low', description: 'Cosmetic or informational', responseTarget: '2 business days', resolutionTarget: '7 business days' },
]

const EMPTY_PARTY: PartyBlock = {
  entityType: '',
  legalName: '',
  regNumber: '',
  tradingName: '',
  fullNames: '',
  idNumber: '',
  email: '',
  phone: '',
  signatoryName: '',
  signatoryCapacity: '',
}

/* ─── Empty data ─────────────────────────────────────────── */
export const SLA_EMPTY_DATA: SlaWizardData = {
  providerConfirmed: false,
  provider: { ...EMPTY_PARTY },
  customer: { ...EMPTY_PARTY },
  // legacy flat fields (backward-compat)
  customerName: '',
  customerReg: '',
  customerAddress: '',
  customerEmail: '',
  providerName: '',
  providerReg: '',
  providerAddress: '',
  providerEmail: '',
  serviceDescription: '',
  startDate: '',
  termType: 'Ongoing until terminated',
  endDate: '',

  modules: [],

  uptimeTarget: '',
  uptimePeriod: 'Monthly',
  uptimeExclusions: ['Scheduled maintenance', 'Customer-caused outages', 'Third-party outages', 'Force majeure'],

  supportHours: 'Business hours',
  supportHoursCustom: '',
  supportChannels: [],
  supportChannelOther: '',

  useSeverityModel: true,
  severityTargets: DEFAULT_SEVERITY_TARGETS,
  incidentNarrative: '',
  escalationContacts: [],

  maintenanceWindow: '',
  maintenanceNoticeHours: '48',
  emergencyMaintenance: true,

  backupFrequency: 'Daily',
  rtoHours: '',
  rpoHours: '',
  backupRetentionDays: '30',

  securityCommitments: [],
  breachNoticeHours: '48',

  creditTiers: [],
  creditCapPct: '30',
  creditClaimDays: '30',
  creditsSoleRemedy: true,

  governingLaw: 'South African law',
  disputeForum: 'Arbitration under AFSA rules',
  jurisdictionCity: 'Johannesburg',
  signatureMethod: 'Platform signature',
  signingOrder: 'Either order',
  signatories: [
    { name: '', title: '' },
    { name: '', title: '' },
  ],
}

const LOCAL_KEY = 'tsl-sla-wizard-state'

const defaultState: SlaWizardState = {
  status: 'idle', step: 0, progress: 0,
  data: SLA_EMPTY_DATA, startedAt: null, completedAt: null,
}

function draftToState(draft: WizardDraft<SlaWizardData>): SlaWizardState {
  const data: SlaWizardData = { ...SLA_EMPTY_DATA, ...draft.data }
  const status: SlaWizardStatus = draft.completedAt ? 'completed' : draft.status as SlaWizardStatus
  return {
    status,
    step: draft.step,
    progress: calcSlaProgress(data),
    data,
    startedAt: draft.startedAt,
    completedAt: draft.completedAt,
  }
}

function stateToDraft(state: SlaWizardState): WizardDraft<SlaWizardData> {
  return {
    wizardType: 'sla',
    status: state.status,
    step: state.step,
    progress: state.progress,
    data: state.data,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
  }
}

/* ─── Hook ──────────────────────────────────────────────── */
export function useSlaWizard() {
  const [state, setState] = useState<SlaWizardState>(() => {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (raw) {
      try {
        const draft = JSON.parse(raw) as WizardDraft<SlaWizardData>
        return draftToState(draft)
      } catch { /* ignore */ }
    }
    return defaultState
  })

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const persist = useCallback((nextState: SlaWizardState, immediate = false) => {
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
      const next: SlaWizardState = {
        ...prev,
        status: 'inProgress',
        startedAt: prev.startedAt ?? new Date().toISOString(),
      }
      persist(next, true)
      return next
    })
  }, [persist])

  const saveProgress = useCallback((step: number, data: SlaWizardData, immediate = false) => {
    setState((prev) => {
      const next: SlaWizardState = {
        ...prev,
        step,
        data,
        progress: calcSlaProgress(data),
      }
      persist(next, immediate)
      return next
    })
  }, [persist])

  const completeWizard = useCallback(async () => {
    setState((prev) => {
      const completedAt = new Date().toISOString()
      const next: SlaWizardState = { ...prev, status: 'completed', completedAt }
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
    wizardService.load<SlaWizardData>('sla').then((draft) => {
      if (draft) setState(draftToState(draft))
    })
  }, [])

  return { state, startWizard, saveProgress, completeWizard, resetWizard }
}
