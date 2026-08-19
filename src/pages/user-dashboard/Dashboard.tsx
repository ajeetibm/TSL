import {
  ArrowRight,
  BookOpen,
  Box,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleCheckBig,
  Download,
  FileText,
  FolderOpen,
  Info,
  Loader2,
  Play,
  Scale,
  Shield,
  Target,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { capitalizePlan, formatDate } from '../../services/dashboardTypes'
import type { DashboardData, LegalLinks, QuickAccessLinks, SubscriptionData, SubscriptionPlan } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import { paymentApi, smeApi, subscriptionApi } from '../../services/tslApi'
import { openPaystackCheckout } from '../../services/paystackClient'
import type { WizardAccess } from '../../services/tslApi'
import { buildNdaDocx, buildEmploymentDocx, buildPrivacyPolicyDocx, buildFounderAgreementDocx, buildServiceAgreementDocx } from '../../services/docxBuilders'
import { useNdaWizard } from '../../hooks/useNdaWizard'
import { useEmploymentWizard } from '../../hooks/useEmploymentWizard'
import { usePrivacyPolicyWizard } from '../../hooks/usePrivacyPolicyWizard'
import { useFounderAgreementWizard } from '../../hooks/useFounderAgreementWizard'
import { useServiceAgreementWizard } from '../../hooks/useServiceAgreementWizard'
import { useBillingSubscription } from '../../hooks/useBillingSubscription'
import NdaWizardModal from './NdaWizardModal'
import type { NdaWizardData } from './NdaWizardModal'
import EmploymentWizardModal from './EmploymentWizardModal'
import type { EmploymentWizardData } from './EmploymentWizardModal'
import PrivacyPolicyWizardModal from './PrivacyPolicyWizardModal'
import type { PrivacyPolicyWizardData } from './PrivacyPolicyWizardModal'
import FounderAgreementWizardModal from './FounderAgreementWizardModal'
import type { FounderAgreementWizardData } from './FounderAgreementWizardModal'
import ServiceAgreementWizardModal from './ServiceAgreementWizardModal'
import InsufficientBlueprintUnitsModal from './InsufficientBlueprintUnitsModal'
import type { ServiceAgreementWizardData } from './ServiceAgreementWizardModal'
import ComingSoonWizardModal from './ComingSoonWizardModal'
import { UpgradePlansModal } from './billing/UpgradePlansModal'
import { UpgradeConfirmModal } from './billing/UpgradeConfirmModal'
import './Dashboard.css'

type DashboardTab = 'new' | 'inProgress' | 'completed'

const BLUEPRINT_ICON_NAME: Record<string, string> = {
  'Non-Disclosure Agreement (NDA)': 'Shield',
  'Board Resolution': 'Briefcase',
  'Employment Offer Letter': 'UsersRound',
  'Privacy & Cookies Policy': 'Shield',
  'Memorandum of Agreement (MOA)': 'FileText',
  'Software Development Agreement': 'Code2',
  'Employment Contract Pack': 'UsersRound',
  'Company Registration': 'Building2',
  'Shareholders Agreement': 'UsersRound',
}

// ── Completed-instance record ────────────────────────────────────────────────
// Each time a blueprint run is completed we push one entry here rather than
// relying on the single-slot hook state. This lets the Completed tab accumulate
// multiple runs of the same blueprint type without overwriting earlier ones.
interface CompletedInstance {
  id: string              // unique per completion
  wizardType: string      // matches wizard.title
  completedAt: string
  data: unknown           // typed narrowly in render helpers
}

// Per-plan benefit lines shown in the top-right hero card.
// Numeric values (runs, team members) come from the live SubscriptionData so they
// stay accurate after an upgrade/downgrade without any frontend changes.
// The label copy below matches the exact wording required by product.
function buildPlanBenefits(sub: SubscriptionData, _plan: SubscriptionPlan | undefined): string[] {
  const runs    = sub.wizardRuns === -1  ? 'Unlimited' : `${sub.wizardRuns}`
  const members = sub.teamMembers === -1 ? 'Unlimited' : `${sub.teamMembers}`

  const id = sub.planId?.toLowerCase() ?? ''

  if (id === 'launchpad') {
    return [
      '4 Credits per month',
      '0 Counsel credits per month',
      'Credit top-ups at R250 per Credit',
      'Standard support (48-72h response)',
      '1GB document storage',
      'PDF export',
    ]
  }

  if (id === 'operator') {
    return [
      '12 Credits per month',
      '2 Counsel credits per month',
      'Credit top-ups at R250 per Credit',
      'Priority support (24-48h response)',
      'Unlimited document storage',
      'API access for integrations',
    ]
  }

  if (id === 'boardroom') {
    return [
      '30 Credits per month',
      '6 Counsel credits per month',
      'Credit top-ups at R250 per Credit',
      'Dedicated support (SLA)',
      'Unlimited document storage',
      'API access + white-label options',
    ]
  }

  // Fallback: generic list built from API fields
  return [
    `${runs} Credits per month`,
    `${members} team member${sub.teamMembers === 1 ? '' : 's'}`,
  ]
}

const PREVIEW_COUNT = 4
const wizardAccessCacheKey = 'tsl-wizard-access-cache'

interface PlanCardProps {
  planName: string
  benefits: string[]
  variant: 'landing' | 'paid'
}

function PlanCard({ planName, benefits, variant }: PlanCardProps) {
  const [showAll, setShowAll] = useState(false)
  const hasMore = benefits.length > PREVIEW_COUNT
  const visible = showAll ? benefits : benefits.slice(0, PREVIEW_COUNT)

  return (
    <div className={`user-dashboard__plan-card user-dashboard__plan-card--${variant}`}>
      <h3>
        Your <span>{planName} Plan</span> Includes:
      </h3>
      <ul>
        {visible.map((benefit) => (
          <li key={benefit}>
            <CheckCircle2 size={18} />
            {benefit}
          </li>
        ))}
      </ul>

      {hasMore && (
        <button
          type="button"
          className="user-dashboard__plan-card-toggle"
          onClick={() => setShowAll((s) => !s)}
          aria-expanded={showAll}
        >
          {showAll ? 'Show Less' : 'View All Features'}
          <ChevronDown
            size={13}
            className={`user-dashboard__plan-card-chevron${showAll ? ' user-dashboard__plan-card-chevron--open' : ''}`}
          />
        </button>
      )}
    </div>
  )
}

const quickStartCards = [
  {
    title: 'Getting Started Guide',
    description: 'Learn how to use the platform effectively',
    action: 'Read Guide',
    icon: FileText,
    urlKey: 'gettingStartedGuideUrl' as keyof QuickAccessLinks,
  },
  {
    title: 'Video Tutorials',
    description: 'Watch step-by-step wizard walkthroughs',
    action: 'Watch Now',
    icon: Target,
    urlKey: 'videoTutorialUrl' as keyof QuickAccessLinks,
  },
  {
    title: 'Schedule Consultation',
    description: 'Get expert help from our legal team',
    action: 'Book Now',
    icon: Calendar,
    urlKey: 'consultationBookingUrl' as keyof QuickAccessLinks,
  },
]

const newWizards = [
  {
    id: 1,
    title: 'Non-Disclosure Agreement (NDA)',
    note: 'Need NDAs for investor meetings and contractor agreements',
    wizards: 1,
    paidItems: 'Items',
    landingItems: 'Items',
    landingLabel: 'Blueprints',
    unitCost: 1,
  },
  {
    id: 2,
    title: 'Employment Offer Letter',
    note: 'Hiring our first developer next month',
    wizards: 1,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Blueprints',
    unitCost: 2,
  },
  {
    id: 3,
    title: 'Privacy & Cookies Policy',
    note: 'Required for our web app launch',
    wizards: 1,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Blueprints',
    unitCost: 1,
  },
  {
    id: 4,
    title: 'Founder Agreement',
    note: 'Setting up co-founder equity split',
    wizards: 1,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Blueprints',
    unitCost: 1,
  },
  {
    id: 5,
    title: 'Service Agreement',
    note: 'Multiple client contracts needed',
    wizards: 1,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Blueprints',
    unitCost: 1,
  },
]


const notices = [
  { label: 'Terms of Service',         icon: FileText, urlKey: 'termsOfServiceUrl'  as keyof LegalLinks },
  { label: 'Privacy & POPIA Compliance', icon: Shield, urlKey: 'privacyPolicyUrl'   as keyof LegalLinks },
  { label: 'Legal Advice Disclaimer',  icon: Info,     urlKey: 'legalDisclaimerUrl' as keyof LegalLinks },
]

function relativeUpdated(value?: string) {
  if (!value) return 'Updated recently'
  const updated = new Date(value).getTime()
  if (Number.isNaN(updated)) return 'Updated recently'
  const diffHours = Math.max(1, Math.round((Date.now() - updated) / 36e5))
  if (diffHours < 24) return `Updated ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  const days = Math.round(diffHours / 24)
  return `Updated ${days} day${days === 1 ? '' : 's'} ago`
}

/* ── Download helpers ────────────────────────────────────── */
function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

/**
 * Build a structurally valid single-page PDF containing NDA text.
 * Uses the minimal PDF 1.4 object model — no external libraries needed.
 */
function buildNdaPdf(data: import('./NdaWizardModal').NdaWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')

  const fmtAddr = (a: typeof data.party_a.address) =>
    [a.street_number, a.building, a.street_name, a.suburb, a.city, a.province, a.postal_code, a.country].filter(Boolean).join(', ')

  const lines: string[] = [
    'NON-DISCLOSURE AGREEMENT',
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. PARTIES',
    '─────────────────────────────────────────',
    `Agreement Type : ${data.agreement_type || '—'}`,
    '',
    'Party A',
    `  Type       : ${data.party_a.entity_type || '—'}`,
    `  Legal Name : ${data.party_a.legal_name || data.party_a.full_names || '—'}`,
    `  Reg No.    : ${data.party_a.reg_number || '—'}`,
    `  Address    : ${fmtAddr(data.party_a.address)}`,
    `  Email      : ${data.party_a.email || '—'}`,
    `  Signatory  : ${data.party_a.signatory_name || '—'} (${data.party_a.signatory_capacity || '—'})`,
    '',
    'Party B',
    `  Type       : ${data.party_b.entity_type || '—'}`,
    `  Legal Name : ${data.party_b.legal_name || data.party_b.full_names || '—'}`,
    `  Reg No.    : ${data.party_b.reg_number || '—'}`,
    `  Address    : ${fmtAddr(data.party_b.address)}`,
    `  Email      : ${data.party_b.email || '—'}`,
    `  Signatory  : ${data.party_b.signatory_name || '—'} (${data.party_b.signatory_capacity || '—'})`,
    '',
    '─────────────────────────────────────────',
    '2. PURPOSE & SCOPE',
    '─────────────────────────────────────────',
    `Purpose      : ${data.purpose || '—'}`,
    `CI Definition: ${data.ci_definition || '—'}`,
    `Must be marked: ${data.marking_required ? 'Yes' : 'No'}`,
    '',
    '─────────────────────────────────────────',
    '3. OBLIGATIONS',
    '─────────────────────────────────────────',
    `Duration              : ${data.duration_years} years, from ${data.duration_start}`,
    `Return / Destroy      : ${data.return_or_destroy}`,
    `Archival copy allowed : ${data.archival_copy ? 'Yes' : 'No'}`,
    `Non-solicitation      : ${data.non_solicit ? `Yes (${data.non_solicit_months} months)` : 'No'}`,
    '',
    '─────────────────────────────────────────',
    '4. LEGAL + SIGNING',
    '─────────────────────────────────────────',
    `Governing Law         : ${data.governing_law || '—'}`,
    `Dispute Forum         : ${data.dispute_forum || '—'}`,
    `Signature Method      : ${data.signature_method || '—'}`,
    `Signing Order         : ${data.signing_order || '—'}`,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for',
    'reference purposes only. It does not constitute',
    'legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]

  // Encode lines as PDF text commands (BT ... ET block per line)
  const pageLines: string[] = []
  for (const line of lines) {
    // Escape PDF special chars: ( ) \
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    pageLines.push(`BT /F1 11 Tf 50 ${800 - pageLines.length * 15} Td (${escaped}) Tj ET`)
  }
  const streamContent = pageLines.join('\n')

  // Build minimal PDF objects
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj'
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`
  const obj4 = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj'

  const header = '%PDF-1.4\n'
  const body = [obj1, obj2, obj3, obj4, obj5].join('\n')

  // Cross-reference table
  const offsets: number[] = []
  let pos = header.length
  for (const obj of [obj1, obj2, obj3, obj4, obj5]) {
    offsets.push(pos)
    pos += obj.length + 1 // +1 for the newline between objects
  }
  const xrefOffset = header.length + body.length + 1

  const xref = [
    'xref',
    `0 6`,
    '0000000000 65535 f ',
    ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `),
  ].join('\n')

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  const full = `${header}${body}\n${xref}\n${trailer}`
  return new Blob([full], { type: 'application/pdf' })
}

/**
 * Build a plain-text Evidence Pack containing all wizard answers + audit log.
 */
function buildEvidencePack(data: import('./NdaWizardModal').NdaWizardData, completedAt: string | null): Blob {
  const now = new Date()
  const lines = [
    'TSL EVIDENCE PACK',
    '==================',
    `Wizard ID          : tsl-nda-${now.getTime()}`,
    `Template Version   : v1.0`,
    `Document Version   : NDA-2025`,
    `Generated Date     : ${now.toLocaleDateString('en-ZA')}`,
    `Completion Time    : ${completedAt ? new Date(completedAt).toLocaleString('en-ZA') : now.toLocaleString('en-ZA')}`,
    `Platform           : The Startup Legal`,
    '',
    '── WIZARD ANSWERS ──────────────────────────',
    '',
    '1. PARTIES',
    `   Agreement Type   : ${data.agreement_type || '—'}`,
    '   Party A',
    `     Type           : ${data.party_a.entity_type || '—'}`,
    `     Legal Name     : ${data.party_a.legal_name || data.party_a.full_names || '—'}`,
    `     Reg No.        : ${data.party_a.reg_number || '—'}`,
    `     Email          : ${data.party_a.email || '—'}`,
    `     Signatory      : ${data.party_a.signatory_name || '—'} (${data.party_a.signatory_capacity || '—'})`,
    '   Party B',
    `     Type           : ${data.party_b.entity_type || '—'}`,
    `     Legal Name     : ${data.party_b.legal_name || data.party_b.full_names || '—'}`,
    `     Reg No.        : ${data.party_b.reg_number || '—'}`,
    `     Email          : ${data.party_b.email || '—'}`,
    `     Signatory      : ${data.party_b.signatory_name || '—'} (${data.party_b.signatory_capacity || '—'})`,
    '',
    '2. PURPOSE & SCOPE',
    `   Purpose          : ${data.purpose || '—'}`,
    `   CI Definition    : ${data.ci_definition || '—'}`,
    `   Must be marked   : ${data.marking_required ? 'Yes' : 'No'}`,
    '',
    '3. OBLIGATIONS',
    `   Duration         : ${data.duration_years} years, from ${data.duration_start}`,
    `   Return/Destroy   : ${data.return_or_destroy}`,
    `   Archival copy    : ${data.archival_copy ? 'Yes' : 'No'}`,
    `   Non-solicitation : ${data.non_solicit ? `Yes (${data.non_solicit_months} months)` : 'No'}`,
    '',
    '4. LEGAL + SIGNING',
    `   Governing Law    : ${data.governing_law || '—'}`,
    `   Dispute Forum    : ${data.dispute_forum || '—'}`,
    `   Signature Method : ${data.signature_method || '—'}`,
    `   Signing Order    : ${data.signing_order || '—'}`,
    '',
    '── AUDIT LOG ───────────────────────────────',
    `${now.toISOString()}  WIZARD_COMPLETED`,
    `${now.toISOString()}  DOCUMENT_GENERATED`,
    `${now.toISOString()}  EVIDENCE_PACK_EXPORTED`,
    '',
    'DISCLAIMER: For reference purposes only. Not legal advice.',
  ]
  return new Blob([lines.join('\n')], { type: 'text/plain' })
}

/* ── Employment Offer Letter download builders ───────────── */
function buildEmploymentPdf(d: EmploymentWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const salary = d.salaryAmount ? `R${Number(d.salaryAmount).toLocaleString('en-ZA')} ${d.salaryFrequency}` : '—'
  const lines: string[] = [
    'EMPLOYMENT OFFER LETTER',
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. EMPLOYER DETAILS',
    '─────────────────────────────────────────',
    `Company Name     : ${d.companyName || '—'}`,
    `Reg. Number      : ${d.companyReg || '—'}`,
    `Address          : ${d.employerAddress || '—'}`,
    `Contact Person   : ${d.employerContactPerson || '—'}`,
    `Email            : ${d.employerEmail || '—'}`,
    '',
    '─────────────────────────────────────────',
    '2. EMPLOYEE DETAILS',
    '─────────────────────────────────────────',
    `Full Name        : ${d.employeeFullName || '—'}`,
    `ID / Passport    : ${d.employeeIdNumber || '—'}`,
    `Address          : ${d.employeeAddress || '—'}`,
    `Email            : ${d.employeeEmail || '—'}`,
    `Phone            : ${d.employeePhone || '—'}`,
    '',
    '─────────────────────────────────────────',
    '3. EMPLOYMENT INFORMATION',
    '─────────────────────────────────────────',
    `Job Title        : ${d.jobTitle || '—'}`,
    `Department       : ${d.department || '—'}`,
    `Employment Type  : ${d.employmentType || '—'}`,
    `Start Date       : ${d.startDate || '—'}`,
    `Probation Period : ${d.probationPeriod || '—'}`,
    `Working Hours    : ${d.workingHours || '—'}`,
    `Work Location    : ${d.workLocation || '—'}`,
    '',
    '─────────────────────────────────────────',
    '4. SALARY & BENEFITS',
    '─────────────────────────────────────────',
    `Salary           : ${salary}`,
    `Bonuses          : ${d.bonuses || '—'}`,
    `Leave            : ${d.leaveEntitlement || '—'}`,
    `Medical          : ${d.medicalBenefits || '—'}`,
    `Pension          : ${d.pension || '—'}`,
    `Other Benefits   : ${d.otherBenefits || '—'}`,
    '',
    '─────────────────────────────────────────',
    '5. CONTRACT TERMS',
    '─────────────────────────────────────────',
    `Notice Period    : ${d.noticePeriod || '—'}`,
    `Governing Law    : ${d.governingLaw || '—'}`,
    `Confidentiality  : ${d.confidentialityClause ? 'Yes' : 'No'}`,
    `Intellectual Prop: ${d.intellectualPropertyClause ? 'Yes' : 'No'}`,
    `Non-Compete      : ${d.nonCompeteClause ? 'Yes' : 'No'}`,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for reference purposes only.',
    'It does not constitute legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]
  const pageLines: string[] = []
  for (const line of lines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    pageLines.push(`BT /F1 11 Tf 50 ${800 - pageLines.length * 15} Td (${escaped}) Tj ET`)
  }
  const streamContent = pageLines.join('\n')
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj'
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`
  const obj4 = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj'
  const header = '%PDF-1.4\n'
  const body = [obj1, obj2, obj3, obj4, obj5].join('\n')
  const offsets: number[] = []
  let pos = header.length
  for (const obj of [obj1, obj2, obj3, obj4, obj5]) { offsets.push(pos); pos += obj.length + 1 }
  const xrefOffset = header.length + body.length + 1
  const xref = ['xref', '0 6', '0000000000 65535 f ', ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `)].join('\n')
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([`${header}${body}\n${xref}\n${trailer}`], { type: 'application/pdf' })
}

function canonicalise(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalise).join(',')}]`
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalise(record[key])}`).join(',')}}`
  }
  return JSON.stringify(value)
}

async function sha256(value: string | Blob): Promise<string> {
  const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : await value.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function buildEmploymentEvidencePack(d: EmploymentWizardData, completedAt: string | null, instanceId: string): Promise<Blob> {
  const generatedAt = completedAt ?? new Date().toISOString()
  const inputs = {
    company_id: d.company_id,
    'candidate.full_names': d['candidate.full_names'],
    'candidate.email': d['candidate.email'],
    job_title: d.job_title,
    reports_to: d.reports_to,
    start_date: d.start_date,
    work_location: d.work_location,
    salary_amount: d.salary_amount,
    salary_period: d.salary_period,
    benefits: d.benefits,
    benefits_detail: d.benefits_detail,
    probation_months: d.probation_months,
    restraint_flag: d.restraint_flag,
    conditions: d.conditions,
    medical_justification: d.medical_justification,
    work_permit_type: d.work_permit_type,
    work_permit_expiry: d.work_permit_expiry,
    offer_expiry: d.offer_expiry,
  }
  const pdf = buildEmploymentPdf(d, completedAt)
  const docx = await buildEmploymentDocx(d, completedAt)
  const [inputFingerprint, pdfFingerprint, docxFingerprint] = await Promise.all([
    sha256(canonicalise(inputs)),
    sha256(pdf),
    sha256(docx),
  ])
  const lines = [
    'TSL EVIDENCE PACK - EMPLOYMENT OFFER LETTER',
    '=============================================',
    `Blueprint ID       : employment-offer-letter`,
    `Blueprint Instance ID: ${instanceId}`,
    `Schema Version     : 2.0`,
    `Template Version   : employment-offer-letter-v2.0`,
    `Generation Timestamp: ${generatedAt}`,
    `Input Fingerprint  : sha256:${inputFingerprint}`,
    `Output Fingerprint (PDF): sha256:${pdfFingerprint}`,
    `Output Fingerprint (DOCX): sha256:${docxFingerprint}`,
    '',
    'CANONICAL BLUEPRINT INPUTS',
    '==========================',
    '',
    'ROLE',
    `  company_id                : ${inputs.company_id || '—'}`,
    `  candidate.full_names      : ${inputs['candidate.full_names'] || '—'}`,
    `  candidate.email           : ${inputs['candidate.email'] || '—'}`,
    `  job_title                 : ${inputs.job_title || '—'}`,
    `  reports_to                : ${inputs.reports_to || '—'}`,
    `  start_date                : ${inputs.start_date || '—'}`,
    `  work_location             : ${inputs.work_location || '—'}`,
    '',
    'PACKAGE',
    `  salary_amount             : ${inputs.salary_amount || '—'}`,
    `  salary_period             : ${inputs.salary_period}`,
    `  benefits                  : ${inputs.benefits.join(', ') || '—'}`,
    `  benefits_detail           : ${inputs.benefits_detail || '—'}`,
    `  probation_months          : ${inputs.probation_months || '—'}`,
    `  restraint_flag            : ${inputs.restraint_flag === null ? '—' : inputs.restraint_flag ? 'Yes' : 'No'}`,
    '',
    'CONDITIONS',
    `  conditions                : ${inputs.conditions.join(', ') || '—'}`,
    `  medical_justification     : ${inputs.medical_justification || '—'}`,
    `  work_permit_type          : ${inputs.work_permit_type || '—'}`,
    `  work_permit_expiry        : ${inputs.work_permit_expiry || '—'}`,
    `  offer_expiry              : ${inputs.offer_expiry || '—'}`,
    '',
  ]
  return new Blob([lines.join('\n')], { type: 'text/plain' })
}

/* ── Privacy Policy download builders ───────────────────────── */
function buildPrivacyPolicyPdf(d: PrivacyPolicyWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const yn = (v: boolean) => (v ? 'Yes' : 'No')
  const lines: string[] = [
    'PRIVACY POLICY (POPIA COMPLIANT)',
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. BUSINESS INFORMATION',
    '─────────────────────────────────────────',
    `Company Name     : ${d.companyName || '—'}`,
    `Website          : ${d.website || '—'}`,
    `Business Email   : ${d.businessEmail || '—'}`,
    `Contact Number   : ${d.contactNumber || '—'}`,
    `Physical Address : ${d.physicalAddress || '—'}`,
    '',
    '─────────────────────────────────────────',
    '2. INFORMATION COLLECTED',
    '─────────────────────────────────────────',
    `Personal Information  : ${yn(d.collectsPersonalInfo)}`,
    `Contact Details       : ${yn(d.collectsContactDetails)}`,
    `Payment Information   : ${yn(d.collectsPaymentInfo)}`,
    `Technical Information : ${yn(d.collectsTechnicalInfo)}`,
    `Cookies               : ${yn(d.collectsCookies)}`,
    '',
    '─────────────────────────────────────────',
    '3. PURPOSE OF COLLECTION',
    '─────────────────────────────────────────',
    `Service Delivery  : ${yn(d.purposeServiceDelivery)}`,
    `Marketing         : ${yn(d.purposeMarketing)}`,
    `Analytics         : ${yn(d.purposeAnalytics)}`,
    `Customer Support  : ${yn(d.purposeCustomerSupport)}`,
    `Legal Compliance  : ${yn(d.purposeLegalCompliance)}`,
    '',
    '─────────────────────────────────────────',
    '4. DATA SHARING',
    '─────────────────────────────────────────',
    `Third-party Providers  : ${yn(d.sharesThirdPartyProviders)}`,
    `Payment Gateways       : ${yn(d.sharesPaymentGateways)}`,
    `Marketing Platforms    : ${yn(d.sharesMarketingPlatforms)}`,
    `Government Authorities : ${yn(d.sharesGovernmentAuthorities)}`,
    '',
    '─────────────────────────────────────────',
    '5. USER RIGHTS',
    '─────────────────────────────────────────',
    `Right to Access          : ${yn(d.rightAccess)}`,
    `Right to Correction      : ${yn(d.rightCorrection)}`,
    `Right to Deletion        : ${yn(d.rightDeletion)}`,
    `Right to Object          : ${yn(d.rightObjection)}`,
    `Right to Data Portability: ${yn(d.rightDataPortability)}`,
    '',
    '─────────────────────────────────────────',
    '6. SECURITY & RETENTION',
    '─────────────────────────────────────────',
    `Data Storage      : ${d.dataStorage || '—'}`,
    `Retention Period  : ${d.retentionPeriod || '—'}`,
    `Security Measures : ${d.securityMeasures || '—'}`,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for reference purposes only.',
    'It does not constitute legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]
  const pageLines: string[] = []
  for (const line of lines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    pageLines.push(`BT /F1 11 Tf 50 ${800 - pageLines.length * 15} Td (${escaped}) Tj ET`)
  }
  const streamContent = pageLines.join('\n')
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj'
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`
  const obj4 = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj'
  const header = '%PDF-1.4\n'
  const body = [obj1, obj2, obj3, obj4, obj5].join('\n')
  const offsets: number[] = []
  let pos = header.length
  for (const obj of [obj1, obj2, obj3, obj4, obj5]) { offsets.push(pos); pos += obj.length + 1 }
  const xrefOffset = header.length + body.length + 1
  const xref = ['xref', '0 6', '0000000000 65535 f ', ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `)].join('\n')
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([`${header}${body}\n${xref}\n${trailer}`], { type: 'application/pdf' })
}

function buildPrivacyPolicyEvidencePack(d: PrivacyPolicyWizardData, completedAt: string | null): Blob {
  const now = new Date()
  const yn = (v: boolean) => (v ? 'Yes' : 'No')
  const lines = [
    'TSL EVIDENCE PACK — PRIVACY POLICY',
    '====================================',
    `Wizard ID          : tsl-pp-${now.getTime()}`,
    `Template Version   : v1.0`,
    `Document Version   : PP-2025`,
    `Generated Date     : ${now.toLocaleDateString('en-ZA')}`,
    `Completion Time    : ${completedAt ? new Date(completedAt).toLocaleString('en-ZA') : now.toLocaleString('en-ZA')}`,
    `Platform           : The Startup Legal`,
    '',
    '── WIZARD ANSWERS ──────────────────────────',
    '',
    '1. BUSINESS INFORMATION',
    `   Company Name     : ${d.companyName || '—'}`,
    `   Website          : ${d.website || '—'}`,
    `   Business Email   : ${d.businessEmail || '—'}`,
    `   Contact Number   : ${d.contactNumber || '—'}`,
    `   Physical Address : ${d.physicalAddress || '—'}`,
    '',
    '2. INFORMATION COLLECTED',
    `   Personal Info    : ${yn(d.collectsPersonalInfo)}`,
    `   Contact Details  : ${yn(d.collectsContactDetails)}`,
    `   Payment Info     : ${yn(d.collectsPaymentInfo)}`,
    `   Technical Info   : ${yn(d.collectsTechnicalInfo)}`,
    `   Cookies          : ${yn(d.collectsCookies)}`,
    '',
    '3. PURPOSE OF COLLECTION',
    `   Service Delivery : ${yn(d.purposeServiceDelivery)}`,
    `   Marketing        : ${yn(d.purposeMarketing)}`,
    `   Analytics        : ${yn(d.purposeAnalytics)}`,
    `   Customer Support : ${yn(d.purposeCustomerSupport)}`,
    `   Legal Compliance : ${yn(d.purposeLegalCompliance)}`,
    '',
    '4. DATA SHARING',
    `   Third-party      : ${yn(d.sharesThirdPartyProviders)}`,
    `   Payment Gateways : ${yn(d.sharesPaymentGateways)}`,
    `   Marketing Plat.  : ${yn(d.sharesMarketingPlatforms)}`,
    `   Government Auth. : ${yn(d.sharesGovernmentAuthorities)}`,
    '',
    '5. USER RIGHTS',
    `   Access           : ${yn(d.rightAccess)}`,
    `   Correction       : ${yn(d.rightCorrection)}`,
    `   Deletion         : ${yn(d.rightDeletion)}`,
    `   Objection        : ${yn(d.rightObjection)}`,
    `   Data Portability : ${yn(d.rightDataPortability)}`,
    '',
    '6. SECURITY & RETENTION',
    `   Data Storage     : ${d.dataStorage || '—'}`,
    `   Retention Period : ${d.retentionPeriod || '—'}`,
    `   Security Measures: ${d.securityMeasures || '—'}`,
    '',
    '── AUDIT LOG ───────────────────────────────',
    `${now.toISOString()}  WIZARD_COMPLETED`,
    `${now.toISOString()}  DOCUMENT_GENERATED`,
    `${now.toISOString()}  EVIDENCE_PACK_EXPORTED`,
    '',
    'DISCLAIMER: For reference purposes only. Not legal advice.',
  ]
  return new Blob([lines.join('\n')], { type: 'text/plain' })
}

/* ── Founders' Agreement download builders ───────────────── */
function buildFounderAgreementPdf(d: FounderAgreementWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const founderLines = d.founders.flatMap((f, i) => [
    `Founder ${i + 1}`,
    `  Name   : ${f.name || '—'}`,
    `  Email  : ${f.email || '—'}`,
    `  Role   : ${f.role || '—'}`,
    `  Equity : ${f.equity ? `${f.equity}%` : '—'}`,
    '',
  ])
  const sigLines = d.signatories.flatMap((s, i) => [
    `Signatory ${i + 1}: ${s.name || '—'} (${s.title || '—'})`,
  ])
  const lines: string[] = [
    "FOUNDERS' AGREEMENT & IP ASSIGNMENT",
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. COMPANY INFORMATION',
    '─────────────────────────────────────────',
    `Incorporated        : ${d.isIncorporated || '—'}`,
    `Company Name        : ${d.companyName || '—'}`,
    `Registration No.    : ${d.registrationNumber || '—'}`,
    `Registered Address  : ${d.registeredAddress || '—'}`,
    '',
    '─────────────────────────────────────────',
    '2. FOUNDERS',
    '─────────────────────────────────────────',
    ...founderLines,
    '─────────────────────────────────────────',
    '3. GOVERNANCE & DECISION MAKING',
    '─────────────────────────────────────────',
    `Decision Model      : ${d.decisionMakingModel || '—'}`,
    `Reserved Matters    : ${d.reservedMatters.filter(r => r.trim()).join('; ') || '—'}`,
    `Board Approval      : ${d.boardApprovalRequirements || '—'}`,
    `Responsibilities    : ${d.founderResponsibilities || '—'}`,
    '',
    '─────────────────────────────────────────',
    '4. VESTING & SHARE RULES',
    '─────────────────────────────────────────',
    `Vesting Enabled     : ${d.vestingEnabled || '—'}`,
    `Cliff Period        : ${d.vestingEnabled === 'Yes' ? (d.cliffPeriod || '—') : 'N/A'}`,
    `Vesting Period      : ${d.vestingEnabled === 'Yes' ? (d.vestingPeriod || '—') : 'N/A'}`,
    `Share Restrictions  : ${d.shareTransferRestrictions || '—'}`,
    `Buy-back Rights     : ${d.buybackRights || '—'}`,
    `Exit Rules          : ${d.founderExitRules || '—'}`,
    '',
    '─────────────────────────────────────────',
    '5. INTELLECTUAL PROPERTY',
    '─────────────────────────────────────────',
    `Assign IP to Co.    : ${d.assignIpToCompany || '—'}`,
    `Existing IP         : ${d.hasExistingIp || '—'}`,
    `IP Description      : ${d.hasExistingIp === 'Yes' ? (d.existingIpDescription || '—') : 'N/A'}`,
    `IP Assignment       : ${d.hasExistingIp === 'Yes' ? (d.existingIpAssignment || '—') : 'N/A'}`,
    '',
    '─────────────────────────────────────────',
    '6. LEGAL & SIGNING',
    '─────────────────────────────────────────',
    `Confidentiality     : ${d.confidentiality || '—'}`,
    `Dispute Resolution  : ${d.disputeResolution || '—'}`,
    `Governing Law       : ${d.governingLaw || '—'}`,
    `Jurisdiction        : ${d.jurisdiction || '—'}`,
    '',
    'Signatories:',
    ...sigLines,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for reference purposes only.',
    'It does not constitute legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]
  const pageLines: string[] = []
  for (const line of lines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    pageLines.push(`BT /F1 11 Tf 50 ${800 - pageLines.length * 15} Td (${escaped}) Tj ET`)
  }
  const streamContent = pageLines.join('\n')
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj'
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`
  const obj4 = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj'
  const header = '%PDF-1.4\n'
  const body = [obj1, obj2, obj3, obj4, obj5].join('\n')
  const offsets: number[] = []
  let pos = header.length
  for (const obj of [obj1, obj2, obj3, obj4, obj5]) { offsets.push(pos); pos += obj.length + 1 }
  const xrefOffset = header.length + body.length + 1
  const xref = ['xref', '0 6', '0000000000 65535 f ', ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `)].join('\n')
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([`${header}${body}\n${xref}\n${trailer}`], { type: 'application/pdf' })
}

function buildFounderAgreementEvidencePack(d: FounderAgreementWizardData, completedAt: string | null): Blob {
  const now = new Date()
  const founderLines = d.founders.flatMap((f, i) => [
    `   Founder ${i + 1} Name   : ${f.name || '—'}`,
    `   Founder ${i + 1} Email  : ${f.email || '—'}`,
    `   Founder ${i + 1} Role   : ${f.role || '—'}`,
    `   Founder ${i + 1} Equity : ${f.equity ? `${f.equity}%` : '—'}`,
  ])
  const sigLines = d.signatories.map((s, i) => `   Signatory ${i + 1}       : ${s.name || '—'} (${s.title || '—'})`)
  const lines = [
    "TSL EVIDENCE PACK — FOUNDERS' AGREEMENT & IP ASSIGNMENT",
    '=========================================================',
    `Wizard ID          : tsl-fa-${now.getTime()}`,
    `Template Version   : v2.0`,
    `Document Version   : FA-2025`,
    `Generated Date     : ${now.toLocaleDateString('en-ZA')}`,
    `Completion Time    : ${completedAt ? new Date(completedAt).toLocaleString('en-ZA') : now.toLocaleString('en-ZA')}`,
    `Platform           : The Startup Legal`,
    '',
    '── WIZARD ANSWERS ──────────────────────────',
    '',
    '1. COMPANY',
    `   Incorporated        : ${d.isIncorporated || '—'}`,
    `   Company Name        : ${d.companyName || '—'}`,
    `   Registration No.    : ${d.registrationNumber || '—'}`,
    `   Registered Address  : ${d.registeredAddress || '—'}`,
    '',
    '2. FOUNDERS',
    ...founderLines,
    '',
    '3. GOVERNANCE',
    `   Decision Model      : ${d.decisionMakingModel || '—'}`,
    `   Reserved Matters    : ${d.reservedMatters.filter(r => r.trim()).join('; ') || '—'}`,
    `   Board Approval      : ${d.boardApprovalRequirements || '—'}`,
    `   Responsibilities    : ${d.founderResponsibilities || '—'}`,
    '',
    '4. VESTING & SHARE RULES',
    `   Vesting Enabled     : ${d.vestingEnabled || '—'}`,
    `   Cliff Period        : ${d.vestingEnabled === 'Yes' ? (d.cliffPeriod || '—') : 'N/A'}`,
    `   Vesting Period      : ${d.vestingEnabled === 'Yes' ? (d.vestingPeriod || '—') : 'N/A'}`,
    `   Share Restrictions  : ${d.shareTransferRestrictions || '—'}`,
    `   Buy-back Rights     : ${d.buybackRights || '—'}`,
    `   Exit Rules          : ${d.founderExitRules || '—'}`,
    '',
    '5. INTELLECTUAL PROPERTY',
    `   Assign IP to Co.    : ${d.assignIpToCompany || '—'}`,
    `   Existing IP         : ${d.hasExistingIp || '—'}`,
    `   IP Description      : ${d.hasExistingIp === 'Yes' ? (d.existingIpDescription || '—') : 'N/A'}`,
    `   IP Assignment       : ${d.hasExistingIp === 'Yes' ? (d.existingIpAssignment || '—') : 'N/A'}`,
    '',
    '6. LEGAL & SIGNING',
    `   Confidentiality     : ${d.confidentiality || '—'}`,
    `   Dispute Resolution  : ${d.disputeResolution || '—'}`,
    `   Governing Law       : ${d.governingLaw || '—'}`,
    `   Jurisdiction        : ${d.jurisdiction || '—'}`,
    ...sigLines,
    '',
    '── AUDIT LOG ───────────────────────────────',
    `${now.toISOString()}  WIZARD_COMPLETED`,
    `${now.toISOString()}  DOCUMENT_GENERATED`,
    `${now.toISOString()}  EVIDENCE_PACK_EXPORTED`,
    '',
    'DISCLAIMER: For reference purposes only. Not legal advice.',
  ]
  return new Blob([lines.join('\n')], { type: 'text/plain' })
}

/* ── Service Agreement download builders ─────────────────── */
function buildServiceAgreementPdf(d: ServiceAgreementWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const lines: string[] = [
    'SERVICE AGREEMENT',
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. PARTIES',
    '─────────────────────────────────────────',
    'Service Provider',
    `  Legal Name : ${d.providerName || '—'}`,
    `  Reg No.    : ${d.providerReg || '—'}`,
    `  Address    : ${d.providerAddress || '—'}`,
    '',
    'Client',
    `  Legal Name : ${d.clientName || '—'}`,
    `  Reg No.    : ${d.clientReg || '—'}`,
    `  Address    : ${d.clientAddress || '—'}`,
    '',
    `Contact Name  : ${d.contactName || '—'}`,
    `Contact Email : ${d.contactEmail || '—'}`,
    `Contact Phone : ${d.contactPhone || '—'}`,
    '',
    '─────────────────────────────────────────',
    '2. SERVICES',
    '─────────────────────────────────────────',
    `Services      : ${d.servicesDescription || '—'}`,
    `Scope of Work : ${d.scopeOfWork || '—'}`,
    `Deliverables  : ${d.deliverables || '—'}`,
    '',
    '─────────────────────────────────────────',
    '3. FEES & PRICING',
    '─────────────────────────────────────────',
    `Pricing           : ${d.pricing || '—'}`,
    `Payment Terms     : ${d.paymentTerms || '—'}`,
    `Billing Frequency : ${d.billingFrequency || '—'}`,
    '',
    '─────────────────────────────────────────',
    '4. SERVICE LEVELS',
    '─────────────────────────────────────────',
    `Availability    : ${d.availability || '—'}`,
    `Response Time   : ${d.responseTime || '—'}`,
    `Resolution Time : ${d.resolutionTime || '—'}`,
    `Support Hours   : ${d.supportHours || '—'}`,
    '',
    '─────────────────────────────────────────',
    '5. RESPONSIBILITIES',
    '─────────────────────────────────────────',
    `Provider : ${d.providerResponsibilities || '—'}`,
    `Client   : ${d.clientResponsibilities || '—'}`,
    '',
    '─────────────────────────────────────────',
    '6. TERM & TERMINATION',
    '─────────────────────────────────────────',
    `Start Date           : ${d.startDate || '—'}`,
    `End Date             : ${d.endDate || '—'}`,
    `Renewal              : ${d.renewal || '—'}`,
    `Termination Notice   : ${d.terminationNotice || '—'}`,
    '',
    '─────────────────────────────────────────',
    '7. LEGAL',
    '─────────────────────────────────────────',
    `Confidentiality : ${d.confidentiality || '—'}`,
    `Liability       : ${d.liability || '—'}`,
    `Governing Law   : ${d.governingLaw || '—'}`,
    `Jurisdiction    : ${d.jurisdiction || '—'}`,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for reference purposes only.',
    'It does not constitute legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]
  const pageLines: string[] = []
  for (const line of lines) {
    const escaped = line.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
    pageLines.push(`BT /F1 11 Tf 50 ${800 - pageLines.length * 15} Td (${escaped}) Tj ET`)
  }
  const streamContent = pageLines.join('\n')
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj'
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj'
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842]\n   /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj`
  const obj4 = `4 0 obj\n<< /Length ${streamContent.length} >>\nstream\n${streamContent}\nendstream\nendobj`
  const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj'
  const header = '%PDF-1.4\n'
  const body = [obj1, obj2, obj3, obj4, obj5].join('\n')
  const offsets: number[] = []
  let pos = header.length
  for (const obj of [obj1, obj2, obj3, obj4, obj5]) { offsets.push(pos); pos += obj.length + 1 }
  const xrefOffset = header.length + body.length + 1
  const xref = ['xref', '0 6', '0000000000 65535 f ', ...offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n `)].join('\n')
  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return new Blob([`${header}${body}\n${xref}\n${trailer}`], { type: 'application/pdf' })
}

function buildServiceAgreementEvidencePack(d: ServiceAgreementWizardData, completedAt: string | null): Blob {
  const now = new Date()
  const lines = [
    'TSL EVIDENCE PACK — SERVICE AGREEMENT',
    '=======================================',
    `Wizard ID          : tsl-sa-${now.getTime()}`,
    `Template Version   : v1.0`,
    `Document Version   : SA-2025`,
    `Generated Date     : ${now.toLocaleDateString('en-ZA')}`,
    `Completion Time    : ${completedAt ? new Date(completedAt).toLocaleString('en-ZA') : now.toLocaleString('en-ZA')}`,
    `Platform           : The Startup Legal`,
    '',
    '── WIZARD ANSWERS ──────────────────────────',
    '',
    '1. PARTIES',
    '   Service Provider',
    `     Legal Name     : ${d.providerName || '—'}`,
    `     Reg No.        : ${d.providerReg || '—'}`,
    `     Address        : ${d.providerAddress || '—'}`,
    '   Client',
    `     Legal Name     : ${d.clientName || '—'}`,
    `     Reg No.        : ${d.clientReg || '—'}`,
    `     Address        : ${d.clientAddress || '—'}`,
    `   Contact Name     : ${d.contactName || '—'}`,
    `   Contact Email    : ${d.contactEmail || '—'}`,
    `   Contact Phone    : ${d.contactPhone || '—'}`,
    '',
    '2. SERVICES',
    `   Description      : ${d.servicesDescription || '—'}`,
    `   Scope of Work    : ${d.scopeOfWork || '—'}`,
    `   Deliverables     : ${d.deliverables || '—'}`,
    '',
    '3. FEES & PRICING',
    `   Pricing          : ${d.pricing || '—'}`,
    `   Payment Terms    : ${d.paymentTerms || '—'}`,
    `   Billing Frequency: ${d.billingFrequency || '—'}`,
    '',
    '4. SERVICE LEVELS',
    `   Availability     : ${d.availability || '—'}`,
    `   Response Time    : ${d.responseTime || '—'}`,
    `   Resolution Time  : ${d.resolutionTime || '—'}`,
    `   Support Hours    : ${d.supportHours || '—'}`,
    '',
    '5. RESPONSIBILITIES',
    `   Provider         : ${d.providerResponsibilities || '—'}`,
    `   Client           : ${d.clientResponsibilities || '—'}`,
    '',
    '6. TERM & TERMINATION',
    `   Start Date       : ${d.startDate || '—'}`,
    `   End Date         : ${d.endDate || '—'}`,
    `   Renewal          : ${d.renewal || '—'}`,
    `   Termination Notice: ${d.terminationNotice || '—'}`,
    '',
    '7. LEGAL',
    `   Confidentiality  : ${d.confidentiality || '—'}`,
    `   Liability        : ${d.liability || '—'}`,
    `   Governing Law    : ${d.governingLaw || '—'}`,
    `   Jurisdiction     : ${d.jurisdiction || '—'}`,
    '',
    '── AUDIT LOG ───────────────────────────────',
    `${now.toISOString()}  WIZARD_COMPLETED`,
    `${now.toISOString()}  DOCUMENT_GENERATED`,
    `${now.toISOString()}  EVIDENCE_PACK_EXPORTED`,
    '',
    'DISCLAIMER: For reference purposes only. Not legal advice.',
  ]
  return new Blob([lines.join('\n')], { type: 'text/plain' })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { state: ndaState, startWizard, saveProgress, completeWizard, resetWizard: resetNda } = useNdaWizard()
  const { state: empState, startWizard: startEmp, saveProgress: saveEmpProgress, completeWizard: completeEmp, resetWizard: resetEmp } = useEmploymentWizard()
  const { state: ppState, startWizard: startPP, saveProgress: savePPProgress, completeWizard: completePP, resetWizard: resetPP } = usePrivacyPolicyWizard()
  const { state: faState, startWizard: startFA, saveProgress: saveFAProgress, completeWizard: completeFA, resetWizard: resetFA } = useFounderAgreementWizard()
  const { state: saState, startWizard: startSA, saveProgress: saveSAProgress, completeWizard: completeSA, resetWizard: resetSA } = useServiceAgreementWizard()

  // ── Billing upgrade flow for Free plan users ──────────────────────────────
  const [upgradePayError, setUpgradePayError] = useState<string | null>(null)

  const upgradePayFn = useCallback(async (amountZAR: number, planName: string): Promise<string | null> => {
    setUpgradePayError(null)
    const checkoutResult = await openPaystackCheckout({
      amount: amountZAR,
      currency: 'ZAR',
      email: (() => { try { return (JSON.parse(localStorage.getItem('tsl-auth-user') ?? '{}') as { email?: string }).email || 'user@example.com' } catch { return 'user@example.com' } })(),
      plan: planName.toLowerCase(),
      paymentMethod: 'card',
      selectedWizards: [],
      totalWizards: 0,
    })
    if (checkoutResult.status === 'cancelled') return null
    if (checkoutResult.status === 'failed') {
      setUpgradePayError(checkoutResult.message || 'Payment failed. Please try again.')
      return null
    }
    const verifyRes = await paymentApi.verifyPaystack({ reference: checkoutResult.reference, type: 'subscription-upgrade' })
    if (!verifyRes.success || verifyRes.data?.status !== 'success') {
      setUpgradePayError(verifyRes.message || 'Payment could not be verified. Please try again.')
      return null
    }
    return checkoutResult.reference
  }, [])

  const {
    subscription: billingSubscription,
    plans: billingPlans,
    plansLoading: billingPlansLoading,
    plansError: billingPlansError,
    selectedPlan: billingSelectedPlan,
    upgradePreview: billingUpgradePreview,
    previewLoading: billingPreviewLoading,
    previewError: billingPreviewError,
    actionLoading: billingActionLoading,
    actionError: billingActionError,
    activeModal: billingActiveModal,
    upgradeResult: billingUpgradeResult,
    openUpgradePlans: openBillingUpgradePlans,
    selectPlan: billingSelectPlan,
    confirmUpgrade: billingConfirmUpgrade,
    cancelUpgradeConfirm: billingCancelUpgradeConfirm,
    closeModal: billingCloseModal,
  } = useBillingSubscription(upgradePayFn)

  const [wizardAccess, setWizardAccess] = useState<WizardAccess | null>(() => {
    try { return JSON.parse(localStorage.getItem(wizardAccessCacheKey) ?? 'null') as WizardAccess | null } catch { return null }
  })
  // Pre-confirm from cache when the cache was written by a verified payment —
  // avoids a blank/landing flash while the API call is still in flight.
  // The API response will always overwrite with the authoritative value.
  const [wizardAccessConfirmed, setWizardAccessConfirmed] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(wizardAccessCacheKey) ?? 'null') as { hasSubscription?: boolean } | null
      return Boolean(cached?.hasSubscription)
    } catch { return false }
  })

  const [dashboardViewMode, setDashboardViewMode] = useState(() =>
    localStorage.getItem('tsl-dashboard-view-mode') ?? 'initial',
  )
  // A wizard may only be started after the server has confirmed subscription status.
  // wizardAccessConfirmed ensures stale localStorage cache never grants access
  // before the API has responded.
  // Show the first-time landing for every subscribed user until they explicitly
  // click Start — regardless of prior session view-mode stored in localStorage.
  const isInitialSubscriptionDashboard = Boolean(
    wizardAccessConfirmed &&
    wizardAccess?.hasSubscription &&
    wizardAccess.selectedWizards.length &&
    dashboardViewMode !== 'returning',
  )
  // isPaidDashboard: show the tabbed (New / In Progress / Completed) dashboard.
  // Only reached after the user clicks Start from the landing view (which flips
  // dashboardViewMode to 'returning').
  const isPaidDashboard = Boolean(
    wizardAccessConfirmed &&
    wizardAccess?.hasSubscription &&
    !isInitialSubscriptionDashboard &&
    dashboardViewMode === 'returning',
  )
  const defaultTab: DashboardTab = 'new'
  const [activeTab, setActiveTab] = useState<DashboardTab>(defaultTab)
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false)
  const [isPPModalOpen, setIsPPModalOpen] = useState(false)
  const [isFAModalOpen, setIsFAModalOpen] = useState(false)
  const [isSAModalOpen, setIsSAModalOpen] = useState(false)
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null)
  const [ndaToast, setNdaToast] = useState('')
  const [insufficientUnits, setInsufficientUnits] = useState<{ remaining: number; required: number; blueprintName: string; pricePerUnit: number; iconName?: string } | null>(null)
  const ndaToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Queue state ──────────────────────────────────────────────────────────
  // Tracks how many instances of each blueprint type are waiting in the New tab.
  // Independent of the per-type wizard hooks so that:
  //   • Multiple queued items of the same type all appear in New simultaneously
  //   • Starting one moves only that instance to In Progress; the rest stay in New
  //   • Completing a workflow does not remove queued items from New
  const queueStorageKey = 'tsl-dashboard-queue'
  const [queuedCounts, setQueuedCounts] = useState<Record<string, number>>(() => {
    try {
      // Only restore a previously persisted queue — do NOT auto-seed from
      // selectedWizards here. Seeding happens only after the user leaves the
      // first-time landing (dashboardViewMode === 'returning'), so the New tab
      // starts empty until the user explicitly clicks Start on a wizard.
      const storedRaw = localStorage.getItem(queueStorageKey)
      return storedRaw ? (JSON.parse(storedRaw) as Record<string, number>) : {}
    } catch { return {} }
  })
  // Whether the queue has been seeded from the server-authoritative selectedWizards
  const queueSeedRef = useRef(false)
  // Tracks whether the initial billingSubscription load has been observed so
  // the billing upgrade effect only fires on genuine in-place plan changes,
  // not on the initial mount hydration from the server.
  const billingPlanSeenRef = useRef<string | null>(null)

  // ── Completed instances ──────────────────────────────────────────────────
  // Each completed run is appended here so the Completed tab accumulates
  // multiple runs of the same blueprint type independently of the single-slot
  // wizard hooks. The hook can be reset to start a new run without losing
  // earlier completion records.
  const completedInstancesKey = 'tsl-dashboard-completed-instances'
  const [completedInstances, setCompletedInstances] = useState<CompletedInstance[]>(() => {
    try {
      const raw = localStorage.getItem(completedInstancesKey)
      return raw ? (JSON.parse(raw) as CompletedInstance[]) : []
    } catch { return [] }
  })

  const pushCompletedInstance = (wizardType: string, data: unknown, completedAt: string) => {
    const entry: CompletedInstance = {
      id: `${wizardType}:${completedAt}:${Math.random().toString(36).slice(2, 7)}`,
      wizardType,
      completedAt,
      data,
    }
    setCompletedInstances((prev) => {
      const next = [...prev, entry]
      localStorage.setItem(completedInstancesKey, JSON.stringify(next))
      return next
    })
  }

  // ── In-progress set ──────────────────────────────────────────────────────
  // Tracks which blueprint types currently have an active (inProgress) run in
  // their single-slot hook. Prevents double-starting the same type while it is
  // already open — the user must finish or close the current run first.
  // Derived from live hook states so it is always in sync.
  const inProgressTitles = new Set<string>([
    ...(ndaState.status === 'inProgress' ? ['Non-Disclosure Agreement (NDA)'] : []),
    ...(empState.status === 'inProgress' ? ['Employment Offer Letter'] : []),
    ...(ppState.status === 'inProgress' ? ['Privacy & Cookies Policy'] : []),
    ...(faState.status === 'inProgress' ? ['Founder Agreement'] : []),
    ...(saState.status === 'inProgress' ? ['Service Agreement'] : []),
  ])

  // Decrement one instance from the New queue and open the corresponding modal.
  // Guard: if this blueprint type is already inProgress, do not allow a second
  // concurrent start — show the in-progress card instead by switching tabs.
  // If the hook is in 'completed' state reset it first so startWizard() can
  // transition it back to inProgress.
  const handleStart = (title: string) => {
    // Block double-start: a wizard slot can only hold one active run at a time.
    // Switch to In Progress so the user can Continue rather than starting again.
    if (inProgressTitles.has(title)) {
      setActiveTab('inProgress')
      return
    }

    // Do NOT flip the view yet — the landing page stays visible behind the
    // modal. The transition to the tabbed dashboard happens only when the
    // user closes or completes the modal (see onClose / onComplete handlers).

    // Ensure the New tab has an entry for this wizard when we transition to the
    // paid tabbed dashboard after the modal closes. This guards against the case
    // where the queue has not yet been seeded from the API (e.g. the user starts
    // a wizard from the initial subscription view before the wizardAccess response
    // arrives). Without this, the New tab would be empty after the transition.
    if ((queuedCounts[title] ?? 0) <= 0) {
      setQueuedCounts((prev) => {
        const next = { ...prev, [title]: 1 }
        localStorage.setItem(queueStorageKey, JSON.stringify(next))
        return next
      })
    }

    if (title === 'Non-Disclosure Agreement (NDA)') {
      if (ndaState.status === 'completed') resetNda()
      startWizard(); setIsNdaModalOpen(true)
    } else if (title === 'Employment Offer Letter') {
      if (empState.status === 'completed') resetEmp()
      startEmp(); setIsEmpModalOpen(true)
    } else if (title === 'Privacy & Cookies Policy') {
      if (ppState.status === 'completed') resetPP()
      startPP(); setIsPPModalOpen(true)
    } else if (title === 'Founder Agreement') {
      if (faState.status === 'completed') resetFA()
      startFA(); setIsFAModalOpen(true)
    } else if (title === 'Service Agreement') {
      if (saState.status === 'completed') resetSA()
      startSA(); setIsSAModalOpen(true)
    } else {
      setComingSoonTitle(title)
    }
  }

  // Toast shown after a wizard is added to dashboard without payment
  const locationState = location.state as { addedCount?: number; blueprintTopUpSuccess?: boolean; unitsAdded?: number; addedWizards?: Array<{ title: string; quantity: number }> } | null
  const addedCount = locationState?.addedCount ?? 0
  const [addToast, setAddToast] = useState(() => {
    if (locationState?.blueprintTopUpSuccess && locationState.unitsAdded) {
      return `${locationState.unitsAdded} Blueprint Credit${locationState.unitsAdded !== 1 ? 's' : ''} added successfully.`
    }
    return addedCount > 0
      ? `${addedCount} wizard${addedCount !== 1 ? 's' : ''} added to your dashboard.`
      : ''
  })
  const addToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!addToast) return
    if (addToastTimerRef.current) clearTimeout(addToastTimerRef.current)
    addToastTimerRef.current = setTimeout(() => setAddToast(''), 5000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addToast])

  // ── Quick Access Links ───────────────────────────────────────────────────
  const [quickLinks, setQuickLinks] = useState<QuickAccessLinks | null>(null)
  const [quickLinksLoading, setQuickLinksLoading] = useState(true)

  // ── Legal Notices Links ──────────────────────────────────────────────────
  const [legalLinks, setLegalLinks] = useState<LegalLinks | null>(null)
  const [legalLinksLoading, setLegalLinksLoading] = useState(true)

  // ── Live subscription + plan data (drives the plan card benefits) ────────
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlan | undefined>(undefined)

  setPageMetadata(
    'Dashboard',
    'TSL user dashboard for reviewing legal workflows, plan usage, and completed documents.',
  )

  useEffect(() => {
    let cancelled = false

    smeApi.dashboard().then((response) => {
      if (cancelled) return
      if (!response.success) {
        setError(response.message ?? 'Failed to load dashboard data.')
        setLoading(false)
        return
      }
      if (response.data) {
        setDashboardData(response.data)
      }
      setLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  // Re-fetch wizard access on mount AND whenever we return from add-to-dashboard
  const locationKey = location.key
  useEffect(() => {
    let cancelled = false
    paymentApi.wizardAccess().then((response) => {
      if (!cancelled) {
        // Mark server response received regardless of outcome — prevents stale
        // cache from being treated as authoritative before API responds.
        setWizardAccessConfirmed(true)
      }
      if (!cancelled && response.success && response.data) {
        const freshAccess = response.data
        setWizardAccess(freshAccess)
        localStorage.setItem(wizardAccessCacheKey, JSON.stringify(freshAccess))

        // When the user just returned from "Add to Dashboard", set the queue
        // directly from the server-authoritative selectedWizards so there is no
        // double-count (the seed block below would add on top of what the server
        // already includes for the newly added wizards).
        if (addedCount > 0 && locationState?.addedWizards) {
          queueSeedRef.current = true
          setQueuedCounts((prev) => {
            const next = { ...prev }
            for (const w of freshAccess.selectedWizards) {
              // Use the server quantity as the authoritative count; preserve any
              // count that is already higher (e.g. user had extras queued).
              if ((next[w.title] ?? 0) < (w.quantity ?? 1)) {
                next[w.title] = w.quantity ?? 1
              }
            }
            localStorage.setItem(queueStorageKey, JSON.stringify(next))
            return next
          })
          return
        }

        // Only seed the queue from server data when the user is already on the
        // returning (tabbed) dashboard — not on the first-time landing.
        // On the first-time landing the queue is populated one wizard at a time
        // as the user clicks Start, so auto-seeding all selectedWizards would
        // flood the New tab with every blueprint the account has ever saved.
        if (!queueSeedRef.current && localStorage.getItem('tsl-dashboard-view-mode') === 'returning') {
          queueSeedRef.current = true
          setQueuedCounts((prev) => {
            const next = { ...prev }
            for (const w of freshAccess.selectedWizards) {
              if ((next[w.title] ?? 0) <= 0) {
                next[w.title] = w.quantity ?? 1
              }
            }
            localStorage.setItem(queueStorageKey, JSON.stringify(next))
            return next
          })
        }
      }
    })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationKey])

  useEffect(() => {
    let cancelled = false
    smeApi.quickAccessLinks().then((res) => {
      if (cancelled) return
      setQuickLinksLoading(false)
      if (res.success && res.data) {
        setQuickLinks(res.data as QuickAccessLinks)
      }
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    smeApi.legalLinks().then((res) => {
      if (cancelled) return
      setLegalLinksLoading(false)
      if (res.success && res.data) {
        setLegalLinks(res.data as LegalLinks)
      }
    })
    return () => { cancelled = true }
  }, [])

  // Clean up legacy keys on mount so stale data never triggers side-effects.
  useEffect(() => {
    localStorage.removeItem('tsl-dashboard-payment-complete')
    localStorage.removeItem('tsl-payment-clicked-wizards')
  }, [])

  // ── Fetch live subscription + plan data ───────────────────────────────────
  // Runs once on mount. Fetches both subscription (wizardRuns, teamMembers, planName)
  // and the plans list (storage, features[]) so the plan card is fully dynamic.
  useEffect(() => {
    let cancelled = false
    Promise.all([subscriptionApi.get(), subscriptionApi.plans()]).then(([subRes, plansRes]) => {
      if (cancelled) return
      if (subRes.success && subRes.data) {
        setSubscription(subRes.data)
        if (plansRes.success && plansRes.data) {
          const matched = plansRes.data.find(
            (p) => p.planId.toLowerCase() === subRes.data!.planId.toLowerCase(),
          )
          setCurrentPlan(matched)
        }
      }
    })
    return () => { cancelled = true }
  }, [])

  // ── Sync Dashboard after a billing upgrade ────────────────────────────────
  // When billingSubscription changes planId (Free → paid), propagate it into
  // the local subscription state and flip wizardAccess so the UI gate opens.
  // Only treat the subscription as active when the plan is genuinely paid
  // (not 'free') — otherwise a free-plan record from the server would
  // incorrectly set hasSubscription:true and open wizard modals for users
  // who have not purchased a plan.
  useEffect(() => {
    if (!billingSubscription) return
    setSubscription(billingSubscription)
    if (billingPlans.length > 0) {
      const matched = billingPlans.find(
        (p) => p.planId.toLowerCase() === billingSubscription.planId.toLowerCase(),
      )
      if (matched) setCurrentPlan(matched)
    }
    const isPaidPlan = billingSubscription.planId.toLowerCase() !== 'free'
    if (isPaidPlan) {
      setWizardAccessConfirmed(true)
      setWizardAccess((prev) => {
        const base = prev ?? { hasSubscription: false, plan: '', wizardLimit: 0, selectedWizards: [], remainingWizards: 0 }
        return { ...base, hasSubscription: true, plan: billingSubscription.planId }
      })

      // Only process the modal/view-flip logic when this is a genuine in-place
      // upgrade (plan changed while the component was already mounted), not the
      // initial hydration load on a fresh mount after navigating from Settings.
      const isInPlaceUpgrade = billingPlanSeenRef.current !== null &&
        billingPlanSeenRef.current !== billingSubscription.planId
      if (isInPlaceUpgrade) {
        const clicked = localStorage.getItem('tsl-payment-clicked-wizards')
        const fromDashboardStart = clicked !== null &&
          localStorage.getItem('tsl-dashboard-view-mode') !== 'returning'
        if (clicked) {
          setQueuedCounts((prev) => {
            if ((prev[clicked] ?? 0) > 0) return prev
            const next = { ...prev, [clicked]: 1 }
            localStorage.setItem(queueStorageKey, JSON.stringify(next))
            return next
          })
          localStorage.removeItem('tsl-payment-clicked-wizards')
          if (fromDashboardStart) handleStart(clicked)
        }
        if (fromDashboardStart) {
          setDashboardViewMode('returning')
          localStorage.setItem('tsl-dashboard-view-mode', 'returning')
        } else {
          // Upgrade happened from Dashboard without a specific wizard Start click
          // (e.g. user clicked Upgrade Plan from the plan card). Reset the view-mode
          // flag so any 'initial' written by confirmUpgrade doesn't persist across
          // future Dashboard mounts for an already-subscribed user.
          localStorage.setItem('tsl-dashboard-view-mode', 'returning')
        }
      }
    }
    // Record the current planId so the next change can be detected as in-place.
    billingPlanSeenRef.current = billingSubscription.planId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billingSubscription?.planId])

  const derivedTab: DashboardTab = activeTab
  const downloadFinalBlueprint = async (blueprintId: string, downloadKey: string, filename: string, build: () => Blob | Promise<Blob>) => {
    const chargeKey = `tsl-blueprint-unit-charged:${downloadKey}`
    const blob = await build()
    const alreadyCharged = localStorage.getItem(chargeKey) === 'true'
    const response = await subscriptionApi.consumeBlueprintRun(blueprintId, alreadyCharged)
    if (!response.success || !response.data) {
      const shortage = response.data as { remainingBlueprintUnits?: number; requiredBlueprintUnits?: number; blueprint?: { name: string }; blueprintRunTopUpRate?: number } | undefined
      if (shortage?.remainingBlueprintUnits !== undefined && shortage.requiredBlueprintUnits !== undefined) {
        const bpName = shortage.blueprint?.name ?? 'Blueprint'
        setInsufficientUnits({
          remaining: shortage.remainingBlueprintUnits,
          required: shortage.requiredBlueprintUnits,
          blueprintName: bpName,
          pricePerUnit: shortage.blueprintRunTopUpRate ?? 250,
          iconName: BLUEPRINT_ICON_NAME[bpName] ?? 'Shield',
        })
      } else showNdaToast(response.message || 'Unable to generate the final document.')
      return
    }
    if (!alreadyCharged && response.data.unitsCharged > 0) localStorage.setItem(chargeKey, 'true')
    setSubscription((current) => current ? { ...current, usage: response.data!.usage } : current)
    triggerDownload(blob, filename)
  }
  const showNdaToast = (msg: string) => {
    if (ndaToastTimerRef.current) clearTimeout(ndaToastTimerRef.current)
    setNdaToast(msg)
    ndaToastTimerRef.current = setTimeout(() => setNdaToast(''), 5000)
  }

  const decrementQueue = (title: string) => {
    setQueuedCounts((prev) => {
      const current = prev[title] ?? 0
      if (current <= 0) return prev
      const next = { ...prev, [title]: current - 1 }
      localStorage.setItem(queueStorageKey, JSON.stringify(next))
      return next
    })
  }

  const handleNdaComplete = (data: NdaWizardData) => {
    const completedAt = new Date().toISOString()
    saveProgress(4, data)
    completeWizard()
    pushCompletedInstance('Non-Disclosure Agreement (NDA)', data, completedAt)
    decrementQueue('Non-Disclosure Agreement (NDA)')
    showNdaToast('NDA generated successfully. Your document is ready to download.')
  }

  const handleEmpComplete = (data: EmploymentWizardData) => {
    const completedAt = new Date().toISOString()
    saveEmpProgress(6, data)
    completeEmp()
    pushCompletedInstance('Employment Offer Letter', data, completedAt)
    decrementQueue('Employment Offer Letter')
    showNdaToast('Employment Offer Letter generated successfully. Your document is ready to download.')
  }

  const handlePPComplete = (data: PrivacyPolicyWizardData) => {
    const completedAt = new Date().toISOString()
    savePPProgress(7, data)
    completePP()
    pushCompletedInstance('Privacy & Cookies Policy', data, completedAt)
    decrementQueue('Privacy & Cookies Policy')
    showNdaToast('Privacy Policy generated successfully. Your document is ready to download.')
  }

  const handleFAComplete = (data: FounderAgreementWizardData) => {
    const completedAt = new Date().toISOString()
    saveFAProgress(8, data)
    completeFA()
    pushCompletedInstance('Founder Agreement', data, completedAt)
    decrementQueue('Founder Agreement')
    showNdaToast("Founders' Agreement generated successfully. Your document is ready to download.")
  }

  const handleSAComplete = (data: ServiceAgreementWizardData) => {
    const completedAt = new Date().toISOString()
    saveSAProgress(8, data)
    completeSA()
    pushCompletedInstance('Service Agreement', data, completedAt)
    decrementQueue('Service Agreement')
    showNdaToast('Service Agreement generated successfully. Your document is ready to download.')
  }

  const browseWizards = () => {
    navigate('/dashboard/blueprints')
  }

  const openReturningDashboard = () => {
    // Flip the view-mode state in-place — no navigate() needed.
    // navigate('/dashboard') would remount the component and reset
    // wizardAccessConfirmed to false, causing the landing view to flash
    // before the API call re-confirms the subscription.
    setDashboardViewMode('returning')
    localStorage.setItem('tsl-dashboard-view-mode', 'returning')
  }

  const user = dashboardData?.user
  // Build availableWizards directly from the server-authoritative selectedWizards list
  // so that every saved wizard (including Loan Agreement, Shareholder Resolutions, etc.)
  // always appears — not just the subset present in the static newWizards array.
  const staticWizardMeta = new Map(newWizards.map((w, i) => [w.title, { id: w.id, note: w.note, idx: i }]))
  // availableWizards: one entry per unique blueprint type.
  //   selectedQuantity — authoritative count from the server (used in the landing view)
  //   queuedCount      — runtime New-tab queue (used in the returning/tabbed dashboard)
  // Also include any wizard that was started directly from the predefined landing
  // list (no selectedWizards entry) — those live only in queuedCounts.
  const selectedTitles = new Set((wizardAccess?.selectedWizards ?? []).map((w) => w.title))
  const queueOnlyEntries = Object.keys(queuedCounts)
    .filter((title) => !selectedTitles.has(title) && queuedCounts[title] > 0)
    .map((title, idx) => {
      const meta = staticWizardMeta.get(title)
      return {
        id: meta?.id ?? 200 + idx,
        title,
        note: meta?.note ?? `Access your ${title} wizard`,
        selectedQuantity: 1,
        queuedCount: queuedCounts[title],
      }
    })
  const availableWizards = [
    ...(wizardAccess?.selectedWizards ?? []).map((wizard, idx) => {
      const meta = staticWizardMeta.get(wizard.title)
      return {
        id: meta?.id ?? 100 + idx,
        title: wizard.title,
        note: meta?.note ?? `Access your ${wizard.title} wizard`,
        selectedQuantity: wizard.quantity ?? 1,
        queuedCount: queuedCounts[wizard.title] ?? 0,
      }
    }),
    ...queueOnlyEntries,
  ]
  const paidRunsRemaining = subscription?.usage.runsRemaining ?? user?.runsRemaining ?? 0
  const paidRunsTotal = subscription?.usage.runsTotal ?? user?.runsTotal ?? 0
  const paidRunsUsed = subscription?.usage.runsUsed ?? user?.runsUsed ?? 0
  const hasExhaustedWizardRuns = paidRunsRemaining <= 0
  if (!isPaidDashboard) {
    return (
      <DashboardShell activeSection="Dashboard">
        <header className="user-dashboard__hero user-dashboard__hero--landing">
          <div>
            <h2>Welcome to The Startup Legal! 🎉</h2>
            <p>
              You're all set up with your{' '}
              <strong>
                {isInitialSubscriptionDashboard
                  ? `${wizardAccess?.plan ?? ''} Plan`
                  : wizardAccess?.hasSubscription
                    ? `${wizardAccess.plan ?? ''} Plan`
                    : 'no active subscription'}
              </strong>.{' '}
              {isInitialSubscriptionDashboard
                ? "Let's get your first legal document created."
                : wizardAccess?.hasSubscription
                  ? 'Select your wizards to start creating documents.'
                  : 'Choose a plan and select your wizards to start creating documents.'}
            </p>
            <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
              Browse Blueprints
              <ArrowRight size={18} />
            </button>
          </div>

          <PlanCard
            planName={subscription?.planName ?? capitalizePlan(user?.plan)}
            benefits={subscription ? buildPlanBenefits(subscription, currentPlan) : []}
            variant="landing"
          />
        </header>

        <main className="user-dashboard__landing-content">
          {loading && <p className="user-dashboard__state-text">Loading dashboard data...</p>}
          {error && (
            <p className="user-dashboard__state-text" role="alert">
              {error}
            </p>
          )}

          <section className="user-dashboard__quick-start" aria-label="Quick start resources">
            {quickStartCards.map(({ title, description, action, icon: Icon, urlKey }) => {
              const href = quickLinks?.[urlKey] ?? null
              const isLoading = quickLinksLoading
              const isDisabled = !isLoading && !href
              return (
                <article className="user-dashboard__quick-start-card" key={title}>
                  <span className="user-dashboard__quick-start-icon">
                    <Icon size={24} />
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  {isLoading ? (
                    <button type="button" disabled className="user-dashboard__quick-start-btn--loading">
                      <Loader2 size={14} className="user-dashboard__quick-start-spinner" />
                      Loading…
                    </button>
                  ) : isDisabled ? (
                    <button
                      type="button"
                      disabled
                      title="Coming Soon"
                      className="user-dashboard__quick-start-btn--disabled"
                    >
                      {action}
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <a
                      href={href!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="user-dashboard__quick-start-link"
                    >
                      {action}
                      <ArrowRight size={16} />
                    </a>
                  )}
                </article>
              )
            })}
          </section>

          <div className="user-dashboard__landing-grid">
            <section className="user-dashboard__wizard-review">
              <div className="user-dashboard__review-copy">
                <h2>Review Your Pre-Selected Wizards</h2>
                <p>
                  We've prepared these essential legal documents based on typical startup needs. Adjust quantities
                  or remove items as needed, then execute your wizards to begin.
                </p>
              </div>

              <div className="user-dashboard__wizard-summary">
                <span>
                  <Zap size={28} />
                </span>
                <div>
                  <strong>
                    {isInitialSubscriptionDashboard
                      ? `${availableWizards.reduce((sum, wizard) => sum + wizard.selectedQuantity, 0)} Wizards Available`
                      : wizardAccess?.hasSubscription
                        ? 'Select your wizards'
                        : 'Upgrade required'}
                  </strong>
                  <p>
                    {isInitialSubscriptionDashboard
                      ? 'Your selected wizards are ready to start.'
                      : wizardAccess?.hasSubscription
                        ? 'You have an active plan. Browse wizards to add them to your dashboard.'
                        : 'Your dashboard will show selected wizards with a Start button after successful payment.'}
                  </p>
                </div>
              </div>

              <div className="user-dashboard__landing-wizard-list">
                {newWizards.map((wizard) => {
                  const w = wizard as typeof newWizards[0]
                  const selectedQty = w.wizards
                  const unitCost = w.unitCost ?? 1
                  const costLabel = `${unitCost} ${unitCost === 1 ? 'Credit' : 'Credits'} each`
                  return (
                    <article className="user-dashboard__landing-wizard-card" key={wizard.id}>
                      <div className="user-dashboard__landing-wizard-copy">
                        <h3>
                          <Info size={15} />
                          {wizard.title}
                        </h3>
                        <p>
                          <strong>Note:</strong> {wizard.note}
                        </p>
                      </div>
                      <div className="user-dashboard__landing-wizard-meta">
                        <span>
                          <FileText size={13} />
                          Blueprints
                        </span>
                        <strong>{selectedQty} selected</strong>
                      </div>
                      <div className="user-dashboard__landing-wizard-divider" aria-hidden="true" />
                      <div className="user-dashboard__landing-wizard-meta">
                        <span>
                          <Zap size={13} style={{ color: '#cf9b2f' }} />
                          Unit cost
                        </span>
                        <strong>{costLabel}</strong>
                      </div>
                      <button
                        type="button"
                        className="user-dashboard__new-wizard-button"
                        onClick={
                            wizardAccessConfirmed && wizardAccess?.hasSubscription
                              ? () => handleStart(wizard.title)
                              : () => {
                                localStorage.setItem('tsl-payment-clicked-wizards', wizard.title)
                                void openBillingUpgradePlans()
                              }
                        }
                      >
                        <Play size={16} />
                        Start
                      </button>
                    </article>
                  )
                })}
              </div>
            </section>

            <aside className="user-dashboard__rail">
              <section className="user-dashboard__actions-card">
                <div className="user-dashboard__rail-heading">
                  <span>
                    <Zap size={24} />
                  </span>
                  <h3>Quick Actions</h3>
                </div>
                <button type="button" className="user-dashboard__action user-dashboard__action--primary" onClick={browseWizards}>
                  <Box size={18} />
                  Browse All Wizards
                </button>
                <button type="button" className="user-dashboard__action" onClick={() => navigate('/dashboard/counsel')}>
                  <Scale size={18} />
                  Book Legal Counsel
                </button>
                <button type="button" className="user-dashboard__action" onClick={() => navigate('/dashboard/playbooks')}>
                  <BookOpen size={18} />
                  View Playbooks
                </button>
              </section>

              <section className="user-dashboard__notices-card">
                <div className="user-dashboard__notice-header">
                  <Shield size={20} />
                  <h3>Legal Notices</h3>
                </div>
                <p>Review important policies</p>
                <div>
                  {notices.map(({ label, icon: Icon, urlKey }) => {
                    const href = legalLinks?.[urlKey] ?? null
                    const isLoading = legalLinksLoading
                    const isDisabled = !isLoading && !href
                    if (isLoading) {
                      return (
                        <button
                          type="button"
                          key={label}
                          disabled
                          className="user-dashboard__notice-link user-dashboard__notice-link--loading"
                        >
                          <span><Icon size={18} /></span>
                          {label}
                          <Loader2 size={16} className="user-dashboard__notice-spinner" />
                        </button>
                      )
                    }
                    if (isDisabled) {
                      return (
                        <button
                          type="button"
                          key={label}
                          disabled
                          title="Document coming soon"
                          className="user-dashboard__notice-link user-dashboard__notice-link--disabled"
                        >
                          <span><Icon size={18} /></span>
                          {label}
                          <ChevronRight size={16} />
                        </button>
                      )
                    }
                    return (
                      <a
                        key={label}
                        href={href!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="user-dashboard__notice-link"
                      >
                        <span><Icon size={18} /></span>
                        {label}
                        <ChevronRight size={16} />
                      </a>
                    )
                  })}
                </div>
              </section>
            </aside>
          </div>
        </main>

        {comingSoonTitle && (
          <ComingSoonWizardModal
            title={comingSoonTitle}
            onClose={() => setComingSoonTitle(null)}
          />
        )}

        {/* Landing-view modals: background stays as the landing page while the
            modal is open. Closing (X) lands on New tab so the queued wizard is
            visible. Completing lands on Completed tab. */}
        {isNdaModalOpen && (
          <NdaWizardModal
            onClose={() => { setIsNdaModalOpen(false); setActiveTab('inProgress'); openReturningDashboard() }}
            initialStep={ndaState.status === 'completed' ? 1 : ndaState.step + 1}
            initialData={ndaState.status === 'completed' ? undefined : ndaState.data}
            onStepChange={(step, data) => saveProgress(step, data)}
            onComplete={(data) => { handleNdaComplete(data); setIsNdaModalOpen(false); setActiveTab('completed'); openReturningDashboard() }}
          />
        )}

        {isEmpModalOpen && (
          <EmploymentWizardModal
            onClose={() => { setIsEmpModalOpen(false); setActiveTab('inProgress'); openReturningDashboard() }}
            initialStep={empState.status === 'completed' ? 1 : empState.step + 1}
            initialData={empState.status === 'completed' ? undefined : empState.data}
            onStepChange={(step, data) => saveEmpProgress(step, data)}
            onComplete={(data) => { handleEmpComplete(data); setIsEmpModalOpen(false); setActiveTab('completed'); openReturningDashboard() }}
          />
        )}

        {isPPModalOpen && (
          <PrivacyPolicyWizardModal
            onClose={() => { setIsPPModalOpen(false); setActiveTab('inProgress'); openReturningDashboard() }}
            initialStep={ppState.status === 'completed' ? 1 : ppState.step + 1}
            initialData={ppState.status === 'completed' ? undefined : ppState.data}
            onStepChange={(step, data) => savePPProgress(step, data)}
            onComplete={(data) => { handlePPComplete(data); setIsPPModalOpen(false); setActiveTab('completed'); openReturningDashboard() }}
          />
        )}

        {isFAModalOpen && (
          <FounderAgreementWizardModal
            onClose={() => { setIsFAModalOpen(false); setActiveTab('inProgress'); openReturningDashboard() }}
            initialStep={faState.status === 'completed' ? 1 : faState.step + 1}
            initialData={faState.status === 'completed' ? undefined : faState.data}
            onStepChange={(step, data) => saveFAProgress(step, data)}
            onComplete={(data) => { handleFAComplete(data); setIsFAModalOpen(false); setActiveTab('completed'); openReturningDashboard() }}
          />
        )}

        {isSAModalOpen && (
          <ServiceAgreementWizardModal
            onClose={() => { setIsSAModalOpen(false); setActiveTab('inProgress'); openReturningDashboard() }}
            initialStep={saState.status === 'completed' ? 1 : saState.step + 1}
            initialData={saState.status === 'completed' ? undefined : saState.data}
            onStepChange={(step, data) => saveSAProgress(step, data)}
            onComplete={(data) => { handleSAComplete(data); setIsSAModalOpen(false); setActiveTab('completed'); openReturningDashboard() }}
          />
        )}

        {billingActiveModal === 'upgrade-plans' && (
          <UpgradePlansModal
            currentPlanId="free"
            plans={billingPlans}
            plansLoading={billingPlansLoading}
            plansError={billingPlansError}
            onSelectUpgrade={(plan) => void billingSelectPlan(plan, 'upgrade')}
            onSelectDowngrade={(plan) => void billingSelectPlan(plan, 'downgrade')}
            onClose={billingCloseModal}
          />
        )}

        {billingActiveModal === 'upgrade-confirm' && billingSelectedPlan && (
          <UpgradeConfirmModal
            plan={billingSelectedPlan}
            preview={billingUpgradePreview}
            previewLoading={billingPreviewLoading}
            previewError={billingPreviewError}
            actionLoading={billingActionLoading}
            actionError={upgradePayError ?? billingActionError}
            onConfirm={() => void billingConfirmUpgrade()}
            onCancel={billingCancelUpgradeConfirm}
          />
        )}
      </DashboardShell>
    )
  }

  return (
    <DashboardShell activeSection="Dashboard">
      <header className="user-dashboard__hero user-dashboard__hero--paid">
        <div>
          <h2>Dashboard</h2>
          <p>Track your legal workflows and completed documents across all your business operations.</p>
          <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
            Browse Blueprints
            <ArrowRight size={18} />
          </button>
        </div>

        <PlanCard
          planName={subscription?.planName ?? capitalizePlan(user?.plan)}
          benefits={subscription ? buildPlanBenefits(subscription, currentPlan) : []}
          variant="paid"
        />
      </header>

      <main className="user-dashboard__content">
        {billingUpgradeResult && (
          <div className="tsl-upgrade-success-banner" role="status" aria-live="polite">
            <CheckCircle2 size={16} />
            You're now on the <strong>{billingUpgradeResult.planName} plan</strong> — effective today, {formatDate(billingUpgradeResult.paidAt)}
          </div>
        )}

        {ndaToast && (
          <div className="user-dashboard__nda-toast" role="status" aria-live="polite">
            <CheckCircle2 size={18} />
            {ndaToast}
          </div>
        )}
        {addToast && (
          <div className="user-dashboard__nda-toast user-dashboard__nda-toast--add" role="status" aria-live="polite">
            <CheckCircle2 size={18} />
            {addToast}
          </div>
        )}

        {loading && <p className="user-dashboard__state-text">Loading dashboard data...</p>}
        {error && (
          <p className="user-dashboard__state-text" role="alert">
            {error}
          </p>
        )}

        <section className="user-dashboard__stats-grid" aria-label="Dashboard stats">
          <article className="user-dashboard__stat-card">
            <span className="user-dashboard__stat-icon user-dashboard__stat-icon--gold">
              <Zap size={18} />
            </span>
            <div>
              <div className="user-dashboard__stat-number">
                {paidRunsRemaining} <span>of {paidRunsTotal}</span>
              </div>
              <div className="user-dashboard__stat-label">Credits Remaining</div>
              <div className="user-dashboard__stat-sublabel">This billing period</div>
            </div>
          </article>

          <article className="user-dashboard__stat-card">
            <span className="user-dashboard__stat-icon user-dashboard__stat-icon--dark">
              <Target size={18} />
            </span>
            <div>
              <div className="user-dashboard__stat-number">{paidRunsUsed}</div>
              <div className="user-dashboard__stat-label">Credits Used</div>
              <div className="user-dashboard__stat-sublabel">Since Dec 1, 2025</div>
            </div>
          </article>

          <article className="user-dashboard__stat-card user-dashboard__stat-card--dark">
            <span className="user-dashboard__stat-icon user-dashboard__stat-icon--gold">
              <Calendar size={18} />
            </span>
            <div>
              <div className="user-dashboard__stat-date">Jan 1</div>
              <div className="user-dashboard__stat-year">2026</div>
              <div className="user-dashboard__stat-billing">Next Billing</div>
              <div className="user-dashboard__stat-plan">{subscription?.planName ?? capitalizePlan(user?.plan)} Plan</div>
            </div>
          </article>
        </section>

        <section className="user-dashboard__workflow-panel">
          {/* ── Tab counts ────────────────────────────────────────────── */}
          {(() => {
            const newCount = availableWizards.reduce((sum, w) => sum + w.queuedCount, 0)
            const inProgressCount = inProgressTitles.size
            const completedCount = completedInstances.length
            return (
              <div className="user-dashboard__tabs" role="tablist" aria-label="Dashboard workflow status">
                <button
                  type="button"
                  role="tab"
                  aria-selected={derivedTab === 'new'}
                  className={
                    derivedTab === 'new' ? 'user-dashboard__tab user-dashboard__tab--active' : 'user-dashboard__tab'
                  }
                  onClick={() => setActiveTab('new')}
                >
                  New
                  {newCount > 0 && (
                    <span className="user-dashboard__tab-badge" aria-label={`${newCount} queued`}>
                      {newCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={derivedTab === 'inProgress'}
                  className={
                    derivedTab === 'inProgress' ? 'user-dashboard__tab user-dashboard__tab--active' : 'user-dashboard__tab'
                  }
                  onClick={() => setActiveTab('inProgress')}
                >
                  In Progress
                  {inProgressCount > 0 && (
                    <span className="user-dashboard__tab-badge" aria-label={`${inProgressCount} in progress`}>
                      {inProgressCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={derivedTab === 'completed'}
                  className={
                    derivedTab === 'completed' ? 'user-dashboard__tab user-dashboard__tab--active' : 'user-dashboard__tab'
                  }
                  onClick={() => setActiveTab('completed')}
                >
                  Completed
                  {completedCount > 0 && (
                    <span className="user-dashboard__tab-badge" aria-label={`${completedCount} completed`}>
                      {completedCount}
                    </span>
                  )}
                </button>
              </div>
            )
          })()}

          {derivedTab === 'new' && (
            <div className="user-dashboard__new-list" role="tabpanel">
              {availableWizards.map((wizard) => {
                if (wizard.queuedCount <= 0) return null
                const isRunning = inProgressTitles.has(wizard.title)
                return (
                  <article className="user-dashboard__new-row" key={`${wizard.id}-new`}>
                    <div className="user-dashboard__new-row-left">
                      <span className="user-dashboard__new-row-dot" aria-hidden="true">
                        <Info size={16} />
                      </span>
                      <div>
                        <h3 className="user-dashboard__new-row-title">{wizard.title}</h3>
                        <p className="user-dashboard__new-row-note">
                          <span className="user-dashboard__new-row-note-label">Note:</span>
                          {' '}{wizard.note}
                        </p>
                      </div>
                    </div>
                    <div className="user-dashboard__new-row-right">
                      <div className="user-dashboard__new-row-meta">
                        <span className="user-dashboard__new-row-meta-label">
                          {hasExhaustedWizardRuns ? 'Credits exhausted' : 'Blueprint'}
                        </span>
                        <strong className="user-dashboard__new-row-meta-count">
                          {hasExhaustedWizardRuns
                            ? 'Monthly limit reached'
                            : isRunning
                              ? `${wizard.queuedCount} queued · 1 in progress`
                              : `${wizard.queuedCount} queued`}
                        </strong>
                      </div>
                      {isRunning ? (
                        <button
                          type="button"
                          className="user-dashboard__new-row-btn user-dashboard__new-row-btn--resume"
                          onClick={() => setActiveTab('inProgress')}
                          title="Finish the current run before starting the next"
                        >
                          <ArrowRight size={14} /> Resume
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="user-dashboard__new-row-btn"
                          onClick={() => handleStart(wizard.title)}
                        >
                          <Play size={14} /> Start
                        </button>
                      )}
                    </div>
                  </article>
                )
              })}

              {availableWizards.every((w) => w.queuedCount <= 0) && (
                <div className="user-dashboard__empty-state">
                  <FileText size={32} />
                  <p>All wizards have been started.</p>
                  <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
                    Browse More Wizards <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {derivedTab === 'inProgress' && (
            <div className="user-dashboard__progress-grid" role="tabpanel">
              {ndaState.status === 'inProgress' && (
                <article className="user-dashboard__progress-card">
                  <h3>Non-Disclosure Agreement (NDA)</h3>
                  <span className="user-dashboard__status-badge">In Progress</span>
                  <div className="user-dashboard__progress-row">
                    <span>Progress</span>
                    <strong>{ndaState.progress}%</strong>
                  </div>
                  <div className="user-dashboard__progress-track">
                    <span style={{ width: `${ndaState.progress}%` }} />
                  </div>
                  <div className="user-dashboard__progress-footer">
                    <span>{relativeUpdated(ndaState.startedAt ?? undefined)}</span>
                    <button type="button" onClick={() => { startWizard(); setIsNdaModalOpen(true) }}>
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              )}

              {empState.status === 'inProgress' && (
                <article className="user-dashboard__progress-card">
                  <h3>Employment Offer Letter</h3>
                  <span className="user-dashboard__status-badge">In Progress</span>
                  <div className="user-dashboard__progress-row">
                    <span>Progress</span>
                    <strong>{empState.progress}%</strong>
                  </div>
                  <div className="user-dashboard__progress-track">
                    <span style={{ width: `${empState.progress}%` }} />
                  </div>
                  <div className="user-dashboard__progress-footer">
                    <span>{relativeUpdated(empState.startedAt ?? undefined)}</span>
                    <button type="button" onClick={() => { startEmp(); setIsEmpModalOpen(true) }}>
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              )}

              {ppState.status === 'inProgress' && (
                <article className="user-dashboard__progress-card">
                  <h3>Privacy Policy (POPIA Compliant)</h3>
                  <span className="user-dashboard__status-badge">In Progress</span>
                  <div className="user-dashboard__progress-row">
                    <span>Progress</span>
                    <strong>{ppState.progress}%</strong>
                  </div>
                  <div className="user-dashboard__progress-track">
                    <span style={{ width: `${ppState.progress}%` }} />
                  </div>
                  <div className="user-dashboard__progress-footer">
                    <span>{relativeUpdated(ppState.startedAt ?? undefined)}</span>
                    <button type="button" onClick={() => { startPP(); setIsPPModalOpen(true) }}>
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              )}

              {faState.status === 'inProgress' && (
                <article className="user-dashboard__progress-card">
                  <h3>Founders' Agreement</h3>
                  <span className="user-dashboard__status-badge">In Progress</span>
                  <div className="user-dashboard__progress-row">
                    <span>Progress</span>
                    <strong>{faState.progress}%</strong>
                  </div>
                  <div className="user-dashboard__progress-track">
                    <span style={{ width: `${faState.progress}%` }} />
                  </div>
                  <div className="user-dashboard__progress-footer">
                    <span>{relativeUpdated(faState.startedAt ?? undefined)}</span>
                    <button type="button" onClick={() => { startFA(); setIsFAModalOpen(true) }}>
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              )}

              {saState.status === 'inProgress' && (
                <article className="user-dashboard__progress-card">
                  <h3>Service Agreement</h3>
                  <span className="user-dashboard__status-badge">In Progress</span>
                  <div className="user-dashboard__progress-row">
                    <span>Progress</span>
                    <strong>{saState.progress}%</strong>
                  </div>
                  <div className="user-dashboard__progress-track">
                    <span style={{ width: `${saState.progress}%` }} />
                  </div>
                  <div className="user-dashboard__progress-footer">
                    <span>{relativeUpdated(saState.startedAt ?? undefined)}</span>
                    <button type="button" onClick={() => { startSA(); setIsSAModalOpen(true) }}>
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              )}

              {[ndaState, empState, ppState, faState, saState].every((s) => s.status !== 'inProgress') && (
                <div className="user-dashboard__empty-state">
                  <FileText size={32} />
                  <p>No documents in progress.</p>
                  <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
                    Start a Wizard <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

          {derivedTab === 'completed' && (
            <div className="user-dashboard__completed-list" role="tabpanel">
              {/* Each entry in completedInstances is an independently completed run.
                  Multiple runs of the same blueprint type each appear as a separate card,
                  ordered chronologically (oldest first = original push order). */}
              {completedInstances.map((instance) => {
                const { id, wizardType, completedAt, data } = instance
                const displayDate = completedAt ? formatDate(completedAt) : 'Just now'

                if (wizardType === 'Non-Disclosure Agreement (NDA)') {
                  const ndaData = data as import('./NdaWizardModal').NdaWizardData
                  return (
                    <article className="user-dashboard__completed-card" key={id}>
                      <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Non-Disclosure Agreement (NDA)</h3>
                        <p>Completed {displayDate}</p>
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => void downloadFinalBlueprint('nda', id, 'NDA-Document.pdf', () => buildNdaPdf(ndaData, completedAt))}>
                          <Download size={16} /> Download PDF
                        </button>
                        <button type="button" onClick={() => void downloadFinalBlueprint('nda', id, 'NDA-Document.docx', () => buildNdaDocx(ndaData, completedAt))}>
                          <Download size={16} /> Download DOCX
                        </button>
                        <button type="button" onClick={() => triggerDownload(buildEvidencePack(ndaData, completedAt), 'NDA-Evidence-Pack.txt')}>
                          <FolderOpen size={16} /> Evidence Pack
                        </button>
                      </div>
                    </article>
                  )
                }

                if (wizardType === 'Employment Offer Letter') {
                  const empData = data as import('./EmploymentWizardModal').EmploymentWizardData
                  return (
                    <article className="user-dashboard__completed-card" key={id}>
                      <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Employment Offer Letter</h3>
                        <p>Completed {displayDate}</p>
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => void downloadFinalBlueprint('employment-offer-letter', id, 'Employment-Offer-Letter.pdf', () => buildEmploymentPdf(empData, completedAt))}>
                          <Download size={16} /> Download PDF
                        </button>
                        <button type="button" onClick={() => void downloadFinalBlueprint('employment-offer-letter', id, 'Employment-Offer-Letter.docx', () => buildEmploymentDocx(empData, completedAt))}>
                          <Download size={16} /> Download DOCX
                        </button>
                        <button type="button" onClick={() => void buildEmploymentEvidencePack(empData, completedAt, id).then((pack) => triggerDownload(pack, 'Employment-Evidence-Pack.txt'))}>
                          <FolderOpen size={16} /> Evidence Pack
                        </button>
                      </div>
                    </article>
                  )
                }

                if (wizardType === 'Privacy & Cookies Policy') {
                  const ppData = data as import('./PrivacyPolicyWizardModal').PrivacyPolicyWizardData
                  return (
                    <article className="user-dashboard__completed-card" key={id}>
                      <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Privacy Policy (POPIA Compliant)</h3>
                        <p>Completed {displayDate}</p>
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => void downloadFinalBlueprint('privacy-policy', id, 'Privacy-Policy.pdf', () => buildPrivacyPolicyPdf(ppData, completedAt))}>
                          <Download size={16} /> Download PDF
                        </button>
                        <button type="button" onClick={() => void downloadFinalBlueprint('privacy-policy', id, 'Privacy-Policy.docx', () => buildPrivacyPolicyDocx(ppData, completedAt))}>
                          <Download size={16} /> Download DOCX
                        </button>
                        <button type="button" onClick={() => triggerDownload(buildPrivacyPolicyEvidencePack(ppData, completedAt), 'Privacy-Policy-Evidence-Pack.txt')}>
                          <FolderOpen size={16} /> Evidence Pack
                        </button>
                      </div>
                    </article>
                  )
                }

                if (wizardType === 'Founder Agreement') {
                  const faData = data as import('./FounderAgreementWizardModal').FounderAgreementWizardData
                  return (
                    <article className="user-dashboard__completed-card" key={id}>
                      <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Founders' Agreement</h3>
                        <p>Completed {displayDate}</p>
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => void downloadFinalBlueprint('founder-agreement', id, 'Founders-Agreement.pdf', () => buildFounderAgreementPdf(faData, completedAt))}>
                          <Download size={16} /> Download PDF
                        </button>
                        <button type="button" onClick={() => void downloadFinalBlueprint('founder-agreement', id, 'Founders-Agreement.docx', () => buildFounderAgreementDocx(faData, completedAt))}>
                          <Download size={16} /> Download DOCX
                        </button>
                        <button type="button" onClick={() => triggerDownload(buildFounderAgreementEvidencePack(faData, completedAt), 'Founders-Agreement-Evidence-Pack.txt')}>
                          <FolderOpen size={16} /> Evidence Pack
                        </button>
                      </div>
                    </article>
                  )
                }

                if (wizardType === 'Service Agreement') {
                  const saData = data as import('./ServiceAgreementWizardModal').ServiceAgreementWizardData
                  return (
                    <article className="user-dashboard__completed-card" key={id}>
                      <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Service Agreement</h3>
                        <p>Completed {displayDate}</p>
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => void downloadFinalBlueprint('service-agreement', id, 'Service-Agreement.pdf', () => buildServiceAgreementPdf(saData, completedAt))}>
                          <Download size={16} /> Download PDF
                        </button>
                        <button type="button" onClick={() => void downloadFinalBlueprint('service-agreement', id, 'Service-Agreement.docx', () => buildServiceAgreementDocx(saData, completedAt))}>
                          <Download size={16} /> Download DOCX
                        </button>
                        <button type="button" onClick={() => triggerDownload(buildServiceAgreementEvidencePack(saData, completedAt), 'Service-Agreement-Evidence-Pack.txt')}>
                          <FolderOpen size={16} /> Evidence Pack
                        </button>
                      </div>
                    </article>
                  )
                }

                // Fallback for coming-soon wizard types that were somehow completed
                return (
                  <article className="user-dashboard__completed-card" key={id}>
                    <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                    <div className="user-dashboard__completed-copy">
                      <h3>{wizardType}</h3>
                      <p>Completed {displayDate}</p>
                    </div>
                  </article>
                )
              })}

              {completedInstances.length === 0 && (
                <div className="user-dashboard__empty-state">
                  <CircleCheckBig size={32} />
                  <p>No completed documents yet.</p>
                  <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
                    Start a Wizard <ArrowRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {insufficientUnits && (
        <InsufficientBlueprintUnitsModal
          remaining={insufficientUnits.remaining}
          required={insufficientUnits.required}
          blueprintName={insufficientUnits.blueprintName}
          pricePerUnit={insufficientUnits.pricePerUnit}
          iconName={insufficientUnits.iconName}
          onClose={() => setInsufficientUnits(null)}
          onUpgrade={() => { setInsufficientUnits(null); void openBillingUpgradePlans() }}
        />
      )}

      {isNdaModalOpen && (
        <NdaWizardModal
          onClose={() => setIsNdaModalOpen(false)}
          initialStep={ndaState.status === 'completed' ? 1 : ndaState.step + 1}
          initialData={ndaState.status === 'completed' ? undefined : ndaState.data}
          onStepChange={(step, data) => saveProgress(step, data)}
          onComplete={(data) => { handleNdaComplete(data); setIsNdaModalOpen(false) }}
        />
      )}

      {isEmpModalOpen && (
        <EmploymentWizardModal
          onClose={() => setIsEmpModalOpen(false)}
          initialStep={empState.status === 'completed' ? 1 : empState.step + 1}
          initialData={empState.status === 'completed' ? undefined : empState.data}
          onStepChange={(step, data) => saveEmpProgress(step, data)}
          onComplete={(data) => { handleEmpComplete(data); setIsEmpModalOpen(false) }}
        />
      )}

      {isPPModalOpen && (
        <PrivacyPolicyWizardModal
          onClose={() => setIsPPModalOpen(false)}
          initialStep={ppState.status === 'completed' ? 1 : ppState.step + 1}
          initialData={ppState.status === 'completed' ? undefined : ppState.data}
          onStepChange={(step, data) => savePPProgress(step, data)}
          onComplete={(data) => { handlePPComplete(data); setIsPPModalOpen(false) }}
        />
      )}

      {isFAModalOpen && (
        <FounderAgreementWizardModal
          onClose={() => setIsFAModalOpen(false)}
          initialStep={faState.status === 'completed' ? 1 : faState.step + 1}
          initialData={faState.status === 'completed' ? undefined : faState.data}
          onStepChange={(step, data) => saveFAProgress(step, data)}
          onComplete={(data) => { handleFAComplete(data); setIsFAModalOpen(false) }}
        />
      )}

      {isSAModalOpen && (
        <ServiceAgreementWizardModal
          onClose={() => setIsSAModalOpen(false)}
          initialStep={saState.status === 'completed' ? 1 : saState.step + 1}
          initialData={saState.status === 'completed' ? undefined : saState.data}
          onStepChange={(step, data) => saveSAProgress(step, data)}
          onComplete={(data) => { handleSAComplete(data); setIsSAModalOpen(false) }}
        />
      )}

      {comingSoonTitle && (
        <ComingSoonWizardModal
          title={comingSoonTitle}
          onClose={() => setComingSoonTitle(null)}
        />
      )}
    </DashboardShell>
  )
}
