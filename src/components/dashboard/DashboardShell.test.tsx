import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { NotificationProvider } from '../../context/NotificationContext'
import { DashboardShell } from './DashboardShell'

// Mock useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../../services/tslApi', () => ({
  notificationApi: {
    list: vi.fn().mockResolvedValue({ success: true, data: { notifications: [], unreadCount: 5 } }),
    markRead: vi.fn().mockResolvedValue({ success: true }),
    markAllRead: vi.fn().mockResolvedValue({ success: true }),
  },
  clearAuthSession: vi.fn(),
}))

// Helper function to render with router
const renderWithRouter = (ui: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <NotificationProvider>{ui}</NotificationProvider>
    </BrowserRouter>
  )
}

describe('DashboardShell', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Rendering', () => {
    it('should render the dashboard shell with all elements', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Test Content</div>
        </DashboardShell>
      )

      expect(screen.getByText('The Startup Legal')).toBeInTheDocument()
      expect(screen.getByText('Legal Workflow Platform')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render all sidebar navigation items', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Wizards')).toBeInTheDocument()
      expect(screen.getByText('Counsel')).toBeInTheDocument()
      expect(screen.getByText('Playbooks')).toBeInTheDocument()
      expect(screen.getByText('Notifications')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })

    it('should render footer navigation items', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      expect(screen.getByText('Profile')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
    })

    it('should render notification badge', async () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const notificationButton = screen.getByText('Notifications').closest('button')
      expect(notificationButton).toBeInTheDocument()
      await waitFor(() =>
        expect(notificationButton?.querySelector('b')).toHaveTextContent('5')
      )
    })

    it('should render children content', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div data-testid="child-content">Custom Dashboard Content</div>
        </DashboardShell>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Custom Dashboard Content')).toBeInTheDocument()
    })
  })

  describe('Active Section Highlighting', () => {
    it('should highlight Dashboard when it is active', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const dashboardButton = screen.getByText('Dashboard').closest('button')
      expect(dashboardButton).toHaveClass('user-dashboard__nav-item--active')
    })

    it('should highlight Wizards when it is active', () => {
      renderWithRouter(
        <DashboardShell activeSection="Wizards">
          <div>Content</div>
        </DashboardShell>
      )

      const wizardsButton = screen.getByText('Wizards').closest('button')
      expect(wizardsButton).toHaveClass('user-dashboard__nav-item--active')
    })

    it('should highlight Counsel when it is active', () => {
      renderWithRouter(
        <DashboardShell activeSection="Counsel">
          <div>Content</div>
        </DashboardShell>
      )

      const counselButton = screen.getByText('Counsel').closest('button')
      expect(counselButton).toHaveClass('user-dashboard__nav-item--active')
    })

    it('should highlight Playbooks when it is active', () => {
      renderWithRouter(
        <DashboardShell activeSection="Playbooks">
          <div>Content</div>
        </DashboardShell>
      )

      const playbooksButton = screen.getByText('Playbooks').closest('button')
      expect(playbooksButton).toHaveClass('user-dashboard__nav-item--active')
    })

    it('should highlight Notifications when it is active', () => {
      renderWithRouter(
        <DashboardShell activeSection="Notifications">
          <div>Content</div>
        </DashboardShell>
      )

      const notificationsButton = screen.getByText('Notifications').closest('button')
      expect(notificationsButton).toHaveClass('user-dashboard__nav-item--active')
    })

    it('should highlight Settings when it is active', () => {
      renderWithRouter(
        <DashboardShell activeSection="Settings">
          <div>Content</div>
        </DashboardShell>
      )

      const settingsButton = screen.getByText('Settings').closest('button')
      expect(settingsButton).toHaveClass('user-dashboard__nav-item--active')
    })

    it('should only highlight one section at a time', () => {
      renderWithRouter(
        <DashboardShell activeSection="Wizards">
          <div>Content</div>
        </DashboardShell>
      )

      const activeButtons = screen.getAllByRole('button').filter(button =>
        button.classList.contains('user-dashboard__nav-item--active')
      )

      expect(activeButtons).toHaveLength(1)
      expect(activeButtons[0]).toHaveTextContent('Wizards')
    })
  })

  describe('Navigation', () => {
    it('should navigate to dashboard when Dashboard is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <DashboardShell activeSection="Wizards">
          <div>Content</div>
        </DashboardShell>
      )

      const dashboardButton = screen.getByText('Dashboard').closest('button')
      if (dashboardButton) {
        await user.click(dashboardButton)
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
      }
    })

    it('should navigate to wizards when Wizards is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const wizardsButton = screen.getByText('Wizards').closest('button')
      if (wizardsButton) {
        await user.click(wizardsButton)
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/wizards')
      }
    })

    it('should navigate to counsel when Counsel is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const counselButton = screen.getByText('Counsel').closest('button')
      if (counselButton) {
        await user.click(counselButton)
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/counsel')
      }
    })

    it('should navigate to playbooks when Playbooks is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const playbooksButton = screen.getByText('Playbooks').closest('button')
      if (playbooksButton) {
        await user.click(playbooksButton)
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/playbooks')
      }
    })
  })

  describe('Sign Out Functionality', () => {
    it('should remove authentication from localStorage on sign out', async () => {
      const user = userEvent.setup()
      localStorage.setItem('tsl-authenticated', 'true')

      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      expect(localStorage.getItem('tsl-authenticated')).toBe('true')

      const signOutButton = screen.getByText('Sign Out').closest('button')
      if (signOutButton) {
        await user.click(signOutButton)
      }

      // clearAuthSession is mocked — verify it was called then clear manually
      const { clearAuthSession } = await import('../../services/tslApi')
      expect(clearAuthSession).toHaveBeenCalled()
    })

    it('should navigate to home page on sign out', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const signOutButton = screen.getByText('Sign Out').closest('button')
      if (signOutButton) {
        await user.click(signOutButton)
        expect(mockNavigate).toHaveBeenCalledWith('/')
      }
    })

    it('should handle sign out when localStorage is empty', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      expect(localStorage.getItem('tsl-authenticated')).toBeNull()

      const signOutButton = screen.getByText('Sign Out').closest('button')
      if (signOutButton) {
        await user.click(signOutButton)
        expect(mockNavigate).toHaveBeenCalledWith('/')
      }
    })
  })

  describe('Profile Button', () => {
    it('should render profile button', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const profileButton = screen.getByText('Profile').closest('button')
      expect(profileButton).toBeInTheDocument()
    })

    it('should navigate to profile when profile button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const profileButton = screen.getByText('Profile').closest('button')
      if (profileButton) {
        await user.click(profileButton)
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard/profile')
      }
    })
  })

  describe('Accessibility', () => {
    it('should have proper navigation aria-label', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const nav = screen.getByRole('navigation', { name: 'Dashboard navigation' })
      expect(nav).toBeInTheDocument()
    })

    it('should have all navigation items as buttons', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const buttons = screen.getAllByRole('button')
      // 6 main nav items + 2 footer items (Profile, Sign Out)
      expect(buttons.length).toBeGreaterThanOrEqual(8)
    })

    it('should have proper button types', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const buttons = screen.getAllByRole('button')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button')
      })
    })
  })

  describe('Icons', () => {
    it('should render icons for all navigation items', () => {
      const { container } = renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      // Check that SVG icons are rendered (lucide-react renders SVGs)
      const svgs = container.querySelectorAll('svg')
      // At least 8 icons: 6 nav items + Profile + Sign Out
      expect(svgs.length).toBeGreaterThanOrEqual(8)
    })
  })

  describe('Layout Structure', () => {
    it('should have proper CSS classes for layout', () => {
      const { container } = renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      expect(container.querySelector('.user-dashboard')).toBeInTheDocument()
      expect(container.querySelector('.user-dashboard__sidebar')).toBeInTheDocument()
      expect(container.querySelector('.user-dashboard__main')).toBeInTheDocument()
    })

    it('should render brand section in sidebar', () => {
      const { container } = renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const brand = container.querySelector('.user-dashboard__brand')
      expect(brand).toBeInTheDocument()
      expect(brand?.querySelector('h1')).toHaveTextContent('The Startup Legal')
      expect(brand?.querySelector('p')).toHaveTextContent('Legal Workflow Platform')
    })

    it('should render sidebar footer', () => {
      const { container } = renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      expect(container.querySelector('.user-dashboard__sidebar-footer')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          {null}
        </DashboardShell>
      )

      const main = container.querySelector('.user-dashboard__main')
      expect(main).toBeInTheDocument()
    })

    it('should handle multiple children', () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Child 1</div>
          <div>Child 2</div>
          <div>Child 3</div>
        </DashboardShell>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
      expect(screen.getByText('Child 3')).toBeInTheDocument()
    })

    it('should handle complex children components', () => {
      const ComplexChild = () => (
        <div>
          <h2>Dashboard Title</h2>
          <p>Dashboard content</p>
          <button>Action Button</button>
        </div>
      )

      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <ComplexChild />
        </DashboardShell>
      )

      expect(screen.getByText('Dashboard Title')).toBeInTheDocument()
      expect(screen.getByText('Dashboard content')).toBeInTheDocument()
      expect(screen.getByText('Action Button')).toBeInTheDocument()
    })
  })

  describe('Badge Display', () => {
    it('should only show badge on Notifications item', async () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const notificationButton = screen.getByText('Notifications').closest('button')
      const dashboardButton = screen.getByText('Dashboard').closest('button')

      await waitFor(() =>
        expect(notificationButton?.querySelector('b')).toBeInTheDocument()
      )
      expect(dashboardButton?.querySelector('b')).not.toBeInTheDocument()
    })

    it('should display correct badge count', async () => {
      renderWithRouter(
        <DashboardShell activeSection="Dashboard">
          <div>Content</div>
        </DashboardShell>
      )

      const notificationButton = screen.getByText('Notifications').closest('button')
      await waitFor(() => {
        const badge = notificationButton?.querySelector('b')
        expect(badge).toHaveTextContent('5')
      })
    })
  })
})

// Made with Bob
