import {
  AlertTriangle,
  ChevronDown,
  CircleX,
  Clock,
  DollarSign,
  Download,
  Search,
} from 'lucide-react'

const adminInvoices = [
  { invoiceId: 'INV-2025-001', client: 'Acme Corp', plan: 'Operator', issueDate: 'Jan 3, 2026', dueDate: 'Jan 17, 2026' },
  { invoiceId: 'INV-2025-002', client: 'TechStart Ltd', plan: 'Launchpad', issueDate: 'Jan 2, 2026', dueDate: 'Jan 16, 2026' },
  { invoiceId: 'INV-2025-003', client: 'Digital Co', plan: 'Operator', issueDate: 'Dec 25, 2025', dueDate: 'Jan 8, 2026' },
  { invoiceId: 'INV-2024-004', client: 'Cloud Systems', plan: 'Boardroom', issueDate: 'Jan 3, 2026', dueDate: 'Jan 17, 2026' },
  { invoiceId: 'INV-2024-005', client: 'Smart Solutions', plan: 'Operator', issueDate: 'Dec 20, 2025', dueDate: 'Jan 3, 2026' },
]

export default function BillingInvoices() {
  return (
    <div className="admin-settings__billing">
      <section className="admin-settings__billing-alert">
        <span>
          <AlertTriangle size={22} />
        </span>
        <div>
          <h2>Payment Reconciliation Required</h2>
          <p>3 payments have failed in the last 7 days. Review and retry failed transactions to maintain cash flow.</p>
          <button type="button">Review Failed Payments</button>
        </div>
      </section>

      <div className="admin-settings__billing-stats" aria-label="Billing summary">
        <article className="admin-settings__billing-stat">
          <span>
            <DollarSign size={24} />
          </span>
          <div>
            <strong>R485,740</strong>
            <p>Total Revenue</p>
            <small>This month</small>
          </div>
        </article>
        <article className="admin-settings__billing-stat">
          <span>
            <Clock size={24} />
          </span>
          <div>
            <strong>R23,450</strong>
            <p>Outstanding Invoices</p>
            <small>12 pending</small>
          </div>
        </article>
        <article className="admin-settings__billing-stat admin-settings__billing-stat--failed">
          <span>
            <CircleX size={23} />
          </span>
          <div>
            <strong>R8,920</strong>
            <p>Failed Payments</p>
            <small>5 failed</small>
          </div>
        </article>
      </div>

      <section className="admin-settings__invoice-card">
        <header className="admin-settings__invoice-header">
          <h2>Recent Invoices</h2>
          <button type="button">
            <Download size={17} />
            Download Invoices
          </button>
        </header>

        <div className="admin-settings__invoice-filters">
          <label className="admin-settings__invoice-search">
            <Search size={18} />
            <input type="search" placeholder="Search users..." aria-label="Search invoices" />
          </label>
          {['All Clients', 'All Plans', 'All Months'].map((filter) => (
            <button key={filter} type="button" className="admin-settings__invoice-filter">
              {filter}
              <ChevronDown size={16} />
            </button>
          ))}
        </div>

        <div className="admin-settings__invoice-table-wrap">
          <table className="admin-settings__invoice-table">
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Client</th>
                <th>Plans</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {adminInvoices.map((invoice) => (
                <tr key={invoice.invoiceId}>
                  <td>{invoice.invoiceId}</td>
                  <td>{invoice.client}</td>
                  <td>
                    <span className="admin-settings__plan-pill">{invoice.plan}</span>
                  </td>
                  <td>{invoice.issueDate}</td>
                  <td>{invoice.dueDate}</td>
                  <td>
                    <span className="admin-settings__invoice-actions">
                      <button type="button">View</button>
                      <i aria-hidden="true" />
                      <button type="button">Download</button>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

// Made with Bob
