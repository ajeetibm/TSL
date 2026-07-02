import { ArrowRight, BookOpen, CheckCircle2, Download, FileText, LineChart, TrendingUp, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { setPageMetadata } from '../services/metadata'
import './PlaybooksInsights.css'

export default function PlaybooksInsights() {
  setPageMetadata('Playbooks & Insights', 'Guidance and analytics to help you make the right legal decisions- saving you time and money.')

  return (
    <div className="playbooks-insights">
      {/* Hero Section */}
      <section className="playbooks-insights__hero">
        <div className="playbooks-insights__hero-content">
          <Link to="/pricing" className="playbooks-insights__breadcrumb">
            Business & Insights
          </Link>
          <h1>Playbooks & Insights</h1>
          <p>Guidance and analytics to help you make the right legal decisions- saving you time and money.</p>
          <div className="playbooks-insights__hero-buttons">
            <button className="playbooks-insights__button playbooks-insights__button--primary">
              Explore Playbooks
            </button>
            <button className="playbooks-insights__button playbooks-insights__button--secondary">
              View Dashboards <ArrowRight size={18} />
            </button>
            <button className="playbooks-insights__button playbooks-insights__button--tertiary">
              Pricing Details
            </button>
          </div>
        </div>
      </section>

      {/* Investor-Grade Legal Guidance */}
      <section className="playbooks-insights__section playbooks-insights__section--light">
        <div className="playbooks-insights__container">
          <h2 className="playbooks-insights__section-title">Investor-Grade Legal Guidance</h2>
          <p className="playbooks-insights__section-subtitle">
            Checklists, calculators, and guidance made that help you execute around
            complex, compliance, and governance matters.
          </p>

          <div className="playbooks-insights__grid playbooks-insights__grid--3">
            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--gold">
                <FileText size={24} />
              </div>
              <h3>Checklists & Templates</h3>
              <p>
                Step-by-step guides for complex legal processes. From fundraising to hiring, we've got you covered.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--gold">
                <LineChart size={24} />
              </div>
              <h3>Calculators & Tools</h3>
              <p>
                Interactive calculators for equity splits, valuations, and more. Make informed decisions with data.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--gold">
                <BookOpen size={24} />
              </div>
              <h3>Smart Wizard Links</h3>
              <p>
                Direct links to relevant wizards from playbooks. Seamlessly transition from guidance to execution.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--gold">
                <Users size={24} />
              </div>
              <h3>Compliance Guidance</h3>
              <p>
                Stay compliant with South African regulations. B-BBEE, POPIA, and company law requirements covered.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--gold">
                <TrendingUp size={24} />
              </div>
              <h3>Fundraising Support</h3>
              <p>
                Navigate funding rounds with confidence. Term sheets, cap tables, and investor rights explained.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--gold">
                <CheckCircle2 size={24} />
              </div>
              <h3>Governance Frameworks</h3>
              <p>
                Build strong governance foundations. Board structures, shareholder rights, and decision-making frameworks.
              </p>
            </div>
          </div>

          <div className="playbooks-insights__banner">
            <div className="playbooks-insights__banner-icon">
              <BookOpen size={20} />
            </div>
            <div className="playbooks-insights__banner-content">
              <strong>Playbooks Not For Counsel Wizard Runs</strong>
              <p>
                Wizard playbooks are educational guides made available to all users on your subscription plan. For complex or unique situations, you can always book a counsel session to get personalized advice. Counsel sessions are billed separately from playbooks and wizards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Practical Guides */}
      <section className="playbooks-insights__section">
        <div className="playbooks-insights__container">
          <Link to="/playbooks" className="playbooks-insights__link">
            Sample Playbooks
          </Link>
          <h2 className="playbooks-insights__section-title">Practical Guides for Investors and Founders</h2>
          <p className="playbooks-insights__section-subtitle">
            Checklists, models, and frameworks proven to save founders time and
            mistakes for startups.
          </p>

          <div className="playbooks-insights__grid playbooks-insights__grid--2">
            <div className="playbooks-insights__guide">
              <div className="playbooks-insights__guide-header">
                <div className="playbooks-insights__guide-icon">
                  <Users size={24} />
                </div>
                <div>
                  <h3>Fundraising in South Africa</h3>
                  <p>Navigate funding rounds, term sheets, and due diligence</p>
                </div>
              </div>
              <ul className="playbooks-insights__guide-list">
                <li>
                  <CheckCircle2 size={16} />
                  <span>30 minute • 12 Min • 5 Wizard</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Pre-Series A • 12 Min • 5 Wizard</span>
                </li>
              </ul>
              <button className="playbooks-insights__guide-button">
                <Download size={18} />
                Download Sample
              </button>
            </div>

            <div className="playbooks-insights__guide">
              <div className="playbooks-insights__guide-header">
                <div className="playbooks-insights__guide-icon">
                  <FileText size={24} />
                </div>
                <div>
                  <h3>Founder's Guide</h3>
                  <p>Essential legal setup for South African startups</p>
                </div>
              </div>
              <ul className="playbooks-insights__guide-list">
                <li>
                  <CheckCircle2 size={16} />
                  <span>Company Setup • 8 Min • 3 Wizard</span>
                </li>
                <li>
                  <CheckCircle2 size={16} />
                  <span>Equity Splits • 15 Min • 4 Wizard</span>
                </li>
              </ul>
              <button className="playbooks-insights__guide-button">
                <Download size={18} />
                Download Sample
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How They Plug In */}
      <section className="playbooks-insights__section playbooks-insights__section--light">
        <div className="playbooks-insights__container">
          <h2 className="playbooks-insights__section-title">Playbooks and Insights: How They Plug In</h2>
          <p className="playbooks-insights__section-subtitle">
            Playbooks and Insights provide guided workflows with checklists, calculators, and
            direct wizard links. They help you 100 decisions faster.
          </p>

          <div className="playbooks-insights__grid playbooks-insights__grid--2">
            <div className="playbooks-insights__feature">
              <div className="playbooks-insights__feature-header">
                <div className="playbooks-insights__feature-number">1</div>
                <h3>Playbooks by Plan</h3>
              </div>
              <p>Access tier-specific playbooks and guidance based on your subscription level.</p>
              <div className="playbooks-insights__feature-plans">
                <div className="playbooks-insights__plan-badge playbooks-insights__plan-badge--operator">
                  Operator: <strong>Essentials</strong>
                </div>
                <div className="playbooks-insights__plan-badge playbooks-insights__plan-badge--boardroom">
                  Boardroom: <strong>Essentials + Community</strong>
                </div>
              </div>
              <ul className="playbooks-insights__feature-list">
                <li>
                  <strong>Operator:</strong> Essentials
                </li>
                <li>
                  <strong>Boardroom:</strong> Essentials + Community. South Africa's leading community of founders and investors.
                </li>
              </ul>
            </div>

            <div className="playbooks-insights__feature">
              <div className="playbooks-insights__feature-header">
                <div className="playbooks-insights__feature-number">2</div>
                <h3>Insights by Plan</h3>
              </div>
              <p>Get analytics and tracking based on your tier and activity.</p>
              <div className="playbooks-insights__feature-plans">
                <div className="playbooks-insights__plan-badge playbooks-insights__plan-badge--launchpad">
                  Launchpad: <strong>Basic Tracking</strong>
                </div>
                <div className="playbooks-insights__plan-badge playbooks-insights__plan-badge--operator">
                  Operator: <strong>Usage Dashboards</strong>
                </div>
                <div className="playbooks-insights__plan-badge playbooks-insights__plan-badge--boardroom">
                  Boardroom: <strong>Executive Metrics</strong>
                </div>
              </div>
              <ul className="playbooks-insights__feature-list">
                <li>
                  <strong>Launchpad:</strong> Basic tracking. View your wizard runs and document history.
                </li>
                <li>
                  <strong>Operator:</strong> Usage dashboards. Track team activity and compliance status.
                </li>
                <li>
                  <strong>Boardroom:</strong> Executive metrics. Comprehensive analytics and reporting.
                </li>
              </ul>
            </div>
          </div>

          <div className="playbooks-insights__banner">
            <div className="playbooks-insights__banner-icon">
              <BookOpen size={20} />
            </div>
            <div className="playbooks-insights__banner-content">
              <strong>Insights Not For Counsel Wizard Runs</strong>
              <p>
                Usage insights and dashboards are available to all users on your subscription plan. For complex or unique situations, you can always book a counsel session to get personalized advice. Counsel sessions are billed separately from insights and wizards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visibility Into Outcomes */}
      <section className="playbooks-insights__section">
        <div className="playbooks-insights__container">
          <h2 className="playbooks-insights__section-title">Visibility Into Outcomes, Not Just Activity</h2>
          <p className="playbooks-insights__section-subtitle">
            Dashboards and insights that show workflow completion, compliance status, and
            document health. Evaluate if your plan, no more, no less.
          </p>

          <div className="playbooks-insights__grid playbooks-insights__grid--3">
            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--dark">
                <LineChart size={24} />
              </div>
              <h3>Workflow Dashboards</h3>
              <p>
                Track wizard completion rates, time to completion, and bottlenecks across your team.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--dark">
                <TrendingUp size={24} />
              </div>
              <h3>Timeline Tracking</h3>
              <p>
                Monitor document lifecycles and renewal dates. Never miss a critical deadline.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--dark">
                <CheckCircle2 size={24} />
              </div>
              <h3>Acceptance Metrics</h3>
              <p>
                See signature rates, review times, and acceptance patterns across your documents.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--dark">
                <Users size={24} />
              </div>
              <h3>Completion Analytics</h3>
              <p>
                Understand which workflows are most used and identify areas for improvement.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--dark">
                <FileText size={24} />
              </div>
              <h3>Export & Reporting</h3>
              <p>
                Generate reports for investors, board meetings, or compliance audits.
              </p>
            </div>

            <div className="playbooks-insights__card">
              <div className="playbooks-insights__card-icon playbooks-insights__card-icon--dark">
                <TrendingUp size={24} />
              </div>
              <h3>Governance Trends</h3>
              <p>
                Track governance maturity over time and benchmark against industry standards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="playbooks-insights__cta">
        <div className="playbooks-insights__cta-content">
          <h2>Ready to Get Started with Playbooks & Insights?</h2>
          <p>
            Choose the plan that fits your needs and get immediate guidance and
            analytics to help you make better legal decisions.
          </p>
          <button className="playbooks-insights__cta-button">
            View Pricing <ArrowRight size={20} />
          </button>
          <p className="playbooks-insights__cta-note">
            Free 14-day trial on all paid plans • Cancel anytime
          </p>
        </div>
      </section>
    </div>
  )
}

// Made with Bob
