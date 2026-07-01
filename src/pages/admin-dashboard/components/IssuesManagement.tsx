import { useState } from 'react'
import { Search, AlertCircle, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react'
import IssueDetailsModal from './IssueDetailsModal'

const adminIssues = [
  {
    title: 'Payment Gateway Timeout Error',
    id: '#ISS-1089',
    category: 'Payment',
    reported: '2024-01-09 08:45',
    by: 'System',
    severity: 'High',
  },
  {
    title: 'Document Generation Failure',
    id: '#ISS-1088',
    category: 'Wizard',
    reported: '2024-01-09 07:12',
    by: 'Michael Chen',
    severity: 'Critical',
  },
  {
    title: 'User Authentication Loop',
    id: '#ISS-1087',
    category: 'Auth',
    reported: '2024-01-09 06:33',
    by: 'Sarah Johnson',
    severity: 'High',
  },
  {
    title: 'Email Notification Delay',
    id: '#ISS-1086',
    category: 'Notification',
    reported: '2024-01-08 22:15',
    by: 'System',
    severity: 'Medium',
  },
  {
    title: 'PDF Export Formatting Issue',
    id: '#ISS-1085',
    category: 'Export',
    reported: '2024-01-08 18:42',
    by: 'David Park',
    severity: 'Low',
  },
  {
    title: 'Dashboard Widget Loading Error',
    id: '#ISS-1084',
    category: 'Dashboard',
    reported: '2024-01-08 15:27',
    by: 'Emma Wilson',
    severity: 'Medium',
  },
  {
    title: 'Database Connection Intermittent',
    id: '#ISS-1083',
    category: 'Database',
    reported: '2024-01-08 14:05',
    by: 'System',
    severity: 'Critical',
  },
  {
    title: 'Search Functionality Not Working',
    id: '#ISS-1082',
    category: 'Search',
    reported: '2024-01-08 11:38',
    by: 'Lisa Anderson',
    severity: 'High',
  },
]

const issueCategories = [
  { label: 'Payment', count: 5, tone: 'critical' },
  { label: 'Wizard', count: 8, tone: 'high' },
  { label: 'Authentication', count: 4, tone: 'medium' },
  { label: 'Database', count: 3, tone: 'critical' },
  { label: 'Notification', count: 6, tone: 'neutral' },
  { label: 'Other', count: 5, tone: 'neutral' },
]

export default function IssuesManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<typeof adminIssues[0] | null>(null)

  const handleViewDetails = (issue: typeof adminIssues[0]) => {
    console.log('Opening modal for issue:', issue)
    setSelectedIssue(issue)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedIssue(null)
  }

  return (
    <>
      <section className="admin-issues">
      <div className="admin-issues__stats" aria-label="Issues summary">
        <article className="admin-issues__stat">
          <span>
            <AlertCircle size={28} />
          </span>
          <div>
            <strong>3</strong>
            <p>Critical</p>
            <small className="admin-issues__copy--critical">Immediate attention required</small>
          </div>
        </article>
        <article className="admin-issues__stat">
          <span>
            <AlertTriangle size={28} />
          </span>
          <div>
            <strong>12</strong>
            <p>High Priority</p>
            <small className="admin-issues__copy--high">Requires attention</small>
          </div>
        </article>
        <article className="admin-issues__stat admin-issues__stat--warning">
          <span>
            <AlertTriangle size={28} />
          </span>
          <div>
            <strong>11</strong>
            <p>Medium Priority</p>
            <small className="admin-issues__copy--medium">Monitor closely</small>
          </div>
        </article>
        <article className="admin-issues__stat admin-issues__stat--warning">
          <span>
            <CheckCircle size={28} />
          </span>
          <div>
            <strong>8</strong>
            <p>Resolved Today</p>
            <small className="admin-issues__copy--success">Successfully resolved</small>
          </div>
        </article>
      </div>

      <div className="admin-issues__layout">
        <section className="admin-issues__list-panel">
          <div className="admin-issues__filters">
            <label className="admin-issues__search">
              <Search size={16} />
              <input type="search" placeholder="Search issues..." />
            </label>
            <button type="button" className="admin-issues__filter-button">
              All Severity
              <ChevronDown size={16} />
            </button>
          </div>

          <div className="admin-issues__list">
            {adminIssues.map((issue) => {
              const critical = issue.severity === 'Critical'
              const medium = issue.severity === 'Medium'
              const low = issue.severity === 'Low'
              return (
                <article className="admin-issues__item" key={issue.id}>
                  <span className="admin-issues__item-icon">
                    <AlertTriangle size={24} />
                  </span>
                  <div className="admin-issues__item-content">
                    <div className="admin-issues__item-heading">
                      <div>
                        <h2>{issue.title}</h2>
                        <p>
                          {issue.id} • {issue.category}
                        </p>
                      </div>
                      <b
                        className={
                          critical
                            ? 'admin-issues__severity admin-issues__severity--critical'
                            : medium
                              ? 'admin-issues__severity admin-issues__severity--medium'
                              : low
                                ? 'admin-issues__severity admin-issues__severity--low'
                                : 'admin-issues__severity admin-issues__severity--high'
                        }
                      >
                        {issue.severity}
                      </b>
                    </div>
                    <p className="admin-issues__meta">
                      Reported: {issue.reported}
                      <span>•</span>
                      By: {issue.by}
                    </p>
                    <button type="button" onClick={() => handleViewDetails(issue)}>
                      View Details
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        <aside className="admin-issues__categories">
          <h2>Issue Categories</h2>
          <div>
            {issueCategories.map((category) => (
              <article className="admin-issues__category" key={category.label}>
                <strong>{category.label}</strong>
                <span className={`admin-issues__category-count admin-issues__category-count--${category.tone}`}>
                  {category.count}
                </span>
              </article>
            ))}
          </div>
        </aside>
      </div>
      </section>

      <IssueDetailsModal isOpen={isModalOpen} issue={selectedIssue} onClose={handleCloseModal} />
    </>
  )
}

// Made with Bob
