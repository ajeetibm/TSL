import { CheckCircle2, ChevronRight, CircleDot, DollarSign, MessageSquare, Scale, Send, Upload } from 'lucide-react'
import { useState } from 'react'
import { DashboardShell } from '../components/dashboard/DashboardShell'
import { setPageMetadata } from '../services/metadata'
import './Dashboard.css'
import './DashboardCounsel.css'

const requestHistory = [
  {
    title: 'NDA Review - Tech Partnership',
    date: 'Dec 15, 2025',
    reviewer: 'Reviewed by Sarah Naidoo',
    status: 'In Progress',
  },
  {
    title: 'NDA Review - Tech Partnership',
    date: 'Dec 15, 2025',
    reviewer: 'Reviewed by Sarah Naidoo',
    status: 'Completed',
  },
  {
    title: 'NDA Review - Tech Partnership',
    date: 'Dec 15, 2025',
    reviewer: 'Reviewed by Sarah Naidoo',
    status: 'Completed',
  },
]

export default function DashboardCounsel() {
  const [activeTab, setActiveTab] = useState<'book' | 'history'>('book')

  setPageMetadata('Counsel', 'Connect with experienced attorneys for expert guidance.')

  return (
    <DashboardShell activeSection="Counsel">
      <main className="dashboard-counsel">
        <header className="dashboard-counsel__header">
          <span className="dashboard-counsel__header-marker" aria-hidden="true">
            <Scale size={18} />
          </span>
          <div>
            <h1>Counsel</h1>
            <p>Connect with experienced attorneys for expert guidance</p>
          </div>
        </header>

        <div className="dashboard-counsel__content">
          <section className="dashboard-counsel__stats" aria-label="Counsel credit summary">
            <article className="dashboard-counsel__stat dashboard-counsel__stat--gold">
              <div className="dashboard-counsel__stat-top">
                <span className="dashboard-counsel__stat-icon">
                  <DollarSign size={24} />
                </span>
                <div className="dashboard-counsel__stat-value">
                  <strong>2</strong>
                  <span>credits remaining</span>
                </div>
              </div>
              <h2>Counsel Credits</h2>
              <p>Included with your Boardroom plan</p>
            </article>

            <article className="dashboard-counsel__stat">
              <div className="dashboard-counsel__stat-top">
                <span className="dashboard-counsel__stat-icon dashboard-counsel__stat-icon--navy">
                  <MessageSquare size={24} />
                </span>
                <div className="dashboard-counsel__stat-value">
                  <strong>1</strong>
                  <span>credits used</span>
                </div>
              </div>
              <h2>Usage This Month</h2>
              <p>1 of 6 included credits</p>
            </article>
          </section>

          <section className="dashboard-counsel__topup">
            <span className="dashboard-counsel__topup-icon">
              <DollarSign size={22} />
            </span>
            <div>
              <h2>Credit Usage &amp; Top-Ups</h2>
              <p>
                Your plan includes 6 counsel credits per month for basic reviews. If scope exceeds basic credit
                allocation, top-up pricing applies at R450 per additional credit hour.
              </p>
            </div>
            <button type="button">
              Top Up Credits
              <ChevronRight size={16} />
            </button>
          </section>

          <section className="dashboard-counsel__workspace">
            <div className="dashboard-counsel__tabs" aria-label="Counsel tabs">
              <button
                type="button"
                className={
                  activeTab === 'book'
                    ? 'dashboard-counsel__tab dashboard-counsel__tab--active'
                    : 'dashboard-counsel__tab'
                }
                onClick={() => setActiveTab('book')}
              >
                Book Counsel
              </button>
              <button
                type="button"
                className={
                  activeTab === 'history'
                    ? 'dashboard-counsel__tab dashboard-counsel__tab--active'
                    : 'dashboard-counsel__tab'
                }
                onClick={() => setActiveTab('history')}
              >
                Request History
              </button>
            </div>

            {activeTab === 'book' ? (
              <form className="dashboard-counsel__form">
                <div className="dashboard-counsel__form-heading">
                  <h2>Request Expert Review</h2>
                  <p>Submit a request for legal review or escalation. Our attorneys will respond within 24 hours.</p>
                </div>

                <label className="dashboard-counsel__field">
                  <span>Subject</span>
                  <input type="text" aria-label="Subject" />
                </label>

                <label className="dashboard-counsel__field">
                  <span>Description</span>
                  <textarea aria-label="Description" />
                </label>

                <label className="dashboard-counsel__field">
                  <span className="dashboard-counsel__label-row">
                    Attachments (Optional)
                    <small>
                      <Upload size={14} />
                      PDF, DOCX, • Max 4MB
                    </small>
                  </span>
                  <button type="button" className="dashboard-counsel__upload">
                    <Upload size={16} />
                    Upload files
                  </button>
                </label>

                <label className="dashboard-counsel__field">
                  <span>Related Wizard (Optional)</span>
                  <select aria-label="Related Wizard" defaultValue="">
                    <option value="" disabled />
                    <option>Non-Disclosure Agreement (NDA)</option>
                    <option>Employment Offer Letter</option>
                    <option>Privacy Policy (POPIA Compliant)</option>
                    <option>Founder Agreement</option>
                    <option>Service Agreement</option>
                  </select>
                </label>

                <button type="submit" className="dashboard-counsel__submit">
                  <Send size={18} />
                  Submit Request
                </button>
              </form>
            ) : (
              <div className="dashboard-counsel__history" aria-label="Counsel request history">
                {requestHistory.map((request, index) => {
                  const isCompleted = request.status === 'Completed'
                  const StatusIcon = isCompleted ? CheckCircle2 : CircleDot

                  return (
                    <article className="dashboard-counsel__history-card" key={`${request.title}-${index}`}>
                      <div className="dashboard-counsel__history-copy">
                        <h2>{request.title}</h2>
                        <p>
                          <span>{request.date}</span>
                          <b>•</b>
                          <span>{request.reviewer}</span>
                        </p>
                      </div>

                      <span
                        className={
                          isCompleted
                            ? 'dashboard-counsel__status dashboard-counsel__status--completed'
                            : 'dashboard-counsel__status dashboard-counsel__status--progress'
                        }
                      >
                        <StatusIcon size={16} />
                        {request.status}
                      </span>

                      <button type="button" className="dashboard-counsel__response">
                        View Response
                      </button>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>
    </DashboardShell>
  )
}
