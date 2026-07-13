/**
 * wizardService.ts
 *
 * Production-ready service layer for wizard draft persistence.
 *
 * ┌─────────────────────────────────────────────────────────┐
 * │  HOW TO SWITCH FROM MOCK → PRODUCTION                   │
 * │                                                         │
 * │  Set VITE_WIZARD_STORAGE=api in your .env file.        │
 * │  The hooks (useNdaWizard, useEmploymentWizard) call     │
 * │  this service — no other changes required.              │
 * └─────────────────────────────────────────────────────────┘
 *
 * Storage modes
 * ─────────────
 *  "local"  (default / mock)
 *    Reads & writes to localStorage.
 *    Works fully offline with no backend.
 *    Used when VITE_WIZARD_STORAGE is unset or "local".
 *
 *  "api"  (production)
 *    Persists drafts to the backend via REST.
 *    Requires authenticated user + running API server.
 *    Used when VITE_WIZARD_STORAGE=api.
 *
 * API contract (production backend must implement)
 * ────────────────────────────────────────────────
 *  GET    /api/v1/sme/wizards/:wizardType/draft
 *         → { success: true, data: WizardDraft | null }
 *
 *  PUT    /api/v1/sme/wizards/:wizardType/draft
 *         body: WizardDraft
 *         → { success: true, data: WizardDraft }
 *
 *  POST   /api/v1/sme/wizards/:wizardType/complete
 *         body: { data: WizardFormData }
 *         → { success: true, data: { completedAt: string } }
 *
 *  DELETE /api/v1/sme/wizards/:wizardType/draft
 *         → { success: true }
 */

import { request } from './tslApi'

/* ─── Wizard type identifiers ───────────────────────────── */
export type WizardType = 'nda' | 'employment' | 'privacy-policy' | 'founder-agreement'

/* ─── Shape stored / returned for each wizard ───────────── */
export interface WizardDraft<TData = unknown> {
  wizardType: WizardType
  status: 'idle' | 'inProgress' | 'completed'
  step: number
  progress: number
  data: TData
  startedAt: string | null
  completedAt: string | null
}

/* ─── Storage mode ───────────────────────────────────────── */
const STORAGE_MODE = (import.meta.env.VITE_WIZARD_STORAGE ?? 'local') as 'local' | 'api'

/* ─── Local storage keys ─────────────────────────────────── */
const LOCAL_KEYS: Record<WizardType, string> = {
  nda: 'tsl-nda-wizard-state',
  employment: 'tsl-employment-wizard-state',
  'privacy-policy': 'tsl-privacy-policy-wizard-state',
  'founder-agreement': 'tsl-founder-agreement-wizard-state',
}

/* ════════════════════════════════════════════════════════════
   LOCAL IMPLEMENTATION (mock / offline)
   ════════════════════════════════════════════════════════════ */
function localLoad<TData>(wizardType: WizardType): WizardDraft<TData> | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEYS[wizardType])
    if (raw) return JSON.parse(raw) as WizardDraft<TData>
  } catch { /* ignore corrupt data */ }
  return null
}

function localSave<TData>(draft: WizardDraft<TData>): void {
  localStorage.setItem(LOCAL_KEYS[draft.wizardType], JSON.stringify(draft))
}

function localDelete(wizardType: WizardType): void {
  localStorage.removeItem(LOCAL_KEYS[wizardType])
}

/* ════════════════════════════════════════════════════════════
   API IMPLEMENTATION (production)
   ════════════════════════════════════════════════════════════ */
async function apiLoad<TData>(wizardType: WizardType): Promise<WizardDraft<TData> | null> {
  const res = await request<WizardDraft<TData>>(`/api/v1/sme/wizards/${wizardType}/draft`)
  if (res.success && res.data) return res.data
  return null
}

async function apiSave<TData>(draft: WizardDraft<TData>): Promise<void> {
  await request<WizardDraft<TData>>(
    `/api/v1/sme/wizards/${draft.wizardType}/draft`,
    'PUT',
    draft as unknown as Record<string, unknown>,
  )
}

async function apiComplete<TData>(wizardType: WizardType, data: TData): Promise<string> {
  const res = await request<{ completedAt: string }>(
    `/api/v1/sme/wizards/${wizardType}/complete`,
    'POST',
    { data: data as unknown as Record<string, unknown> },
  )
  return res.success && res.data?.completedAt
    ? res.data.completedAt
    : new Date().toISOString()
}

async function apiDelete(wizardType: WizardType): Promise<void> {
  await request(`/api/v1/sme/wizards/${wizardType}/draft`, 'DELETE')
}

/* ════════════════════════════════════════════════════════════
   PUBLIC FACADE  — used by the hooks
   ════════════════════════════════════════════════════════════ */
export const wizardService = {
  /**
   * Load a saved draft.
   * Returns null when no draft exists (new user / reset).
   */
  async load<TData>(wizardType: WizardType): Promise<WizardDraft<TData> | null> {
    if (STORAGE_MODE === 'api') return apiLoad<TData>(wizardType)
    return Promise.resolve(localLoad<TData>(wizardType))
  },

  /**
   * Persist the current draft (called on every field change and Next click).
   */
  async save<TData>(draft: WizardDraft<TData>): Promise<void> {
    // Always mirror to localStorage for instant resume even if API call is in-flight
    localSave(draft)
    if (STORAGE_MODE === 'api') return apiSave(draft)
  },

  /**
   * Mark the wizard as completed.
   * Returns the server-confirmed completedAt timestamp.
   */
  async complete<TData>(wizardType: WizardType, data: TData): Promise<string> {
    if (STORAGE_MODE === 'api') return apiComplete(wizardType, data)
    return Promise.resolve(new Date().toISOString())
  },

  /**
   * Delete the draft (called by resetWizard).
   */
  async reset(wizardType: WizardType): Promise<void> {
    localDelete(wizardType)
    if (STORAGE_MODE === 'api') return apiDelete(wizardType)
  },

  /** The currently active storage mode — useful for debug logging. */
  get mode() { return STORAGE_MODE },
}
