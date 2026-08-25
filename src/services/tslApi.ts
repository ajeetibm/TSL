type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type JsonRecord = Record<string, unknown>

export interface ApiSuccess<T = unknown> {
  success: true
  message?: string
  data?: T
  total?: number
  isNewUser?: boolean
}

export interface ApiFailure {
  success: false
  error?: string
  message?: string
  messages?: string[]
  data?: unknown
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiFailure

export interface AuthUser {
  userId: string
  fullName?: string
  email: string
  role?: string
  plan?: string | null
  token: string
  tokenExpiry?: string
  createdAt?: string
  portal?: 'sme' | 'admin' | 'counsel'
  mustResetPassword?: boolean
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  acceptedTerms: boolean
}

export interface LoginPayload {
  email: string
  password: string
  portal?: 'sme' | 'admin' | 'counsel'
}

export interface GoogleAuthPayload {
  // The Google OAuth access token — server calls UserInfo API to resolve email/name/picture
  access_token: string
}

export interface ForgotPasswordPayload {
  email: string
  portal?: 'user' | 'admin' | 'counsel'
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
  confirmPassword: string
}

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('tsl-auth-token')

  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {}
}

export async function request<T = unknown>(
  endpoint: string,
  method: HttpMethod = 'GET',
  body?: unknown,
  includeAuth = true,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(includeAuth ? authHeaders() : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok) {
    const failure = payload as ApiFailure

    // If the server revoked this session (e.g. revoked from another device),
    // clear local auth and redirect to login immediately.
    if (response.status === 401 && failure.error === 'TOKEN_REVOKED') {
      data: failure.data,
      clearAuthSession()
      window.location.href = '/'
      return { success: false, message: failure.message ?? 'Session revoked.', error: 'TOKEN_REVOKED' }
    }

    return {
      success: false,
      message: failure.message ?? `Request failed with status ${response.status}`,
      error: failure.error ?? 'REQUEST_FAILED',
      messages: failure.messages,
      data: failure.data,
    }
  }

  return payload
}

function emitAuthSessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('tsl-auth-session-changed'))
  }
}

export function saveAuthSession(user?: AuthUser) {
  localStorage.setItem('tsl-authenticated', 'true')

  if (user?.token) {
    localStorage.setItem('tsl-auth-token', user.token)
  }

  if (user) {
    localStorage.setItem('tsl-auth-user', JSON.stringify(user))
  }

  emitAuthSessionChanged()
}

export function clearAuthSession() {
  localStorage.removeItem('tsl-authenticated')
  localStorage.removeItem('tsl-auth-token')
  localStorage.removeItem('tsl-auth-user')
  localStorage.removeItem('tsl-dashboard-payment-complete')
  localStorage.removeItem('tsl-dashboard-view-mode')
  localStorage.removeItem('tsl-wizard-access-cache')
  localStorage.removeItem('tsl-dashboard-queue')
  localStorage.removeItem('tsl-selected-dashboard-wizards')
  localStorage.removeItem('tsl-dashboard-completed-instances')
  emitAuthSessionChanged()
}

export const authApi = {
  register: (payload: RegisterPayload) => request<AuthUser>('/api/v1/auth/register', 'POST', payload, false),
  login: (payload: LoginPayload) => request<AuthUser>('/api/v1/auth/login', 'POST', payload, false),
  forgotPassword: (payload: ForgotPasswordPayload) => request('/api/v1/auth/forgot-password', 'POST', payload, false),
  verifyResetToken: (token: string) => request(`/api/v1/auth/verify-reset-token?token=${encodeURIComponent(token)}`, 'GET', undefined, false),
  resetPassword: (payload: ResetPasswordPayload) => request('/api/v1/auth/reset-password', 'POST', payload, false),
  google: (payload: GoogleAuthPayload) => request<AuthUser>('/api/v1/auth/google', 'POST', payload, false),
  changePassword: (payload: JsonRecord) => request('/api/v1/auth/change-password', 'PUT', payload),
  exchangePortalHandoff: (code: string) => request<AuthUser>(`/api/v1/auth/portal-handoff`, 'POST', { code }, false),
}

import type {
  BillingData,
  BillingHistoryInvoice,
  CounselCredits,
  CounselRequest,
  DashboardData,
  DocumentItem,
  DowngradeResult,
  FailedPayment,
  LegalLinks,
  NotificationsData,
  PaymentMethod,
  PlaybooksData,
  ProratedUpgradePreview,
  QuickAccessLinks,
  SubscriptionData,
  SubscriptionPlan,
  UpgradeResult,
  SubscriptionUsage,
  WizardItem,
} from './dashboardTypes'

export interface BlueprintRunConsumption {
  unitsCharged: number
  usage: SubscriptionUsage
  blueprint: DocumentCatalogueBlueprint
}

export interface BlueprintRunTopUp {
  unitsAdded: number
  usage: SubscriptionUsage
}

export interface DocumentCatalogueBlueprint {
  blueprintId: string
  name: string
  blueprintUnitWeight: number
  consumptionPoint: 'final-download' | 'vault-acceptance' | 'cipc-submission'
}

export const smeApi = {
  dashboard: () => request<DashboardData>('/api/v1/sme/dashboard'),
  quickAccessLinks: () => request<QuickAccessLinks>('/api/v1/sme/quick-access-links'),
  legalLinks: () => request<LegalLinks>('/api/v1/sme/legal-links'),
  getProfilePreferences: () => request<JsonRecord>('/api/v1/sme/profile/preferences'),
  saveProfilePreferences: (payload: JsonRecord) => request('/api/v1/sme/profile/preferences', 'PUT', payload),
  downloadWorkflow: (workflowId: string, type = 'pdf') =>
    request(`/api/v1/sme/workflows/${workflowId}/download?type=${encodeURIComponent(type)}`),
  startWizard: (wizardId: string, notes = '') =>
    request(`/api/v1/sme/wizards/${wizardId}/start`, 'POST', { notes }),
  saveWorkflowStep: (workflowId: string, stepNumber: number, data: JsonRecord) =>
    request(`/api/v1/sme/workflows/${workflowId}/steps/${stepNumber}`, 'PUT', { stepNumber, data }),
  generateWorkflow: (workflowId: string) =>
    request(`/api/v1/sme/workflows/${workflowId}/generate`, 'POST', { workflowId }),
  workflowStatus: (workflowId: string) => request(`/api/v1/sme/workflows/${workflowId}/status`),
}

export const wizardApi = {
  list: () => request<WizardItem[]>('/api/v1/wizards', 'GET', undefined, false),
}

export const counselApi = {
  credits: () => request<CounselCredits>('/api/v1/sme/counsel/credits'),
  createRequest: (payload: JsonRecord) => request('/api/v1/sme/counsel/requests', 'POST', payload),
  createPublicFundingReview: (payload: JsonRecord) => request<{ requestId: string; status: 'pending' | 'approved' }>('/api/v1/sme/counsel/public-funding-review', 'POST', payload),
  publicFundingReviewStatus: (requestId: string) => request<{ status: 'pending' | 'approved' }>(`/api/v1/sme/counsel/public-funding-review/${encodeURIComponent(requestId)}`),
  requests: () => request<CounselRequest[]>('/api/v1/sme/counsel/requests'),
  topUpCredits: (payload: JsonRecord) => request<CounselCredits>('/api/v1/sme/counsel/topup', 'POST', payload),
}

export const notificationApi = {
  list: () => request<NotificationsData>('/api/v1/sme/notifications'),
  markRead: (notificationId: string) =>
    request(`/api/v1/sme/notifications/${notificationId}/read`, 'PATCH', { isRead: true }),
  markAllRead: () => request('/api/v1/sme/notifications/read-all', 'POST'),
  savePreferences: (payload: JsonRecord) => request('/api/v1/sme/notifications/preferences', 'PUT', payload),
}

export const billingApi = {
  summary: () => request<BillingData>('/api/v1/sme/billing'),
  paymentMethods: () => request<PaymentMethod[]>('/api/v1/sme/billing/payment-methods'),
  addPaymentMethod: (payload: JsonRecord) => request('/api/v1/sme/billing/payment-methods', 'POST', payload),
  setDefaultMethod: (methodId: string) => request(`/api/v1/sme/billing/payment-methods/${methodId}/default`, 'PATCH'),
  removeMethod: (methodId: string) => request(`/api/v1/sme/billing/payment-methods/${methodId}`, 'DELETE'),
}

// ── Subscription (Upgrade / Downgrade) API ────────────────────────────────
// All subscription mutation calls go through this namespace.
// To switch to production: update VITE_API_BASE_URL — no UI changes required.

export const subscriptionApi = {
  /** GET  /api/v1/subscription — current plan, usage, billing date, pending downgrade */
  get: () => request<SubscriptionData>('/api/v1/subscription'),

  /** GET  /api/v1/plans — all available plans with features */
  plans: () => request<SubscriptionPlan[]>('/api/v1/plans'),
  /** GET /api/v1/blueprints — authoritative document catalogue and unit weights */
  blueprints: () => request<DocumentCatalogueBlueprint[]>('/api/v1/blueprints'),

  /** Charge only at final document consumption. */
  consumeBlueprintRun: (blueprintId: string, alreadyCharged = false) =>
    request<BlueprintRunConsumption>('/api/v1/subscription/blueprint-runs/consume', 'POST', { blueprintId, alreadyCharged }),

  /** R250 per Blueprint Unit. */
  topUpBlueprintRuns: (units: number) => request<BlueprintRunTopUp>('/api/v1/subscription/blueprint-runs/top-up', 'POST', { units }),

  /** GET  /api/v1/subscription/upgrade/preview?toPlanId=X — prorated charge preview */
  upgradePreview: (toPlanId: string) =>
    request<ProratedUpgradePreview>(`/api/v1/subscription/upgrade/preview?toPlanId=${encodeURIComponent(toPlanId)}`),

  /** POST /api/v1/subscription/upgrade — confirm & charge immediately.
   *  paymentReference is the Paystack reference returned after a successful
   *  checkout. When present, the server records it on the invoice.
   *  When absent (mock/test), the server simulates the charge internally. */
  upgrade: (payload: { currentPlanId: string; toPlanId: string; paymentReference?: string }) =>
    request<UpgradeResult>('/api/v1/subscription/upgrade', 'POST', payload),

  /** POST /api/v1/subscription/downgrade — schedule downgrade for next billing cycle */
  downgrade: (payload: { currentPlanId: string; toPlanId: string }) =>
    request<DowngradeResult>('/api/v1/subscription/downgrade', 'POST', payload),

  /** DELETE /api/v1/subscription/downgrade — cancel scheduled downgrade */
  cancelDowngrade: () => request('/api/v1/subscription/downgrade', 'DELETE'),

  /** GET /api/v1/subscription/invoices — full billing history */
  invoices: () => request<BillingHistoryInvoice[]>('/api/v1/subscription/invoices'),
}

export interface PaystackInitialization {
  provider: 'paystack'
  mode: 'test'
  reference: string
  accessCode: string
  authorizationUrl: string
  publicKey: string
  amount: number
  amountInKobo: number
  currency: string
  email: string
  plan: string
}

export interface PaystackCardAuthorization {
  authorization_code?: string
  card_type?: string
  last4?: string
  exp_month?: string
  exp_year?: string
  bank?: string
  reusable?: boolean
}

export interface PaystackVerification {
  provider: 'paystack'
  reference: string
  status: 'success' | 'failed' | 'cancelled'
  gatewayResponse: string
  paidAt?: string
  /** Present on successful verification — real Paystack card authorization object */
  authorization?: PaystackCardAuthorization
}

export const paymentApi = {
  initializePaystack: (payload: JsonRecord) =>
    request<PaystackInitialization>('/api/v1/sme/payments/paystack/initialize', 'POST', payload),
  verifyPaystack: (payload: JsonRecord) =>
    request<PaystackVerification>('/api/v1/sme/payments/paystack/verify', 'POST', payload),
  wizardAccess: () => request<WizardAccess>('/api/v1/sme/payments/wizard-access'),
  addWizardsToDashboard: (selectedWizards: Array<{ title: string; quantity: number }>) =>
    request<WizardAccess>('/api/v1/sme/payments/wizard-access', 'POST', { selectedWizards }),
}

export interface WizardAccess {
  hasSubscription: boolean
  plan: string | null
  wizardLimit: number
  selectedWizards: Array<{ title: string; quantity: number }>
  remainingWizards: number
}

export const profileApi = {
  get: (email?: string) =>
    request(email ? `/api/v1/sme/profile?email=${encodeURIComponent(email)}` : '/api/v1/sme/profile'),
  update: (payload: JsonRecord) => request('/api/v1/sme/profile', 'PUT', payload),
}

export interface ActiveSession {
  id: string
  device: string
  location: string
  ip: string
  lastActive: string
  isCurrent: boolean
}

export const securityApi = {
  getSessions: () => request<ActiveSession[]>('/api/v1/sme/security/sessions'),
  revokeSession: (sessionId: string) => request<ActiveSession[]>(`/api/v1/sme/security/sessions/${encodeURIComponent(sessionId)}`, 'DELETE'),
}

export const adminApi = {
  dashboard: () => request('/api/v1/admin/dashboard'),
  profile: () => request('/api/v1/admin/profile'),
  getProfilePreferences: () => request<JsonRecord>('/api/v1/admin/profile/preferences'),
  saveProfilePreferences: (payload: JsonRecord) => request('/api/v1/admin/profile/preferences', 'PUT', payload),
  updateProfile: (payload: JsonRecord) => request('/api/v1/admin/profile', 'PUT', payload),
  changePassword: (payload: JsonRecord) => request('/api/v1/admin/change-password', 'PUT', payload),
  getSessions: () => request<ActiveSession[]>('/api/v1/admin/security/sessions'),
  revokeSession: (sessionId: string) => request<ActiveSession[]>(`/api/v1/admin/security/sessions/${encodeURIComponent(sessionId)}`, 'DELETE'),
  users: () => request('/api/v1/admin/users'),
  updateUser: (userId: string, payload: JsonRecord) => request(`/api/v1/admin/users/${userId}`, 'PUT', payload),
  inviteAdmin: (payload: JsonRecord) => request('/api/v1/admin/admins/invite', 'POST', payload),
  revokeAdmin: (adminId: string) => request(`/api/v1/admin/admins/${adminId}`, 'DELETE'),
  counsel: () => request('/api/v1/admin/counsel'),
  addCounsel: (payload: JsonRecord) => request('/api/v1/admin/counsel', 'POST', payload),
  assignCounselRequest: (requestId: string, payload: JsonRecord) =>
    request(`/api/v1/admin/counsel-requests/${requestId}/assign`, 'POST', payload),
  markNotificationRead: (notificationId: string) => request(`/api/v1/admin/notifications/${notificationId}/read`, 'PATCH'),
  issues: () => request('/api/v1/admin/issues'),
  // Fetch failed payment transactions.
  // PRODUCTION: backend populates this from payment gateway webhooks / subscription failures.
  // Replace mock endpoint with real API — no frontend changes needed.
  failedPayments: () => request<FailedPayment[]>('/api/v1/admin/payments/failed'),
  billing: (params?: { search?: string; client?: string; plan?: string; month?: string }) => {
    const qs = new URLSearchParams()
    if (params?.search) qs.set('search', params.search)
    if (params?.client) qs.set('client', params.client)
    if (params?.plan)   qs.set('plan',   params.plan)
    if (params?.month)  qs.set('month',  params.month)
    const query = qs.toString()
    return request(`/api/v1/admin/billing${query ? `?${query}` : ''}`)
  },
  // Triggers an async server-side export job; backend emails the download link.
  // PRODUCTION: replace mock endpoint with real export service — no frontend changes needed.
  exportBilling: (payload?: { format?: 'pdf' | 'csv'; filters?: JsonRecord }) =>
    request<{ jobId: string; status: string; notificationEmail: string }>(
      '/api/v1/admin/billing/export',
      'POST',
      payload ?? {},
    ),
}

export const adminSettingsApi = {
  getGeneral:              () => request('/api/v1/admin/settings/general'),
  saveGeneral:             (payload: JsonRecord) => request('/api/v1/admin/settings/general', 'PUT', payload),
  getNotifications:        () => request('/api/v1/admin/settings/notifications'),
  saveNotifications:       (payload: JsonRecord) => request('/api/v1/admin/settings/notifications', 'PUT', payload),
  getSecurity:             () => request('/api/v1/admin/settings/security'),
  saveSecurity:            (payload: JsonRecord) => request('/api/v1/admin/settings/security', 'PUT', payload),
  // Password policy — fetched when modal opens, saved on modal submit.
  // Switching to production only requires changing VITE_API_BASE_URL.
  getPasswordPolicy:       () => request('/api/v1/admin/settings/password-policy'),
  savePasswordPolicy:      (payload: JsonRecord) => request('/api/v1/admin/settings/password-policy', 'PUT', payload),
}

export const counselPortalApi = {
  dashboard: (email?: string) =>
    request(email ? `/api/v1/counsel/dashboard?email=${encodeURIComponent(email)}` : '/api/v1/counsel/dashboard'),
  profile: (email?: string) =>
    request(email ? `/api/v1/counsel/profile?email=${encodeURIComponent(email)}` : '/api/v1/counsel/profile'),
  availability: (availability: string) => request('/api/v1/counsel/availability', 'PATCH', { availability }),
  acceptRequest: (requestId: string) => request(`/api/v1/counsel/requests/${requestId}/accept`, 'POST'),
  completeRequest: (requestId: string, payload: JsonRecord) =>
    request(`/api/v1/counsel/requests/${requestId}/complete`, 'POST', payload),
  rejectRequest: (requestId: string, reason: string) =>
    request(`/api/v1/counsel/requests/${requestId}/reject`, 'POST', { reason }),
  requests: (email?: string) =>
    request(email ? `/api/v1/counsel/requests?email=${encodeURIComponent(email)}` : '/api/v1/counsel/requests'),
  updateProfile: (payload: JsonRecord) => request('/api/v1/counsel/profile', 'PUT', payload),
  changePassword: (payload: JsonRecord) => request('/api/v1/counsel/change-password', 'PUT', payload),
  resetPassword: (payload: JsonRecord) => request<AuthUser>('/api/v1/counsel/reset-password', 'POST', payload, false),
}

export const playbookApi = {
  playBookList: () => request<PlaybooksData>('/api/v1/playbooks', 'GET', undefined, false),
}

export const documentsApi = {
  /** GET /api/v1/documents — returns a flat array of PDF playbook documents */
  list: () => request<DocumentItem[]>('/api/v1/documents'),
}
