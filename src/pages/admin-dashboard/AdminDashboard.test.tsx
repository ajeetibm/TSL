/**
 * AdminDashboard — Profile section & View All Requests tests
 *
 * The AdminDashboard is a large page that renders many navigation sections.
 * To reach the profile panel we navigate via the sidebar Profile button.
 * All network calls (adminApi) are mocked so tests run offline.
 */
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import AdminDashboard from './AdminDashboard'
import { CounselRequestProvider } from '../../context/CounselRequestContext'

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
  }
})

vi.mock('../../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const mockAdminProfile = vi.fn()
const mockAdminDashboard = vi.fn()
const mockAdminCounsel = vi.fn()
const mockAdminUpdateProfile = vi.fn()
const mockAdminChangePassword = vi.fn()
const mockClearAuthSession = vi.fn()

vi.mock('../../services/tslApi', () => ({
  adminApi: {
    profile: () => mockAdminProfile(),
    dashboard: () => mockAdminDashboard(),
    counsel: () => mockAdminCounsel(),
    updateProfile: (...args: unknown[]) => mockAdminUpdateProfile(...args),
    changePassword: (...args: unknown[]) => mockAdminChangePassword(...args),
    assignCounselRequest: vi.fn().mockResolvedValue({ success: true }),
    users: vi.fn().mockResolvedValue({ success: false }),
    issues: vi.fn().mockResolvedValue({ success: false }),
    billing: vi.fn().mockResolvedValue({ success: false }),
  },
  adminSettingsApi: {
    getGeneral: vi.fn().mockResolvedValue({ success: false }),
    getNotifications: vi.fn().mockResolvedValue({ success: false }),
    getSecurity: vi.fn().mockResolvedValue({ success: false }),
  },
  clearAuthSession: () => mockClearAuthSession(),
}))

// Stub heavy sub-components that are not under test
vi.mock('./components', () => ({
  BillingInvoices: () => <div data-testid="billing-invoices" />,
  CounselManagement: () => <div data-testid="counsel-management" />,
  GeneralSettings: () => <div data-testid="general-settings" />,
  InviteSubAdminModal: () => null,
  IssuesManagement: () => <div data-testid="issues-management" />,
  Notifications: () => <div data-testid="notifications" />,
  Security: () => <div data-testid="security" />,
  UsersActivity: () => <div data-testid="users-activity" />,
}))

vi.mock('./components/AddCounselModal', () => ({
  default: () => null,
}))

vi.mock('./components/CounselManagement', () => ({
  initialCounselMembers: [],
  default: () => <div data-testid="counsel-management" />,
}))

vi.mock('./revenueChartUtils', () => ({
  getRevenueAxisTicks: vi.fn(() => []),
  buildRevenueLinePoints: vi.fn(() => ''),
  formatRevenueAxisLabel: vi.fn((v: number) => String(v)),
  getRevenuePlotHeight: vi.fn(() => 200),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Render and wait for all on-mount async API calls to settle */
const renderAdminDashboard = async () => {
  let result!: ReturnType<typeof render>
  await act(async () => {
    result = render(
      <MemoryRouter>
        <CounselRequestProvider>
          <AdminDashboard />
        </CounselRequestProvider>
      </MemoryRouter>
    )
  })
  return result
}

/** Navigate to the Profile section by clicking the sidebar Profile button */
const openProfileSection = async () => {
  const profileButton = screen.getByRole('button', { name: /^profile$/i })
  await act(async () => { fireEvent.click(profileButton) })
}

/** Click the "View All" button on the dashboard to open the View All requests screen */
const openViewAll = async () => {
  const viewAllBtn = screen.getByRole('button', { name: /view all/i })
  await act(async () => { fireEvent.click(viewAllBtn) })
}

// ---------------------------------------------------------------------------
// Shared mock data for dashboard with counsel requests
// ---------------------------------------------------------------------------

const mockDashboardWithRequests = {
  success: true,
  data: {
    kpis: { totalUsers: 100, activeWizards: 50, revenueMTD: 10000 },
    recentCounselRequests: [
      {
        requestId: 'req-1',
        subject: 'Review of SaaS Service Agreement',
        fromUser: 'Thabo Molefe',
        receivedAt: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Pending',
      },
      {
        requestId: 'req-2',
        subject: 'Employment Contract Review',
        fromUser: 'Sarah Dlamini',
        receivedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'Assigned',
      },
    ],
    revenueChart: [],
    topWizards: [],
  },
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AdminDashboard — Profile Section', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminProfile.mockResolvedValue({ success: false })
    mockAdminDashboard.mockResolvedValue({ success: false })
    mockAdminCounsel.mockResolvedValue({ success: false })
    mockAdminUpdateProfile.mockResolvedValue({ success: true, message: 'Profile saved successfully.' })
    mockAdminChangePassword.mockResolvedValue({ success: true, message: 'Password changed successfully.' })
  })

  // --- Navigation -----------------------------------------------------------

  it('renders without crashing', async () => {
    await renderAdminDashboard()
    expect(document.body).toBeTruthy()
  })

  it('shows the Profile section when the Profile nav button is clicked', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    expect(screen.getByRole('heading', { name: /^profile$/i })).toBeInTheDocument()
  })

  it('shows profile-related description in header when Profile is active', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    expect(screen.getByText(/manage your account settings/i)).toBeInTheDocument()
  })

  // --- Profile tab bar ------------------------------------------------------

  it('renders all three profile tabs in the Profile section', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    expect(screen.getByRole('button', { name: /profile information/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument()
  })

  it('shows the Profile Information tab by default', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    expect(screen.getByDisplayValue('Given')).toBeInTheDocument()
  })

  it('switches to the Security tab when clicked', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    await act(async () => { fireEvent.click(securityButtons[securityButtons.length - 1]) })
    expect(screen.getByText(/change password/i)).toBeInTheDocument()
  })

  it('switches to the Preferences tab when clicked', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /preferences/i })) })
    expect(screen.getByText(/email preferences/i)).toBeInTheDocument()
  })

  // --- Profile Information tab – form fields --------------------------------

  it('displays default admin profile form fields', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    expect(screen.getByDisplayValue('Given')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Kibanza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('given@thestartuplegal.co.za')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+27 11 234 5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue(/sandton/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Platform Administrator')).toBeInTheDocument()
  })

  it('allows editing the first name field', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const input = screen.getByDisplayValue('Given')
    await act(async () => { fireEvent.change(input, { target: { value: 'Sarah' } }) })
    expect(screen.getByDisplayValue('Sarah')).toBeInTheDocument()
  })

  it('allows editing the last name field', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const input = screen.getByDisplayValue('Kibanza')
    await act(async () => { fireEvent.change(input, { target: { value: 'Smith' } }) })
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
  })

  it('allows editing the email field', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const input = screen.getByDisplayValue('given@thestartuplegal.co.za')
    await act(async () => { fireEvent.change(input, { target: { value: 'new@tsl.co.za' } }) })
    expect(screen.getByDisplayValue('new@tsl.co.za')).toBeInTheDocument()
  })

  it('allows editing the phone field', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const input = screen.getByDisplayValue('+27 11 234 5678')
    await act(async () => { fireEvent.change(input, { target: { value: '+27 21 000 9999' } }) })
    expect(screen.getByDisplayValue('+27 21 000 9999')).toBeInTheDocument()
  })

  it('allows editing the job title field', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const input = screen.getByDisplayValue('Platform Administrator')
    await act(async () => { fireEvent.change(input, { target: { value: 'Super Admin' } }) })
    expect(screen.getByDisplayValue('Super Admin')).toBeInTheDocument()
  })

  // --- Cancel & Save --------------------------------------------------------

  it('resets form to baseline values when Cancel is clicked', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const input = screen.getByDisplayValue('Given')
    await act(async () => { fireEvent.change(input, { target: { value: 'Changed' } }) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /cancel/i })) })
    expect(screen.getByDisplayValue('Given')).toBeInTheDocument()
  })

  it('calls adminApi.updateProfile when Save Changes is clicked', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /save changes/i })) })
    await waitFor(() => expect(mockAdminUpdateProfile).toHaveBeenCalledTimes(1))
    expect(mockAdminUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Given', lastName: 'Kibanza' })
    )
  })

  it('shows success message after profile is saved', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /save changes/i })) })
    await waitFor(() => expect(screen.getByText(/profile saved successfully/i)).toBeInTheDocument())
  })

  it('shows error message when profile save fails', async () => {
    mockAdminUpdateProfile.mockResolvedValueOnce({ success: false, message: 'Save failed.' })
    await renderAdminDashboard()
    await openProfileSection()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /save changes/i })) })
    await waitFor(() => expect(screen.getByText(/save failed/i)).toBeInTheDocument())
  })

  // --- Security tab ---------------------------------------------------------

  it('renders three password input fields in the Security tab', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    await act(async () => { fireEvent.click(securityButtons[securityButtons.length - 1]) })
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    expect(passwordInputs.length).toBeGreaterThanOrEqual(3)
  })

  it('shows validation error when password fields are empty on submit', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    await act(async () => { fireEvent.click(securityButtons[securityButtons.length - 1]) })
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /update password/i })) })
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('shows error when new password and confirm password do not match', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    await act(async () => { fireEvent.click(securityButtons[securityButtons.length - 1]) })
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
      fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
      fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'different123' } })
      fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    })
    await waitFor(() => expect(screen.getByText(/must match/i)).toBeInTheDocument())
  })

  it('calls adminApi.changePassword with correct payload', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    await act(async () => { fireEvent.click(securityButtons[securityButtons.length - 1]) })
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
      fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
      fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass123' } })
      fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    })
    await waitFor(() => expect(mockAdminChangePassword).toHaveBeenCalledTimes(1))
    expect(mockAdminChangePassword).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'given@thestartuplegal.co.za',
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      })
    )
  })

  it('shows success message after password is changed', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    await act(async () => { fireEvent.click(securityButtons[securityButtons.length - 1]) })
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
      fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
      fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass123' } })
      fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    })
    await waitFor(() => expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument())
  })

  it('renders Two-Factor Authentication section in Security tab', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    await act(async () => { fireEvent.click(securityButtons[securityButtons.length - 1]) })
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
  })

  it('renders Active Sessions section in Security tab', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    await act(async () => { fireEvent.click(securityButtons[securityButtons.length - 1]) })
    expect(screen.getByText(/active sessions/i)).toBeInTheDocument()
  })

  // --- Preferences tab ------------------------------------------------------

  it('renders all three email preference items in Preferences tab', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /preferences/i })) })
    expect(screen.getByText(/workflow updates/i)).toBeInTheDocument()
    expect(screen.getByText(/weekly summary/i)).toBeInTheDocument()
    expect(screen.getByText(/product updates/i)).toBeInTheDocument()
  })

  it('renders three checkbox toggles in Preferences tab', async () => {
    await renderAdminDashboard()
    await openProfileSection()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /preferences/i })) })
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
  })

  // --- Sign out -------------------------------------------------------------

  it('calls clearAuthSession and navigates to / on Sign Out', async () => {
    await renderAdminDashboard()
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: /sign out/i })) })
    expect(mockClearAuthSession).toHaveBeenCalledTimes(1)
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  // --- API data loaded into profile form ------------------------------------

  it('updates profile form with data returned from adminApi.profile', async () => {
    mockAdminProfile.mockResolvedValueOnce({
      success: true,
      data: {
        firstName: 'Alice',
        lastName: 'Mokoena',
        email: 'alice@tsl.co.za',
        phone: '+27 12 000 0000',
        location: 'Pretoria, South Africa',
        jobTitle: 'Head of Operations',
      },
    })
    await renderAdminDashboard()
    await openProfileSection()
    await waitFor(() => expect(screen.getByDisplayValue('Alice')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Mokoena')).toBeInTheDocument()
    expect(screen.getByDisplayValue('alice@tsl.co.za')).toBeInTheDocument()
  })

  // --- Accessible structure -------------------------------------------------

  it('has a non-empty root element', async () => {
    const { container } = await renderAdminDashboard()
    expect(container.firstChild).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// View All Requests section
// ---------------------------------------------------------------------------

describe('AdminDashboard — View All Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminProfile.mockResolvedValue({ success: false })
    mockAdminDashboard.mockResolvedValue(mockDashboardWithRequests)
    mockAdminCounsel.mockResolvedValue({ success: false })
    mockAdminUpdateProfile.mockResolvedValue({ success: true })
    mockAdminChangePassword.mockResolvedValue({ success: true })
  })

  it('shows the View All button on the dashboard', async () => {
    await renderAdminDashboard()
    expect(screen.getByRole('button', { name: /view all/i })).toBeInTheDocument()
  })

  it('navigates to the View All screen when View All is clicked', async () => {
    await renderAdminDashboard()
    await openViewAll()
    expect(screen.getByRole('button', { name: /back to dashboard/i })).toBeInTheDocument()
  })

  it('renders all request cards in the View All screen', async () => {
    await renderAdminDashboard()
    await openViewAll()
    expect(screen.getByText('Review of SaaS Service Agreement')).toBeInTheDocument()
    expect(screen.getByText('Employment Contract Review')).toBeInTheDocument()
  })

  it('renders "From:" attribution for each request card', async () => {
    await renderAdminDashboard()
    await openViewAll()
    expect(screen.getByText('Thabo Molefe')).toBeInTheDocument()
    expect(screen.getByText('Sarah Dlamini')).toBeInTheDocument()
  })

  it('renders "Preview & Assign to Counsel" buttons for each card', async () => {
    await renderAdminDashboard()
    await openViewAll()
    const assignBtns = screen.getAllByRole('button', { name: /preview & assign to counsel/i })
    expect(assignBtns).toHaveLength(2)
  })

  it('returns to the dashboard when Back to Dashboard is clicked', async () => {
    await renderAdminDashboard()
    await openViewAll()
    const backBtn = screen.getByRole('button', { name: /back to dashboard/i })
    await act(async () => { fireEvent.click(backBtn) })
    expect(screen.queryByRole('button', { name: /back to dashboard/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /view all/i })).toBeInTheDocument()
  })

  it('filters cards by search term', async () => {
    await renderAdminDashboard()
    await openViewAll()
    const searchInput = screen.getByPlaceholderText(/search by subject or user/i)
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'SaaS' } })
    })
    expect(screen.getByText('Review of SaaS Service Agreement')).toBeInTheDocument()
    expect(screen.queryByText('Employment Contract Review')).not.toBeInTheDocument()
  })

  it('filters cards by user name', async () => {
    await renderAdminDashboard()
    await openViewAll()
    const searchInput = screen.getByPlaceholderText(/search by subject or user/i)
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'Sarah' } })
    })
    expect(screen.getByText('Employment Contract Review')).toBeInTheDocument()
    expect(screen.queryByText('Review of SaaS Service Agreement')).not.toBeInTheDocument()
  })

  it('shows empty state message when search has no matches', async () => {
    await renderAdminDashboard()
    await openViewAll()
    const searchInput = screen.getByPlaceholderText(/search by subject or user/i)
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'xyznonexistent' } })
    })
    expect(screen.getByText(/no counsel requests match your filters/i)).toBeInTheDocument()
  })

  it('filters cards by status using the status dropdown', async () => {
    await renderAdminDashboard()
    await openViewAll()
    const select = screen.getByRole('combobox')
    await act(async () => {
      fireEvent.change(select, { target: { value: 'Assigned' } })
    })
    expect(screen.getByText('Employment Contract Review')).toBeInTheDocument()
    expect(screen.queryByText('Review of SaaS Service Agreement')).not.toBeInTheDocument()
  })

  it('clears search when returning to the dashboard', async () => {
    await renderAdminDashboard()
    await openViewAll()
    const searchInput = screen.getByPlaceholderText(/search by subject or user/i)
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'SaaS' } })
    })
    const backBtn = screen.getByRole('button', { name: /back to dashboard/i })
    await act(async () => { fireEvent.click(backBtn) })
    // Re-open: search should be reset
    await openViewAll()
    const freshInput = screen.getByPlaceholderText(/search by subject or user/i)
    expect((freshInput as HTMLInputElement).value).toBe('')
  })

  it('renders the search input and status select in the View All toolbar', async () => {
    await renderAdminDashboard()
    await openViewAll()
    expect(screen.getByPlaceholderText(/search by subject or user/i)).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})
