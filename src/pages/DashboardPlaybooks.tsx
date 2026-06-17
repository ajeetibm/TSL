import {
  ArrowRight,
  BookOpen,
  FileText,
  Shield,
  TrendingUp,
  UsersRound,
  WandSparkles,
} from 'lucide-react'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { setPageMetadata } from '../services/metadata'
import './Dashboard.css'
import './DashboardPlaybooks.css'

const playbookSections = [
  {
    title: 'Hiring',
    icon: UsersRound,
    cards: [
      {
        title: 'Hiring Your First Employee',
        steps: '8 steps',
        time: '15 min',
        description:
          'A comprehensive guide to compliant employee onboarding in South Africa, including BCEA requirements, contracts, and payroll setup.',
        icon: UsersRound,
        wizards: ['Employment Contract (BCEA)', 'Employee Handbook'],
      },
      {
        title: 'Contractor vs Employee Classification',
        steps: '5 steps',
        time: '10 min',
        description:
          'Understand the legal differences between contractors and employees, and ensure proper classification under South African labour law.',
        icon: UsersRound,
        wizards: ['Independent Contractor Agreement'],
      },
      {
        title: 'Building an Employee Handbook',
        steps: '12 steps',
        time: '20 min',
        description:
          'Create a comprehensive employee handbook that covers policies, procedures, and workplace expectations while ensuring legal compliance.',
        icon: FileText,
        wizards: ['Employee Handbook Generator'],
      },
    ],
  },
  {
    title: 'Compliance',
    icon: Shield,
    cards: [
      {
        title: 'POPIA Compliance Basics',
        steps: '7 steps',
        time: '12 min',
        description:
          'Set up practical privacy controls, consent language, and data handling processes for South African businesses.',
        icon: Shield,
        wizards: ['Privacy Policy (POPIA Compliant)', 'Data Processing Agreement'],
      },
      {
        title: 'Document Retention Checklist',
        steps: '6 steps',
        time: '9 min',
        description:
          'Know which company, employment, tax, and customer records to keep, and how long to retain them.',
        icon: FileText,
        wizards: ['Records Retention Policy'],
      },
      {
        title: 'Website Legal Readiness',
        steps: '9 steps',
        time: '14 min',
        description:
          'Prepare a legally sound website with terms, privacy disclosures, cookies, and customer-facing notices.',
        icon: WandSparkles,
        wizards: ['Terms of Service', 'Privacy Policy'],
      },
    ],
  },
  {
    title: 'Fundraising',
    icon: TrendingUp,
    cards: [
      {
        title: 'Investor Meeting Prep',
        steps: '6 steps',
        time: '11 min',
        description:
          'Prepare the core legal documents and confidentiality steps needed before sharing sensitive startup materials.',
        icon: TrendingUp,
        wizards: ['Non-Disclosure Agreement (NDA)', 'Founder Agreement'],
      },
      {
        title: 'Founder Equity Readiness',
        steps: '8 steps',
        time: '16 min',
        description:
          'Review founder roles, equity splits, vesting expectations, and decision-making before funding conversations.',
        icon: UsersRound,
        wizards: ['Founder Agreement', 'Shareholder Resolutions'],
      },
      {
        title: 'Due Diligence Pack',
        steps: '10 steps',
        time: '18 min',
        description:
          'Organise contracts, policies, resolutions, and employment records into a cleaner investor review package.',
        icon: BookOpen,
        wizards: ['Board Resolution', 'Service Agreement'],
      },
    ],
  },
]

export default function DashboardPlaybooks() {
  setPageMetadata('Playbooks', 'Browse guided legal playbooks for common business workflows.')

  return (
    <DashboardShell activeSection="Playbooks">
      <main className="dashboard-playbooks">
        <header className="dashboard-playbooks__header">
          <span className="dashboard-playbooks__header-marker" aria-hidden="true">
            <BookOpen size={18} />
          </span>
          <div>
            <h1>Playbooks</h1>
            <p>Step-by-step legal guides for common business workflows</p>
          </div>
        </header>

        <div className="dashboard-playbooks__content">
          {playbookSections.map(({ title, icon: SectionIcon, cards }) => (
            <section className="dashboard-playbooks__section" key={title}>
              <div className="dashboard-playbooks__section-heading">
                <span>
                  <SectionIcon size={20} />
                </span>
                <h2>{title}</h2>
              </div>

              <div className="dashboard-playbooks__grid">
                {cards.map(({ title: cardTitle, steps, time, description, icon: CardIcon, wizards }) => (
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

                    <button type="button" className="dashboard-playbooks__button">
                      Read Playbook
                      <ArrowRight size={18} />
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </DashboardShell>
  )
}
