import { Activity, CheckCircle2, Clock, FileText, Search, Shield, UsersRound, X } from 'lucide-react'
import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import InviteSubAdminModal from './InviteSubAdminModal'
import UserDetailsModal from './UserDetailsModal'
import AdminEditModal from './AdminEditModal'
import AdminRevokeDialog from './AdminRevokeDialog'
import { useUserProfile } from '../../../context/UserProfileContext'
import { adminApi } from '../../../services/tslApi'
import { getAdmins } from '../services/adminManagementService'
import type { AdminRecord } from '../types/adminManagement'
import './UserDetailsModal.css'

// ── User Management types / helpers (unchanged) ───────────────────────────

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

interface AdminUsersApiUser {
  userId?: string
  fullName?: string
  email?: string
  companyName?: string
  contactPerson?: string
  phone?: string
  registrationNumber?: string
  physicalAddress?: string
  address?: string
  plan?: string
  status?: string
  joinedAt?: string
}

interface AdminUsersApiData {
  users?: AdminUsersApiUser[]
}

type ToastState = { msg: string; type: 'success' | 'error' } | null

function formatPlan(plan?: string) {
  if (!plan) return 'Operator'
  const normalized = plan.toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function formatStatus(status?: string) {
  if (!status) return 'Active'
  const normalized = status.toLowerCase()
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

function formatJoinDate(joinedAt?: string) {
  if (!joinedAt) return ''
  const parsed = new Date(joinedAt)
  if (Number.isNaN(parsed.getTime())) return joinedAt
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function mapApiUser(user: AdminUsersApiUser): User | null {
  if (!user.email) return null
  return {
    name: user.contactPerson || user.fullName || user.companyName || 'Unknown',
    email: user.email,
    plan: formatPlan(user.plan),
    status: formatStatus(user.status),
    joinDate: formatJoinDate(user.joinedAt),
    company: user.companyName,
    phone: user.phone,
    registrationNumber: user.registrationNumber,
    address: user.physicalAddress || user.address,
  }
}

function isAdminLikeEmail(email: string) {
  const normalized = email.toLowerCase()
  return normalized.includes('admin') || normalized.includes('thestartuplegal')
}

const adminUsersFallback: User[] = [
  { name: 'John Doe',      email: 'john@example.com',  plan: 'Operator',  status: 'Active',   joinDate: 'Jan 15, 2025' },
  { name: 'Sarah Smith',   email: 'sarah@example.com', plan: 'Launchpad', status: 'Active',   joinDate: 'Feb 20, 2025' },
  { name: 'Mike Johnson',  email: 'mike@example.com',  plan: 'Operator',  status: 'Active',   joinDate: 'Mar 10, 2025' },
  { name: 'Emily Brown',   email: 'emily@example.com', plan: 'Operator',  status: 'Active',   joinDate: 'Apr 5, 2025' },
  { name: 'David Wilson',  email: 'david@example.com', plan: 'Launchpad', status: 'Inactive', joinDate: 'May 12, 2025' },
  { name: 'Lisa Anderson', email: 'lisa@example.com',  plan: 'Boardroom', status: 'Active',   joinDate: 'Jun 8, 2025' },
]

type ManagementTab = 'users' | 'admins'

// ── Toast component ───────────────────────────────────────────────────────

interface AdminToastProps {
  toast:   ToastState
  onClose: () => void
}

function AdminToast({ toast, onClose }: AdminToastProps) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onClose, 5000)
    return () => clearTimeout(t)
  }, [toast, onClose])

  if (!toast) return null

  return (
    <div className={`adm-toast adm-toast--${toast.type}`} role={toast.type === 'success' ? 'status' : 'alert'} aria-live="polite">
      <span className="adm-toast__icon">
        {toast.type === 'success' ? <CheckCircle2 size={17} /> : <X size={17} />}
      </span>
      <p className="adm-toast__msg">{toast.msg}</p>
      <button type="button" className="adm-toast__close" onClick={onClose} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────

export default function UsersActivity() {
  const { profile } = useUserProfile()
  const [managementTab, setManagementTab]   = useState<ManagementTab>('users')
  const [isModalOpen, setIsModalOpen]       = useState(false)
  const [selectedUser, setSelectedUser]     = useState<User | null>(null)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [apiUsers, setApiUsers]             = useState<User[] | null>(null)

  // ── Admin management state ─────────────────────────────────────────────
  const [admins, setAdmins]                     = useState<AdminRecord[]>([])
  const [editingAdmin, setEditingAdmin]         = useState<AdminRecord | null>(null)
  const [revokingAdmin, setRevokingAdmin]       = useState<AdminRecord | null>(null)
  const [toast, setToast]                       = useState<ToastState>(null)

  const showToast = useCallback((msg: string, type: 'success' | 'error') => {
    setToast({ msg, type })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  // ── User management filter state ───────────────────────────────────────
  const [searchQuery, setSearchQuery]           = useState('')
  const [selectedPlan, setSelectedPlan]         = useState('All Plans')
  const [selectedStatus, setSelectedStatus]     = useState('All Status')
  const [dateSort, setDateSort]                 = useState<'newest' | 'oldest'>('newest')

  // ── Admin management filter state ─────────────────────────────────────
  const [adminSearchQuery, setAdminSearchQuery]       = useState('')
  const [adminSelectedStatus, setAdminSelectedStatus] = useState('All Status')

  // ── Dropdown refs ──────────────────────────────────────────────────────
  const dateSortDropdownRef    = useRef<HTMLDivElement>(null)
  const planDropdownRef        = useRef<HTMLDivElement>(null)
  const statusDropdownRef      = useRef<HTMLDivElement>(null)
  const adminStatusDropdownRef = useRef<HTMLDivElement>(null)
  const [isDateSortDropdownOpen,    setIsDateSortDropdownOpen]    = useState(false)
  const [isPlanDropdownOpen,        setIsPlanDropdownOpen]        = useState(false)
  const [isStatusDropdownOpen,      setIsStatusDropdownOpen]      = useState(false)
  const [isAdminStatusDropdownOpen, setIsAdminStatusDropdownOpen] = useState(false)

  // ── Data loading ───────────────────────────────────────────────────────

  useEffect(() => {
    let isCurrent = true
    adminApi.users().then((result) => {
      if (!isCurrent || !result.success) return
      const data  = result.data as AdminUsersApiData | undefined
      const users = data?.users?.map(mapApiUser).filter((u): u is User => Boolean(u))
      if (users?.length) setApiUsers(users)
    })
    return () => { isCurrent = false }
  }, [])

  useEffect(() => {
    let isCurrent = true
    getAdmins().then((result) => {
      if (!isCurrent || !result.success || !result.data) return
      setAdmins(result.data)
    })
    return () => { isCurrent = false }
  }, [])

  // ── Close dropdowns on outside click ──────────────────────────────────

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dateSortDropdownRef.current    && !dateSortDropdownRef.current.contains(e.target as Node))    setIsDateSortDropdownOpen(false)
      if (planDropdownRef.current        && !planDropdownRef.current.contains(e.target as Node))        setIsPlanDropdownOpen(false)
      if (statusDropdownRef.current      && !statusDropdownRef.current.contains(e.target as Node))      setIsStatusDropdownOpen(false)
      if (adminStatusDropdownRef.current && !adminStatusDropdownRef.current.contains(e.target as Node)) setIsAdminStatusDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Handlers ───────────────────────────────────────────────────────────

  const handleViewUser  = (user: User) => { setSelectedUser(user); setIsModalOpen(true) }
  const handleCloseUser = () => { setIsModalOpen(false); setSelectedUser(null) }

  const handleAdminSaved = (updated: AdminRecord) => {
    setAdmins((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
  }

  const handleAdminRevoked = (id: string) => {
    setAdmins((prev) => prev.filter((a) => a.id !== id))
    setRevokingAdmin(null)
  }

  // ── Derived data ───────────────────────────────────────────────────────

  const mergedUsers = useMemo(() => {
    const sourceUsers = apiUsers?.length ? apiUsers : adminUsersFallback
    if (!profile.email || isAdminLikeEmail(profile.email)) return sourceUsers
    const existingIndex = sourceUsers.findIndex((u) => u.email.toLowerCase() === profile.email.toLowerCase())
    const liveRow: User = {
      name: profile.contactPerson || profile.companyName || sourceUsers[existingIndex]?.name || 'Unknown',
      email: profile.email,
      plan: sourceUsers[existingIndex]?.plan ?? 'Operator',
      status: sourceUsers[existingIndex]?.status ?? 'Active',
      joinDate: sourceUsers[existingIndex]?.joinDate ?? '',
      company: profile.companyName,
      phone: profile.phone,
      registrationNumber: profile.registrationNumber,
      address: profile.physicalAddress,
    }
    if (existingIndex !== -1) {
      const updated = [...sourceUsers]
      updated[existingIndex] = liveRow
      return updated
    }
    return [liveRow, ...sourceUsers]
  }, [apiUsers, profile])

  const filteredUsers = useMemo(() => {
    const filtered = mergedUsers.filter((u) => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesPlan   = selectedPlan   === 'All Plans'  || u.plan   === selectedPlan
      const matchesStatus = selectedStatus === 'All Status' || u.status === selectedStatus
      return matchesSearch && matchesPlan && matchesStatus
    })
    return [...filtered].sort((a, b) => {
      const da = a.joinDate ? new Date(a.joinDate).getTime() : 0
      const db = b.joinDate ? new Date(b.joinDate).getTime() : 0
      return dateSort === 'newest' ? db - da : da - db
    })
  }, [mergedUsers, searchQuery, selectedPlan, selectedStatus, dateSort])

  const filteredAdmins = useMemo(() =>
    admins.filter((a) => {
      const matchesSearch = a.name.toLowerCase().includes(adminSearchQuery.toLowerCase()) || a.email.toLowerCase().includes(adminSearchQuery.toLowerCase())
      const matchesStatus = adminSelectedStatus === 'All Status' || a.status === adminSelectedStatus
      return matchesSearch && matchesStatus
    }), [admins, adminSearchQuery, adminSelectedStatus])

  const uniquePlans        = Array.from(new Set(mergedUsers.map((u) => u.plan)))
  const uniqueStatuses     = Array.from(new Set(mergedUsers.map((u) => u.status)))
  const uniqueAdminStatuses = Array.from(new Set(admins.map((a) => a.status)))

  const activeAdminsCount  = admins.filter((a) => a.status === 'Active').length
  const pendingAdminsCount = admins.filter((a) => a.status === 'Pending').length

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <section className="admin-users">
      {/* Stats row */}
      <div className="admin-users__stats" aria-label="User activity summary">
        <article className="admin-users__stat">
          <span><Activity size={24} /></span>
          <div>
            <strong>2,847</strong>
            <h2>Actions Today</h2>
            <p>+12% vs yesterday</p>
          </div>
        </article>
        <article className="admin-users__stat">
          <span><UsersRound size={24} /></span>
          <div>
            <strong>234</strong>
            <h2>Active Users Now</h2>
            <p>8.2% of total</p>
          </div>
        </article>
        <article className="admin-users__stat">
          <span><FileText size={24} /></span>
          <div>
            <strong>87</strong>
            <h2>{managementTab === 'admins' ? 'Wizards Started' : 'Workflows Started'}</h2>
            <p>today</p>
          </div>
        </article>
      </div>

      {/* Tabs */}
      <div className="admin-users__tabs" aria-label="Management tabs">
        <button type="button" className={managementTab === 'users'  ? 'admin-users__tab admin-users__tab--active' : 'admin-users__tab'} onClick={() => setManagementTab('users')}>User Management</button>
        <button type="button" className={managementTab === 'admins' ? 'admin-users__tab admin-users__tab--active' : 'admin-users__tab'} onClick={() => setManagementTab('admins')}>Admin Management</button>
      </div>

      {/* Admin summary KPIs */}
      {managementTab === 'admins' && (
        <div className="admin-users__admin-stats" aria-label="Admin management summary">
          <article className="admin-users__admin-stat">
            <span><Shield size={24} /></span>
            <div>
              <strong>{activeAdminsCount}</strong>
              <p>Active Admins</p>
            </div>
          </article>
          <article className="admin-users__admin-stat admin-users__admin-stat--muted">
            <span><Clock size={24} /></span>
            <div>
              <strong>{pendingAdminsCount}</strong>
              <p>Pending Invites</p>
            </div>
          </article>
        </div>
      )}

      {/* Table card */}
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
              {/* Date sort dropdown */}
              <div ref={dateSortDropdownRef} style={{ position: 'relative' }}>
                <button type="button" className="admin-users__filter-button" onClick={() => setIsDateSortDropdownOpen(!isDateSortDropdownOpen)}>
                  {dateSort === 'newest' ? 'Newest First' : 'Oldest First'}<span className="admin-users__select-arrow" aria-hidden="true" />
                </button>
                {isDateSortDropdownOpen && (
                  <div className="adm-dropdown">
                    {(['newest', 'oldest'] as const).map((opt) => (
                      <button key={opt} type="button" className={`adm-dropdown__item${dateSort === opt ? ' adm-dropdown__item--active' : ''}`} onClick={() => { setDateSort(opt); setIsDateSortDropdownOpen(false) }}>
                        {opt === 'newest' ? 'Newest First' : 'Oldest First'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Plan dropdown */}
              <div ref={planDropdownRef} style={{ position: 'relative' }}>
                <button type="button" className="admin-users__filter-button" onClick={() => setIsPlanDropdownOpen(!isPlanDropdownOpen)}>
                  {selectedPlan}<span className="admin-users__select-arrow" aria-hidden="true" />
                </button>
                {isPlanDropdownOpen && (
                  <div className="adm-dropdown">
                    {['All Plans', ...uniquePlans].map((p) => (
                      <button key={p} type="button" className={`adm-dropdown__item${selectedPlan === p ? ' adm-dropdown__item--active' : ''}`} onClick={() => { setSelectedPlan(p); setIsPlanDropdownOpen(false) }}>{p}</button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status dropdown */}
              <div ref={statusDropdownRef} style={{ position: 'relative' }}>
                <button type="button" className="admin-users__filter-button" onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}>
                  {selectedStatus}<span className="admin-users__select-arrow" aria-hidden="true" />
                </button>
                {isStatusDropdownOpen && (
                  <div className="adm-dropdown">
                    {['All Status', ...uniqueStatuses].map((s) => (
                      <button key={s} type="button" className={`adm-dropdown__item${selectedStatus === s ? ' adm-dropdown__item--active' : ''}`} onClick={() => { setSelectedStatus(s); setIsStatusDropdownOpen(false) }}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Admin status dropdown */}
              <div ref={adminStatusDropdownRef} style={{ position: 'relative' }}>
                <button type="button" className="admin-users__filter-button" onClick={() => setIsAdminStatusDropdownOpen(!isAdminStatusDropdownOpen)}>
                  {adminSelectedStatus}<span className="admin-users__select-arrow" aria-hidden="true" />
                </button>
                {isAdminStatusDropdownOpen && (
                  <div className="adm-dropdown">
                    {['All Status', ...uniqueAdminStatuses].map((s) => (
                      <button key={s} type="button" className={`adm-dropdown__item${adminSelectedStatus === s ? ' adm-dropdown__item--active' : ''}`} onClick={() => { setAdminSelectedStatus(s); setIsAdminStatusDropdownOpen(false) }}>{s}</button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" className="admin-users__invite" onClick={() => setIsInviteModalOpen(true)}>
                Invite Sub Admin
              </button>
            </>
          )}
        </div>

        {/* Tables */}
        <div className="admin-users__table-wrap">
          {managementTab === 'users' ? (
            <table className="admin-users__table">
              <thead>
                <tr>
                  <th aria-label="Select all"><span className="admin-users__checkbox" /></th>
                  <th>Name</th><th>Email</th><th>Plan</th><th>Status</th><th>Join Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No users found matching your filters</td></tr>
                ) : filteredUsers.map((user) => (
                  <tr key={user.email}>
                    <td><span className="admin-users__checkbox" /></td>
                    <td><strong>{user.name}</strong></td>
                    <td>{user.email}</td>
                    <td><span className="admin-users__pill admin-users__pill--plan">{user.plan}</span></td>
                    <td>
                      <span className={user.status === 'Active' ? 'admin-users__pill admin-users__pill--active' : 'admin-users__pill admin-users__pill--inactive'}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.joinDate}</td>
                    <td><button type="button" className="admin-users__view" onClick={() => handleViewUser(user)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="admin-users__table admin-users__table--admins">
              <thead>
                <tr>
                  <th aria-label="Select all"><span className="admin-users__checkbox" /></th>
                  <th>Name</th><th>Email</th><th>Status</th><th>Last Active</th><th>Invited Date</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdmins.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>No admins found matching your filters</td></tr>
                ) : filteredAdmins.map((admin) => (
                  <tr key={admin.id}>
                    <td><span className="admin-users__checkbox" /></td>
                    <td><strong>{admin.name}</strong></td>
                    <td>{admin.email}</td>
                    <td>
                      <span className={admin.status === 'Active' ? 'admin-users__pill admin-users__pill--active' : 'admin-users__pill admin-users__pill--pending'}>
                        {admin.status}
                      </span>
                    </td>
                    <td className={admin.status === 'Pending' ? 'admin-users__last-active--pending' : undefined}>
                      {admin.lastActive}
                    </td>
                    <td>{admin.invitedDate}</td>
                    <td>
                      <span className="admin-users__action-group">
                        <button
                          type="button"
                          className="admin-users__edit"
                          onClick={() => setEditingAdmin(admin)}
                        >
                          Edit
                        </button>
                        <span className="admin-users__divider" aria-hidden="true" />
                        <button
                          type="button"
                          className={admin.secondaryAction === 'Revoke' ? 'admin-users__danger' : 'admin-users__muted-action'}
                          onClick={() => setRevokingAdmin(admin)}
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

      {/* ── User detail modal ── */}
      {selectedUser && (
        <UserDetailsModal
          isOpen={isModalOpen}
          onClose={handleCloseUser}
          user={selectedUser}
          onSaved={(updated) => {
            setApiUsers((prev) => {
              const source = prev ?? adminUsersFallback
              const idx = source.findIndex((u) => u.email === selectedUser.email)
              if (idx === -1) return [updated, ...source]
              const next = [...source]
              next[idx] = updated
              return next
            })
            handleCloseUser()
          }}
          onToast={showToast}
        />
      )}

      {/* ── Invite sub-admin modal ── */}
      <InviteSubAdminModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSendInvitation={(data) => { console.log('Invite:', data) }}
      />

      {/* ── Edit admin modal ── */}
      {editingAdmin && (
        <AdminEditModal
          record={editingAdmin}
          mode="edit"
          onClose={() => setEditingAdmin(null)}
          onSaved={handleAdminSaved}
          onToast={showToast}
        />
      )}

      {/* ── Revoke confirmation dialog ── */}
      {revokingAdmin && (
        <AdminRevokeDialog
          record={revokingAdmin}
          variant={revokingAdmin.secondaryAction === 'Revoke' ? 'revoke' : 'cancel'}
          onCancel={() => setRevokingAdmin(null)}
          onRevoked={handleAdminRevoked}
          onToast={showToast}
        />
      )}

      {/* ── Toast ── */}
      <AdminToast toast={toast} onClose={dismissToast} />
    </section>
  )
}
