import { BackButton } from '../../components/dashboard/BackButton'
import {
  ArrowRight,
  BookOpen,
  FileText,
  Shield,
  TrendingUp,
  UsersRound,
  WandSparkles,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { DashboardShell } from '../../components/dashboard/DashboardShell'
import { setPageMetadata } from '../../services/metadata'
import { API_BASE_URL, documentsApi, playbookApi } from '../../services/tslApi'
import './Dashboard.css'
import './DashboardPlaybooks.css'

// Configure the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

type PlaybookCard = {
  title: string
  steps: string
  time: string
  description: string
  icon: React.ElementType
  wizards: string[]
  pdfUrl: string
}

// const playbookSections = [
//   {
//     title: 'Hiring',
//     icon: UsersRound,
//     cards: [
//       {
//         title: 'Hiring Your First Employee',
//         steps: '8 steps',
//         time: '15 min',
//         description:
//           'A comprehensive guide to compliant employee onboarding in South Africa, including BCEA requirements, contracts, and payroll setup.',
//         icon: UsersRound,
//         wizards: ['Employment Contract (BCEA)', 'Employee Handbook'],
//         pdfUrl: samplePdf,
//       },
//       {
//         title: 'Contractor vs Employee Classification',
//         steps: '5 steps',
//         time: '10 min',
//         description:
//           'Understand the legal differences between contractors and employees, and ensure proper classification under South African labour law.',
//         icon: UsersRound,
//         wizards: ['Independent Contractor Agreement'],
//         pdfUrl: samplePdf,
//       },
//       {
//         title: 'Building an Employee Handbook',
//         steps: '12 steps',
//         time: '20 min',
//         description:
//           'Create a comprehensive employee handbook that covers policies, procedures, and workplace expectations while ensuring legal compliance.',
//         icon: FileText,
//         wizards: ['Employee Handbook Generator'],
//         pdfUrl: samplePdf,
//       },
//     ],
//   },
//   {
//     title: 'Compliance',
//     icon: Shield,
//     cards: [
//       {
//         title: 'POPIA Compliance Basics',
//         steps: '7 steps',
//         time: '12 min',
//         description:
//           'Set up practical privacy controls, consent language, and data handling processes for South African businesses.',
//         icon: Shield,
//         wizards: ['Privacy Policy (POPIA Compliant)', 'Data Processing Agreement'],
//         pdfUrl: samplePdf,
//       },
//       {
//         title: 'Document Retention Checklist',
//         steps: '6 steps',
//         time: '9 min',
//         description:
//           'Know which company, employment, tax, and customer records to keep, and how long to retain them.',
//         icon: FileText,
//         wizards: ['Records Retention Policy'],
//         pdfUrl: samplePdf,
//       },
//       {
//         title: 'Website Legal Readiness',
//         steps: '9 steps',
//         time: '14 min',
//         description:
//           'Prepare a legally sound website with terms, privacy disclosures, cookies, and customer-facing notices.',
//         icon: WandSparkles,
//         wizards: ['Terms of Service', 'Privacy Policy'],
//         pdfUrl: samplePdf,
//       },
//     ],
//   },
//   {
//     title: 'Fundraising',
//     icon: TrendingUp,
//     cards: [
//       {
//         title: 'Investor Meeting Prep',
//         steps: '6 steps',
//         time: '11 min',
//         description:
//           'Prepare the core legal documents and confidentiality steps needed before sharing sensitive startup materials.',
//         icon: TrendingUp,
//         wizards: ['Non-Disclosure Agreement (NDA)', 'Founder Agreement'],
//         pdfUrl: samplePdf,
//       },
//       {
//         title: 'Founder Equity Readiness',
//         steps: '8 steps',
//         time: '16 min',
//         description:
//           'Review founder roles, equity splits, vesting expectations, and decision-making before funding conversations.',
//         icon: UsersRound,
//         wizards: ['Founder Agreement', 'Shareholder Resolutions'],
//         pdfUrl: samplePdf,
//       },
//       {
//         title: 'Due Diligence Pack',
//         steps: '10 steps',
//         time: '18 min',
//         description:
//           'Organise contracts, policies, resolutions, and employment records into a cleaner investor review package.',
//         icon: BookOpen,
//         wizards: ['Board Resolution', 'Service Agreement'],
//         pdfUrl: samplePdf,
//       },
//     ],
//   },
// ]

// ─── PDF Modal ────────────────────────────────────────────────────────────────

type PlaybookPDFModalProps = {
  playbook: PlaybookCard
  onClose: () => void
}

function PlaybookPDFModal({ playbook, onClose }: PlaybookPDFModalProps) {
  const { title, description, pdfUrl } = playbook
  const [numPages, setNumPages] = useState<number | null>(null)

  // `renderScale` multiplies the base page width (derived from the body container).
  // Only updated after a zoom gesture settles to avoid flickering canvas teardown.
  const [renderScale, setRenderScale] = useState(1.0)

  // `bodyWidth` is measured from the scrollable container so pages fill the available area.
  const [bodyWidth, setBodyWidth] = useState<number | undefined>(undefined)

  // `visualScale` follows every wheel tick and is applied via CSS transform
  // so the user sees instant, smooth feedback while gesturing.
  const visualScaleRef = useRef(1.0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const bodyRef = useRef<HTMLDivElement>(null)
  const pagesWrapRef = useRef<HTMLDivElement>(null)

  const clampScale = (s: number) => Math.min(Math.max(s, 0.4), 3.0)

  // Measure the body container width so pages fill it; update on resize.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const measure = () => {
      // Subtract horizontal padding (32px each side = 96px total)
      setBodyWidth(el.clientWidth - 96)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Trap focus / close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  // Ctrl+wheel (mouse) and pinch (touchpad) zoom
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey) return
      e.preventDefault()

      // Update visual scale immediately via CSS transform (no React re-render)
      const next = clampScale(visualScaleRef.current - e.deltaY * 0.005)
      visualScaleRef.current = next
      if (pagesWrapRef.current) {
        pagesWrapRef.current.style.transform = `scale(${next})`
        pagesWrapRef.current.style.transformOrigin = 'top center'
      }

      // Debounce: commit to react-pdf once gesture pauses for 150 ms
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setRenderScale(next)
        // Reset CSS transform now that react-pdf has re-rendered at the new scale
        if (pagesWrapRef.current) {
          pagesWrapRef.current.style.transform = ''
        }
      }, 150)
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      el.removeEventListener('wheel', handleWheel)
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  return (
    <div
      className="pdf-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} PDF`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="pdf-modal">
        {/* ── Header ── */}
        <header className="pdf-modal__header">
          <div className="pdf-modal__header-left">
            <span className="pdf-modal__header-icon">
              <BookOpen size={22} />
            </span>
            <div>
              <h2 className="pdf-modal__title">{title}</h2>
              <p className="pdf-modal__subtitle">{description}</p>
            </div>
          </div>
          <button
            type="button"
            className="pdf-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        {/* ── Scrollable PDF area ── */}
        {numPages && (
          <div className="pdf-modal__page-count">{numPages} pages</div>
        )}
        <div className="pdf-modal__body" ref={bodyRef}>
          {!pdfUrl ? (
            <div className="pdf-modal__error">
              <FileText size={40} />
              <p>No document available.</p>
              <span>This playbook does not have an attached PDF yet.</span>
            </div>
          ) : (
            <Document
              file={pdfUrl}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="pdf-modal__loading">Loading document…</div>}
              error={
                <div className="pdf-modal__error">
                  <FileText size={40} />
                  <p>Unable to load the PDF.</p>
                  <span>The document will be available shortly.</span>
                </div>
              }
            >
              {numPages && (
                <div ref={pagesWrapRef}>
                  {Array.from({ length: numPages }, (_, i) => (
                    <Page
                      key={`page_${i + 1}`}
                      pageNumber={i + 1}
                      width={bodyWidth ? bodyWidth * renderScale : undefined}
                      className="pdf-modal__page"
                      renderTextLayer
                      renderAnnotationLayer
                    />
                  ))}
                </div>
              )}
            </Document>
          )}
        </div>

        {/* ── Footer ── */}
        <footer className="pdf-modal__footer">
          © The StartUp Legal (Pty) Ltd. All rights reserved.
        </footer>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type PlaybookSection = {
  title: string
  icon: React.ElementType
  cards: PlaybookCard[]
}

const ICON_MAP: Record<string, LucideIcon> = {
  UsersRound,
  Shield,
  TrendingUp,
  BookOpen,
  FileText,
  WandSparkles,
}

function resolveIcon(name: string): LucideIcon {
  return ICON_MAP[name] ?? WandSparkles
}

/**
 * Builds a title→url map from the documents API array.
 * doc.name matches the playbook card title exactly (e.g. "Hiring Your First Employee").
 * Relative URLs (starting with /) are prefixed with the API base URL so react-pdf
 * can fetch them from the backend, not the Vite dev server.
 */
function buildPdfMap(documents: import('../../services/dashboardTypes').DocumentItem[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const doc of documents) {
    const url = doc.url.startsWith('/')
      ? `${API_BASE_URL}${doc.url}`
      : doc.url
    map.set(doc.name, url)
  }
  return map
}

function mapApiSections(
  raw: import('../../services/dashboardTypes').PlaybookSection[],
  pdfMap: Map<string, string>,
): PlaybookSection[] {
  return raw.map(({ title, icon, cards }) => ({
    title,
    icon: resolveIcon(icon),
    cards: cards.map((c) => ({
      title: c.title,
      steps: c.steps,
      time: c.time,
      description: c.description,
      icon: resolveIcon(icon),
      wizards: c.wizards ?? [],
      pdfUrl: pdfMap.get(c.title) ?? c.pdfUrl ?? '',
    })),
  }))
}

export default function DashboardPlaybooks() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<PlaybookCard | null>(null)
  const [sections, setSections] = useState<PlaybookSection[]>([])
  const [loading, setLoading] = useState(true)

  setPageMetadata('Playbooks', 'Browse guided legal playbooks for common business workflows.')

  useEffect(() => {
    void Promise.all([
      playbookApi.playBookList(),
      documentsApi.list(),
    ]).then(([playbooksRes, docsRes]) => {
      // data is a flat DocumentItem[] array — build title→url map directly
      const pdfMap = docsRes.success && Array.isArray(docsRes.data)
        ? buildPdfMap(docsRes.data)
        : new Map<string, string>()

      if (playbooksRes.success && playbooksRes.data?.playbookSections?.length) {
        setSections(mapApiSections(playbooksRes.data.playbookSections, pdfMap))
      }
      setLoading(false)
    })
  }, [])

  return (
    <DashboardShell activeSection="Playbooks">
      <main className="dashboard-playbooks">
        <header className="dashboard-playbooks__header">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <span className="dashboard-playbooks__header-marker" aria-hidden="true">
            <BookOpen size={18} />
          </span>
          <div>
            <h1>Playbooks</h1>
            <p>Step-by-step legal guides for common business workflows</p>
          </div>
        </header>

        <div className="dashboard-playbooks__content">
          {loading && (
            <p className="dashboard-playbooks__loading">Loading playbooks…</p>
          )}
          {!loading && sections.map(({ title, icon: SectionIcon, cards }) => (
            <section className="dashboard-playbooks__section" key={title}>
              <div className="dashboard-playbooks__section-heading">
                <span>
                  <SectionIcon size={20} />
                </span>
                <h2>{title}</h2>
              </div>

              <div className="dashboard-playbooks__grid">
                {cards.map((card) => {
                  const { title: cardTitle, steps, time, description, icon: CardIcon, wizards } = card
                  return (
                    <article className="dashboard-playbooks__card" key={cardTitle}>
                      <div className="dashboard-playbooks__card-heading">
                        <span className="dashboard-playbooks__card-icon">
                          <CardIcon size={24} />
                        </span>
                        <div>
                          <h3>{cardTitle}</h3>
                          <p>
                            {steps}
                            <b>•</b>
                            {time}
                          </p>
                        </div>
                      </div>

                      <p className="dashboard-playbooks__description">{description}</p>

                      <div className="dashboard-playbooks__related">
                        <h4>
                          <WandSparkles size={14} />
                          Related Wizards
                        </h4>
                        <ul>
                          {wizards.map((wizard) => (
                            <li key={wizard}>{wizard}</li>
                          ))}
                        </ul>
                      </div>

                      <button
                        type="button"
                        className="dashboard-playbooks__button"
                        onClick={() => setSelectedPlaybook(card)}
                      >
                        Read Playbook
                        <ArrowRight size={18} />
                      </button>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      </main>

      {selectedPlaybook && (
        <PlaybookPDFModal
          playbook={selectedPlaybook}
          onClose={() => setSelectedPlaybook(null)}
        />
      )}
    </DashboardShell>
  )
}
