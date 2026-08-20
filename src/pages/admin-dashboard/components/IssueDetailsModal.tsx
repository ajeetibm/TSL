import { Calendar, Clock, Tag, User, Users, X } from 'lucide-react'

interface Issue {
  title: string
  id: string
  category: string
  reported: string
  by: string
  severity: string
}

interface IssueDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  issue: Issue | null
}

export default function IssueDetailsModal({ isOpen, onClose, issue }: IssueDetailsModalProps) {
  console.log('IssueDetailsModal render:', { isOpen, issue: issue?.title })
  
  if (!isOpen || !issue) {
    console.log('Modal not rendering - isOpen:', isOpen, 'issue:', issue)
    return null
  }
  
  console.log('Modal IS rendering!')

  const getSeverityClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'issue-severity-critical'
      case 'high':
        return 'issue-severity-high'
      case 'medium':
        return 'issue-severity-medium'
      default:
        return 'issue-severity-low'
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-content--issue" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>Issue Details</h2>
            <p>{issue.id} • {issue.category}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        <div className="issue-details">
          <h3>{issue.title}</h3>
          <span className={`issue-details__badge ${getSeverityClass(issue.severity)}`}>
            {issue.severity} Priority
          </span>

          <div className="issue-details__grid">
            <div className="issue-details__item">
              <div className="issue-details__item-header">
                <Calendar size={16} />
                <span className="issue-details__label">REPORTED</span>
              </div>
              <p>{issue.reported}</p>
            </div>

            <div className="issue-details__item">
              <div className="issue-details__item-header">
                <Clock size={16} />
                <span className="issue-details__label">LAST UPDATED</span>
              </div>
              <p>2024-01-09 09:15</p>
            </div>

            <div className="issue-details__item">
              <div className="issue-details__item-header">
                <User size={16} />
                <span className="issue-details__label">REPORTER</span>
              </div>
              <p>{issue.by}</p>
            </div>

            <div className="issue-details__item">
              <div className="issue-details__item-header">
                <Users size={16} />
                <span className="issue-details__label">ASSIGNED TO</span>
              </div>
              <p>DevOps Team</p>
            </div>

            <div className="issue-details__item">
              <div className="issue-details__item-header">
                <Tag size={16} />
                <span className="issue-details__label">CATEGORY</span>
              </div>
              <p>{issue.category}</p>
            </div>

            <div className="issue-details__item">
              <div className="issue-details__item-header">
                <Users size={16} />
                <span className="issue-details__label">AFFECTED USERS</span>
              </div>
              <p>47 users</p>
            </div>
          </div>

          <div className="issue-details__description">
            <h4>DESCRIPTION</h4>
            <p>
              Payment gateway is experiencing timeout errors during transaction processing. Multiple users have
              reported failed payments despite funds being debited.
            </p>
          </div>

          <div className="issue-details__actions">
            <button type="button" className="modal-btn modal-btn--primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Made with Bob
