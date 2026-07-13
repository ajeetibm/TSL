import {
  ArrowRight,
  BookOpen,
  Box,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleCheckBig,
  Download,
  FileText,
  Folder,
  Gauge,
  Info,
  Loader2,
  Play,
  Scale,
  Shield,
  Target,
  Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { formatDate } from '../../services/dashboardTypes'
import type { DashboardData, LegalLinks, QuickAccessLinks } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import { smeApi } from '../../services/tslApi'
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
import type { ServiceAgreementWizardData } from './ServiceAgreementWizardModal'
import './Dashboard.css'

type DashboardTab = 'new' | 'inProgress' | 'completed'

const landingPlanBenefits = [
  '12 wizard runs per month',
  'Access to all legal wizards',
  'Priority support',
  'Legal counsel credits',
]

const paidPlanBenefits = [
  '12 wizard runs per month',
  'Access to all legal wizards',
  'Priority support',
  'Legal counsel credits',
]

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
    icon: Gauge,
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
  { label: 'Legal Advice Disclaimer',  icon: Gauge,    urlKey: 'legalDisclaimerUrl' as keyof LegalLinks },
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
 * Build an RTF document containing NDA text.
 * RTF opens natively in Word, LibreOffice Writer, Pages, and WordPad.
 */
function buildNdaRtf(data: import('./NdaWizardModal').NdaWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')

  const esc = (s: string) =>
    s.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')

  const h1 = (text: string) => `{\\pard\\sb240\\sa120\\b\\fs28 ${esc(text)}\\par}\n`
  const h2 = (text: string) => `{\\pard\\sb200\\sa80\\b\\fs22 ${esc(text)}\\par}\n`
  const row = (label: string, value: string) =>
    `{\\pard\\li200\\fs20 {\\b ${esc(label)}:} ${esc(value || '—')}\\par}\n`
  const body = (text: string) => `{\\pard\\fi0\\fs20 ${esc(text)}\\par}\n`
  const sep = () => `{\\pard\\sb60\\sa60\\fs16 ${esc('─'.repeat(50))}\\par}\n`

  const content = [
    h1('NON-DISCLOSURE AGREEMENT'),
    row('Date', date),
    row('Generated by', 'The Startup Legal'),
    sep(),
    h2('1. Basics'),
    row('NDA Type', data.ndaType),
    row('Purpose', data.purpose),
    sep(),
    h2('2. Parties'),
    h2('Disclosing Party'),
    row('Legal Name', data.disclosingName),
    row('Registration No.', data.disclosingReg),
    row('Address', data.disclosingAddress),
    h2('Receiving Party'),
    row('Legal Name', data.receivingName),
    row('Registration No.', data.receivingReg),
    row('Address', data.receivingAddress),
    sep(),
    h2('3. Purpose of Disclosure'),
    body(data.disclosurePurpose),
    sep(),
    h2('4. Confidentiality'),
    row('Duration', data.duration),
    row('Trade Secrets Clause', data.tradeSecrets ? 'Yes' : 'No'),
    row('Permit Employees / Advisors', data.permitEmployees ? 'Yes' : 'No'),
    row('Return / Destroy on Request', data.returnDestroy ? 'Yes' : 'No'),
    sep(),
    h2('5. Legal + Signing'),
    row('Governing Law', data.governingLaw),
    row('Jurisdiction City', data.jurisdictionCity),
    h2('Disclosing Party Signatory'),
    row('Name', data.disclosingSignatoryName),
    row('Title', data.disclosingSignatoryTitle),
    h2('Receiving Party Signatory'),
    row('Name', data.receivingSignatoryName),
    row('Title', data.receivingSignatoryTitle),
    sep(),
    body('DISCLAIMER: This document is generated for reference purposes only.'),
    body('It does not constitute legal advice. Consult a qualified attorney.'),
  ].join('')

  const rtf = `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n${content}}`
  return new Blob([rtf], { type: 'application/rtf' })
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

function buildEmploymentRtf(d: EmploymentWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const salary = d.salaryAmount ? `R${Number(d.salaryAmount).toLocaleString('en-ZA')} ${d.salaryFrequency}` : '—'
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
  const h1 = (t: string) => `{\\pard\\sb240\\sa120\\b\\fs28 ${esc(t)}\\par}\n`
  const h2 = (t: string) => `{\\pard\\sb200\\sa80\\b\\fs22 ${esc(t)}\\par}\n`
  const row = (label: string, value: string) => `{\\pard\\li200\\fs20 {\\b ${esc(label)}:} ${esc(value || '—')}\\par}\n`
  const sep = () => `{\\pard\\sb60\\sa60\\fs16 ${esc('─'.repeat(50))}\\par}\n`
  const content = [
    h1('EMPLOYMENT OFFER LETTER'),
    row('Date', date), row('Generated by', 'The Startup Legal'), sep(),
    h2('1. Employer Details'),
    row('Company Name', d.companyName), row('Registration No.', d.companyReg),
    row('Address', d.employerAddress), row('Contact Person', d.employerContactPerson), row('Email', d.employerEmail), sep(),
    h2('2. Employee Details'),
    row('Full Name', d.employeeFullName), row('ID / Passport', d.employeeIdNumber),
    row('Address', d.employeeAddress), row('Email', d.employeeEmail), row('Phone', d.employeePhone), sep(),
    h2('3. Employment Information'),
    row('Job Title', d.jobTitle), row('Department', d.department), row('Employment Type', d.employmentType),
    row('Start Date', d.startDate), row('Probation Period', d.probationPeriod),
    row('Working Hours', d.workingHours), row('Work Location', d.workLocation), sep(),
    h2('4. Salary & Benefits'),
    row('Salary', salary), row('Bonuses', d.bonuses), row('Leave Entitlement', d.leaveEntitlement),
    row('Medical Benefits', d.medicalBenefits), row('Pension', d.pension), row('Other Benefits', d.otherBenefits), sep(),
    h2('5. Contract Terms'),
    row('Notice Period', d.noticePeriod), row('Governing Law', d.governingLaw),
    row('Confidentiality Clause', d.confidentialityClause ? 'Yes' : 'No'),
    row('Intellectual Property Clause', d.intellectualPropertyClause ? 'Yes' : 'No'),
    row('Non-Compete Clause', d.nonCompeteClause ? 'Yes' : 'No'), sep(),
    `{\\pard\\fs18 DISCLAIMER: For reference purposes only. Not legal advice.\\par}\n`,
  ].join('')
  return new Blob([`{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n${content}}`], { type: 'application/rtf' })
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

function buildPrivacyPolicyRtf(d: PrivacyPolicyWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const yn = (v: boolean) => (v ? 'Yes' : 'No')
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
  const h1 = (t: string) => `{\\pard\\sb240\\sa120\\b\\fs28 ${esc(t)}\\par}\n`
  const h2 = (t: string) => `{\\pard\\sb200\\sa80\\b\\fs22 ${esc(t)}\\par}\n`
  const row = (label: string, value: string) => `{\\pard\\li200\\fs20 {\\b ${esc(label)}:} ${esc(value || '—')}\\par}\n`
  const sep = () => `{\\pard\\sb60\\sa60\\fs16 ${esc('─'.repeat(50))}\\par}\n`
  const content = [
    h1('PRIVACY POLICY (POPIA COMPLIANT)'),
    row('Date', date), row('Generated by', 'The Startup Legal'), sep(),
    h2('1. Business Information'),
    row('Company Name', d.companyName), row('Website', d.website),
    row('Business Email', d.businessEmail), row('Contact Number', d.contactNumber),
    row('Physical Address', d.physicalAddress), sep(),
    h2('2. Information Collected'),
    row('Personal Information', yn(d.collectsPersonalInfo)), row('Contact Details', yn(d.collectsContactDetails)),
    row('Payment Information', yn(d.collectsPaymentInfo)), row('Technical Information', yn(d.collectsTechnicalInfo)),
    row('Cookies', yn(d.collectsCookies)), sep(),
    h2('3. Purpose of Collection'),
    row('Service Delivery', yn(d.purposeServiceDelivery)), row('Marketing', yn(d.purposeMarketing)),
    row('Analytics', yn(d.purposeAnalytics)), row('Customer Support', yn(d.purposeCustomerSupport)),
    row('Legal Compliance', yn(d.purposeLegalCompliance)), sep(),
    h2('4. Data Sharing'),
    row('Third-party Providers', yn(d.sharesThirdPartyProviders)), row('Payment Gateways', yn(d.sharesPaymentGateways)),
    row('Marketing Platforms', yn(d.sharesMarketingPlatforms)), row('Government Authorities', yn(d.sharesGovernmentAuthorities)), sep(),
    h2('5. User Rights'),
    row('Right to Access', yn(d.rightAccess)), row('Right to Correction', yn(d.rightCorrection)),
    row('Right to Deletion', yn(d.rightDeletion)), row('Right to Object', yn(d.rightObjection)),
    row('Right to Data Portability', yn(d.rightDataPortability)), sep(),
    h2('6. Security & Retention'),
    row('Data Storage', d.dataStorage), row('Retention Period', d.retentionPeriod),
    row('Security Measures', d.securityMeasures), sep(),
    `{\\pard\\fs18 DISCLAIMER: For reference purposes only. Not legal advice.\\par}\n`,
  ].join('')
  return new Blob([`{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n${content}}`], { type: 'application/rtf' })
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

function buildFounderAgreementRtf(d: FounderAgreementWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
  const h1 = (t: string) => `{\\pard\\sb240\\sa120\\b\\fs28 ${esc(t)}\\par}\n`
  const h2 = (t: string) => `{\\pard\\sb200\\sa80\\b\\fs22 ${esc(t)}\\par}\n`
  const row = (label: string, value: string) => `{\\pard\\li200\\fs20 {\\b ${esc(label)}:} ${esc(value || '—')}\\par}\n`
  const sep = () => `{\\pard\\sb60\\sa60\\fs16 ${esc('─'.repeat(50))}\\par}\n`
  const founderBlock = d.founders.map((f, i) =>
    [h2(`Founder ${i + 1}`), row('Name', f.name), row('Email', f.email), row('Role', f.role), row('Equity', f.equity ? `${f.equity}%` : '')].join(''),
  ).join('')
  const sigBlock = d.signatories.map((s, i) => row(`Signatory ${i + 1}`, `${s.name} (${s.title})`)).join('')
  const content = [
    h1("FOUNDERS' AGREEMENT & IP ASSIGNMENT"),
    row('Date', date), row('Generated by', 'The Startup Legal'), sep(),
    h2('1. Company Information'),
    row('Incorporated', d.isIncorporated), row('Company Name', d.companyName),
    row('Registration No.', d.registrationNumber), row('Registered Address', d.registeredAddress), sep(),
    h2('2. Founders'), founderBlock, sep(),
    h2('3. Governance & Decision Making'),
    row('Decision Model', d.decisionMakingModel),
    row('Reserved Matters', d.reservedMatters.filter(r => r.trim()).join('; ')),
    row('Board Approval', d.boardApprovalRequirements),
    row('Founder Responsibilities', d.founderResponsibilities), sep(),
    h2('4. Vesting & Share Rules'),
    row('Vesting Enabled', d.vestingEnabled),
    ...(d.vestingEnabled === 'Yes' ? [row('Cliff Period', d.cliffPeriod), row('Vesting Period', d.vestingPeriod)] : []),
    row('Share Transfer Restrictions', d.shareTransferRestrictions),
    row('Buy-back Rights', d.buybackRights), row('Exit Rules', d.founderExitRules), sep(),
    h2('5. Intellectual Property'),
    row('Assign IP to Company', d.assignIpToCompany), row('Existing IP', d.hasExistingIp),
    ...(d.hasExistingIp === 'Yes' ? [row('IP Description', d.existingIpDescription), row('IP Assignment', d.existingIpAssignment)] : []), sep(),
    h2('6. Legal & Signing'),
    row('Confidentiality', d.confidentiality), row('Dispute Resolution', d.disputeResolution),
    row('Governing Law', d.governingLaw), row('Jurisdiction', d.jurisdiction),
    sigBlock, sep(),
    `{\\pard\\fs18 DISCLAIMER: For reference purposes only. Not legal advice.\\par}\n`,
  ].join('')
  return new Blob([`{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n${content}}`], { type: 'application/rtf' })
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

function buildServiceAgreementRtf(d: ServiceAgreementWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
  const h1 = (t: string) => `{\\pard\\sb240\\sa120\\b\\fs28 ${esc(t)}\\par}\n`
  const h2 = (t: string) => `{\\pard\\sb200\\sa80\\b\\fs22 ${esc(t)}\\par}\n`
  const row = (label: string, value: string) => `{\\pard\\li200\\fs20 {\\b ${esc(label)}:} ${esc(value || '—')}\\par}\n`
  const sep = () => `{\\pard\\sb60\\sa60\\fs16 ${esc('─'.repeat(50))}\\par}\n`
  const content = [
    h1('SERVICE AGREEMENT'),
    row('Date', date), row('Generated by', 'The Startup Legal'), sep(),
    h2('1. Parties'),
    h2('Service Provider'),
    row('Legal Name', d.providerName), row('Registration No.', d.providerReg), row('Address', d.providerAddress),
    h2('Client'),
    row('Legal Name', d.clientName), row('Registration No.', d.clientReg), row('Address', d.clientAddress),
    row('Contact Name', d.contactName), row('Contact Email', d.contactEmail), row('Contact Phone', d.contactPhone), sep(),
    h2('2. Services'),
    row('Services Description', d.servicesDescription), row('Scope of Work', d.scopeOfWork), row('Deliverables', d.deliverables), sep(),
    h2('3. Fees & Pricing'),
    row('Pricing', d.pricing), row('Payment Terms', d.paymentTerms), row('Billing Frequency', d.billingFrequency), sep(),
    h2('4. Service Levels'),
    row('Availability', d.availability), row('Response Time', d.responseTime),
    row('Resolution Time', d.resolutionTime), row('Support Hours', d.supportHours), sep(),
    h2('5. Responsibilities'),
    row('Provider Responsibilities', d.providerResponsibilities), row('Client Responsibilities', d.clientResponsibilities), sep(),
    h2('6. Term & Termination'),
    row('Start Date', d.startDate), row('End Date', d.endDate),
    row('Renewal', d.renewal), row('Termination Notice', d.terminationNotice), sep(),
    h2('7. Legal'),
    row('Confidentiality', d.confidentiality), row('Liability', d.liability),
    row('Governing Law', d.governingLaw), row('Jurisdiction', d.jurisdiction), sep(),
    `{\\pard\\fs18 DISCLAIMER: For reference purposes only. Not legal advice.\\par}\n`,
  ].join('')
  return new Blob([`{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n${content}}`], { type: 'application/rtf' })
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { state: ndaState, startWizard, saveProgress, completeWizard } = useNdaWizard()
  const { state: empState, startWizard: startEmp, saveProgress: saveEmpProgress, completeWizard: completeEmp } = useEmploymentWizard()
  const { state: ppState, startWizard: startPP, saveProgress: savePPProgress, completeWizard: completePP } = usePrivacyPolicyWizard()
  const { state: faState, startWizard: startFA, saveProgress: saveFAProgress, completeWizard: completeFA } = useFounderAgreementWizard()
  const { state: saState, startWizard: startSA, saveProgress: saveSAProgress, completeWizard: completeSA } = useServiceAgreementWizard()

  // Any active wizard shows the paid dashboard
  const isPaidDashboard =
    ndaState.status !== 'idle' || empState.status !== 'idle' || ppState.status !== 'idle' || faState.status !== 'idle' || saState.status !== 'idle'
  const defaultTab: DashboardTab =
    ndaState.status === 'completed' || empState.status === 'completed' || ppState.status === 'completed' || faState.status === 'completed' || saState.status === 'completed' ? 'completed' :
    ndaState.status === 'inProgress' || empState.status === 'inProgress' || ppState.status === 'inProgress' || faState.status === 'inProgress' || saState.status === 'inProgress' ? 'inProgress' : 'new'
  const [activeTab, setActiveTab] = useState<DashboardTab>(defaultTab)
  const [isNdaModalOpen, setIsNdaModalOpen] = useState(false)
  const [isEmpModalOpen, setIsEmpModalOpen] = useState(false)
  const [isPPModalOpen, setIsPPModalOpen] = useState(false)
  const [isFAModalOpen, setIsFAModalOpen] = useState(false)
  const [isSAModalOpen, setIsSAModalOpen] = useState(false)
  const [ndaToast, setNdaToast] = useState('')
  const ndaToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Quick Access Links ───────────────────────────────────────────────────
  const [quickLinks, setQuickLinks] = useState<QuickAccessLinks | null>(null)
  const [quickLinksLoading, setQuickLinksLoading] = useState(true)

  // ── Legal Notices Links ──────────────────────────────────────────────────
  const [legalLinks, setLegalLinks] = useState<LegalLinks | null>(null)
  const [legalLinksLoading, setLegalLinksLoading] = useState(true)

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

  // Derive active tab from wizard states — computed on every render, no effect needed
  const derivedTab: DashboardTab =
    ndaState.status === 'completed' || empState.status === 'completed' || ppState.status === 'completed' || faState.status === 'completed' || saState.status === 'completed' ? 'completed' :
    ndaState.status === 'inProgress' || empState.status === 'inProgress' || ppState.status === 'inProgress' || faState.status === 'inProgress' || saState.status === 'inProgress' ? 'inProgress' :
    activeTab

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

  const user = dashboardData?.user
  const landingRunsRemaining = user?.runsRemaining ?? 5
  const paidRunsRemaining = user?.runsRemaining ?? 9
  const paidRunsTotal = user?.runsTotal ?? 12
  const paidRunsUsed = user?.runsUsed ?? 3
  if (!isPaidDashboard) {
    return (
      <DashboardShell activeSection="Dashboard">
        <header className="user-dashboard__hero user-dashboard__hero--landing">
          <div>
            <h2>Welcome to The Startup Legal! 🎉</h2>
            <p>
              You're all set up with your <strong>Operator Plan</strong>. Let's get your first legal
              document created.
            </p>
            <button type="button" className="user-dashboard__gold-button" onClick={browseWizards}>
              Browse Wizards
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="user-dashboard__plan-card user-dashboard__plan-card--landing">
            <h3>
              Your <span>Operator Plan</span> Includes:
            </h3>
            <ul>
              {landingPlanBenefits.map((benefit) => (
                <li key={benefit}>
                  <CheckCircle2 size={18} />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
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
                  <strong>5 Wizards Available (8 Items)</strong>
                  <p>You have {landingRunsRemaining} wizard runs remaining this month. <b>One Wizard per start</b></p>
                </div>
              </div>

              <div className="user-dashboard__landing-wizard-list">
                {newWizards.map((wizard) => (
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
                      <span>{wizard.landingLabel}</span>
                      <strong>
                        {wizard.wizards} {wizard.landingItems}
                      </strong>
                    </div>
                    <button
                      type="button"
                      className="user-dashboard__new-wizard-button"
                      onClick={() => {
                        if (wizard.title === 'Employment Offer letter') {
                          startEmp()
                          setIsEmpModalOpen(true)
                        } else if (wizard.title === 'Privacy Policy') {
                          startPP()
                          setIsPPModalOpen(true)
                        } else if (wizard.title === 'Founder Agreement') {
                          startFA()
                          setIsFAModalOpen(true)
                        } else if (wizard.title === 'Service Agreement') {
                          startSA()
                          setIsSAModalOpen(true)
                        } else {
                          startWizard()
                          setIsNdaModalOpen(true)
                        }
                      }}
                    >
                      <Play size={16} />
                      {wizard.title === 'Non-Disclosure Agreement (NDA)' && ndaState.status === 'inProgress' ? 'Continue' :
                       wizard.title === 'Employment Offer letter' && empState.status === 'inProgress' ? 'Continue' :
                       wizard.title === 'Privacy Policy' && ppState.status === 'inProgress' ? 'Continue' :
                       wizard.title === 'Founder Agreement' && faState.status === 'inProgress' ? 'Continue' :
                       wizard.title === 'Service Agreement' && saState.status === 'inProgress' ? 'Continue' : 'Start'}
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

        {isNdaModalOpen && (
          <NdaWizardModal
            onClose={() => setIsNdaModalOpen(false)}
            initialStep={ndaState.status === 'completed' ? 1 : ndaState.step + 1}
            initialData={ndaState.status === 'completed' ? undefined : ndaState.data}
            onStepChange={(step, data) => saveProgress(step, data)}
            onComplete={(data) => {
              handleNdaComplete(data)
              setIsNdaModalOpen(false)
            }}
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

        <div className="user-dashboard__plan-card user-dashboard__plan-card--paid">
          <h3>
            Your <span>Operator Plan</span> Includes:
          </h3>
          <ul>
            {paidPlanBenefits.map((benefit) => (
              <li key={benefit}>
                <CheckCircle2 size={18} />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main className="user-dashboard__content">
        {ndaToast && (
          <div className="user-dashboard__nda-toast" role="status" aria-live="polite">
            <CheckCircle2 size={18} />
            {ndaToast}
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
              <Zap size={24} />
            </span>
            <div>
              <div className="user-dashboard__stat-number">
                {paidRunsRemaining} <span>of {paidRunsTotal}</span>
              </div>
              <div className="user-dashboard__stat-label">Wizards Remaining</div>
              <div className="user-dashboard__stat-sublabel">This billing period</div>
            </div>
          </article>

          <article className="user-dashboard__stat-card">
            <span className="user-dashboard__stat-icon user-dashboard__stat-icon--dark">
              <Target size={24} />
            </span>
            <div>
              <div className="user-dashboard__stat-number">{paidRunsUsed}</div>
              <div className="user-dashboard__stat-label">Wizards Used</div>
              <div className="user-dashboard__stat-sublabel">Since Dec 1, 2025</div>
            </div>
          </article>

          <article className="user-dashboard__stat-card user-dashboard__stat-card--dark">
            <span className="user-dashboard__stat-icon user-dashboard__stat-icon--gold">
              <Calendar size={24} />
            </span>
            <div>
              <div className="user-dashboard__stat-date">Jan 1</div>
              <div className="user-dashboard__stat-year">2026</div>
              <div className="user-dashboard__stat-billing">Next Billing</div>
              <div className="user-dashboard__stat-plan">Operator Plan - R999</div>
            </div>
          </article>
        </section>

        <section className="user-dashboard__workflow-panel">
          <div className="user-dashboard__tabs" role="tablist" aria-label="Dashboard workflow status">
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
                    <button type="button" onClick={() => triggerDownload(buildNdaPdf(ndaState.data, ndaState.completedAt), 'NDA-Document.pdf')}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildNdaRtf(ndaState.data, ndaState.completedAt), 'NDA-Document.rtf')}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildEvidencePack(ndaState.data, ndaState.completedAt), 'NDA-Evidence-Pack.txt')}>
                      <Folder size={16} /> Evidence Pack
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
                    <button type="button" onClick={() => triggerDownload(buildEmploymentPdf(empState.data, empState.completedAt), 'Employment-Offer-Letter.pdf')}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildEmploymentRtf(empState.data, empState.completedAt), 'Employment-Offer-Letter.rtf')}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildEmploymentEvidencePack(empState.data, empState.completedAt), 'Employment-Evidence-Pack.txt')}>
                      <Folder size={16} /> Evidence Pack
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
                    <button type="button" onClick={() => triggerDownload(buildPrivacyPolicyPdf(ppState.data, ppState.completedAt), 'Privacy-Policy.pdf')}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildPrivacyPolicyRtf(ppState.data, ppState.completedAt), 'Privacy-Policy.rtf')}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildPrivacyPolicyEvidencePack(ppState.data, ppState.completedAt), 'Privacy-Policy-Evidence-Pack.txt')}>
                      <Folder size={16} /> Evidence Pack
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
                    <button type="button" onClick={() => triggerDownload(buildFounderAgreementPdf(faState.data, faState.completedAt), 'Founders-Agreement.pdf')}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildFounderAgreementRtf(faState.data, faState.completedAt), 'Founders-Agreement.rtf')}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildFounderAgreementEvidencePack(faState.data, faState.completedAt), 'Founders-Agreement-Evidence-Pack.txt')}>
                      <Folder size={16} /> Evidence Pack
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
                    <button type="button" onClick={() => triggerDownload(buildServiceAgreementPdf(saState.data, saState.completedAt), 'Service-Agreement.pdf')}>
                      <Download size={16} /> Download PDF
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildServiceAgreementRtf(saState.data, saState.completedAt), 'Service-Agreement.rtf')}>
                      <Download size={16} /> Download DOCX
                    </button>
                    <button type="button" onClick={() => triggerDownload(buildServiceAgreementEvidencePack(saState.data, saState.completedAt), 'Service-Agreement-Evidence-Pack.txt')}>
                      <Folder size={16} /> Evidence Pack
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
    </DashboardShell>
  )
}
