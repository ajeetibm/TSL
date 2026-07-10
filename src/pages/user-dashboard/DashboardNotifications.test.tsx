import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardNotifications from './DashboardNotifications'
import type { NotificationItem } from '../../services/dashboardTypes'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

// Provide a stub context so useNotificationCount never throws
vi.mock('../../context/NotificationContext', () => ({
  useNotificationCount: () => ({
    unreadCount: 0,
    setUnreadCount: vi.fn(),
    seedUnreadCount: vi.fn(),
  }),
}))

// Stub getNotificationIcon so it always returns a simple SVG component
vi.mock('../../services/dashboardTypes', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/dashboardTypes')>()
  return {
    ...actual,
    getNotificationIcon: () => () => <svg data-testid="lucide-icon" />,
  }
})

// Default resolved value for notificationApi — overridden per-test where needed
const mockList = vi.fn()
const mockMarkRead = vi.fn()
const mockMarkAllRead = vi.fn()

vi.mock('../../services/tslApi', () => ({
  notificationApi: {
    list: () => mockList(),
    markRead: (id: string) => mockMarkRead(id),
    markAllRead: () => mockMarkAllRead(),
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeNotification(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    notificationId: 'n-1',
    type: 'document',
    title: 'Document completed',
    message: 'Your document is ready.',
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    ...overrides,
  }
}

const SUCCESS_EMPTY = { success: true, data: { notifications: [], unreadCount: 0 } }

const renderComponent = async () => {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <BrowserRouter>
        <DashboardNotifications />
      </BrowserRouter>
    )
  })
  return result!
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('DashboardNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockList.mockResolvedValue(SUCCESS_EMPTY)
    mockMarkRead.mockResolvedValue({ success: true })
    mockMarkAllRead.mockResolvedValue({ success: true })
  })

  // ── Shell & header ──────────────────────────────────────────────────────────

  it('renders within the DashboardShell wrapper', async () => {
    await renderComponent()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('shows the page heading and subheading', async () => {
    await renderComponent()
    expect(screen.getByRole('heading', { name: /^notifications$/i })).toBeInTheDocument()
    expect(screen.getByText(/stay updated with your legal workflow activities/i)).toBeInTheDocument()
  })

  it('shows the "Mark all as read" button', async () => {
    await renderComponent()
    expect(screen.getByRole('button', { name: /mark all as read/i })).toBeInTheDocument()
  })

  // ── Loading state ───────────────────────────────────────────────────────────

  it('shows a loading indicator while the API call is in flight', async () => {
    // Never resolves during this test — render synchronously so loading state is visible
    mockList.mockReturnValue(new Promise(() => {}))
    render(
      <BrowserRouter>
        <DashboardNotifications />
      </BrowserRouter>
    )
    expect(screen.getByText(/loading notifications/i)).toBeInTheDocument()
  })

  // ── Error state ─────────────────────────────────────────────────────────────

  it('shows an error message when the API returns a failure', async () => {
    mockList.mockResolvedValue({ success: false, message: 'Server error' })
    await renderComponent()
    expect(screen.getByText(/server error/i)).toBeInTheDocument()
  })

  it('shows a fallback error when the API failure has no message', async () => {
    mockList.mockResolvedValue({ success: false })
    await renderComponent()
    expect(screen.getByText(/failed to load notifications/i)).toBeInTheDocument()
  })

  // ── Empty state ─────────────────────────────────────────────────────────────

  it('shows "all caught up" when there are no unread notifications', async () => {
    await renderComponent()
    expect(screen.getByText(/you're all caught up/i)).toBeInTheDocument()
  })

  it('shows "no earlier notifications" when the earlier list is empty', async () => {
    await renderComponent()
    expect(screen.getByText(/no earlier notifications/i)).toBeInTheDocument()
  })

  // ── Notification feed ───────────────────────────────────────────────────────

  it('renders unread notification cards from the API', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        unreadCount: 1,
        notifications: [makeNotification({ isRead: false, title: 'Doc ready' })],
      },
    })
    await renderComponent()
    expect(screen.getByText('Doc ready')).toBeInTheDocument()
  })

  it('renders earlier (read) notification cards from the API', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        unreadCount: 0,
        notifications: [makeNotification({ isRead: true, title: 'Old notice' })],
      },
    })
    await renderComponent()
    expect(screen.getByText('Old notice')).toBeInTheDocument()
  })

  it('displays the notification message text', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        unreadCount: 1,
        notifications: [makeNotification({ message: 'Sign the NDA now.' })],
      },
    })
    await renderComponent()
    expect(screen.getByText('Sign the NDA now.')).toBeInTheDocument()
  })

  it('shows the Unread section heading', async () => {
    await renderComponent()
    expect(screen.getByRole('heading', { name: /^unread$/i })).toBeInTheDocument()
  })

  it('shows the Earlier section heading', async () => {
    await renderComponent()
    expect(screen.getByRole('heading', { name: /^earlier$/i })).toBeInTheDocument()
  })

  it('shows a relative timestamp on each notification card', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        unreadCount: 1,
        notifications: [
          makeNotification({ createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() }),
        ],
      },
    })
    await renderComponent()
    expect(screen.getByText(/3 hours ago/i)).toBeInTheDocument()
  })

  it('shows a "Mark as read" button for each unread card', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        unreadCount: 2,
        notifications: [
          makeNotification({ notificationId: 'n-1', isRead: false }),
          makeNotification({ notificationId: 'n-2', isRead: false }),
        ],
      },
    })
    await renderComponent()
    expect(screen.getAllByRole('button', { name: /mark as read/i })).toHaveLength(2)
  })

  // ── Mark as read ────────────────────────────────────────────────────────────

  it('moves a notification from unread to earlier when "Mark as read" is clicked', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        unreadCount: 1,
        notifications: [makeNotification({ notificationId: 'n-99', isRead: false, title: 'Pay invoice' })],
      },
    })
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /mark as read/i }))
    })

    expect(screen.queryByRole('button', { name: /mark as read/i })).not.toBeInTheDocument()
    expect(mockMarkRead).toHaveBeenCalledWith('n-99')
  })

  it('clears all unread items when "Mark all as read" is clicked', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        unreadCount: 2,
        notifications: [
          makeNotification({ notificationId: 'n-1', isRead: false }),
          makeNotification({ notificationId: 'n-2', isRead: false }),
        ],
      },
    })
    await renderComponent()

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /mark all as read/i }))
    })

    expect(screen.queryByRole('button', { name: /mark as read/i })).not.toBeInTheDocument()
    expect(mockMarkAllRead).toHaveBeenCalled()
  })

  // ── Notification counts ─────────────────────────────────────────────────────

  it('reflects the correct total count in the summary section', async () => {
    mockList.mockResolvedValue({
      success: true,
      data: {
        unreadCount: 1,
        notifications: [
          makeNotification({ notificationId: 'n-1', isRead: false }),
          makeNotification({ notificationId: 'n-2', isRead: true }),
        ],
      },
    })
    await renderComponent()
    expect(screen.getByText('2')).toBeInTheDocument() // total = 2
  })

  // ── Notification settings sidebar ───────────────────────────────────────────

  it('renders the Notification Settings heading', async () => {
    await renderComponent()
    expect(screen.getByRole('heading', { name: /notification settings/i })).toBeInTheDocument()
  })

  it('renders all five settings option labels', async () => {
    await renderComponent()
    expect(screen.getByText('Document updates')).toBeInTheDocument()
    expect(screen.getByText('Signature requests')).toBeInTheDocument()
    expect(screen.getByText('Team activity')).toBeInTheDocument()
    expect(screen.getByText('Billing updates')).toBeInTheDocument()
    expect(screen.getByText('Product updates')).toBeInTheDocument()
  })

  it('renders exactly five toggle switches', async () => {
    await renderComponent()
    expect(screen.getAllByRole('switch')).toHaveLength(5)
  })

  it('toggles have correct default aria-checked values from DEFAULT_PREFS', async () => {
    await renderComponent()
    const switches = screen.getAllByRole('switch')
    const byLabel = (name: string) =>
      switches.find((s) => s.getAttribute('aria-label') === name)!

    expect(byLabel('Document updates').getAttribute('aria-checked')).toBe('true')
    expect(byLabel('Signature requests').getAttribute('aria-checked')).toBe('true')
    expect(byLabel('Team activity').getAttribute('aria-checked')).toBe('false')
    expect(byLabel('Billing updates').getAttribute('aria-checked')).toBe('true')
    expect(byLabel('Product updates').getAttribute('aria-checked')).toBe('false')
  })

  it('flips a toggle when clicked', async () => {
    await renderComponent()
    const docSwitch = screen.getByRole('switch', { name: 'Document updates' })
    expect(docSwitch.getAttribute('aria-checked')).toBe('true')

    fireEvent.click(docSwitch)
    expect(docSwitch.getAttribute('aria-checked')).toBe('false')
  })

  it('flips an off-toggle to on when clicked', async () => {
    await renderComponent()
    const teamSwitch = screen.getByRole('switch', { name: 'Team activity' })
    expect(teamSwitch.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(teamSwitch)
    expect(teamSwitch.getAttribute('aria-checked')).toBe('true')
  })

  // ── Save Preferences button dirty / clean state ─────────────────────────────

  it('"Save Preferences" is disabled initially (no changes made)', async () => {
    await renderComponent()
    expect(screen.getByRole('button', { name: /save preferences/i })).toBeDisabled()
  })

  it('"Save Preferences" becomes enabled after a toggle is flipped', async () => {
    await renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: 'Document updates' }))
    expect(screen.getByRole('button', { name: /save preferences/i })).toBeEnabled()
  })

  it('"Save Preferences" becomes disabled again after saving', async () => {
    await renderComponent()
    const saveBtn = screen.getByRole('button', { name: /save preferences/i })

    fireEvent.click(screen.getByRole('switch', { name: 'Document updates' }))
    expect(saveBtn).toBeEnabled()

    fireEvent.click(saveBtn)
    expect(saveBtn).toBeDisabled()
  })

  it('"Save Preferences" becomes disabled when a toggled switch is flipped back', async () => {
    await renderComponent()
    const docSwitch = screen.getByRole('switch', { name: 'Document updates' })
    const saveBtn = screen.getByRole('button', { name: /save preferences/i })

    // Flip once → dirty
    fireEvent.click(docSwitch)
    expect(saveBtn).toBeEnabled()

    // Flip back → clean again
    fireEvent.click(docSwitch)
    expect(saveBtn).toBeDisabled()
  })

  it('persists new toggle state after saving', async () => {
    await renderComponent()
    const teamSwitch = screen.getByRole('switch', { name: 'Team activity' })
    expect(teamSwitch.getAttribute('aria-checked')).toBe('false')

    fireEvent.click(teamSwitch)
    fireEvent.click(screen.getByRole('button', { name: /save preferences/i }))

    // After save, flipping back should make it dirty again (saved baseline is now true)
    fireEvent.click(teamSwitch)
    expect(screen.getByRole('button', { name: /save preferences/i })).toBeEnabled()
  })

  it('can save multiple toggle changes at once', async () => {
    await renderComponent()
    fireEvent.click(screen.getByRole('switch', { name: 'Team activity' }))
    fireEvent.click(screen.getByRole('switch', { name: 'Product updates' }))

    const saveBtn = screen.getByRole('button', { name: /save preferences/i })
    expect(saveBtn).toBeEnabled()

    fireEvent.click(saveBtn)
    expect(saveBtn).toBeDisabled()
  })

  // ── Stay Informed summary ───────────────────────────────────────────────────

  it('renders the Stay Informed section', async () => {
    await renderComponent()
    expect(screen.getByRole('heading', { name: /stay informed/i })).toBeInTheDocument()
    expect(screen.getByText(/never miss important updates/i)).toBeInTheDocument()
  })

  it('displays Total notifications and Unread labels', async () => {
    await renderComponent()
    expect(screen.getByText(/total notifications/i)).toBeInTheDocument()
    expect(screen.getAllByText(/^unread$/i).length).toBeGreaterThanOrEqual(1)
  })
})
