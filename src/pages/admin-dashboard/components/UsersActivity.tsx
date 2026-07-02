import { Activity, Clock, FileText, Search, Shield, UsersRound, ChevronDown } from 'lucide-react'
import { useState, useMemo, useRef, useEffect } from 'react'
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
  
  // Filter states for User Management
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('All Roles')
  const [selectedPlan, setSelectedPlan] = useState('All Plans')
  const [selectedStatus, setSelectedStatus] = useState('All Status')
  
  // Filter states for Admin Management
  const [adminSearchQuery, setAdminSearchQuery] = useState('')
  const [adminSelectedStatus, setAdminSelectedStatus] = useState('All Status')
  
  // Dropdown open states
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false)
  const [isPlanDropdownOpen, setIsPlanDropdownOpen] = useState(false)
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
  const [isAdminStatusDropdownOpen, setIsAdminStatusDropdownOpen] = useState(false)
  
  // Refs for dropdown click outside detection
  const roleDropdownRef = useRef<HTMLDivElement>(null)
  const planDropdownRef = useRef<HTMLDivElement>(null)
  const statusDropdownRef = useRef<HTMLDivElement>(null)
  const adminStatusDropdownRef = useRef<HTMLDivElement>(null)
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false)
      }
      if (planDropdownRef.current && !planDropdownRef.current.contains(event.target as Node)) {
        setIsPlanDropdownOpen(false)
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false)
      }
      if (adminStatusDropdownRef.current && !adminStatusDropdownRef.current.contains(event.target as Node)) {
        setIsAdminStatusDropdownOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return adminUsers.filter((user) => {
      // Search filter
      const matchesSearch =
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Role filter (currently not used in data, but keeping for future)
      const matchesRole = selectedRole === 'All Roles'
      
      // Plan filter
      const matchesPlan = selectedPlan === 'All Plans' || user.plan === selectedPlan
      
      // Status filter
      const matchesStatus = selectedStatus === 'All Status' || user.status === selectedStatus
      
      return matchesSearch && matchesRole && matchesPlan && matchesStatus
    })
  }, [searchQuery, selectedRole, selectedPlan, selectedStatus])

  // Filter admins based on search and filters
  const filteredAdmins = useMemo(() => {
    return adminManagementRows.filter((admin) => {
      // Search filter
      const matchesSearch =
        admin.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(adminSearchQuery.toLowerCase())
      
      // Status filter
      const matchesStatus = adminSelectedStatus === 'All Status' || admin.status === adminSelectedStatus
      
      return matchesSearch && matchesStatus
    })
  }, [adminSearchQuery, adminSelectedStatus])

  // Get unique plans for filter dropdown
  const uniquePlans = Array.from(new Set(adminUsers.map(user => user.plan)))
  
  // Get unique statuses for filter dropdown
  const uniqueStatuses = Array.from(new Set(adminUsers.map(user => user.status)))
  const uniqueAdminStatuses = Array.from(new Set(adminManagementRows.map(admin => admin.status)))

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
            <input
              type="search"
              placeholder="Search users..."
              value={managementTab === 'users' ? searchQuery : adminSearchQuery}
              onChange={(e) => managementTab === 'users' ? setSearchQuery(e.target.value) : setAdminSearchQuery(e.target.value)}
            />
          </label>
          {managementTab === 'users' ? (
            <>
              {/* All Roles Dropdown */}
              <div ref={roleDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="admin-users__filter-button"
                  onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                >
                  {selectedRole}
                  <span className="admin-users__select-arrow" aria-hidden="true" />
                </button>
                {isRoleDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#ffffff',
                    border: '2px solid #e5e5e5',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRole('All Roles')
                        setIsRoleDropdownOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: selectedRole === 'All Roles' ? '#f5f5f5' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      All Roles
                    </button>
                  </div>
                )}
              </div>
              
              {/* All Plans Dropdown */}
              <div ref={planDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="admin-users__filter-button"
                  onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}
                >
                  {selectedPlan}
                  <span className="admin-users__select-arrow" aria-hidden="true" />
                </button>
                {isPlanDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#ffffff',
                    border: '2px solid #e5e5e5',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPlan('All Plans')
                        setIsPlanDropdownOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: selectedPlan === 'All Plans' ? '#f5f5f5' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      All Plans
                    </button>
                    {uniquePlans.map(plan => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => {
                          setSelectedPlan(plan)
                          setIsPlanDropdownOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: selectedPlan === plan ? '#f5f5f5' : 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* All Status Dropdown */}
              <div ref={statusDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="admin-users__filter-button"
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                >
                  {selectedStatus}
                  <span className="admin-users__select-arrow" aria-hidden="true" />
                </button>
                {isStatusDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#ffffff',
                    border: '2px solid #e5e5e5',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStatus('All Status')
                        setIsStatusDropdownOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: selectedStatus === 'All Status' ? '#f5f5f5' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      All Status
                    </button>
                    {uniqueStatuses.map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setSelectedStatus(status)
                          setIsStatusDropdownOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: selectedStatus === status ? '#f5f5f5' : 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Admin Status Dropdown */}
              <div ref={adminStatusDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="admin-users__filter-button"
                  onClick={() => setIsAdminStatusDropdownOpen(!isAdminStatusDropdownOpen)}
                >
                  {adminSelectedStatus}
                  <span className="admin-users__select-arrow" aria-hidden="true" />
                </button>
                {isAdminStatusDropdownOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: '#ffffff',
                    border: '2px solid #e5e5e5',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminSelectedStatus('All Status')
                        setIsAdminStatusDropdownOpen(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: 'none',
                        background: adminSelectedStatus === 'All Status' ? '#f5f5f5' : 'transparent',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      All Status
                    </button>
                    {uniqueAdminStatuses.map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setAdminSelectedStatus(status)
                          setIsAdminStatusDropdownOpen(false)
                        }}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: adminSelectedStatus === status ? '#f5f5f5' : 'transparent',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontSize: '16px'
                        }}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                      No users found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
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
                  ))
                )}
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
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                      No admins found matching your filters
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
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
                  ))
                )}
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
