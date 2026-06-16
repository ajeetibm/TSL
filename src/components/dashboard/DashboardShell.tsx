import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Scale,
  Settings,
  UserRound,
  WandSparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

type DashboardSection = 'Dashboard' | 'Wizards' | 'Counsel' | 'Playbooks' | 'Notifications' | 'Settings'

interface DashboardShellProps {
  activeSection: DashboardSection
  children: ReactNode
}

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Wizards', icon: WandSparkles, path: '/dashboard/wizards' },
  { label: 'Counsel', icon: Scale, path: '/dashboard/counsel' },
  { label: 'Playbooks', icon: BookOpen },
  { label: 'Notifications', icon: Bell, badge: '5' },
  { label: 'Settings', icon: Settings },
] satisfies Array<{
  label: DashboardSection
  icon: typeof LayoutDashboard
  path?: string
  badge?: string
}>

export function DashboardShell({ activeSection, children }: DashboardShellProps) {
  const navigate = useNavigate()

  const signOut = () => {
    localStorage.removeItem('tsl-authenticated')
    navigate('/')
  }

  return (
    <div className="user-dashboard">
      <aside className="user-dashboard__sidebar">
        <div className="user-dashboard__brand">
          <h1>The Startup Legal</h1>
          <p>Legal Workflow Platform</p>
        </div>

        <nav className="user-dashboard__nav" aria-label="Dashboard navigation">
          {sidebarItems.map(({ label, icon: Icon, badge, path }) => (
            <button
              key={label}
              type="button"
              className={
                label === activeSection
                  ? 'user-dashboard__nav-item user-dashboard__nav-item--active'
                  : 'user-dashboard__nav-item'
              }
              onClick={() => path && navigate(path)}
            >
              <Icon size={18} />
              <span>{label}</span>
              {badge && <b>{badge}</b>}
            </button>
          ))}
        </nav>

        <div className="user-dashboard__sidebar-footer">
          <button type="button" className="user-dashboard__nav-item">
            <UserRound size={18} />
            <span>Profile</span>
          </button>
          <button type="button" className="user-dashboard__nav-item" onClick={signOut}>
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <section className="user-dashboard__main">{children}</section>
    </div>
  )
}
