import { ArrowRight, Check, Shield, FileText, Scale, Users, Clock, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { setPageMetadata } from '../services/metadata'
import './Counsel.css'

export default function Counsel() {
  setPageMetadata('Counsel', 'Monthly attorney support that operates inside your legal workflows—not via email.')

  return (
    <div className="counsel-page">
      {/* Hero Section */}
      <section className="counsel-hero">
        <div className="counsel-hero__content">
          <Link to="/pricing" className="counsel-breadcrumb">
            Features Overview
          </Link>
          <h1>Counsel</h1>
          <p className="counsel-hero__subtitle">
            Monthly attorney support that operates inside your legal workflows—not via email.
          </p>
          <p className="counsel-hero__description">
            Counsel provides strategic guidance within context, helping you navigate complex negotiations and non-standard situations—all with audit trails.
          </p>
          <div className="counsel-hero__buttons">
            <button className="counsel-button counsel-button--primary">
              See Included Engagement
            </button>
            <button className="counsel-button counsel-button--secondary">
              Billing Details
            </button>
            <button className="counsel-button counsel-button--tertiary">
              Legal Setup
            </button>
          </div>
        </div>
      </section>

      {/* How Counsel Works */}
      <section className="counsel-section">
        <div className="counsel-container">
          <h2 className="counsel-section__title">How Counsel Works</h2>
          <p className="counsel-section__subtitle">
            Attorney support is embedded in your workflows, not bolted on through
            email or external consultations.
          </p>

          <div className="counsel-grid counsel-grid--2">
            <div className="counsel-card">
              <div className="counsel-card__icon counsel-card__icon--gold">
                <Users size={24} />
              </div>
              <h3>Traditional Legal Support</h3>
              <ul className="counsel-list">
                <li>
                  <Check size={16} />
                  <span>Email discussions for counsel review</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Scheduled calls or in-person consultations</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Separate billing for every interaction</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Manual tracking of attorney time and billing</span>
                </li>
              </ul>
            </div>

            <div className="counsel-card">
              <div className="counsel-card__icon counsel-card__icon--gold">
                <Shield size={24} />
              </div>
              <h3>Counsel on TSL</h3>
              <ul className="counsel-list">
                <li>
                  <Check size={16} />
                  <span>Counsel operates inside workflows, not via email</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Context-aware reviews with negotiation history</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>Flat monthly negotiation budget, gates, no help</span>
                </li>
                <li>
                  <Check size={16} />
                  <span>All actions are time-tracked and audit-ready</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="counsel-banner counsel-banner--warning">
            <div className="counsel-banner__icon">
              <AlertCircle size={20} />
            </div>
            <div className="counsel-banner__content">
              <strong>Gen-Based Engagement Only</strong>
              <p>
                Counsel is engaged at defined review or approval gates within workflows. Ad-hoc legal questions outside workflows are not supported through this feature.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Defined Review and Approval Gates */}
      <section className="counsel-section counsel-section--light">
        <div className="counsel-container">
          <Link to="/features" className="counsel-link">
            Where Counsel is Located
          </Link>
          <h2 className="counsel-section__title">Defined Review and Approval Gates</h2>
          <p className="counsel-section__subtitle">
            Counsel is triggered at specific points in your workflows where legal
            expertise is required for the next stage.
          </p>

          <div className="counsel-grid counsel-grid--2">
            <div className="counsel-feature">
              <div className="counsel-feature__icon">
                <FileText size={24} />
              </div>
              <h3>Document Review Gates</h3>
              <p>
                Counsel reviews draft documents at key gates before finalization or signature.
              </p>
              <p className="counsel-feature__example">
                <strong>Examples:</strong> Shareholder agreements, investment terms, IP assignments
              </p>
            </div>

            <div className="counsel-feature">
              <div className="counsel-feature__icon">
                <Users size={24} />
              </div>
              <h3>Negotiation Escalations</h3>
              <p>
                When counterparty requests fall outside standard parameters or require legal judgment.
              </p>
              <p className="counsel-feature__example">
                <strong>Examples:</strong> Material edits, liability terms, non-standard terms
              </p>
            </div>

            <div className="counsel-feature">
              <div className="counsel-feature__icon">
                <Scale size={24} />
              </div>
              <h3>Edge Case Resolution</h3>
              <p>
                When workflow logic encounters scenarios not covered by standard templates.
              </p>
              <p className="counsel-feature__example">
                <strong>Examples:</strong> Multi-party agreements, complex equity structures, cross-border clauses
              </p>
            </div>

            <div className="counsel-feature">
              <div className="counsel-feature__icon">
                <Check size={24} />
              </div>
              <h3>Approval Requirements</h3>
              <p>
                Workflows configured to require attorney approval before proceeding to signature.
              </p>
              <p className="counsel-feature__example">
                <strong>Examples:</strong> Board resolutions, financing agreements, regulatory changes
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Attorney Support Package */}
      <section className="counsel-section">
        <div className="counsel-container">
          <Link to="/pricing" className="counsel-link">
            What's Included
          </Link>
          <h2 className="counsel-section__title">Monthly Attorney Support Package</h2>
          <p className="counsel-section__subtitle">
            Your monthly attorney hours include reviews, guidance, risk assessments, and
            even basic documentation.
          </p>

          <div className="counsel-grid counsel-grid--3">
            <div className="counsel-package">
              <div className="counsel-package__number">01</div>
              <h3>Monthly Attorney Hours</h3>
              <p>
                Allocated hours based on your plan tier. Unused hours expire at month end.
              </p>
            </div>

            <div className="counsel-package">
              <div className="counsel-package__number">02</div>
              <h3>In-Workflow Reviews</h3>
              <p>
                Counsel reviews happen inside workflows, not via email. All actions documented in context.
              </p>
            </div>

            <div className="counsel-package">
              <div className="counsel-package__number">03</div>
              <h3>Hand Guidance</h3>
              <p>
                Strategic advice on negotiation tactics, risk mitigation, and compliance requirements.
              </p>
            </div>

            <div className="counsel-package">
              <div className="counsel-package__number">04</div>
              <h3>Risk Assessments</h3>
              <p>
                Formal flag review ranging from low-risk administrative tasks to high-risk regulatory matters.
              </p>
            </div>

            <div className="counsel-package">
              <div className="counsel-package__number">05</div>
              <h3>Alternative Positions</h3>
              <p>
                Suggested alternative clauses or negotiation positions when standard terms don't fit.
              </p>
            </div>

            <div className="counsel-package">
              <div className="counsel-package__number">06</div>
              <h3>Audit Trail Inclusion</h3>
              <p>
                All counsel advice are recorded and time-stamped within your workflow audit trail.
              </p>
            </div>
          </div>

          <div className="counsel-banner counsel-banner--info">
            <div className="counsel-banner__icon">
              <Clock size={20} />
            </div>
            <div className="counsel-banner__content">
              <strong>Monthly Hours Do Not Roll Over</strong>
              <p>
                Attorney hours are allocated monthly based on your plan tier. Counsel hours expire at the end of each month, unused, and do not carry forward to the next billing cycle.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How Counsel is Governed */}
      <section className="counsel-section counsel-section--light">
        <div className="counsel-container">
          <Link to="/legal" className="counsel-link">
            Governance & Rules
          </Link>
          <h2 className="counsel-section__title">How Counsel is Governed</h2>
          <p className="counsel-section__subtitle">
            All counsel activity is audited, time-tracked, and governed by an audit-ready
            engagement framework.
          </p>

          <div className="counsel-grid counsel-grid--3">
            <div className="counsel-governance">
              <div className="counsel-governance__icon">
                <Shield size={24} />
              </div>
              <h3>Gate-Based Engagement</h3>
              <p>
                Counsel is only engaged at defined review or approval gates within workflows.
              </p>
            </div>

            <div className="counsel-governance">
              <div className="counsel-governance__icon">
                <FileText size={24} />
              </div>
              <h3>Identity-Linked Actions</h3>
              <p>
                Every counsel action is linked to a verified attorney identity and logged.
              </p>
            </div>

            <div className="counsel-governance">
              <div className="counsel-governance__icon">
                <Check size={24} />
              </div>
              <h3>Evidence Pack Integration</h3>
              <p>
                Counsel reviews, comments, and approvals are included in your evidence pack.
              </p>
            </div>

            <div className="counsel-governance">
              <div className="counsel-governance__icon">
                <Clock size={24} />
              </div>
              <h3>Time-Stamped</h3>
              <p>
                All counsel interactions are time-stamped and included in workflow timelines.
              </p>
            </div>

            <div className="counsel-governance">
              <div className="counsel-governance__icon">
                <Users size={24} />
              </div>
              <h3>Identity-Linked</h3>
              <p>
                Counsel actions are linked to verified attorney identities for accountability.
              </p>
            </div>

            <div className="counsel-governance">
              <div className="counsel-governance__icon">
                <Scale size={24} />
              </div>
              <h3>Preserved Forever</h3>
              <p>
                Counsel advice and approvals are preserved indefinitely in your audit trail.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="counsel-cta">
        <div className="counsel-cta__content">
          <h2>Counsel Support is Coming Soon</h2>
          <p>
            We're in the process of onboarding attorneys. This feature is not yet live but
            early access will be available to Boardroom tier subscribers.
          </p>
          <button className="counsel-cta__button">
            Request Early Access <ArrowRight size={20} />
          </button>
          <p className="counsel-cta__note">
            We appreciate your patience as we build this feature. Contact support for updates.
          </p>
        </div>
      </section>
    </div>
  )
}

// Made with Bob
