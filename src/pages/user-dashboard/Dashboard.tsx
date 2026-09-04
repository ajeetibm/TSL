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
  X,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { capitalizePlan, formatDate } from '../../services/dashboardTypes'
import type { CounselCredits, DashboardData, LegalLinks, QuickAccessLinks, SubscriptionData, SubscriptionPlan } from '../../services/dashboardTypes'
import { setPageMetadata } from '../../services/metadata'
import { counselApi, paymentApi, smeApi, subscriptionApi } from '../../services/tslApi'
import type { FounderAgreementFieldMap } from '../../services/founderAgreementFieldMap'
import { mapPrivacyPolicyFields } from '../../services/privacyPolicyFieldMap'
import { mapSlaFields } from '../../services/slaFieldMap'
import { useUserProfile } from '../../context/UserProfileContext'
import { openPaystackCheckout } from '../../services/paystackClient'
import type { WizardAccess } from '../../services/tslApi'
import { buildNdaDocx, buildEmploymentDocx, buildPrivacyPolicyDocx, buildFounderAgreementDocx, buildServiceAgreementDocx, buildSlaDocx } from '../../services/docxBuilders'
import { useNdaWizard } from '../../hooks/useNdaWizard'
import { useEmploymentWizard } from '../../hooks/useEmploymentWizard'
import { usePrivacyPolicyWizard } from '../../hooks/usePrivacyPolicyWizard'
import { useFounderAgreementWizard } from '../../hooks/useFounderAgreementWizard'
import { useServiceAgreementWizard } from '../../hooks/useServiceAgreementWizard'
import { useSlaWizard } from '../../hooks/useSlaWizard'
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
import SlaWizardModal from './SlaWizardModal'
import InsufficientBlueprintUnitsModal from './InsufficientBlueprintUnitsModal'
import type { ServiceAgreementWizardData } from './ServiceAgreementWizardModal'
import type { SlaWizardData } from './SlaWizardModal'
import ComingSoonWizardModal from './ComingSoonWizardModal'
import CounselCreditsModal from './CounselCreditsModal'
import type { TopUpPlan } from './CounselCreditsModal'
import { UpgradePlansModal } from './billing/UpgradePlansModal'
import { UpgradeConfirmModal } from './billing/UpgradeConfirmModal'
import './Dashboard.css'

type DashboardTab = 'new' | 'inProgress' | 'completed'

const BLUEPRINT_ICON_NAME: Record<string, string> = {
  'Non-Disclosure Agreement (NDA)': 'Shield',
  'Board Resolution': 'Briefcase',
  'Employment Offer Letter': 'UsersRound',
  'Privacy & Cookies Policy': 'Shield',
  'Service Level Agreement (SLA)': 'FileText',
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

interface InProgressInstance {
  id: string              // unique per in-progress run
  wizardType: string      // matches wizard.title
  step: number
  progress: number
  startedAt: string
  data: unknown
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
      'All five Blueprints',
      '4 Blueprint run units per month',
      'Additional run units: R149 each',
      'No Counsel credits included',
      'Additional Counsel credits: R550 per credit (30 minutes of attorney time)',
    ]
  }

  if (id === 'operator') {
    return [
      'All five Blueprints',
      '12 Blueprint run units per month',
      'Additional run units: R149 each',
      '2 Counsel credits per month (1 hour of attorney time); unused credits expire at month end',
      'Additional Counsel credits: R550 per credit',
    ]
  }

  if (id === 'boardroom') {
    return [
      'All five Blueprints',
      '30 Blueprint run units per month',
      'Additional run units: R149 each',
      '6 Counsel credits per month (3 hours of attorney time); unused credits expire at month end',
      'Additional Counsel credits: R550 per credit',
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

// Full feature details shown in the "View All Features" modal per plan
const PLAN_FULL_FEATURES: Record<string, { items: string[]; excluded: string[] }> = {
  Launchpad: {
    items: [
      'For founders setting the company up and putting the first documents in place',
      'All five Blueprints',
      '4 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
      'No Counsel credits included',
      'Additional Counsel credits: R550 per credit (30 minutes of attorney time)',
      'Email support: response within 48 business hours',
      '1 user',
      'Document storage: 12 months from generation',
    ],
    excluded: [
      'Counsel credits',
      'Additional users',
    ],
  },
  Operator: {
    items: [
      'For growing teams that need regular legal documents and occasional attorney time',
      'All five Blueprints',
      '12 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
      '2 Counsel credits per month (1 hour of attorney time); unused credits expire at month end',
      'Additional Counsel credits: R550 per credit',
      'Priority email support: response within 24 business hours',
      'Up to 5 users',
      'Document storage: 24 months from generation',
    ],
    excluded: [
      'Additional users beyond 3',
    ],
  },
  Boardroom: {
    items: [
      'For established companies that need high-volume documents and regular attorney access',
      'All five Blueprints',
      '30 Blueprint run units per month',
      'Additional run units: R149 each',
      'No run-unit rollover; unused units expire at the end of the billing month',
      '6 Counsel credits per month (3 hours of attorney time); unused credits expire at month end',
      'Additional Counsel credits: R550 per credit',
      'Dedicated support with SLA',
      'Unlimited users',
      'Document storage: 36 months from generation',
    ],
    excluded: [
      'Additional users beyond 10',
    ],
  },
}

interface PlanFeaturesModalProps {
  planName: string
  onClose: () => void
}

function PlanFeaturesModal({ planName, onClose }: PlanFeaturesModalProps) {
  const plan = PLAN_FULL_FEATURES[planName]
  if (!plan) return null

  return (
    <div
      className="user-dashboard__plan-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-features-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="user-dashboard__plan-modal">
        <button
          type="button"
          className="user-dashboard__plan-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <h2 id="plan-features-modal-title" className="user-dashboard__plan-modal-title">
          Your <span>{planName} Plan</span> Includes:
        </h2>

        <ul className="user-dashboard__plan-modal-list">
          {plan.items.map((item) => (
            <li key={item}>
              <CheckCircle2 size={16} />
              {item}
            </li>
          ))}
          {plan.excluded.map((item) => (
            <li key={item} className="user-dashboard__plan-modal-list-excluded">
              <span className="user-dashboard__plan-modal-x">✕</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

interface PlanCardProps {
  planName: string
  benefits: string[]
  variant: 'landing' | 'paid'
  isFree?: boolean
}

function PlanCard({ planName, benefits, variant, isFree }: PlanCardProps) {
  const [showModal, setShowModal] = useState(false)
  const hasFullFeatures = planName in PLAN_FULL_FEATURES

  return (
    <>
      <div className={`user-dashboard__plan-card user-dashboard__plan-card--${variant}`}>
        <h3>
          Your <span>{planName} Plan</span> Includes:
        </h3>

        {isFree ? (
          <p className="user-dashboard__plan-card-free-text">
            Get started with the basics — upgrade anytime to unlock more.
          </p>
        ) : (
          <>
            <ul>
              {benefits.map((benefit) => (
                <li key={benefit}>
                  <CheckCircle2 size={18} />
                  {benefit}
                </li>
              ))}
            </ul>

            {hasFullFeatures && (
              <button
                type="button"
                className="user-dashboard__plan-card-toggle"
                onClick={() => setShowModal(true)}
              >
                View All Features
                <ChevronDown size={13} className="user-dashboard__plan-card-chevron" />
              </button>
            )}
          </>
        )}
      </div>

      {showModal && (
        <PlanFeaturesModal planName={planName} onClose={() => setShowModal(false)} />
      )}
    </>
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
    unitCost: 2,
  },
  {
    id: 4,
    title: 'Founders agreement and IP assignment',
    note: 'Setting up co-founder equity split',
    wizards: 1,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Blueprints',
    unitCost: 4,
  },
  {
    id: 5,
    title: 'Service Level Agreement (SLA)',
    note: 'Multiple client contracts needed',
    wizards: 1,
    paidItems: 'Item',
    landingItems: 'Items',
    landingLabel: 'Blueprints',
    unitCost: 3,
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
 * Shared, paginated PDF renderer for completed Blueprint downloads.
 *
 * It deliberately keeps the existing data rows and field mappings intact, but
 * presents them in a professional legal-document layout instead of a single
 * Courier text stream. Blueprint-specific builders only describe their title
 * and ordered content; this function owns the TSL header, sections, wrapping,
 * pagination and page footer.
 */
function buildLegalDocumentPdf(lines: string[]): Blob {
  const PAGE_W = 595
  const PAGE_H = 842
  const MARGIN = 54
  const usableWidth = PAGE_W - MARGIN * 2
  const navy = '0.047 0.114 0.21'
  const gold = '0.82 0.62 0.16'
  const ink = '0.075 0.13 0.22'
  const muted = '0.36 0.4 0.46'
  const sanitize = (value: string) => value
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
  const wrap = (value: string, maxChars: number) => {
    const words = value.trim().split(/\s+/)
    const wrapped: string[] = []
    let line = ''
    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word
      if (next.length > maxChars && line) {
        wrapped.push(line)
        line = word
      } else {
        line = next
      }
    })
    if (line) wrapped.push(line)
    return wrapped
  }
  const isDivider = (line: string) => /^[-─]{10,}$/.test(line)
  const isHeading = (line: string) => /^\d+\. [A-Z &+]+$/.test(line)
  const title = lines[0] || 'THE STARTUP LEGAL DOCUMENT'
  const pages: string[][] = [[]]
  let pageIndex = 0
  let cursorY = 726

  const addToPage = (operations: string[], requiredHeight: number) => {
    if (cursorY - requiredHeight < 70) {
      pages[pageIndex] = operations
      pageIndex += 1
      pages[pageIndex] = []
      cursorY = 748
      return pages[pageIndex]
    }
    return operations
  }
  const addText = (operations: string[], value: string, x: number, y: number, size: number, font: '/F1' | '/F2', colour: string) => {
    operations.push(`BT ${colour} rg ${font} ${size} Tf ${x} ${y} Td (${sanitize(value)}) Tj ET`)
  }

  lines.slice(1).forEach((sourceLine) => {
    const line = sourceLine.trim()
    if (!line || isDivider(line)) return
    let operations = pages[pageIndex]

    if (isHeading(line)) {
      operations = addToPage(operations, 31)
      operations.push(`q ${gold} rg ${MARGIN} ${cursorY - 5} 3 19 re f Q`)
      addText(operations, line, MARGIN + 12, cursorY, 12, '/F2', ink)
      cursorY -= 28
      return
    }

    const separatorIndex = line.indexOf(':')
    if (separatorIndex > 0 && separatorIndex < 28) {
      const label = line.slice(0, separatorIndex).trim()
      const value = line.slice(separatorIndex + 1).trim() || '-'
      const valueLines = wrap(value, 58)
      operations = addToPage(operations, Math.max(17, valueLines.length * 14) + 4)
      addText(operations, label, MARGIN, cursorY, 9, '/F2', muted)
      valueLines.forEach((valueLine, index) => addText(operations, valueLine, MARGIN + 142, cursorY - index * 14, 9.5, '/F1', ink))
      cursorY -= Math.max(17, valueLines.length * 14) + 4
      return
    }

    const bodyLines = wrap(line, 84)
    operations = addToPage(operations, bodyLines.length * 15 + 8)
    bodyLines.forEach((bodyLine) => {
      addText(operations, bodyLine, MARGIN, cursorY, 10, '/F1', ink)
      cursorY -= 15
    })
    cursorY -= 8
  })

  const fontRegularObject = 3 + pages.length * 2
  const fontBoldObject = fontRegularObject + 1
  const objectCount = fontBoldObject
  const pageObjectNumbers = pages.map((_, index) => 3 + index)
  const contentObjectNumbers = pages.map((_, index) => 3 + pages.length + index)
  const objects: string[] = new Array(objectCount + 1)
  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj'
  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(' ')}] /Count ${pages.length} >>\nendobj`

  pages.forEach((content, index) => {
    const operations: string[] = [
      `q ${navy} rg 0 790 ${PAGE_W} 52 re f Q`,
      `BT 1 1 1 rg /F2 10 Tf ${MARGIN} 812 Td (THE STARTUP LEGAL) Tj ET`,
      `BT 0.77 0.82 0.9 rg /F1 8.5 Tf ${MARGIN} 797 Td (${sanitize(title)}) Tj ET`,
    ]
    if (index === 0) {
      operations.push(`BT ${ink} rg /F2 20 Tf ${MARGIN} 760 Td (${sanitize(title)}) Tj ET`)
      operations.push(`q ${gold} rg ${MARGIN} 744 ${usableWidth} 1.3 re f Q`)
    }
    operations.push(...content)
    operations.push(`q 0.88 0.89 0.91 RG 0.7 w ${MARGIN} 43 m ${PAGE_W - MARGIN} 43 l S Q`)
    operations.push(`BT ${muted} rg /F1 8 Tf 205 26 Td (Generated by The StartUp Legal | Page ${index + 1} of ${pages.length}) Tj ET`)
    const stream = operations.join('\n')
    const pageObject = pageObjectNumbers[index]
    const contentObject = contentObjectNumbers[index]
    objects[pageObject] = `${pageObject} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentObject} 0 R /Resources << /Font << /F1 ${fontRegularObject} 0 R /F2 ${fontBoldObject} 0 R >> >> >>\nendobj`
    objects[contentObject] = `${contentObject} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`
  })
  objects[fontRegularObject] = `${fontRegularObject} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`
  objects[fontBoldObject] = `${fontBoldObject} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`

  const header = '%PDF-1.4\n'
  const offsets: number[] = []
  const body: string[] = []
  let position = header.length
  for (let index = 1; index <= objectCount; index += 1) {
    offsets.push(position)
    const object = `${objects[index]}\n`
    body.push(object)
    position += object.length
  }
  const xref = ['xref', `0 ${objectCount + 1}`, '0000000000 65535 f ', ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)].join('\n')
  const trailer = `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`
  return new Blob([header, ...body, xref, '\n', trailer], { type: 'application/pdf' })
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

  return buildLegalDocumentPdf(lines)
}

/**
 * Build a tamper-evident Evidence Pack for the NDA wizard.
 * Matches the Employment Offer Letter evidence pack pattern:
 * SHA-256 fingerprints are computed over the canonical inputs, the PDF output,
 * and the DOCX output so that any post-generation modification is detectable.
 */
async function buildNdaEvidencePack(
  data: import('./NdaWizardModal').NdaWizardData,
  completedAt: string | null,
  instanceId: string,
): Promise<Blob> {
  const generatedAt = completedAt ?? new Date().toISOString()

  const fmtAddr = (a: import('./NdaWizardModal').NdaWizardData['party_a']['address']) =>
    [a.street_number, a.building, a.street_name, a.suburb, a.city, a.province, a.postal_code, a.country].filter(Boolean).join(', ')

  const inputs = {
    agreement_type: data.agreement_type,
    disclosing_party: data.disclosing_party,
    party_b_type: data.party_b_type,
    'party_a.entity_type': data.party_a.entity_type,
    'party_a.legal_name': data.party_a.legal_name || data.party_a.full_names,
    'party_a.reg_number': data.party_a.reg_number,
    'party_a.email': data.party_a.email,
    'party_a.signatory_name': data.party_a.signatory_name,
    'party_a.signatory_capacity': data.party_a.signatory_capacity,
    'party_b.entity_type': data.party_b.entity_type,
    'party_b.legal_name': data.party_b.legal_name || data.party_b.full_names,
    'party_b.reg_number': data.party_b.reg_number,
    'party_b.email': data.party_b.email,
    'party_b.signatory_name': data.party_b.signatory_name,
    'party_b.signatory_capacity': data.party_b.signatory_capacity,
    purpose: data.purpose,
    ci_definition: data.ci_definition,
    ci_categories: data.ci_categories,
    ci_exclusions: data.ci_exclusions,
    marking_required: data.marking_required,
    duration_years: data.duration_years,
    duration_start: data.duration_start,
    permitted_recipients: data.permitted_recipients,
    return_or_destroy: data.return_or_destroy,
    archival_copy: data.archival_copy,
    non_solicit: data.non_solicit,
    non_solicit_months: data.non_solicit_months,
    governing_law: data.governing_law,
    dispute_forum: data.dispute_forum,
    signature_method: data.signature_method,
    signing_order: data.signing_order,
  }

  const pdf = buildNdaPdf(data, completedAt)
  const docx = await buildNdaDocx(data, completedAt)
  const [inputFingerprint, pdfFingerprint, docxFingerprint] = await Promise.all([
    sha256(canonicalise(inputs)),
    sha256(pdf),
    sha256(docx),
  ])

  const lines = [
    'TSL EVIDENCE PACK - NON-DISCLOSURE AGREEMENT',
    '=============================================',
    `Blueprint ID            : nda`,
    `Blueprint Instance ID   : ${instanceId}`,
    `Schema Version          : 2.0`,
    `Template Version        : nda-v2.0`,
    `Generation Timestamp    : ${generatedAt}`,
    `Input Fingerprint       : sha256:${inputFingerprint}`,
    `Output Fingerprint (PDF): sha256:${pdfFingerprint}`,
    `Output Fingerprint (DOCX): sha256:${docxFingerprint}`,
    '',
    'CANONICAL BLUEPRINT INPUTS',
    '==========================',
    '',
    'PARTIES',
    `  agreement_type              : ${inputs.agreement_type || '—'}`,
    `  disclosing_party            : ${inputs.disclosing_party || '—'}`,
    `  party_b_type                : ${inputs.party_b_type || '—'}`,
    '',
    '  Party A',
    `    entity_type               : ${inputs['party_a.entity_type'] || '—'}`,
    `    legal_name                : ${inputs['party_a.legal_name'] || '—'}`,
    `    reg_number                : ${inputs['party_a.reg_number'] || '—'}`,
    `    address                   : ${fmtAddr(data.party_a.address) || '—'}`,
    `    email                     : ${inputs['party_a.email'] || '—'}`,
    `    signatory_name            : ${inputs['party_a.signatory_name'] || '—'}`,
    `    signatory_capacity        : ${inputs['party_a.signatory_capacity'] || '—'}`,
    '',
    '  Party B',
    `    entity_type               : ${inputs['party_b.entity_type'] || '—'}`,
    `    legal_name                : ${inputs['party_b.legal_name'] || '—'}`,
    `    reg_number                : ${inputs['party_b.reg_number'] || '—'}`,
    `    address                   : ${fmtAddr(data.party_b.address) || '—'}`,
    `    email                     : ${inputs['party_b.email'] || '—'}`,
    `    signatory_name            : ${inputs['party_b.signatory_name'] || '—'}`,
    `    signatory_capacity        : ${inputs['party_b.signatory_capacity'] || '—'}`,
    '',
    'PURPOSE & SCOPE',
    `  purpose                     : ${inputs.purpose || '—'}`,
    `  ci_definition               : ${inputs.ci_definition || '—'}`,
    `  ci_categories               : ${inputs.ci_categories.length ? inputs.ci_categories.join(', ') : '—'}`,
    `  ci_exclusions               : ${inputs.ci_exclusions.length ? inputs.ci_exclusions.join(', ') : '—'}`,
    `  marking_required            : ${inputs.marking_required ? 'Yes' : 'No'}`,
    '',
    'OBLIGATIONS',
    `  duration_years              : ${inputs.duration_years || '—'}`,
    `  duration_start              : ${inputs.duration_start || '—'}`,
    `  permitted_recipients        : ${inputs.permitted_recipients.length ? inputs.permitted_recipients.join(', ') : '—'}`,
    `  return_or_destroy           : ${inputs.return_or_destroy || '—'}`,
    `  archival_copy               : ${inputs.archival_copy ? 'Yes' : 'No'}`,
    `  non_solicit                 : ${inputs.non_solicit ? `Yes (${inputs.non_solicit_months} months)` : 'No'}`,
    '',
    'LEGAL + SIGNING',
    `  governing_law               : ${inputs.governing_law || '—'}`,
    `  dispute_forum               : ${inputs.dispute_forum || '—'}`,
    `  domicilium_a                : ${fmtAddr(data.domicilium_a) || '—'}`,
    `  domicilium_b                : ${fmtAddr(data.domicilium_b) || '—'}`,
    `  signature_method            : ${inputs.signature_method || '—'}`,
    `  signing_order               : ${inputs.signing_order || '—'}`,
    '',
  ]
  return new Blob([lines.join('\n')], { type: 'text/plain' })
}

/* ── Employment Offer Letter download builders ───────────── */
function buildEmploymentPdf(d: EmploymentWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const salary = d.salary_amount ? `R${Number(d.salary_amount).toLocaleString('en-ZA')} ${d.salary_period}` : '—'
  const lines: string[] = [
    'EMPLOYMENT OFFER LETTER',
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. EMPLOYER',
    '─────────────────────────────────────────',
    `Employer         : ${d.employer_name || '—'}`,
    `Company ID       : ${d.company_id || '—'}`,
    '',
    '─────────────────────────────────────────',
    '2. CANDIDATE AND ROLE',
    '─────────────────────────────────────────',
    `Candidate Name   : ${d['candidate.full_names'] || '—'}`,
    `Candidate Email  : ${d['candidate.email'] || '—'}`,
    `Job Title        : ${d.job_title || '—'}`,
    `Reports To       : ${d.reports_to || '—'}`,
    `Start Date       : ${d.start_date || '—'}`,
    `Work Location    : ${d.work_location || '—'}`,
    '',
    '─────────────────────────────────────────',
    '3. PACKAGE',
    '─────────────────────────────────────────',
    `Salary           : ${salary}`,
    `Benefits         : ${d.benefits.join(', ') || 'None'}`,
    `Contribution     : ${d.benefits_detail || '—'}`,
    `Probation        : ${d.probation_months || '—'} months`,
    `Restraint        : ${d.restraint_flag ? 'Yes' : 'No'}`,
    '',
    '─────────────────────────────────────────',
    '4. CONDITIONS',
    '─────────────────────────────────────────',
    `Offer Conditions : ${d.conditions.join(', ') || '—'}`,
    `Medical Reason   : ${d.medical_justification || '—'}`,
    `Work Permit Type : ${d.work_permit_type || 'Not required'}`,
    `Work Permit Exp. : ${d.work_permit_expiry || '—'}`,
    `Offer Expires    : ${d.offer_expiry || '—'}`,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for reference purposes only.',
    'It does not constitute legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]
  return buildLegalDocumentPdf(lines)
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
  const lines: string[] = [
    'PRIVACY & COOKIES POLICY',
    '',
    `Date: ${date}`,
    'Generated by: The Startup Legal',
    '',
    '─────────────────────────────────────────',
    '1. WHO YOU ARE',
    '─────────────────────────────────────────',
    `Responsible Party     : ${d.responsibleParty || '—'}`,
    `Confirmed             : ${d.responsiblePartyConfirmed ? 'Yes' : 'No'}`,
    `Information Officer   : ${d.officerFullNames || '—'}`,
    `ID Number             : ${d.officerIdNumber || '—'}`,
    `Officer Email         : ${d.officerEmail || '—'}`,
    `Privacy Email         : ${d.privacyEmail || '—'}`,
    `Domains               : ${d.domains.filter(Boolean).join(', ') || '—'}`,
    '',
    '─────────────────────────────────────────',
    '2. WHAT YOU COLLECT',
    '─────────────────────────────────────────',
    `PI Categories         : ${d.piCategories.join(', ') || '—'}`,
    `Special PI            : ${d.specialPi.join(', ') || 'None'}`,
    `Special PI Basis      : ${d.specialPiBasis || '—'}`,
    `Children Data         : ${d.childrenData ? 'Yes' : 'No'}`,
    `Children Consent      : ${d.childrenConsent || '—'}`,
    '',
    '─────────────────────────────────────────',
    '3. WHY & BASIS',
    '─────────────────────────────────────────',
    ...d.purposes.flatMap((purpose, index) => [
      `Purpose ${index + 1}         : ${purpose.purpose || '—'}`,
      `Categories         : ${purpose.categories || '—'}`,
      `Lawful Basis       : ${purpose.basis || '—'}`,
      `LI Statement       : ${purpose.liStatement || '—'}`,
      '',
    ]),
    ...d.retention.flatMap((retention, index) => [
      `Retention ${index + 1}       : ${retention.category || '—'}`,
      `Period             : ${retention.period || '—'}`,
      `Reason             : ${retention.reason || '—'}`,
      '',
    ]),
    '─────────────────────────────────────────',
    '4. WHO ELSE SEES IT',
    '─────────────────────────────────────────',
    ...d.thirdParties.flatMap((party, index) => [
      `Third Party ${index + 1}     : ${party.name || '—'}`,
      `Purpose            : ${party.purpose || '—'}`,
      `Country            : ${party.country || '—'}`,
      '',
    ]),
    `Cross-border Transfers: ${d.crossBorder ? 'Yes' : 'No'}`,
    `Transfer Countries   : ${d.crossBorderCountries.join(', ') || '—'}`,
    `Transfer Basis       : ${d.transferBasis || '—'}`,
    `Direct Marketing     : ${d.directMarketing ? 'Yes' : 'No'}`,
    '',
    '─────────────────────────────────────────',
    '5. COOKIES',
    '─────────────────────────────────────────',
    ...d.cookies.flatMap((cookie, index) => [
      `Cookie ${index + 1}          : ${cookie.name || '—'}`,
      `Purpose            : ${cookie.purpose || '—'}`,
      `Duration           : ${cookie.duration || '—'}`,
      `Necessary          : ${cookie.necessary || '—'}`,
      '',
    ]),
    `Cookie Consent      : ${d.cookieConsent || '—'}`,
    `Analytics Provider  : ${d.analyticsProvider || '—'}`,
    '',
    '─────────────────────────────────────────',
    '6. PUBLICATION',
    '─────────────────────────────────────────',
    `DSR Channel         : ${d.dsrChannel || '—'}`,
    `DSR Days            : ${d.dsrDays || '—'}`,
    `Security Summary    : ${d.securitySummary.join(', ') || '—'}`,
    `Effective Date      : ${d.effectiveDate || '—'}`,
    `Automated Decisions : ${d.automatedDecisions ? 'Yes' : 'No'}`,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for reference purposes only.',
    'It does not constitute legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]
  return buildLegalDocumentPdf(lines)
}

function buildPrivacyPolicyEvidencePack(d: PrivacyPolicyWizardData, completedAt: string | null): Blob {
  const now = new Date()
  const lines = [
    'TSL EVIDENCE PACK — PRIVACY POLICY',
    '====================================',
    `Wizard ID          : tsl-pp-${now.getTime()}`,
    'Template Version   : v1.0',
    'Document Version   : PP-2025',
    `Generated Date     : ${now.toLocaleDateString('en-ZA')}`,
    `Completion Time    : ${completedAt ? new Date(completedAt).toLocaleString('en-ZA') : now.toLocaleString('en-ZA')}`,
    'Platform           : The Startup Legal',
    '',
    '── WIZARD ANSWERS ──────────────────────────',
    '',
    '1. WHO YOU ARE',
    `   Responsible Party   : ${d.responsibleParty || '—'}`,
    `   Confirmed           : ${d.responsiblePartyConfirmed ? 'Yes' : 'No'}`,
    `   Information Officer : ${d.officerFullNames || '—'}`,
    `   ID Number           : ${d.officerIdNumber || '—'}`,
    `   Officer Email       : ${d.officerEmail || '—'}`,
    `   Privacy Email       : ${d.privacyEmail || '—'}`,
    `   Domains             : ${d.domains.filter(Boolean).join(', ') || '—'}`,
    '',
    '2. WHAT YOU COLLECT',
    `   PI Categories       : ${d.piCategories.join(', ') || '—'}`,
    `   Special PI          : ${d.specialPi.join(', ') || 'None'}`,
    `   Special PI Basis    : ${d.specialPiBasis || '—'}`,
    `   Children Data       : ${d.childrenData ? 'Yes' : 'No'}`,
    `   Children Consent    : ${d.childrenConsent || '—'}`,
    '',
    '3. WHY & BASIS',
    ...d.purposes.flatMap((purpose, index) => [
      `   Purpose ${index + 1}         : ${purpose.purpose || '—'}`,
      `     Categories        : ${purpose.categories || '—'}`,
      `     Lawful Basis      : ${purpose.basis || '—'}`,
      `     LI Statement      : ${purpose.liStatement || '—'}`,
    ]),
    '',
    ...d.retention.flatMap((retention, index) => [
      `   Retention ${index + 1}       : ${retention.category || '—'}`,
      `     Period            : ${retention.period || '—'}`,
      `     Reason            : ${retention.reason || '—'}`,
    ]),
    '',
    '4. WHO ELSE SEES IT',
    ...d.thirdParties.flatMap((party, index) => [
      `   Third Party ${index + 1}     : ${party.name || '—'}`,
      `     Purpose           : ${party.purpose || '—'}`,
      `     Country           : ${party.country || '—'}`,
    ]),
    `   Cross-border         : ${d.crossBorder ? 'Yes' : 'No'}`,
    `   Countries            : ${d.crossBorderCountries.join(', ') || '—'}`,
    `   Transfer Basis       : ${d.transferBasis || '—'}`,
    `   Direct Marketing     : ${d.directMarketing ? 'Yes' : 'No'}`,
    '',
    '5. COOKIES',
    ...d.cookies.flatMap((cookie, index) => [
      `   Cookie ${index + 1}          : ${cookie.name || '—'}`,
      `     Purpose           : ${cookie.purpose || '—'}`,
      `     Duration          : ${cookie.duration || '—'}`,
      `     Necessary         : ${cookie.necessary || '—'}`,
    ]),
    `   Cookie Consent       : ${d.cookieConsent || '—'}`,
    `   Analytics Provider   : ${d.analyticsProvider || '—'}`,
    '',
    '6. PUBLICATION',
    `   DSR Channel          : ${d.dsrChannel || '—'}`,
    `   DSR Days             : ${d.dsrDays || '—'}`,
    `   Security Summary     : ${d.securitySummary.join(', ') || '—'}`,
    `   Effective Date       : ${d.effectiveDate || '—'}`,
    `   Automated Decisions  : ${d.automatedDecisions ? 'Yes' : 'No'}`,
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
    `  Full names   : ${f.fullNames || '—'}`,
    `  ID number    : ${f.idNumber || '—'}`,
    `  Role         : ${f.role || '—'}`,
    `  Commitment   : ${f.commitment || '—'}`,
    `  Equity       : ${f.equityPct ? `${f.equityPct}%` : '—'}`,
    `  Capital      : ${f.capital || '—'}`,
    '',
  ])
  const sigLines = d.signatories.flatMap((s, i) => [
    `Signatory ${i + 1}: ${s.name || '—'} (${s.capacity || '—'})`,
  ])
  const lines: string[] = [
    "FOUNDERS' AGREEMENT & IP ASSIGNMENT",
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. COMPANY STATUS',
    '─────────────────────────────────────────',
    `Incorporated        : ${d.isIncorporated || '—'}`,
    ...(d.isIncorporated === 'Yes'
      ? [`Company Name        : ${d.companyName || '—'}`]
      : [`Intended name       : ${d.intendedName || '—'}`, `Target incorporation: ${d.targetIncorporation || '—'}`]),
    '',
    '─────────────────────────────────────────',
    '2. FOUNDERS & EQUITY',
    '─────────────────────────────────────────',
    ...founderLines,
    '─────────────────────────────────────────',
    '3. VESTING',
    '─────────────────────────────────────────',
    `Vesting applies     : ${d.vestingApplies || '—'}`,
    ...(d.vestingApplies === 'Yes' ? [
      `Vesting period (mo) : ${d.vestingMonths || '—'}`,
      `Cliff (months)      : ${d.cliffMonths || '—'}`,
      `Frequency           : ${d.vestingFrequency || '—'}`,
      `Acceleration        : ${d.acceleration || '—'}`,
      `Good leaver         : ${d.goodLeaver.join('; ') || '—'}`,
      `Bad leaver effect   : ${d.badLeaverEffect || '—'}`,
    ] : []),
    '',
    '─────────────────────────────────────────',
    '4. DECISIONS & ROLES',
    '─────────────────────────────────────────',
    `Decision model      : ${d.decisionModel || '—'}`,
    `Reserved matters    : ${d.reservedMatters.join('; ') || '—'}`,
    ...(d.reservedMatters.includes('Take on debt above a threshold') ? [`Debt threshold      : ${d.debtThreshold || '—'}`] : []),
    `Removal process     : ${d.removalProcess || '—'}`,
    `Departure role      : ${d.departureRole || '—'}`,
    '',
    '─────────────────────────────────────────',
    '5. INTELLECTUAL PROPERTY',
    '─────────────────────────────────────────',
    `IP assignment       : Yes — assignment applies`,
    `Pre-incorp. work    : ${d.ipPreIncorporation || '—'}`,
    `Publicly funded     : ${d.publiclyFunded || '—'}`,
    `Created at employer : ${d.createdAtEmployer || '—'}`,
    '',
    '─────────────────────────────────────────',
    '6. PROTECTIONS & LEGAL',
    '─────────────────────────────────────────',
    `Confidentiality     : ${d.confidentiality || '—'}`,
    `Non-solicitation    : ${d.nonSolicit || '—'}`,
    `Restraint of trade  : ${d.restraint || '—'}`,
    ...(d.restraint === 'Yes' ? [`Restraint (months)  : ${d.restraintMonths || '—'}`, `Restraint area      : ${d.restraintArea || '—'}`] : []),
    `Deadlock            : ${d.deadlock || '—'}`,
    `Dispute resolution  : ${d.disputeForum || '—'}`,
    `Governing law       : ${d.governingLaw || '—'}`,
    '',
    'Signatories:',
    ...sigLines,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for reference purposes only.',
    'It does not constitute legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]
  return buildLegalDocumentPdf(lines)
}

async function buildFounderAgreementEvidencePack(
  d: FounderAgreementWizardData,
  completedAt: string | null,
  instanceId: string,
): Promise<Blob> {
  const generatedAt = completedAt ?? new Date().toISOString()

  // Canonical inputs object — every field the wizard collects
  const inputs = {
    isIncorporated: d.isIncorporated,
    companyName: d.companyName,
    intendedName: d.intendedName,
    targetIncorporation: d.targetIncorporation,
    founders: d.founders,
    vestingApplies: d.vestingApplies,
    vestingMonths: d.vestingMonths,
    cliffMonths: d.cliffMonths,
    vestingFrequency: d.vestingFrequency,
    acceleration: d.acceleration,
    goodLeaver: d.goodLeaver,
    badLeaverEffect: d.badLeaverEffect,
    decisionModel: d.decisionModel,
    reservedMatters: d.reservedMatters,
    debtThreshold: d.debtThreshold,
    removalProcess: d.removalProcess,
    departureRole: d.departureRole,
    ipPreIncorporation: d.ipPreIncorporation,
    priorIp: d.priorIp,
    priorIpNil: d.priorIpNil,
    publiclyFunded: d.publiclyFunded,
    createdAtEmployer: d.createdAtEmployer,
    digitalAssets: d.digitalAssets,
    confidentiality: d.confidentiality,
    nonSolicit: d.nonSolicit,
    restraint: d.restraint,
    restraintMonths: d.restraintMonths,
    restraintArea: d.restraintArea,
    deadlock: d.deadlock,
    disputeForum: d.disputeForum,
    governingLaw: d.governingLaw,
    signatories: d.signatories,
  }

  const pdf = buildFounderAgreementPdf(d, completedAt)
  const docx = await buildFounderAgreementDocx(d, completedAt)
  const [inputFingerprint, pdfFingerprint, docxFingerprint] = await Promise.all([
    sha256(canonicalise(inputs)),
    sha256(pdf),
    sha256(docx),
  ])

  const founderLines = d.founders.flatMap((f, i) => [
    `   founders[${i}].fullNames      : ${f.fullNames || '—'}`,
    `   founders[${i}].idNumber       : ${f.idNumber || '—'}`,
    `   founders[${i}].role           : ${f.role || '—'}`,
    `   founders[${i}].commitment     : ${f.commitment || '—'}`,
    `   founders[${i}].equityPct      : ${f.equityPct ? `${f.equityPct}%` : '—'}`,
    `   founders[${i}].capital        : ${f.capital || '—'}`,
  ])
  const priorIpLines = d.priorIpNil
    ? [`   priorIp                    : Nothing to declare`]
    : d.priorIp.flatMap((p, i) => [
        `   priorIp[${i}].founder         : ${p.founder || '—'}`,
        `   priorIp[${i}].description     : ${p.description || '—'}`,
        `   priorIp[${i}].dateCreated     : ${p.dateCreated || '—'}`,
        `   priorIp[${i}].treatment       : ${p.treatment || '—'}`,
      ])
  const digitalLines = d.digitalAssets.flatMap((a, i) => [
    `   digitalAssets[${i}].asset          : ${a.asset || '—'}`,
    `   digitalAssets[${i}].currentHolder  : ${a.currentHolder || '—'}`,
    `   digitalAssets[${i}].transferDate   : ${a.transferDate || '—'}`,
  ])
  const sigLines = d.signatories.map((s, i) =>
    `   signatories[${i}].name        : ${s.name || '—'} (${s.capacity || '—'})`
  )

  const lines = [
    "TSL EVIDENCE PACK - FOUNDERS' AGREEMENT & IP ASSIGNMENT",
    '=========================================================',
    `Blueprint ID             : founders-agreement-ip`,
    `Blueprint Instance ID    : ${instanceId}`,
    `Schema Version           : 1.0`,
    `Template Version         : founders-agreement-ip-v1.0`,
    `Generation Timestamp     : ${generatedAt}`,
    `Input Fingerprint        : sha256:${inputFingerprint}`,
    `Output Fingerprint (PDF) : sha256:${pdfFingerprint}`,
    `Output Fingerprint (DOCX): sha256:${docxFingerprint}`,
    '',
    'CANONICAL BLUEPRINT INPUTS',
    '==========================',
    '',
    '1. COMPANY STATUS',
    `   isIncorporated             : ${inputs.isIncorporated || '—'}`,
    ...(d.isIncorporated === 'Yes'
      ? [`   companyName                : ${inputs.companyName || '—'}`]
      : [
          `   intendedName               : ${inputs.intendedName || '—'}`,
          `   targetIncorporation        : ${inputs.targetIncorporation || '—'}`,
        ]),
    '',
    '2. FOUNDERS & EQUITY',
    ...founderLines,
    '',
    '3. VESTING',
    `   vestingApplies             : ${inputs.vestingApplies || '—'}`,
    ...(d.vestingApplies === 'Yes' ? [
      `   vestingMonths              : ${inputs.vestingMonths || '—'}`,
      `   cliffMonths                : ${inputs.cliffMonths || '—'}`,
      `   vestingFrequency           : ${inputs.vestingFrequency || '—'}`,
      `   acceleration               : ${inputs.acceleration || '—'}`,
      `   goodLeaver                 : ${inputs.goodLeaver.join('; ') || '—'}`,
      `   badLeaverEffect            : ${inputs.badLeaverEffect || '—'}`,
    ] : []),
    '',
    '4. DECISIONS & ROLES',
    `   decisionModel              : ${inputs.decisionModel || '—'}`,
    `   reservedMatters            : ${inputs.reservedMatters.join('; ') || '—'}`,
    ...(d.reservedMatters.includes('Take on debt above a threshold')
      ? [`   debtThreshold              : ${inputs.debtThreshold || '—'}`]
      : []),
    `   removalProcess             : ${inputs.removalProcess || '—'}`,
    `   departureRole              : ${inputs.departureRole || '—'}`,
    '',
    '5. INTELLECTUAL PROPERTY',
    `   ipPreIncorporation         : ${inputs.ipPreIncorporation || '—'}`,
    ...priorIpLines,
    `   publiclyFunded             : ${inputs.publiclyFunded || '—'}`,
    `   createdAtEmployer          : ${inputs.createdAtEmployer || '—'}`,
    ...digitalLines,
    '',
    '6. PROTECTIONS & LEGAL',
    `   confidentiality            : ${inputs.confidentiality || '—'}`,
    `   nonSolicit                 : ${inputs.nonSolicit || '—'}`,
    `   restraint                  : ${inputs.restraint || '—'}`,
    ...(d.restraint === 'Yes' ? [
      `   restraintMonths            : ${inputs.restraintMonths || '—'}`,
      `   restraintArea              : ${inputs.restraintArea || '—'}`,
    ] : []),
    `   deadlock                   : ${inputs.deadlock || '—'}`,
    `   disputeForum               : ${inputs.disputeForum || '—'}`,
    `   governingLaw               : ${inputs.governingLaw || '—'}`,
    ...sigLines,
    '',
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
  return buildLegalDocumentPdf(lines)
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

/* ── Service Level Agreement (SLA) download builders ──────── */
function buildSlaPdf(d: SlaWizardData, completedAt: string | null): Blob {
  const date = completedAt ? new Date(completedAt).toLocaleDateString('en-ZA') : new Date().toLocaleDateString('en-ZA')
  const v = (s: string | undefined | null) => s || '—'
  const yn = (b: boolean) => (b ? 'Yes' : 'No')
  const lines: string[] = [
    'SERVICE LEVEL AGREEMENT (SLA)',
    '',
    `Date: ${date}`,
    `Generated by: The Startup Legal`,
    '',
    '─────────────────────────────────────────',
    '1. PARTIES',
    '─────────────────────────────────────────',
    'Service Provider',
    `  Name        : ${v(d.provider?.legalName || d.provider?.fullNames || d.providerName)}`,
    `  Reg No.     : ${v(d.provider?.regNumber || d.providerReg)}`,
    `  Email       : ${v(d.provider?.email || d.providerEmail)}`,
    '',
    'Customer',
    `  Name        : ${v(d.customer?.legalName || d.customer?.fullNames || d.customerName)}`,
    `  Reg No.     : ${v(d.customer?.regNumber || d.customerReg)}`,
    `  Email       : ${v(d.customer?.email || d.customerEmail)}`,
    '',
    '─────────────────────────────────────────',
    '2. AGREEMENT DETAILS',
    '─────────────────────────────────────────',
    `Service Description : ${v(d.serviceDescription)}`,
    `Start Date          : ${v(d.startDate)}`,
    `Term                : ${v(d.termType)}`,
    ...(d.termType === 'Fixed end date' ? [`End Date            : ${v(d.endDate)}`] : []),
    '',
    '─────────────────────────────────────────',
    '3. MODULES',
    '─────────────────────────────────────────',
    `Selected            : ${d.modules.length > 0 ? d.modules.join(', ') : '—'}`,
    '',
    ...(d.modules.includes('Availability') ? [
      '─────────────────────────────────────────',
      '4. AVAILABILITY',
      '─────────────────────────────────────────',
      `Uptime Target       : ${v(d.uptimeTarget)}%`,
      `Measurement Period  : ${v(d.uptimePeriod)}`,
      `Exclusions          : ${d.uptimeExclusions.join(', ') || '—'}`,
      '',
    ] : []),
    ...(d.modules.includes('Support') ? [
      '─────────────────────────────────────────',
      '5. SUPPORT',
      '─────────────────────────────────────────',
      `Support Hours       : ${v(d.supportHours)}`,
      ...(d.supportHours === 'Custom' ? [`Custom Hours        : ${v(d.supportHoursCustom)}`] : []),
      `Support Channels    : ${d.supportChannels.join(', ') || '—'}`,
      '',
    ] : []),
    ...(d.modules.includes('Incident response') ? [
      '─────────────────────────────────────────',
      '6. INCIDENT RESPONSE',
      '─────────────────────────────────────────',
      `Severity Model      : ${yn(d.useSeverityModel)}`,
      ...d.severityTargets.map((t) => `  ${t.severity}  Response: ${t.responseTarget}  Resolution: ${t.resolutionTarget}`),
      `Escalation Contacts : ${d.escalationContacts.map((c) => `${c.name} (${c.role}) ${c.email}`).join('; ') || '—'}`,
      '',
    ] : []),
    ...(d.modules.includes('Maintenance') ? [
      '─────────────────────────────────────────',
      '7. MAINTENANCE',
      '─────────────────────────────────────────',
      `Planned Window      : ${v(d.maintenanceWindow)}`,
      `Notice Period       : ${v(d.maintenanceNoticeHours)} hours`,
      `Emergency Permitted : ${yn(d.emergencyMaintenance)}`,
      '',
    ] : []),
    ...(d.modules.includes('Backups and restore') ? [
      '─────────────────────────────────────────',
      '8. BACKUPS AND RESTORE',
      '─────────────────────────────────────────',
      `Backup Frequency    : ${v(d.backupFrequency)}`,
      `RTO                 : ${v(d.rtoHours)} hours`,
      `RPO                 : ${v(d.rpoHours)} hours`,
      `Retention           : ${v(d.backupRetentionDays)} days`,
      '',
    ] : []),
    ...(d.modules.includes('Security') ? [
      '─────────────────────────────────────────',
      '9. SECURITY',
      '─────────────────────────────────────────',
      `Commitments         : ${d.securityCommitments.join(', ') || '—'}`,
      `Breach Notification : ${v(d.breachNoticeHours)} hours`,
      '',
    ] : []),
    ...(d.modules.includes('Service credits') ? [
      '─────────────────────────────────────────',
      '10. SERVICE CREDITS',
      '─────────────────────────────────────────',
      ...d.creditTiers.map((t, i) => `  Tier ${i + 1}: Below ${t.uptimeBelow}% → ${t.creditPct}% credit`),
      `Monthly Cap         : ${v(d.creditCapPct)}%`,
      `Claim Notice Period : ${v(d.creditClaimDays)} days`,
      `Sole Remedy         : ${yn(d.creditsSoleRemedy)}`,
      '',
    ] : []),
    '─────────────────────────────────────────',
    '11. LEGAL AND SIGNING',
    '─────────────────────────────────────────',
    `Governing Law       : ${v(d.governingLaw)}`,
    `Dispute Forum       : ${v(d.disputeForum)}`,
    ...(d.disputeForum === 'South African courts' ? [`Jurisdiction        : ${v(d.jurisdictionCity)}`] : []),
    `Signature Method    : ${v(d.signatureMethod)}`,
    ...(d.signatureMethod === 'Platform signature' ? [`Signing Order       : ${v(d.signingOrder)}`] : []),
    `Signatories         : ${d.signatories.filter((s) => s.name).map((s) => `${s.name} (${s.title})`).join(', ') || '—'}`,
    '',
    '─────────────────────────────────────────',
    'DISCLAIMER: This document is generated for reference purposes only.',
    'It does not constitute legal advice. Consult a qualified attorney.',
    '─────────────────────────────────────────',
  ]
  return buildLegalDocumentPdf(lines)
}

function buildSlaEvidencePack(d: SlaWizardData, completedAt: string | null): Blob {
  const now = new Date()
  const v = (s: string | undefined | null) => s || '—'
  const yn = (b: boolean) => (b ? 'Yes' : 'No')
  const lines = [
    'TSL EVIDENCE PACK — SERVICE LEVEL AGREEMENT (SLA)',
    '==================================================',
    `Blueprint ID       : tsl-sla-${now.getTime()}`,
    `Template Version   : v2.0`,
    `Document Version   : SLA-2026`,
    `Generated Date     : ${now.toLocaleDateString('en-ZA')}`,
    `Completion Time    : ${completedAt ? new Date(completedAt).toLocaleString('en-ZA') : now.toLocaleString('en-ZA')}`,
    `Platform           : The Startup Legal`,
    '',
    '── WIZARD ANSWERS ──────────────────────────',
    '',
    '1. PARTIES',
    `   Service Provider : ${v(d.provider?.legalName || d.provider?.fullNames || d.providerName)}`,
    `   Provider Reg     : ${v(d.provider?.regNumber || d.providerReg)}`,
    `   Provider Email   : ${v(d.provider?.email || d.providerEmail)}`,
    `   Customer         : ${v(d.customer?.legalName || d.customer?.fullNames || d.customerName)}`,
    `   Customer Reg     : ${v(d.customer?.regNumber || d.customerReg)}`,
    `   Customer Email   : ${v(d.customer?.email || d.customerEmail)}`,
    '',
    '2. AGREEMENT',
    `   Service Desc     : ${v(d.serviceDescription)}`,
    `   Start Date       : ${v(d.startDate)}`,
    `   Term             : ${v(d.termType)}`,
    ...(d.termType === 'Fixed end date' ? [`   End Date         : ${v(d.endDate)}`] : []),
    '',
    '3. MODULES SELECTED',
    `   ${d.modules.join(', ') || '—'}`,
    '',
    ...(d.modules.includes('Availability') ? [
      '4. AVAILABILITY',
      `   Uptime Target    : ${v(d.uptimeTarget)}%`,
      `   Period           : ${v(d.uptimePeriod)}`,
      `   Exclusions       : ${d.uptimeExclusions.join(', ') || '—'}`,
      '',
    ] : []),
    ...(d.modules.includes('Support') ? [
      '5. SUPPORT',
      `   Hours            : ${v(d.supportHours)}`,
      `   Channels         : ${d.supportChannels.join(', ') || '—'}`,
      '',
    ] : []),
    ...(d.modules.includes('Incident response') ? [
      '6. INCIDENT RESPONSE',
      `   Severity Model   : ${yn(d.useSeverityModel)}`,
      ...d.severityTargets.map((t) => `   ${t.severity}: Response ${t.responseTarget}, Resolution ${t.resolutionTarget}`),
      `   Escalation       : ${d.escalationContacts.map((c) => `${c.name} <${c.email}>`).join('; ') || '—'}`,
      '',
    ] : []),
    ...(d.modules.includes('Maintenance') ? [
      '7. MAINTENANCE',
      `   Window           : ${v(d.maintenanceWindow)}`,
      `   Notice           : ${v(d.maintenanceNoticeHours)} hours`,
      `   Emergency        : ${yn(d.emergencyMaintenance)}`,
      '',
    ] : []),
    ...(d.modules.includes('Backups and restore') ? [
      '8. BACKUPS',
      `   Frequency        : ${v(d.backupFrequency)}`,
      `   RTO              : ${v(d.rtoHours)} hours`,
      `   RPO              : ${v(d.rpoHours)} hours`,
      `   Retention        : ${v(d.backupRetentionDays)} days`,
      '',
    ] : []),
    ...(d.modules.includes('Security') ? [
      '9. SECURITY',
      `   Commitments      : ${d.securityCommitments.join(', ') || '—'}`,
      `   Breach Notice    : ${v(d.breachNoticeHours)} hours`,
      '',
    ] : []),
    ...(d.modules.includes('Service credits') ? [
      '10. SERVICE CREDITS',
      ...d.creditTiers.map((t, i) => `    Tier ${i + 1}: Below ${t.uptimeBelow}% → ${t.creditPct}%`),
      `    Monthly Cap      : ${v(d.creditCapPct)}%`,
      `    Claim Days       : ${v(d.creditClaimDays)}`,
      `    Sole Remedy      : ${yn(d.creditsSoleRemedy)}`,
      '',
    ] : []),
    '11. LEGAL',
    `   Governing Law    : ${v(d.governingLaw)}`,
    `   Dispute Forum    : ${v(d.disputeForum)}`,
    `   Signature Method : ${v(d.signatureMethod)}`,
    `   Signatories      : ${d.signatories.filter((s) => s.name).map((s) => `${s.name} (${s.title})`).join(', ') || '—'}`,
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
  const { profile } = useUserProfile()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { state: ndaState, startWizard, saveProgress, completeWizard, resetWizard: resetNda } = useNdaWizard()
  const { state: empState, startWizard: startEmp, saveProgress: saveEmpProgress, completeWizard: completeEmp, resetWizard: resetEmp } = useEmploymentWizard()
  const mapPrivacyFields = useCallback(
    (data: PrivacyPolicyWizardData) => mapPrivacyPolicyFields(data, profile) as unknown as Record<string, unknown>,
    [profile],
  )
  const { state: ppState, startWizard: startPP, saveProgress: savePPProgress, completeWizard: completePP, resetWizard: resetPP } = usePrivacyPolicyWizard(mapPrivacyFields)
  const { state: faState, startWizard: startFA, saveProgress: saveFAProgress, completeWizard: completeFA, resetWizard: resetFA } = useFounderAgreementWizard()
  const { state: saState, startWizard: startSA, saveProgress: saveSAProgress, completeWizard: completeSA, resetWizard: resetSA } = useServiceAgreementWizard()
  const mapSlaApiFields = useCallback(
    (data: SlaWizardData) => mapSlaFields(data) as unknown as Record<string, unknown>,
    [],
  )
  const { state: slaState, startWizard: startSLA, saveProgress: saveSLAProgress, completeWizard: completeSLA, resetWizard: resetSLA } = useSlaWizard(mapSlaApiFields)

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
  const [isSLAModalOpen, setIsSLAModalOpen] = useState(false)
  const [comingSoonTitle, setComingSoonTitle] = useState<string | null>(null)
  const [ndaToast, setNdaToast] = useState('')
  const [counselCreditsForGate, setCounselCreditsForGate] = useState<CounselCredits | null>(null)
  const [isNoCounselCreditModalOpen, setIsNoCounselCreditModalOpen] = useState(false)
  const [insufficientUnits, setInsufficientUnits] = useState<{ remaining: number; required: number; blueprintName: string; pricePerUnit: number; iconName?: string } | null>(null)
  const [pdfConfirm, setPdfConfirm] = useState<{ blueprintId: string; downloadKey: string; filename: string; credits: number; build: () => Blob | Promise<Blob> } | null>(null)
  const pdfDownloadedKey = 'tsl-pdf-downloaded'
  const [pdfDownloaded, setPdfDownloaded] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('tsl-pdf-downloaded')
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set()
    } catch { return new Set() }
  })
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
  // A persisted queue is authoritative: a zero count means the user already
  // started every instance of that Blueprint. Do not re-seed it on refresh.
  const queueWasRestoredRef = useRef((() => {
    try { return localStorage.getItem(queueStorageKey) !== null } catch { return false }
  })())
  // Whether the queue has been seeded from the server-authoritative selectedWizards
  const queueSeedRef = useRef(false)
  // The New-tab item is consumed as soon as the user presses Start. The wizard
  // close/complete handlers still call decrementQueue for older flows, so this
  // ref prevents that same item from being deducted a second time.
  const startedQueueItemRef = useRef<string | null>(null)
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

  const pushCompletedInstance = (wizardType: string, data: unknown, completedAt: string): string => {
    const id = `${wizardType}:${completedAt}:${Math.random().toString(36).slice(2, 7)}`
    const entry: CompletedInstance = { id, wizardType, completedAt, data }
    setCompletedInstances((prev) => {
      const next = [...prev, entry]
      localStorage.setItem(completedInstancesKey, JSON.stringify(next))
      return next
    })
    return id
  }

  // ── In-progress instances ─────────────────────────────────────────────────
  // Each closed-mid-progress run is stored here so multiple instances of the
  // same blueprint type each appear as a separate card in the In Progress tab.
  const inProgressInstancesKey = 'tsl-dashboard-inprogress-instances'
  const [inProgressInstances, setInProgressInstances] = useState<InProgressInstance[]>(() => {
    try {
      const raw = localStorage.getItem('tsl-dashboard-inprogress-instances')
      return raw ? (JSON.parse(raw) as InProgressInstance[]) : []
    } catch { return [] }
  })

  // Ref tracking which in-progress instance is currently being continued so
  // onClose/onComplete handlers can update or remove it.
  const continuingInstanceRef = useRef<string | null>(null)
  // Flag set by onComplete so the subsequent onClose call (fired by all modals
  // after generation) knows not to push a new in-progress instance.
  const justCompletedRef = useRef(false)

  const pushInProgressInstance = (wizardType: string, step: number, progress: number, data: unknown): string => {
    const id = `${wizardType}:${Date.now()}:${Math.random().toString(36).slice(2, 7)}`
    const entry: InProgressInstance = { id, wizardType, step, progress, startedAt: new Date().toISOString(), data }
    setInProgressInstances((prev) => {
      const next = [...prev, entry]
      localStorage.setItem(inProgressInstancesKey, JSON.stringify(next))
      return next
    })
    return id
  }

  const updateInProgressInstance = (id: string, step: number, progress: number, data: unknown) => {
    setInProgressInstances((prev) => {
      const next = prev.map((inst) => inst.id === id ? { ...inst, step, progress, data } : inst)
      localStorage.setItem(inProgressInstancesKey, JSON.stringify(next))
      return next
    })
  }

  const removeInProgressInstance = (id: string) => {
    setInProgressInstances((prev) => {
      const next = prev.filter((inst) => inst.id !== id)
      localStorage.setItem(inProgressInstancesKey, JSON.stringify(next))
      return next
    })
  }

  // Derived: set of blueprint types that have at least one in-progress instance
  const inProgressTitles = new Set<string>(inProgressInstances.map((inst) => inst.wizardType))

  // Decrement one instance from the New queue and open the corresponding modal.
  const handleStart = (title: string) => {
    // Do NOT flip the view yet — the landing page stays visible behind the
    // modal. The transition to the tabbed dashboard happens only when the
    // user closes or completes the modal (see onClose / onComplete handlers).

    // Consume the exact New-tab item immediately, not when the modal closes.
    // Persisting the zero count means a browser refresh cannot restore it from
    // the original server-side selection quantity.
    startedQueueItemRef.current = title
    setQueuedCounts((prev) => {
      const current = prev[title] ?? 0
      const next = { ...prev, [title]: Math.max(0, current - 1) }
      localStorage.setItem(queueStorageKey, JSON.stringify(next))
      queueWasRestoredRef.current = true
      return next
    })

    if (title === 'Non-Disclosure Agreement (NDA)') {
      resetNda(); startWizard(); setIsNdaModalOpen(true)
    } else if (title === 'Employment Offer Letter') {
      resetEmp(); startEmp(); setIsEmpModalOpen(true)
    } else if (title === 'Privacy & Cookies Policy') {
      resetPP(); startPP(); setIsPPModalOpen(true)
    } else if (title === 'Founder Agreement' || title === 'Founders Agreement and IP Assignment' || title === 'Founders agreement and IP assignment') {
      resetFA(); startFA(); setIsFAModalOpen(true)
    } else if (title === 'Service Level Agreement (SLA)') {
      resetSLA(); startSLA(); setIsSLAModalOpen(true)
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

        // When the user returns from "Add to Dashboard", add only the quantities
        // selected in that action. The server response contains every historical
        // selection, which must not overwrite items already started in New.
        if (addedCount > 0 && locationState?.addedWizards) {
          const addedWizards = locationState.addedWizards
          queueSeedRef.current = true
          queueWasRestoredRef.current = true
          setQueuedCounts((prev) => {
            const next = { ...prev }
            for (const addedWizard of addedWizards) {
              const quantity = Math.max(1, Number(addedWizard.quantity) || 1)
              next[addedWizard.title] = (next[addedWizard.title] ?? 0) + quantity
            }
            localStorage.setItem(queueStorageKey, JSON.stringify(next))
            return next
          })
          // This is a one-time return payload. Browser refresh preserves
          // history.state, so remove it after seeding; otherwise every reload
          // would restore the original server quantity over the saved queue.
          navigate(location.pathname, { replace: true, state: null })
          return
        }

        // Only seed the queue from server data when the user is already on the
        // returning (tabbed) dashboard — not on the first-time landing.
        // On the first-time landing the queue is populated one wizard at a time
        // as the user clicks Start, so auto-seeding all selectedWizards would
        // flood the New tab with every blueprint the account has ever saved.
        if (!queueSeedRef.current && !queueWasRestoredRef.current && localStorage.getItem('tsl-dashboard-view-mode') === 'returning') {
          queueSeedRef.current = true
          setQueuedCounts((prev) => {
            const next = { ...prev }
            for (const w of freshAccess.selectedWizards) {
              if ((next[w.title] ?? 0) <= 0) {
                next[w.title] = w.quantity ?? 1
              }
            }
            localStorage.setItem(queueStorageKey, JSON.stringify(next))
            queueWasRestoredRef.current = true
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
          pricePerUnit: shortage.blueprintRunTopUpRate ?? 149,
          iconName: BLUEPRINT_ICON_NAME[bpName] ?? 'Shield',
        })
      } else showNdaToast(response.message || 'Unable to generate the final document.')
      return
    }
    if (!alreadyCharged && response.data.unitsCharged > 0) localStorage.setItem(chargeKey, 'true')
    setSubscription((current) => current ? { ...current, usage: response.data!.usage } : current)
    triggerDownload(blob, filename)
    // Mark the instance as PDF-downloaded so the confirm modal won't show again
    setPdfDownloaded((prev) => {
      const next = new Set([...prev, downloadKey])
      localStorage.setItem(pdfDownloadedKey, JSON.stringify([...next]))
      return next
    })
  }
  const PDF_CREDITS: Record<string, number> = {
    'nda': 1,
    'employment-offer-letter': 2,
    'privacy-policy': 2,
    'service-agreement': 2,
    'service-level-agreement': 3,
    'founders-agreement-ip': 4,
  }

  const confirmPdfDownload = (blueprintId: string, downloadKey: string, filename: string, build: () => Blob | Promise<Blob>) => {
    // Skip confirm if already downloaded (credit already deducted)
    if (pdfDownloaded.has(downloadKey)) {
      void downloadFinalBlueprint(blueprintId, downloadKey, filename, build)
      return
    }
    const credits = PDF_CREDITS[blueprintId] ?? 1
    setPdfConfirm({ blueprintId, downloadKey, filename, credits, build })
  }

  const showNdaToast = (msg: string) => {
    if (ndaToastTimerRef.current) clearTimeout(ndaToastTimerRef.current)
    setNdaToast(msg)
    ndaToastTimerRef.current = setTimeout(() => setNdaToast(''), 5000)
  }

  const decrementQueue = (title: string) => {
    if (startedQueueItemRef.current === title) {
      startedQueueItemRef.current = null
      return
    }
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
    showNdaToast('NDA generated successfully. Your document is ready to download.')
  }

  const handleEmpComplete = (data: EmploymentWizardData) => {
    const completedAt = new Date().toISOString()
    saveEmpProgress(6, data)
    completeEmp(data)
    pushCompletedInstance('Employment Offer Letter', data, completedAt)
    showNdaToast('Employment Offer Letter generated successfully. Your document is ready to download.')
  }

  const handlePPComplete = (data: PrivacyPolicyWizardData) => {
    const completedAt = new Date().toISOString()
    savePPProgress(7, data)
    completePP()
    pushCompletedInstance('Privacy & Cookies Policy', data, completedAt)
    showNdaToast('Privacy Policy generated successfully. Your document is ready to download.')
  }

  const handleFAComplete = (data: FounderAgreementWizardData) => {
    const completedAt = new Date().toISOString()
    saveFAProgress(8, data)
    completeFA()
    pushCompletedInstance('Founders agreement and IP assignment', data, completedAt)
    showNdaToast("Founders' Agreement generated successfully. Your document is ready to download.")
  }

  const routeFounderPublicFundingToCounsel = useCallback(async (fields: FounderAgreementFieldMap) => {
    // Check whether the user has at least one counsel credit before routing.
    const creditsRes = await counselApi.credits()
    const credits = creditsRes.success && creditsRes.data ? creditsRes.data : null
    if (!credits || credits.creditsRemaining < 1) {
      setCounselCreditsForGate(credits)
      setIsNoCounselCreditModalOpen(true)
      return null
    }
    const response = await counselApi.createPublicFundingReview({
      subject: "Founders' Agreement & IP Assignment - Publicly Funded IP Review",
      company: fields.intended_name || 'Founder company',
      wizard_data: fields as unknown as Record<string, unknown>,
    })
    if (!response.success || !response.data) {
      showNdaToast(response.message || 'Unable to submit this review to admin.')
      return null
    }
    showNdaToast('Your publicly funded IP review has been sent to admin for counsel assignment.')
    return response.data
  }, [])

  const refreshFounderPublicFundingReview = useCallback(async (requestId: string) => {
    const response = await counselApi.publicFundingReviewStatus(requestId)
    return response.success && response.data ? response.data : null
  }, [])

  const handleSAComplete = (data: ServiceAgreementWizardData) => {
    const completedAt = new Date().toISOString()
    saveSAProgress(8, data)
    completeSA()
    pushCompletedInstance('Service Agreement', data, completedAt)
    showNdaToast('Service Agreement generated successfully. Your document is ready to download.')
  }

  const handleSLAComplete = (data: SlaWizardData) => {
    const completedAt = new Date().toISOString()
    saveSLAProgress(10, data)
    completeSLA()
    pushCompletedInstance('Service Level Agreement (SLA)', data, completedAt)
    showNdaToast('Service Level Agreement generated successfully. Your document is ready to download.')
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
  const isFreePlan = (subscription?.planId?.toLowerCase() ?? user?.plan?.toLowerCase()) === 'free'
  const isPaidPlan = Boolean(wizardAccess?.hasSubscription) && !isFreePlan

  if (!isPaidDashboard) {
    return (
      <DashboardShell activeSection="Dashboard">
        <header className="user-dashboard__hero user-dashboard__hero--landing">
          <div>
            <h2>Welcome to The Startup Legal! 🎉</h2>
            <p>
              {isPaidPlan ? (
                <>
                  You're all set up with your{' '}
                  <strong>{`${wizardAccess?.plan ?? ''} Plan`}</strong>. Let's get your first legal document created.
                </>
              ) : (
                <>
                  You're all set up with your{' '}
                  <strong>
                    {wizardAccess?.hasSubscription
                      ? `${wizardAccess.plan ?? ''} Plan`
                      : 'no active subscription'}
                  </strong>.{' '}
                  {wizardAccess?.hasSubscription
                    ? 'Select your wizards to start creating documents.'
                    : 'Choose a plan and select your wizards to start creating documents.'}
                </>
              )}
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
            isFree={(subscription?.planId?.toLowerCase() ?? user?.plan?.toLowerCase()) === 'free'}
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
                <h2>Review Your Pre-Selected Blueprints</h2>
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
                  const hasAccess = wizardAccessConfirmed && wizardAccess?.hasSubscription
                  const selectedQty = hasAccess
                    ? (wizardAccess?.selectedWizards ?? []).filter((sw) => sw.title === wizard.title).length
                    : 0
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
                          Cost
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
                  Browse All Blueprints
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
            modal is open. Closing (X) lands on In Progress tab. Completing lands on Completed tab. */}
        {isNdaModalOpen && (
          <NdaWizardModal
            onClose={(step, data) => {
              if (justCompletedRef.current) { justCompletedRef.current = false; return }
              const cid = continuingInstanceRef.current
              if (cid) { updateInProgressInstance(cid, step, Math.round(((step - 1) / 3) * 100), data); continuingInstanceRef.current = null }
              else { decrementQueue('Non-Disclosure Agreement (NDA)'); pushInProgressInstance('Non-Disclosure Agreement (NDA)', step, Math.round(((step - 1) / 3) * 100), data) }
              setIsNdaModalOpen(false); setActiveTab('inProgress'); openReturningDashboard()
            }}
            initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
            initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as NdaWizardData | undefined) : undefined}
            onStepChange={(step, data) => saveProgress(step, data)}
            onComplete={(data) => {
              const cid = continuingInstanceRef.current
              justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
              else { decrementQueue('Non-Disclosure Agreement (NDA)') }
              handleNdaComplete(data); setIsNdaModalOpen(false); setActiveTab('completed'); openReturningDashboard()
            }}
          />
        )}

        {isEmpModalOpen && (
          <EmploymentWizardModal
            onClose={(step, data) => {
              if (justCompletedRef.current) { justCompletedRef.current = false; return }
              const cid = continuingInstanceRef.current
              if (cid) { updateInProgressInstance(cid, step ?? 1, Math.round(((( step ?? 1) - 1) / 5) * 100), data); continuingInstanceRef.current = null }
              else { decrementQueue('Employment Offer Letter'); pushInProgressInstance('Employment Offer Letter', step ?? 1, Math.round((((step ?? 1) - 1) / 5) * 100), data) }
              setIsEmpModalOpen(false); setActiveTab('inProgress'); openReturningDashboard()
            }}
            initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
            initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as EmploymentWizardData | undefined) : undefined}
            onStepChange={(step, data) => saveEmpProgress(step, data)}
            onComplete={(data) => {
              const cid = continuingInstanceRef.current
              justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
              else { decrementQueue('Employment Offer Letter') }
              handleEmpComplete(data); setIsEmpModalOpen(false); setActiveTab('completed'); openReturningDashboard()
            }}
          />
        )}

        {isPPModalOpen && (
          <PrivacyPolicyWizardModal
            onClose={(step, data) => {
              if (justCompletedRef.current) { justCompletedRef.current = false; return }
              const cid = continuingInstanceRef.current
              if (cid) { updateInProgressInstance(cid, step, Math.round(((step - 1) / 6) * 100), data); continuingInstanceRef.current = null }
              else { decrementQueue('Privacy & Cookies Policy'); pushInProgressInstance('Privacy & Cookies Policy', step, Math.round(((step - 1) / 6) * 100), data) }
              setIsPPModalOpen(false); setActiveTab('inProgress'); openReturningDashboard()
            }}
            initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
            initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as PrivacyPolicyWizardData | undefined) : { responsibleParty: profile.legalName || profile.individualFullNames || profile.tradingName || '' } as Partial<PrivacyPolicyWizardData> as PrivacyPolicyWizardData}
            onStepChange={(step, data) => savePPProgress(step, data)}
            onComplete={(data) => {
              const cid = continuingInstanceRef.current
              justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
              else { decrementQueue('Privacy & Cookies Policy') }
              handlePPComplete(data); setIsPPModalOpen(false); setActiveTab('completed'); openReturningDashboard()
            }}
          />
        )}

        {isFAModalOpen && (
          <FounderAgreementWizardModal
            onClose={(step, data) => {
              if (justCompletedRef.current) { justCompletedRef.current = false; return }
              const cid = continuingInstanceRef.current
              if (cid) { updateInProgressInstance(cid, step ?? 1, Math.round((((step ?? 1) - 1) / 7) * 100), data); continuingInstanceRef.current = null }
              else { decrementQueue('Founders agreement and IP assignment'); pushInProgressInstance('Founders agreement and IP assignment', step ?? 1, Math.round((((step ?? 1) - 1) / 7) * 100), data) }
              setIsFAModalOpen(false); setActiveTab('inProgress'); openReturningDashboard()
            }}
            initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
            initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as FounderAgreementWizardData | undefined) : undefined}
            onStepChange={(step, data) => saveFAProgress(step, data)}
            onComplete={(data) => {
              const cid = continuingInstanceRef.current
              justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
              else { decrementQueue('Founders agreement and IP assignment') }
              handleFAComplete(data); setIsFAModalOpen(false); setActiveTab('completed'); openReturningDashboard()
            }}
            onRouteToCounsel={routeFounderPublicFundingToCounsel}
            onRefreshPublicFundingReview={refreshFounderPublicFundingReview}
          />
        )}

        {isSAModalOpen && (
          <ServiceAgreementWizardModal
            onClose={() => {
              if (justCompletedRef.current) { justCompletedRef.current = false; return }
              const cid = continuingInstanceRef.current
              if (cid) { updateInProgressInstance(cid, saState.step, saState.progress, saState.data); continuingInstanceRef.current = null }
              else { decrementQueue('Service Agreement'); pushInProgressInstance('Service Agreement', saState.step, saState.progress, saState.data) }
              setIsSAModalOpen(false); setActiveTab('inProgress'); openReturningDashboard()
            }}
            initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
            initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as ServiceAgreementWizardData | undefined) : undefined}
            onStepChange={(step, data) => saveSAProgress(step, data)}
            onComplete={(data) => {
              const cid = continuingInstanceRef.current
              justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
              else { decrementQueue('Service Agreement') }
              handleSAComplete(data); setIsSAModalOpen(false); setActiveTab('completed'); openReturningDashboard()
            }}
          />
        )}

        {isSLAModalOpen && (
          <SlaWizardModal
            onClose={(step, data) => {
              if (justCompletedRef.current) { justCompletedRef.current = false; return }
              const cid = continuingInstanceRef.current
              if (cid) { updateInProgressInstance(cid, step ?? 1, Math.round((((step ?? 1) - 1) / 9) * 100), data); continuingInstanceRef.current = null }
              else { decrementQueue('Service Level Agreement (SLA)'); pushInProgressInstance('Service Level Agreement (SLA)', step ?? 1, Math.round((((step ?? 1) - 1) / 9) * 100), data) }
              setIsSLAModalOpen(false); setActiveTab('inProgress'); openReturningDashboard()
            }}
            initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
            initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as SlaWizardData | undefined) : undefined}
            onStepChange={(step, data) => saveSLAProgress(step, data)}
            onComplete={(data) => {
              const cid = continuingInstanceRef.current
              justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
              else { decrementQueue('Service Level Agreement (SLA)') }
              handleSLAComplete(data); setIsSLAModalOpen(false); setActiveTab('completed'); openReturningDashboard()
            }}
          />
        )}

        <CounselCreditsModal
          isOpen={isNoCounselCreditModalOpen}
          onClose={() => setIsNoCounselCreditModalOpen(false)}
          currentPlan={counselCreditsForGate?.plan ?? subscription?.planName ?? 'Launchpad'}
          onTopUp={(plan: TopUpPlan) => {
            setIsNoCounselCreditModalOpen(false)
            navigate('/dashboard/counsel/topup', { state: { plan, credits: counselCreditsForGate } })
          }}
        />

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
          isFree={(subscription?.planId?.toLowerCase() ?? user?.plan?.toLowerCase()) === 'free'}
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
              <Calendar size={24} />
            </span>
            <div>
              {(() => {
                const raw = subscription?.nextBillingDate
                const date = raw ? new Date(`${raw}T00:00:00.000Z`) : null
                const day  = date ? date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', timeZone: 'UTC' }) : '—'
                const year = date ? date.getUTCFullYear() : ''
                return (
                  <>
                    <div className="user-dashboard__stat-date">{day}</div>
                    {year && <div className="user-dashboard__stat-year">{year}</div>}
                  </>
                )
              })()}
              <div className="user-dashboard__stat-billing">Next Billing</div>
              <div className="user-dashboard__stat-plan">{subscription?.planName ?? capitalizePlan(user?.plan)} Plan</div>
            </div>
          </article>
        </section>

        <section className="user-dashboard__workflow-panel">
          {/* ── Tab counts ────────────────────────────────────────────── */}
          {(() => {
            const newCount = availableWizards.reduce((sum, w) => sum + w.queuedCount, 0)
            const inProgressCount = inProgressInstances.length
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
                    <span className="user-dashboard__tab-badge" aria-label={`${newCount} available`}>
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
                            : `${wizard.queuedCount} available`}
                        </strong>
                      </div>
                      <button
                        type="button"
                        className="user-dashboard__new-row-btn"
                        onClick={() => handleStart(wizard.title)}
                      >
                        <Play size={14} /> Start
                      </button>
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
              {inProgressInstances.map((inst) => (
                <article className="user-dashboard__progress-card" key={inst.id}>
                  <h3>{inst.wizardType}</h3>
                  <span className="user-dashboard__status-badge">In Progress</span>
                  <div className="user-dashboard__progress-row">
                    <span>Progress</span>
                    <strong>{inst.progress}%</strong>
                  </div>
                  <div className="user-dashboard__progress-track">
                    <span style={{ width: `${inst.progress}%` }} />
                  </div>
                  <div className="user-dashboard__progress-footer">
                    <span>{relativeUpdated(inst.startedAt)}</span>
                    <button
                      type="button"
                      onClick={() => {
                        continuingInstanceRef.current = inst.id
                        if (inst.wizardType === 'Non-Disclosure Agreement (NDA)') { resetNda(); startWizard(); setIsNdaModalOpen(true) }
                        else if (inst.wizardType === 'Employment Offer Letter') { resetEmp(); startEmp(); setIsEmpModalOpen(true) }
                        else if (inst.wizardType === 'Privacy & Cookies Policy') { resetPP(); startPP(); setIsPPModalOpen(true) }
                        else if (inst.wizardType === 'Founders agreement and IP assignment') { resetFA(); startFA(); setIsFAModalOpen(true) }
                        else if (inst.wizardType === 'Service Agreement') { resetSA(); startSA(); setIsSAModalOpen(true) }
                        else if (inst.wizardType === 'Service Level Agreement (SLA)') { resetSLA(); startSLA(); setIsSLAModalOpen(true) }
                      }}
                    >
                      Continue <ArrowRight size={15} />
                    </button>
                  </div>
                </article>
              ))}

              {inProgressInstances.length === 0 && (
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
                const isPdfDownloaded = pdfDownloaded.has(id)

                if (wizardType === 'Non-Disclosure Agreement (NDA)') {
                  const ndaData = data as import('./NdaWizardModal').NdaWizardData
                  return (
                    <article className="user-dashboard__completed-card" key={id}>
                      <span className={`user-dashboard__completed-icon${isPdfDownloaded ? ' user-dashboard__completed-icon--downloaded' : ''}`}><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Non-Disclosure Agreement (NDA)</h3>
                        <p>Completed {displayDate}</p>
                        {isPdfDownloaded && <p className="user-dashboard__downloaded-label">Downloaded</p>}
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => confirmPdfDownload('nda', id, 'NDA-Document.pdf', () => buildNdaPdf(ndaData, completedAt))}>
                          <Download size={16} /> Download PDF
                        </button>
                        <button type="button" onClick={() => void downloadFinalBlueprint('nda', id, 'NDA-Document.docx', () => buildNdaDocx(ndaData, completedAt))}>
                          <Download size={16} /> Download DOCX
                        </button>
                        <button type="button" onClick={() => void buildNdaEvidencePack(ndaData, completedAt, id).then((pack) => triggerDownload(pack, 'NDA-Evidence-Pack.txt'))}>
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
                      <span className={`user-dashboard__completed-icon${isPdfDownloaded ? ' user-dashboard__completed-icon--downloaded' : ''}`}><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Employment Offer Letter</h3>
                        <p>Completed {displayDate}</p>
                        {isPdfDownloaded && <p className="user-dashboard__downloaded-label">Downloaded</p>}
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => confirmPdfDownload('employment-offer-letter', id, 'Employment-Offer-Letter.pdf', () => buildEmploymentPdf(empData, completedAt))}>
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
                      <span className={`user-dashboard__completed-icon${isPdfDownloaded ? ' user-dashboard__completed-icon--downloaded' : ''}`}><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Privacy Policy (POPIA Compliant)</h3>
                        <p>Completed {displayDate}</p>
                        {isPdfDownloaded && <p className="user-dashboard__downloaded-label">Downloaded</p>}
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => confirmPdfDownload('privacy-policy', id, 'Privacy-Policy.pdf', () => buildPrivacyPolicyPdf(ppData, completedAt))}>
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

                if (wizardType === 'Founder Agreement' || wizardType === 'Founders agreement and IP assignment') {
                  const faData = data as import('./FounderAgreementWizardModal').FounderAgreementWizardData
                  return (
                    <article className="user-dashboard__completed-card" key={id}>
                      <span className={`user-dashboard__completed-icon${isPdfDownloaded ? ' user-dashboard__completed-icon--downloaded' : ''}`}><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Founders agreement and IP assignment</h3>
                        <p>Completed {displayDate}</p>
                        {isPdfDownloaded && <p className="user-dashboard__downloaded-label">Downloaded</p>}
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => confirmPdfDownload('founders-agreement-ip', id, 'Founders-Agreement.pdf', () => buildFounderAgreementPdf(faData, completedAt))}>
                          <Download size={16} /> Download PDF
                        </button>
                        <button type="button" onClick={() => void downloadFinalBlueprint('founders-agreement-ip', id, 'Founders-Agreement.docx', () => buildFounderAgreementDocx(faData, completedAt))}>
                          <Download size={16} /> Download DOCX
                        </button>
                        <button type="button" onClick={() => void buildFounderAgreementEvidencePack(faData, completedAt, id).then((pack) => triggerDownload(pack, 'Founders-Agreement-Evidence-Pack.txt'))}>
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
                      <span className={`user-dashboard__completed-icon${isPdfDownloaded ? ' user-dashboard__completed-icon--downloaded' : ''}`}><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Service Agreement</h3>
                        <p>Completed {displayDate}</p>
                        {isPdfDownloaded && <p className="user-dashboard__downloaded-label">Downloaded</p>}
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => confirmPdfDownload('service-agreement', id, 'Service-Agreement.pdf', () => buildServiceAgreementPdf(saData, completedAt))}>
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

                if (wizardType === 'Service Level Agreement (SLA)') {
                  const slaData = data as SlaWizardData
                  return (
                    <article className="user-dashboard__completed-card" key={id}>
                      <span className={`user-dashboard__completed-icon${isPdfDownloaded ? ' user-dashboard__completed-icon--downloaded' : ''}`}><CircleCheckBig size={28} /></span>
                      <div className="user-dashboard__completed-copy">
                        <h3>Service Level Agreement (SLA)</h3>
                        <p>Completed {displayDate}</p>
                        {isPdfDownloaded && <p className="user-dashboard__downloaded-label">Downloaded</p>}
                      </div>
                      <div className="user-dashboard__completed-actions">
                        <button type="button" onClick={() => confirmPdfDownload('service-level-agreement', id, 'Service-Level-Agreement.pdf', () => buildSlaPdf(slaData, completedAt))}>
                          <Download size={16} /> Download PDF
                        </button>
                        <button type="button" onClick={() => void downloadFinalBlueprint('service-level-agreement', id, 'Service-Level-Agreement.docx', () => buildSlaDocx(slaData, completedAt))}>
                          <Download size={16} /> Download DOCX
                        </button>
                        <button type="button" onClick={() => triggerDownload(buildSlaEvidencePack(slaData, completedAt), 'SLA-Evidence-Pack.txt')}>
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

      {pdfConfirm && (
        <div className="pdf-confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="pdf-confirm-title">
          <div className="pdf-confirm-modal">
            <button
              type="button"
              className="pdf-confirm-modal__close"
              aria-label="Cancel"
              onClick={() => setPdfConfirm(null)}
            >
              <X size={18} />
            </button>
            <div className="pdf-confirm-modal__icon">
              <Download size={24} />
            </div>
            <h2 id="pdf-confirm-title" className="pdf-confirm-modal__title">Download PDF</h2>
            <p className="pdf-confirm-modal__body">
              Downloading this PDF will deduct <strong>{pdfConfirm.credits} credit{pdfConfirm.credits !== 1 ? 's' : ''}</strong> from your account balance.
            </p>
            <div className="pdf-confirm-modal__actions">
              <button
                type="button"
                className="pdf-confirm-modal__proceed"
                onClick={() => {
                  const { blueprintId, downloadKey, filename, build } = pdfConfirm
                  setPdfConfirm(null)
                  void downloadFinalBlueprint(blueprintId, downloadKey, filename, build)
                }}
              >
                Proceed
              </button>
              <button
                type="button"
                className="pdf-confirm-modal__cancel"
                onClick={() => setPdfConfirm(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isNdaModalOpen && (
        <NdaWizardModal
          onClose={(step, data) => {
            if (justCompletedRef.current) { justCompletedRef.current = false; return }
            const cid = continuingInstanceRef.current
            if (cid) { updateInProgressInstance(cid, step, Math.round(((step - 1) / 3) * 100), data); continuingInstanceRef.current = null }
            else { decrementQueue('Non-Disclosure Agreement (NDA)'); pushInProgressInstance('Non-Disclosure Agreement (NDA)', step, Math.round(((step - 1) / 3) * 100), data) }
            setIsNdaModalOpen(false)
          }}
          initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
          initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as NdaWizardData | undefined) : undefined}
          onStepChange={(step, data) => saveProgress(step, data)}
          onComplete={(data) => {
            const cid = continuingInstanceRef.current
            justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
            else { decrementQueue('Non-Disclosure Agreement (NDA)') }
            handleNdaComplete(data); setIsNdaModalOpen(false)
          }}
        />
      )}

      {isEmpModalOpen && (
        <EmploymentWizardModal
          onClose={(step, data) => {
            if (justCompletedRef.current) { justCompletedRef.current = false; return }
            const cid = continuingInstanceRef.current
            if (cid) { updateInProgressInstance(cid, step ?? 1, Math.round((((step ?? 1) - 1) / 5) * 100), data); continuingInstanceRef.current = null }
            else { decrementQueue('Employment Offer Letter'); pushInProgressInstance('Employment Offer Letter', step ?? 1, Math.round((((step ?? 1) - 1) / 5) * 100), data) }
            setIsEmpModalOpen(false)
          }}
          initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
          initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as EmploymentWizardData | undefined) : undefined}
          onStepChange={(step, data) => saveEmpProgress(step, data)}
          onComplete={(data) => {
            const cid = continuingInstanceRef.current
            justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
            else { decrementQueue('Employment Offer Letter') }
            handleEmpComplete(data); setIsEmpModalOpen(false)
          }}
        />
      )}

      {isPPModalOpen && (
        <PrivacyPolicyWizardModal
          onClose={(step, data) => {
            if (justCompletedRef.current) { justCompletedRef.current = false; return }
            const cid = continuingInstanceRef.current
            if (cid) { updateInProgressInstance(cid, step, Math.round(((step - 1) / 6) * 100), data); continuingInstanceRef.current = null }
            else { decrementQueue('Privacy & Cookies Policy'); pushInProgressInstance('Privacy & Cookies Policy', step, Math.round(((step - 1) / 6) * 100), data) }
            setIsPPModalOpen(false)
          }}
          initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
          initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as PrivacyPolicyWizardData | undefined) : { responsibleParty: profile.legalName || profile.individualFullNames || profile.tradingName || '' } as Partial<PrivacyPolicyWizardData> as PrivacyPolicyWizardData}
          onStepChange={(step, data) => savePPProgress(step, data)}
          onComplete={(data) => {
            const cid = continuingInstanceRef.current
            justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
            else { decrementQueue('Privacy & Cookies Policy') }
            handlePPComplete(data); setIsPPModalOpen(false)
          }}
        />
      )}

      {isFAModalOpen && (
        <FounderAgreementWizardModal
          onClose={(step, data) => {
            if (justCompletedRef.current) { justCompletedRef.current = false; return }
            const cid = continuingInstanceRef.current
            if (cid) { updateInProgressInstance(cid, step ?? 1, Math.round((((step ?? 1) - 1) / 7) * 100), data); continuingInstanceRef.current = null }
            else { decrementQueue('Founders agreement and IP assignment'); pushInProgressInstance('Founders agreement and IP assignment', step ?? 1, Math.round((((step ?? 1) - 1) / 7) * 100), data) }
            setIsFAModalOpen(false)
          }}
          initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
          initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as FounderAgreementWizardData | undefined) : undefined}
          onStepChange={(step, data) => saveFAProgress(step, data)}
          onComplete={(data) => {
            const cid = continuingInstanceRef.current
            justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
            else { decrementQueue('Founders agreement and IP assignment') }
            handleFAComplete(data); setIsFAModalOpen(false)
          }}
          onRouteToCounsel={routeFounderPublicFundingToCounsel}
          onRefreshPublicFundingReview={refreshFounderPublicFundingReview}
        />
      )}

      {isSAModalOpen && (
        <ServiceAgreementWizardModal
          onClose={() => {
            if (justCompletedRef.current) { justCompletedRef.current = false; return }
            const cid = continuingInstanceRef.current
            if (cid) { updateInProgressInstance(cid, saState.step, saState.progress, saState.data); continuingInstanceRef.current = null }
            else { decrementQueue('Service Agreement'); pushInProgressInstance('Service Agreement', saState.step, saState.progress, saState.data) }
            setIsSAModalOpen(false)
          }}
          initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
          initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as ServiceAgreementWizardData | undefined) : undefined}
          onStepChange={(step, data) => saveSAProgress(step, data)}
          onComplete={(data) => {
            const cid = continuingInstanceRef.current
            justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
            else { decrementQueue('Service Agreement') }
            handleSAComplete(data); setIsSAModalOpen(false)
          }}
        />
      )}

      {isSLAModalOpen && (
        <SlaWizardModal
          onClose={(step, data) => {
            if (justCompletedRef.current) { justCompletedRef.current = false; return }
            const cid = continuingInstanceRef.current
            if (cid) { updateInProgressInstance(cid, step ?? 1, Math.round((((step ?? 1) - 1) / 9) * 100), data); continuingInstanceRef.current = null }
            else { decrementQueue('Service Level Agreement (SLA)'); pushInProgressInstance('Service Level Agreement (SLA)', step ?? 1, Math.round((((step ?? 1) - 1) / 9) * 100), data) }
            setIsSLAModalOpen(false)
          }}
          initialStep={continuingInstanceRef.current ? ((inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.step ?? 1)) : 1}
          initialData={continuingInstanceRef.current ? (inProgressInstances.find(i => i.id === continuingInstanceRef.current)?.data as SlaWizardData | undefined) : undefined}
          onStepChange={(step, data) => saveSLAProgress(step, data)}
          onComplete={(data) => {
            const cid = continuingInstanceRef.current
            justCompletedRef.current = true; if (cid) { removeInProgressInstance(cid); continuingInstanceRef.current = null }
            else { decrementQueue('Service Level Agreement (SLA)') }
            handleSLAComplete(data); setIsSLAModalOpen(false)
          }}
        />
      )}

      {comingSoonTitle && (
        <ComingSoonWizardModal
          title={comingSoonTitle}
          onClose={() => setComingSoonTitle(null)}
        />
      )}

      <CounselCreditsModal
        isOpen={isNoCounselCreditModalOpen}
        onClose={() => setIsNoCounselCreditModalOpen(false)}
        currentPlan={counselCreditsForGate?.plan ?? subscription?.planName ?? 'Launchpad'}
        onTopUp={(plan: TopUpPlan) => {
          setIsNoCounselCreditModalOpen(false)
          navigate('/dashboard/counsel/topup', { state: { plan, credits: counselCreditsForGate } })
        }}
      />

    </DashboardShell>
  )
}
