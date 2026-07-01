import { Activity, Clock, FileText, Search, Shield, UsersRound } from 'lucide-react'
import { useState } from 'react'
import InviteSubAdminModal from './InviteSubAdminModal'
import UserDetailsModal from './UserDetailsModal'
import './UserDetailsModal.css'

interface User {
  name: string
  email: string
  plan: string
  status: string
  joinDate: string
  company?: string
  phone?: string
  registrationNumber?: string
  address?: string
}

const adminUsers: User[] = [
  { name: 'John Doe', email: 'john@example.com', plan: 'Operator', status: 'Active', joinDate: 'Jan 15, 2025' },
  { name: 'Sarah Smith', email: 'sarah@example.com', plan: 'Launchpad', status: 'Active', joinDate: 'Feb 20, 2025' },
  { name: 'Mike Johnson', email: 'mike@example.com', plan: 'Operator', status: 'Active', joinDate: 'Mar 10, 2025' },
  { name: 'Emily Brown', email: 'emily@example.com', plan: 'Operator', status: 'Active', joinDate: 'Apr 5, 2025' },
  { name: 'David Wilson', email: 'david@example.com', plan: 'Launchpad', status: 'Inactive', joinDate: 'May 12, 2025' },
  { name: 'Lisa Anderson', email: 'lisa@example.com', plan: 'Boardroom', status: 'Active', joinDate: 'Jun 8, 2025' },
]

const adminManagementRows = [
  {
    name: 'John Smith',
    email: 'john.smith@admin.com',
    status: 'Active',
    lastActive: '2 hours ago',
    invitedDate: 'Dec 15, 2024',
    secondaryAction: 'Revoke',
  },
  {
    name: 'Emily Davis',
    email: 'emily.davis@admin.com',
    status: 'Pending',
    lastActive: 'Not yet active',
    invitedDate: 'Jan 3, 2025',
    secondaryAction: 'Cancel',
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@admin.com',
    status: 'Active',
    lastActive: '5 minutes ago',
    invitedDate: 'Nov 20, 2024',
    secondaryAction: 'Revoke',
  },
  {
    name: 'Sarah Johnson',
    email: 'sarah.j@admin.com',
    status: 'Pending',
    lastActive: 'Not yet active',
    invitedDate: 'Jan 5, 2025',
    secondaryAction: 'Cancel',
  },
]

type ManagementTab = 'users' | 'admins'

export default function UsersActivity() {
  const [managementTab, setManagementTab] = useState<ManagementTab>('users')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const handleViewUser = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedUser(null)
  }

  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true)
  }

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false)
  }

  const handleSendInvitation = (data: { fullName: string; email: string; message: string }) => {
    console.log('Sending invitation:', data)
    // TODO: Implement API call to send invitation
    // For now, just log the data
  }

  return (
    <section className="admin-users">
      <div className="admin-users__stats" aria-label="User activity summary">
        <article className="admin-users__stat">
          <span>
            <Activity size={24} />
          </span>
          <div>
            <strong>2,847</strong>
            <h2>Actions Today</h2>
            <p>+12% vs yesterday</p>
          </div>
        </article>
        <article className="admin-users__stat">
          <span>
            <UsersRound size={24} />
          </span>
          <div>
            <strong>234</strong>
            <h2>Active Users Now</h2>
            <p>8.2% of total</p>
          </div>
        </article>
        <article className="admin-users__stat">
          <span>
            <FileText size={24} />
          </span>
          <div>
            <strong>87</strong>
            <h2>{managementTab === 'admins' ? 'Wizards Started' : 'Workflows Started'}</h2>
            <p>today</p>
          </div>
        </article>
      </div>

      <div className="admin-users__tabs" aria-label="Management tabs">
        <button
          type="button"
          className={managementTab === 'users' ? 'admin-users__tab admin-users__tab--active' : 'admin-users__tab'}
          onClick={() => setManagementTab('users')}
        >
          User Management
        </button>
        <button
          type="button"
          className={managementTab === 'admins' ? 'admin-users__tab admin-users__tab--active' : 'admin-users__tab'}
          onClick={() => setManagementTab('admins')}
        >
          Admin Management
        </button>
      </div>

      {managementTab === 'admins' && (
        <div className="admin-users__admin-stats" aria-label="Admin management summary">
          <article className="admin-users__admin-stat">
            <span>
              <Shield size={24} />
            </span>
            <div>
              <strong>2</strong>
              <p>Active Admins</p>
            </div>
          </article>
          <article className="admin-users__admin-stat admin-users__admin-stat--muted">
            <span>
              <Clock size={24} />
            </span>
            <div>
              <strong>2</strong>
              <p>Pending Invites</p>
            </div>
          </article>
        </div>
      )}

      <div className="admin-users__table-card">
        <div className={managementTab === 'admins' ? 'admin-users__filters admin-users__filters--admin' : 'admin-users__filters'}>
          <label className="admin-users__search">
            <Search size={17} />
            <input type="search" placeholder="Search users..." />
          </label>
          {managementTab === 'users' ? (
            <>
              <button type="button" className="admin-users__filter-button">
                All Roles
                <span className="admin-users__select-arrow" aria-hidden="true" />
              </button>
              <button type="button" className="admin-users__filter-button">
                All Plans
                <span className="admin-users__select-arrow" aria-hidden="true" />
              </button>
              <button type="button" className="admin-users__filter-button">
                All Status
                <span className="admin-users__select-arrow" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <button type="button" className="admin-users__filter-button">
                All Status
                <span className="admin-users__select-arrow" aria-hidden="true" />
              </button>
              <button type="button" className="admin-users__invite" onClick={handleOpenInviteModal}>
                Invite Sub Admin
              </button>
            </>
          )}
        </div>

        <div className="admin-users__table-wrap">
          {managementTab === 'users' ? (
            <table className="admin-users__table">
              <thead>
                <tr>
                  <th aria-label="Select all">
                    <span className="admin-users__checkbox" />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Join Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminUsers.map((user) => (
                  <tr key={user.email}>
                    <td>
                      <span className="admin-users__checkbox" />
                    </td>
                    <td>
                      <strong>{user.name}</strong>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className="admin-users__pill admin-users__pill--plan">{user.plan}</span>
                    </td>
                    <td>
                      <span
                        className={
                          user.status === 'Active'
                            ? 'admin-users__pill admin-users__pill--active'
                            : 'admin-users__pill admin-users__pill--inactive'
                        }
                      >
                        {user.status}
                      </span>
                    </td>
                    <td>{user.joinDate}</td>
                    <td>
                      <button type="button" className="admin-users__view" onClick={() => handleViewUser(user)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="admin-users__table admin-users__table--admins">
              <thead>
                <tr>
                  <th aria-label="Select all">
                    <span className="admin-users__checkbox" />
                  </th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Last Active</th>
                  <th>Invited Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {adminManagementRows.map((admin) => (
                  <tr key={admin.email}>
                    <td>
                      <span className="admin-users__checkbox" />
                    </td>
                    <td>
                      <strong>{admin.name}</strong>
                    </td>
                    <td>{admin.email}</td>
                    <td>
                      <span
                        className={
                          admin.status === 'Active'
                            ? 'admin-users__pill admin-users__pill--active'
                            : 'admin-users__pill admin-users__pill--pending'
                        }
                      >
                        {admin.status}
                      </span>
                    </td>
                    <td className={admin.status === 'Pending' ? 'admin-users__last-active--pending' : undefined}>
                      {admin.lastActive}
                    </td>
                    <td>{admin.invitedDate}</td>
                    <td>
                      <span className="admin-users__action-group">
                        <button type="button" className="admin-users__edit">
                          Edit
                        </button>
                        <span className="admin-users__divider" aria-hidden="true" />
                        <button
                          type="button"
                          className={
                            admin.secondaryAction === 'Revoke' ? 'admin-users__danger' : 'admin-users__muted-action'
                          }
                        >
                          {admin.secondaryAction}
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedUser && (
        <UserDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          user={selectedUser}
        />
      )}

      <InviteSubAdminModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        onSendInvitation={handleSendInvitation}
      />
    </section>
  )
}

// Made with Bob
