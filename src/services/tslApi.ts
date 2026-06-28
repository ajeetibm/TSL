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
  idToken: string
  portal?: 'sme' | 'admin' | 'counsel'
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

async function request<T = unknown>(
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

export function saveAuthSession(user?: AuthUser) {
  localStorage.setItem('tsl-authenticated', 'true')

  if (user?.token) {
    localStorage.setItem('tsl-auth-token', user.token)
  }

  if (user) {
    localStorage.setItem('tsl-auth-user', JSON.stringify(user))
  }
}

export function clearAuthSession() {
  localStorage.removeItem('tsl-authenticated')
  localStorage.removeItem('tsl-auth-token')
  localStorage.removeItem('tsl-auth-user')
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

export const profileApi = {
  update: (payload: JsonRecord) => request('/api/v1/sme/profile', 'PUT', payload),
}

export const adminApi = {
  dashboard: () => request('/api/v1/admin/dashboard'),
  users: () => request('/api/v1/admin/users'),
  updateUser: (userId: string, payload: JsonRecord) => request(`/api/v1/admin/users/${userId}`, 'PUT', payload),
  inviteAdmin: (payload: JsonRecord) => request('/api/v1/admin/admins/invite', 'POST', payload),
  revokeAdmin: (adminId: string) => request(`/api/v1/admin/admins/${adminId}`, 'DELETE'),
  counsel: () => request('/api/v1/admin/counsel'),
  addCounsel: (payload: JsonRecord) => request('/api/v1/admin/counsel', 'POST', payload),
  assignCounselRequest: (requestId: string, payload: JsonRecord) =>
    request(`/api/v1/admin/counsel-requests/${requestId}/assign`, 'POST', payload),
  issues: () => request('/api/v1/admin/issues'),
  billing: () => request('/api/v1/admin/billing'),
}

export const counselPortalApi = {
  dashboard: () => request('/api/v1/counsel/dashboard'),
  availability: (availability: string) => request('/api/v1/counsel/availability', 'PATCH', { availability }),
  acceptRequest: (requestId: string) => request(`/api/v1/counsel/requests/${requestId}/accept`, 'POST'),
  rejectRequest: (requestId: string, reason: string) =>
    request(`/api/v1/counsel/requests/${requestId}/reject`, 'POST', { reason }),
  requests: () => request('/api/v1/counsel/requests'),
  updateProfile: (payload: JsonRecord) => request('/api/v1/counsel/profile', 'PUT', payload),
}

export const playbookApi = {
  list: () => request<PlaybooksData>('/api/v1/playbooks', 'GET', undefined, false),
}
