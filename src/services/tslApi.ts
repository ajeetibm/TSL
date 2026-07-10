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
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
  confirmPassword: string
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')

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

    return {
      success: false,
      message: failure.message ?? `Request failed with status ${response.status}`,
      error: failure.error ?? 'REQUEST_FAILED',
      messages: failure.messages,
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
  emitAuthSessionChanged()
}

export const authApi = {
  register: (payload: RegisterPayload) => request<AuthUser>('/api/v1/auth/register', 'POST', payload, false),
  login: (payload: LoginPayload) => request<AuthUser>('/api/v1/auth/login', 'POST', payload, false),
  forgotPassword: (payload: ForgotPasswordPayload) => request('/api/v1/auth/forgot-password', 'POST', payload, false),
  resetPassword: (payload: ResetPasswordPayload) => request('/api/v1/auth/reset-password', 'POST', payload, false),
  google: (payload: GoogleAuthPayload) => request<AuthUser>('/api/v1/auth/google', 'POST', payload, false),
  changePassword: (payload: JsonRecord) => request('/api/v1/auth/change-password', 'PUT', payload),
}

import type {
  BillingData,
  CounselCredits,
  CounselRequest,
  DashboardData,
  NotificationsData,
  PaymentMethod,
  PlaybooksData,
  WizardItem,
} from './dashboardTypes'

export const smeApi = {
  dashboard: () => request<DashboardData>('/api/v1/sme/dashboard'),
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

export interface PaystackVerification {
  provider: 'paystack'
  reference: string
  status: 'success' | 'failed' | 'cancelled'
  gatewayResponse: string
  paidAt?: string
}

export const paymentApi = {
  initializePaystack: (payload: JsonRecord) =>
    request<PaystackInitialization>('/api/v1/sme/payments/paystack/initialize', 'POST', payload),
  verifyPaystack: (payload: JsonRecord) =>
    request<PaystackVerification>('/api/v1/sme/payments/paystack/verify', 'POST', payload),
}

export const profileApi = {
  get: (email?: string) =>
    request(email ? `/api/v1/sme/profile?email=${encodeURIComponent(email)}` : '/api/v1/sme/profile'),
  update: (payload: JsonRecord) => request('/api/v1/sme/profile', 'PUT', payload),
}

export const adminApi = {
  dashboard: () => request('/api/v1/admin/dashboard'),
  profile: () => request('/api/v1/admin/profile'),
  updateProfile: (payload: JsonRecord) => request('/api/v1/admin/profile', 'PUT', payload),
  changePassword: (payload: JsonRecord) => request('/api/v1/admin/change-password', 'PUT', payload),
  users: () => request('/api/v1/admin/users'),
  updateUser: (userId: string, payload: JsonRecord) => request(`/api/v1/admin/users/${userId}`, 'PUT', payload),
  inviteAdmin: (payload: JsonRecord) => request('/api/v1/admin/admins/invite', 'POST', payload),
  revokeAdmin: (adminId: string) => request(`/api/v1/admin/admins/${adminId}`, 'DELETE'),
  counsel: () => request('/api/v1/admin/counsel'),
  addCounsel: (payload: JsonRecord) => request('/api/v1/admin/counsel', 'POST', payload),
  assignCounselRequest: (requestId: string, payload: JsonRecord) =>
    request(`/api/v1/admin/counsel-requests/${requestId}/assign`, 'POST', payload),
  issues: () => request('/api/v1/admin/issues'),
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
}

export const counselPortalApi = {
  dashboard: (email?: string) =>
    request(email ? `/api/v1/counsel/dashboard?email=${encodeURIComponent(email)}` : '/api/v1/counsel/dashboard'),
  profile: (email?: string) =>
    request(email ? `/api/v1/counsel/profile?email=${encodeURIComponent(email)}` : '/api/v1/counsel/profile'),
  availability: (availability: string) => request('/api/v1/counsel/availability', 'PATCH', { availability }),
  acceptRequest: (requestId: string) => request(`/api/v1/counsel/requests/${requestId}/accept`, 'POST'),
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
