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
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { capitalizePlan, formatDate } from '../../services/dashboardTypes'
import type { DashboardData, LegalLinks, QuickAccessLinks, SubscriptionData, SubscriptionPlan } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import { paymentApi, smeApi, subscriptionApi } from '../../services/tslApi'
import type { WizardAccess } from '../../services/tslApi'
import { buildNdaDocx, buildEmploymentDocx, buildPrivacyPolicyDocx, buildFounderAgreementDocx, buildServiceAgreementDocx } from '../../services/docxBuilders'
import { useNdaWizard } from '../../hooks/useNdaWizard'
import { useEmploymentWizard } from '../../hooks/useEmploymentWizard'
import { usePrivacyPolicyWizard } from '../../hooks/usePrivacyPolicyWizard'
import { useFounderAgreementWizard } from '../../hooks/useFounderAgreementWizard'
import { useServiceAgreementWizard } from '../../hooks/useServiceAgreementWizard'
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
import UpgradePlanModal from './UpgradePlanModal'
import './Dashboard.css'

type DashboardTab = 'new' | 'inProgress' | 'completed'

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
      '4 Blueprint Units per month',
      '0 Counsel credits per month',
      'Blueprint top-ups at R250 per Unit',
      'Standard support (48-72h response)',
      '1GB document storage',
      'PDF export',
    ]
  }

  if (id === 'operator') {
    return [
      '12 Blueprint Units per month',
      '2 Counsel credits per month',
      'Blueprint top-ups at R250 per Unit',
      'Priority support (24-48h response)',
      'Unlimited document storage',
      'API access for integrations',
    ]
  }

  if (id === 'boardroom') {
    return [
      '30 Blueprint Units per month',
      '6 Counsel credits per month',
      'Blueprint top-ups at R250 per Unit',
      'Dedicated support (SLA)',
      'Unlimited document storage',
      'API access + white-label options',
    ]
  }

  // Fallback: generic list built from API fields
  return [
    `${runs} Blueprint Units per month`,
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
    wizards: 3,
    paidItems: 'Items',
    landingItems: 'Items',
    landingLabel: 'Wizards',
  },
  {
    id: 2,
    title: 'Employment Offer letter',
    note: 'Hiring our first developer next month',
    wizards: 3,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Wizards',
  },
  {
    id: 3,
    title: 'Privacy Policy',
    note: 'Required for our web app launch',
    wizards: 2,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Runs',
  },
  {
    id: 4,
    title: 'Founder Agreement',
    note: 'Setting up co-founder equity split',
    wizards: 2,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Runs Used',
  },
  {
    id: 5,
    title: 'Service Agreement',
    note: 'Multiple client contracts needed',
    wizards: 3,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Runs Used',
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

  const lines: string[] = [
    'NON-DISCLOSURE AGREEMENT',
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. BASICS',
    '─────────────────────────────────────────',
    `NDA Type   : ${data.ndaType || '—'}`,
    `Purpose    : ${data.purpose || '—'}`,
    '',
    '─────────────────────────────────────────',
    '2. PARTIES',
    '─────────────────────────────────────────',
    'Disclosing Party',
    `  Legal Name : ${data.disclosingName || '—'}`,
    `  Reg No.    : ${data.disclosingReg || '—'}`,
    `  Address    : ${data.disclosingAddress || '—'}`,
    '',
    'Receiving Party',
    `  Legal Name : ${data.receivingName || '—'}`,
    `  Reg No.    : ${data.receivingReg || '—'}`,
    `  Address    : ${data.receivingAddress || '—'}`,
    '',
    '─────────────────────────────────────────',
    '3. PURPOSE OF DISCLOSURE',
    '─────────────────────────────────────────',
    data.disclosurePurpose || '—',
    '',
    '─────────────────────────────────────────',
    '4. CONFIDENTIALITY',
    '─────────────────────────────────────────',
    `Duration              : ${data.duration || '—'}`,
    `Trade Secrets Clause  : ${data.tradeSecrets ? 'Yes' : 'No'}`,
    `Permit Employees      : ${data.permitEmployees ? 'Yes' : 'No'}`,
    `Return / Destroy      : ${data.returnDestroy ? 'Yes' : 'No'}`,
    '',
    '─────────────────────────────────────────',
    '5. LEGAL + SIGNING',
    '─────────────────────────────────────────',
    `Governing Law         : ${data.governingLaw || '—'}`,
    `Jurisdiction City     : ${data.jurisdictionCity || '—'}`,
    '',
    'Disclosing Party Signatory',
    `  Name  : ${data.disclosingSignatoryName || '—'}`,
    `  Title : ${data.disclosingSignatoryTitle || '—'}`,
    '',
    'Receiving Party Signatory',
    `  Name  : ${data.receivingSignatoryName || '—'}`,
    `  Title : ${data.receivingSignatoryTitle || '—'}`,
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
    '1. BASICS',
    `   NDA Type         : ${data.ndaType || '—'}`,
    `   Purpose          : ${data.purpose || '—'}`,
    '',
    '2. PARTIES',
    '   Disclosing Party',
    `     Legal Name     : ${data.disclosingName || '—'}`,
    `     Reg No.        : ${data.disclosingReg || '—'}`,
    `     Address        : ${data.disclosingAddress || '—'}`,
    '   Receiving Party',
    `     Legal Name     : ${data.receivingName || '—'}`,
    `     Reg No.        : ${data.receivingReg || '—'}`,
    `     Address        : ${data.receivingAddress || '—'}`,
    '',
    '3. CONTEXT',
    `   Purpose of Disclosure : ${data.disclosurePurpose || '—'}`,
    '',
    '4. CONFIDENTIALITY',
    `   Duration              : ${data.duration || '—'}`,
    `   Trade Secrets Clause  : ${data.tradeSecrets ? 'Yes' : 'No'}`,
    `   Permit Employees      : ${data.permitEmployees ? 'Yes' : 'No'}`,
    `   Return / Destroy      : ${data.returnDestroy ? 'Yes' : 'No'}`,
    '',
    '5. LEGAL + SIGNING',
    `   Governing Law         : ${data.governingLaw || '—'}`,
    `   Jurisdiction City     : ${data.jurisdictionCity || '—'}`,
    '   Disclosing Party Signatory',
    `     Name               : ${data.disclosingSignatoryName || '—'}`,
    `     Title              : ${data.disclosingSignatoryTitle || '—'}`,
    '   Receiving Party Signatory',
    `     Name               : ${data.receivingSignatoryName || '—'}`,
    `     Title              : ${data.receivingSignatoryTitle || '—'}`,
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

function buildEmploymentEvidencePack(d: EmploymentWizardData, completedAt: string | null): Blob {
  const now = new Date()
  const salary = d.salaryAmount ? `R${Number(d.salaryAmount).toLocaleString('en-ZA')} ${d.salaryFrequency}` : '—'
  const lines = [
    'TSL EVIDENCE PACK — EMPLOYMENT OFFER LETTER',
    '============================================',
    `Wizard ID          : tsl-emp-${now.getTime()}`,
    `Template Version   : v1.0`,
    `Document Version   : EMP-2025`,
    `Generated Date     : ${now.toLocaleDateString('en-ZA')}`,
    `Completion Time    : ${completedAt ? new Date(completedAt).toLocaleString('en-ZA') : now.toLocaleString('en-ZA')}`,
    `Platform           : The Startup Legal`,
    '',
    '── WIZARD ANSWERS ──────────────────────────',
    '',
    '1. EMPLOYER',
    `   Company Name     : ${d.companyName || '—'}`,
    `   Reg. Number      : ${d.companyReg || '—'}`,
    `   Address          : ${d.employerAddress || '—'}`,
    `   Contact Person   : ${d.employerContactPerson || '—'}`,
    `   Email            : ${d.employerEmail || '—'}`,
    '',
    '2. EMPLOYEE',
    `   Full Name        : ${d.employeeFullName || '—'}`,
    `   ID / Passport    : ${d.employeeIdNumber || '—'}`,
    `   Address          : ${d.employeeAddress || '—'}`,
    `   Email            : ${d.employeeEmail || '—'}`,
    `   Phone            : ${d.employeePhone || '—'}`,
    '',
    '3. EMPLOYMENT',
    `   Job Title        : ${d.jobTitle || '—'}`,
    `   Department       : ${d.department || '—'}`,
    `   Employment Type  : ${d.employmentType || '—'}`,
    `   Start Date       : ${d.startDate || '—'}`,
    `   Probation        : ${d.probationPeriod || '—'}`,
    `   Working Hours    : ${d.workingHours || '—'}`,
    `   Work Location    : ${d.workLocation || '—'}`,
    '',
    '4. SALARY & BENEFITS',
    `   Salary           : ${salary}`,
    `   Bonuses          : ${d.bonuses || '—'}`,
    `   Leave            : ${d.leaveEntitlement || '—'}`,
    `   Medical          : ${d.medicalBenefits || '—'}`,
    `   Pension          : ${d.pension || '—'}`,
    `   Other Benefits   : ${d.otherBenefits || '—'}`,
    '',
    '5. CONTRACT TERMS',
    `   Notice Period    : ${d.noticePeriod || '—'}`,
    `   Governing Law    : ${d.governingLaw || '—'}`,
    `   Confidentiality  : ${d.confidentialityClause ? 'Yes' : 'No'}`,
    `   IP Clause        : ${d.intellectualPropertyClause ? 'Yes' : 'No'}`,
    `   Non-Compete      : ${d.nonCompeteClause ? 'Yes' : 'No'}`,
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
  const { state: ndaState, startWizard, saveProgress, completeWizard } = useNdaWizard()
  const { state: empState, startWizard: startEmp, saveProgress: saveEmpProgress, completeWizard: completeEmp } = useEmploymentWizard()
  const { state: ppState, startWizard: startPP, saveProgress: savePPProgress, completeWizard: completePP } = usePrivacyPolicyWizard()
  const { state: faState, startWizard: startFA, saveProgress: saveFAProgress, completeWizard: completeFA } = useFounderAgreementWizard()
  const { state: saState, startWizard: startSA, saveProgress: saveSAProgress, completeWizard: completeSA } = useServiceAgreementWizard()
  const [wizardAccess, setWizardAccess] = useState<WizardAccess | null>(() => {
    try { return JSON.parse(localStorage.getItem(wizardAccessCacheKey) ?? 'null') as WizardAccess | null } catch { return null }
  })

  // A wizard may only be started after it has been selected as part of an
  // active subscription. Draft state alone must never grant access.
  const isInitialSubscriptionDashboard = Boolean(
    wizardAccess?.hasSubscription &&
    wizardAccess.selectedWizards.length &&
    localStorage.getItem('tsl-dashboard-view-mode') === 'initial',
  )
  const isPaidDashboard = Boolean(wizardAccess?.hasSubscription && wizardAccess.selectedWizards.length && !isInitialSubscriptionDashboard)
  const defaultTab: DashboardTab =
    ndaState.status === 'completed' || empState.status === 'completed' || ppState.status === 'completed' || faState.status === 'completed' || saState.status === 'completed' ? 'completed' :
    ndaState.status === 'inProgress' || empState.status === 'inProgress' || ppState.status === 'inProgress' || faState.status === 'inProgress' || saState.status === 'inProgress' ? 'inProgress' : 'new'
  const [activeTab, setActiveTab] = useState<DashboardTab>(defaultTab)
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false)
  const [isPPModalOpen, setIsPPModalOpen] = useState(false)
  const [isFAModalOpen, setIsFAModalOpen] = useState(false)
  const [isSAModalOpen, setIsSAModalOpen] = useState(false)
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [ndaToast, setNdaToast] = useState('')
  const [insufficientUnits, setInsufficientUnits] = useState<{ remaining: number; required: number } | null>(null)
  const ndaToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Toast shown after a wizard is added to dashboard without payment
  const addedCount = (location.state as { addedCount?: number } | null)?.addedCount ?? 0
  const [addToast, setAddToast] = useState(() => addedCount > 0
    ? `${addedCount} wizard${addedCount !== 1 ? 's' : ''} added to your dashboard.`
    : ''
  )
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
      if (!cancelled && response.success && response.data) {
        setWizardAccess(response.data)
        localStorage.setItem(wizardAccessCacheKey, JSON.stringify(response.data))
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

  // Clean up the old legacy key so it never interferes again
  useEffect(() => {
    localStorage.removeItem('tsl-dashboard-payment-complete')
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

  // Derive active tab from wizard states — computed on every render, no effect needed
  // Auto-advance to inProgress/completed only if the user hasn't manually selected a tab yet;
  // otherwise honour their explicit choice so clicking "New" tab always works.
  const derivedTab: DashboardTab = (() => {
    const hasCompleted = ndaState.status === 'completed' || empState.status === 'completed' || ppState.status === 'completed' || faState.status === 'completed' || saState.status === 'completed'
    const hasInProgress = ndaState.status === 'inProgress' || empState.status === 'inProgress' || ppState.status === 'inProgress' || faState.status === 'inProgress' || saState.status === 'inProgress'
    // If user has explicitly chosen a tab, honour it (unless the content for it no longer exists)
    if (activeTab === 'completed' && hasCompleted) return 'completed'
    if (activeTab === 'inProgress' && hasInProgress) return 'inProgress'
    if (activeTab === 'new') return 'new'
    // Auto-select: prefer inProgress > completed > new
    if (hasInProgress) return 'inProgress'
    if (hasCompleted) return 'completed'
    return 'new'
  })()

  const downloadFinalBlueprint = async (blueprintId: string, downloadKey: string, filename: string, build: () => Blob | Promise<Blob>) => {
    const chargeKey = `tsl-blueprint-unit-charged:${downloadKey}`
    const blob = await build()
    const alreadyCharged = localStorage.getItem(chargeKey) === 'true'
    const response = await subscriptionApi.consumeBlueprintRun(blueprintId, alreadyCharged)
    if (!response.success || !response.data) {
      const shortage = response.data as { remainingBlueprintUnits?: number; requiredBlueprintUnits?: number } | undefined
      if (shortage?.remainingBlueprintUnits !== undefined && shortage.requiredBlueprintUnits !== undefined) {
        setInsufficientUnits({ remaining: shortage.remainingBlueprintUnits, required: shortage.requiredBlueprintUnits })
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

  const handleNdaComplete = (data: NdaWizardData) => {
    saveProgress(6, data)
    completeWizard()
    showNdaToast('NDA generated successfully. Your document is ready to download.')
  }

  const handleEmpComplete = (data: EmploymentWizardData) => {
    saveEmpProgress(6, data)
    completeEmp()
    showNdaToast('Employment Offer Letter generated successfully. Your document is ready to download.')
  }

  const handlePPComplete = (data: PrivacyPolicyWizardData) => {
    savePPProgress(7, data)
    completePP()
    showNdaToast('Privacy Policy generated successfully. Your document is ready to download.')
  }

  const handleFAComplete = (data: FounderAgreementWizardData) => {
    saveFAProgress(8, data)
    completeFA()
    showNdaToast("Founders' Agreement generated successfully. Your document is ready to download.")
  }

  const handleSAComplete = (data: ServiceAgreementWizardData) => {
    saveSAProgress(8, data)
    completeSA()
    showNdaToast('Service Agreement generated successfully. Your document is ready to download.')
  }

  const browseWizards = () => {
    navigate('/dashboard/wizards')
  }

  const buyBlueprintRunUnits = async (units: number) => {
    const response = await subscriptionApi.topUpBlueprintRuns(units)
    if (!response.success || !response.data) {
      showNdaToast(response.message || 'Unable to add Blueprint Credits. Please try again.')
      return
    }
    setSubscription((current) => current ? { ...current, usage: response.data!.usage } : current)
    showNdaToast(`${units} Blueprint Credit${units === 1 ? '' : 's'} added for R${(units * 250).toLocaleString()}.`)
  }
  const openReturningDashboard = () => {
    // Keep the established tabbed dashboard flow as the place where a wizard
    // is started, resumed, and completed.
    localStorage.setItem('tsl-dashboard-view-mode', 'returning')
    navigate('/dashboard')
  }

  const user = dashboardData?.user
  // Build availableWizards directly from the server-authoritative selectedWizards list
  // so that every saved wizard (including Loan Agreement, Shareholder Resolutions, etc.)
  // always appears — not just the subset present in the static newWizards array.
  const staticWizardMeta = new Map(newWizards.map((w, i) => [w.title, { id: w.id, note: w.note, idx: i }]))
  const availableWizards = (wizardAccess?.selectedWizards ?? []).map((wizard, idx) => {
    const meta = staticWizardMeta.get(wizard.title)
    return {
      id: meta?.id ?? 100 + idx,

      title: wizard.title,
      note: meta?.note ?? `Access your ${wizard.title} wizard`,
      selectedQuantity: wizard.quantity ?? 1,
    }
  })
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
              <strong>{isInitialSubscriptionDashboard ? `${wizardAccess?.plan ?? ''} Plan` : 'no active subscription'}</strong>.{' '}
              {isInitialSubscriptionDashboard
                ? "Let's get your first legal document created."
                : 'Choose a plan and select your wizards to start creating documents.'}
            </p>
            <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
              Browse Wizards
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
                  <strong>{isInitialSubscriptionDashboard ? `${availableWizards.length} Wizards Available` : 'Upgrade required'}</strong>
                  <p>{isInitialSubscriptionDashboard
                    ? 'Your selected wizards are ready to start.'
                    : 'Your dashboard will show selected wizards with a Start button after successful payment.'}</p>
                </div>
              </div>

              <div className="user-dashboard__landing-wizard-list">
                {(isInitialSubscriptionDashboard ? availableWizards : newWizards).map((wizard) => (
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
                      <span>Wizards</span>
                      <strong>
                        {isInitialSubscriptionDashboard
                          ? `${(wizard as typeof availableWizards[0]).selectedQuantity ?? 1} Item`
                          : `${(wizard as typeof newWizards[0]).wizards} ${(wizard as typeof newWizards[0]).landingItems}`}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="user-dashboard__new-wizard-button"
                      onClick={isInitialSubscriptionDashboard ? () => {
                        if (wizard.title === 'Non-Disclosure Agreement (NDA)') { startWizard(); setIsNdaModalOpen(true) }
                        else if (wizard.title === 'Employment Offer letter') { startEmp(); setIsEmpModalOpen(true) }
                        else if (wizard.title === 'Privacy Policy') { startPP(); setIsPPModalOpen(true) }
                        else if (wizard.title === 'Founder Agreement') { startFA(); setIsFAModalOpen(true) }
                        else if (wizard.title === 'Service Agreement') { startSA(); setIsSAModalOpen(true) }
                        else { setComingSoonTitle(wizard.title) }
                      } : () => setShowUpgradeModal(true)}
                    >
                      <Play size={16} />
                      Start
                    </button>
                  </article>
                ))}
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

        {/* Initial-view modals: onClose transitions to the tabbed (returning) dashboard
            so the user lands on In Progress if they left mid-way */}
        {isNdaModalOpen && (
          <NdaWizardModal
            onClose={() => { setIsNdaModalOpen(false); openReturningDashboard() }}
            initialStep={ndaState.status === 'completed' ? 1 : ndaState.step + 1}
            initialData={ndaState.status === 'completed' ? undefined : ndaState.data}
            onStepChange={(step, data) => saveProgress(step, data)}
            onComplete={(data) => { handleNdaComplete(data); setIsNdaModalOpen(false); openReturningDashboard() }}
          />
        )}

        {isEmpModalOpen && (
          <EmploymentWizardModal
            onClose={() => { setIsEmpModalOpen(false); openReturningDashboard() }}
            initialStep={empState.status === 'completed' ? 1 : empState.step + 1}
            initialData={empState.status === 'completed' ? undefined : empState.data}
            onStepChange={(step, data) => saveEmpProgress(step, data)}
            onComplete={(data) => { handleEmpComplete(data); setIsEmpModalOpen(false); openReturningDashboard() }}
          />
        )}

        {isPPModalOpen && (
          <PrivacyPolicyWizardModal
            onClose={() => { setIsPPModalOpen(false); openReturningDashboard() }}
            initialStep={ppState.status === 'completed' ? 1 : ppState.step + 1}
            initialData={ppState.status === 'completed' ? undefined : ppState.data}
            onStepChange={(step, data) => savePPProgress(step, data)}
            onComplete={(data) => { handlePPComplete(data); setIsPPModalOpen(false); openReturningDashboard() }}
          />
        )}

        {isFAModalOpen && (
          <FounderAgreementWizardModal
            onClose={() => { setIsFAModalOpen(false); openReturningDashboard() }}
            initialStep={faState.status === 'completed' ? 1 : faState.step + 1}
            initialData={faState.status === 'completed' ? undefined : faState.data}
            onStepChange={(step, data) => saveFAProgress(step, data)}
            onComplete={(data) => { handleFAComplete(data); setIsFAModalOpen(false); openReturningDashboard() }}
          />
        )}

        {isSAModalOpen && (
          <ServiceAgreementWizardModal
            onClose={() => { setIsSAModalOpen(false); openReturningDashboard() }}
            initialStep={saState.status === 'completed' ? 1 : saState.step + 1}
            initialData={saState.status === 'completed' ? undefined : saState.data}
            onStepChange={(step, data) => saveSAProgress(step, data)}
            onComplete={(data) => { handleSAComplete(data); setIsSAModalOpen(false); openReturningDashboard() }}
          />
        )}

        {showUpgradeModal && (
          <UpgradePlanModal
            onClose={() => setShowUpgradeModal(false)}
            onUpgrade={() => { setShowUpgradeModal(false); browseWizards() }}
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
            Browse Wizards
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
            </button>
          </div>

          {derivedTab === 'new' && (
            <div className="user-dashboard__new-list" role="tabpanel">
              {availableWizards.map((wizard) => {
                const wizardStatus =
                  wizard.title === 'Non-Disclosure Agreement (NDA)' ? ndaState.status :
                  wizard.title === 'Employment Offer letter' ? empState.status :
                  wizard.title === 'Privacy Policy' ? ppState.status :
                  wizard.title === 'Founder Agreement' ? faState.status :
                  wizard.title === 'Service Agreement' ? saState.status :
                  'idle' // Loan Agreement, Shareholder Resolutions, etc. have no in-progress state
                if (wizardStatus !== 'idle') return null
                return (
                  <article className="user-dashboard__new-row" key={wizard.id}>
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
                            : `${wizard.selectedQuantity} selected`}
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="user-dashboard__new-row-btn"
                        onClick={() => {
                          if (wizard.title === 'Non-Disclosure Agreement (NDA)') {
                            startWizard(); setIsNdaModalOpen(true)
                          } else if (wizard.title === 'Employment Offer letter') {
                            startEmp(); setIsEmpModalOpen(true)
                          } else if (wizard.title === 'Privacy Policy') {
                            startPP(); setIsPPModalOpen(true)
                          } else if (wizard.title === 'Founder Agreement') {
                            startFA(); setIsFAModalOpen(true)
                          } else if (wizard.title === 'Service Agreement') {
                            startSA(); setIsSAModalOpen(true)
                          } else {
                            setComingSoonTitle(wizard.title)
                          }
                        }}
                      >
                        <><Play size={14} /> Start</>
                      </button>
                    </div>
                  </article>
                )
              })}

              {availableWizards.length > 0 && availableWizards.every((wizard) => {
                const s =
                  wizard.title === 'Non-Disclosure Agreement (NDA)' ? ndaState.status :
                  wizard.title === 'Employment Offer letter' ? empState.status :
                  wizard.title === 'Privacy Policy' ? ppState.status :
                  wizard.title === 'Founder Agreement' ? faState.status :
                  wizard.title === 'Service Agreement' ? saState.status :
                  'idle'
                return s !== 'idle'
              }) && (
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

              {ndaState.status !== 'inProgress' && empState.status !== 'inProgress' && ppState.status !== 'inProgress' && faState.status !== 'inProgress' && saState.status !== 'inProgress' && (
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
              {ndaState.status === 'completed' && (
                <article className="user-dashboard__completed-card">
                  <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                  <div className="user-dashboard__completed-copy">
                    <h3>Non-Disclosure Agreement (NDA)</h3>
                    <p>Completed {ndaState.completedAt ? formatDate(ndaState.completedAt) : 'Just now'}</p>
                  </div>
                  <div className="user-dashboard__completed-actions">
                    <button type="button" onClick={() => void downloadFinalBlueprint('nda', `nda:${ndaState.completedAt}`, 'NDA-Document.pdf', () => buildNdaPdf(ndaState.data, ndaState.completedAt))}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => void downloadFinalBlueprint('nda', `nda:${ndaState.completedAt}`, 'NDA-Document.docx', () => buildNdaDocx(ndaState.data, ndaState.completedAt))}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildEvidencePack(ndaState.data, ndaState.completedAt), 'NDA-Evidence-Pack.txt')}>
                      <FolderOpen size={16} /> Evidence Pack
                    </button>
                  </div>
                </article>
              )}

              {empState.status === 'completed' && (
                <article className="user-dashboard__completed-card">
                  <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                  <div className="user-dashboard__completed-copy">
                    <h3>Employment Offer Letter</h3>
                    <p>Completed {empState.completedAt ? formatDate(empState.completedAt) : 'Just now'}</p>
                  </div>
                  <div className="user-dashboard__completed-actions">
                    <button type="button" onClick={() => void downloadFinalBlueprint('employment-offer-letter', `employment:${empState.completedAt}`, 'Employment-Offer-Letter.pdf', () => buildEmploymentPdf(empState.data, empState.completedAt))}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => void downloadFinalBlueprint('employment-offer-letter', `employment:${empState.completedAt}`, 'Employment-Offer-Letter.docx', () => buildEmploymentDocx(empState.data, empState.completedAt))}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildEmploymentEvidencePack(empState.data, empState.completedAt), 'Employment-Evidence-Pack.txt')}>
                      <FolderOpen size={16} /> Evidence Pack
                    </button>
                  </div>
                </article>
              )}

              {ppState.status === 'completed' && (
                <article className="user-dashboard__completed-card">
                  <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                  <div className="user-dashboard__completed-copy">
                    <h3>Privacy Policy (POPIA Compliant)</h3>
                    <p>Completed {ppState.completedAt ? formatDate(ppState.completedAt) : 'Just now'}</p>
                  </div>
                  <div className="user-dashboard__completed-actions">
                    <button type="button" onClick={() => void downloadFinalBlueprint('privacy-policy', `privacy-policy:${ppState.completedAt}`, 'Privacy-Policy.pdf', () => buildPrivacyPolicyPdf(ppState.data, ppState.completedAt))}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => void downloadFinalBlueprint('privacy-policy', `privacy-policy:${ppState.completedAt}`, 'Privacy-Policy.docx', () => buildPrivacyPolicyDocx(ppState.data, ppState.completedAt))}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildPrivacyPolicyEvidencePack(ppState.data, ppState.completedAt), 'Privacy-Policy-Evidence-Pack.txt')}>
                      <FolderOpen size={16} /> Evidence Pack
                    </button>
                  </div>
                </article>
              )}

              {faState.status === 'completed' && (
                <article className="user-dashboard__completed-card">
                  <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                  <div className="user-dashboard__completed-copy">
                    <h3>Founders' Agreement</h3>
                    <p>Completed {faState.completedAt ? formatDate(faState.completedAt) : 'Just now'}</p>
                  </div>
                  <div className="user-dashboard__completed-actions">
                    <button type="button" onClick={() => void downloadFinalBlueprint('founder-agreement', `founder-agreement:${faState.completedAt}`, 'Founders-Agreement.pdf', () => buildFounderAgreementPdf(faState.data, faState.completedAt))}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => void downloadFinalBlueprint('founder-agreement', `founder-agreement:${faState.completedAt}`, 'Founders-Agreement.docx', () => buildFounderAgreementDocx(faState.data, faState.completedAt))}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildFounderAgreementEvidencePack(faState.data, faState.completedAt), 'Founders-Agreement-Evidence-Pack.txt')}>
                      <FolderOpen size={16} /> Evidence Pack
                    </button>
                  </div>
                </article>
              )}

              {saState.status === 'completed' && (
                <article className="user-dashboard__completed-card">
                  <span className="user-dashboard__completed-icon"><CircleCheckBig size={28} /></span>
                  <div className="user-dashboard__completed-copy">
                    <h3>Service Agreement</h3>
                    <p>Completed {saState.completedAt ? formatDate(saState.completedAt) : 'Just now'}</p>
                  </div>
                  <div className="user-dashboard__completed-actions">
                    <button type="button" onClick={() => void downloadFinalBlueprint('service-agreement', `service-agreement:${saState.completedAt}`, 'Service-Agreement.pdf', () => buildServiceAgreementPdf(saState.data, saState.completedAt))}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => void downloadFinalBlueprint('service-agreement', `service-agreement:${saState.completedAt}`, 'Service-Agreement.docx', () => buildServiceAgreementDocx(saState.data, saState.completedAt))}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildServiceAgreementEvidencePack(saState.data, saState.completedAt), 'Service-Agreement-Evidence-Pack.txt')}>
                      <FolderOpen size={16} /> Evidence Pack
                    </button>
                  </div>
                </article>
              )}

              {ndaState.status !== 'completed' && empState.status !== 'completed' && ppState.status !== 'completed' && faState.status !== 'completed' && saState.status !== 'completed' && (
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
          onClose={() => setInsufficientUnits(null)}
          onTopUp={(units) => { setInsufficientUnits(null); void buyBlueprintRunUnits(units) }}
          onUpgrade={() => { setInsufficientUnits(null); setShowUpgradeModal(true) }}
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
