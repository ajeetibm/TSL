export interface DashboardUser {
  userId?: string
  companyName?: string
  plan?: string
  runsUsed?: number
  runsTotal?: number
  runsRemaining?: number
  nextBillingDate?: string
  counselCreditsUsed?: number
  counselCreditsTotal?: number
}

export interface DashboardWorkflow {
  workflowId: string
  wizardName: string
  status?: string
  progress?: number
  lastUpdated?: string
  completedAt?: string
  downloads?: string[]
}

export interface DashboardData {
  user: DashboardUser
  inProgress: DashboardWorkflow[]
  completed: DashboardWorkflow[]
}

export interface WizardItem {
  wizardId: string
  name: string
  description: string
  completionTime: number
  runsPerWizard: number
  targetAudience: string
  isPopular?: boolean
  includedIn?: string[]
  whatsIncluded?: string[]
}

export interface CounselCredits {
  plan: string
  creditsTotal: number
  creditsUsed: number
  creditsRemaining: number
  usageThisMonth: number
  topUpRate: number
  currency: string
  resetDate: string
}

export interface CounselRequest {
  requestId: string
  subject: string
  status: string
  assignedCounsel?: string
  submittedAt: string
  responseUrl?: string | null
}

export interface NotificationItem {
  notificationId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export interface NotificationsData {
  unreadCount: number
  notifications: NotificationItem[]
}

export interface BillingPlan {
  name: string
  price: number
  currency: string
  nextBillingDate: string
  runsUsed: number
  runsTotal: number
  teamMembers: number
}

export interface BillingInvoice {
  invoiceId: string
  date: string
  subscription: number
  tax: number
  total: number
  downloadUrl?: string
}

export interface BillingData {
  plan: BillingPlan
  nextInvoice: {
    subscription: number
    tax: number
    total: number
  }
  invoices: BillingInvoice[]
}

// ── Admin Billing & Invoices ───────────────────────────────────────────────

export type AdminInvoiceStatus = 'paid' | 'pending' | 'failed'
export type AdminInvoicePaymentType = 'subscription' | 'one-time' | 'top-up'

export interface AdminInvoice {
  invoiceId: string
  client: string
  plan: string
  paymentType: AdminInvoicePaymentType
  amount: number
  currency: string
  status: AdminInvoiceStatus
  issueDate: string
  dueDate: string
  month: string
  paidAt: string | null
  reference: string
  email: string
}

export interface AdminBillingKpis {
  totalRevenue: number
  currency: string
  period: string
  outstandingAmount: number
  outstandingCount: number
  failedAmount: number
  failedCount: number
}

export interface AdminReconciliationAlert {
  active: boolean
  message?: string
  failedCount?: number
}

export interface AdminBillingData {
  kpis: AdminBillingKpis
  reconciliationAlert: AdminReconciliationAlert
  invoices: AdminInvoice[]
  total: number
}

export interface QuickAccessLinks {
  gettingStartedGuideUrl: string | null
  videoTutorialUrl: string | null
  consultationBookingUrl: string | null
}

export interface LegalLinks {
  termsOfServiceUrl: string | null
  privacyPolicyUrl: string | null
  legalDisclaimerUrl: string | null
}

export interface PaymentMethod {
  methodId: string
  type: string
  brand?: string
  last4?: string
  expiry?: string
  bank?: string
  isDefault?: boolean
}

export interface PlaybookItem {
  title: string
  steps: string
  time: string
  description: string
  wizards?: string[]
  pdfUrl?: string
}

export interface PlaybookSection {
  title: string
  icon: string
  cards: PlaybookItem[]
}

export interface PlaybooksData {
  playbookSections: PlaybookSection[]
}

export function capitalizePlan(plan?: string): string {
  if (!plan) return 'Operator'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

export function formatDate(value?: string): string {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatCurrency(amount: number, currency = 'ZAR'): string {
  if (currency === 'ZAR') return `R${amount.toLocaleString('en-ZA')}`
  return `${currency} ${amount.toLocaleString()}`
}

export function formatStatusLabel(status?: string): string {
  if (!status) return 'Unknown'
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

import type { LucideIcon } from 'lucide-react'
import { Bell, CheckCircle2, FileText, HandCoins, MessageSquare, Scale, Shield, ShieldCheck, UsersRound, WandSparkles } from 'lucide-react'

export function getWizardIcon(wizardId: string, name: string): LucideIcon {
  const key = `${wizardId} ${name}`.toLowerCase()
  if (key.includes('nda') || key.includes('disclosure')) return Shield
  if (key.includes('employment') || key.includes('offer')) return FileText
  if (key.includes('founder')) return UsersRound
  if (key.includes('privacy') || key.includes('popia')) return ShieldCheck
  if (key.includes('loan')) return HandCoins
  if (key.includes('shareholder') || key.includes('resolution')) return Scale
  return WandSparkles
}

export function getNotificationIcon(type: string): LucideIcon {
  if (type.includes('signature')) return Scale
  if (type.includes('document') || type.includes('completed')) return CheckCircle2
  if (type.includes('counsel') || type.includes('message')) return MessageSquare
  if (type.includes('wizard')) return WandSparkles
  return Bell
}

export function getPlaybookCategoryIcon(category: string): LucideIcon {
  const key = category.toLowerCase()
  if (key.includes('hiring')) return UsersRound
  if (key.includes('compliance')) return Shield
  if (key.includes('fundraising') || key.includes('funding')) return FileText
  return WandSparkles
}
