/**
 * AdminDashboard — Profile section tests
 *
 * The AdminDashboard is a large page that renders many navigation sections.
 * To reach the profile panel we navigate via the sidebar Profile button.
 * All network calls (adminApi) are mocked so tests run offline.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

const renderAdminDashboard = () =>
  render(
    <MemoryRouter>
      <CounselRequestProvider>
        <AdminDashboard />
      </CounselRequestProvider>
    </MemoryRouter>
  )

/** Navigate to the Profile section by clicking the sidebar Profile button */
const openProfileSection = () => {
  // The Profile nav item is in the sidebar footer
  const profileButton = screen.getByRole('button', { name: /^profile$/i })
  fireEvent.click(profileButton)
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

  it('renders without crashing', () => {
    renderAdminDashboard()
    expect(document.body).toBeTruthy()
  })

  it('shows the Profile section when the Profile nav button is clicked', () => {
    renderAdminDashboard()
    openProfileSection()
    expect(screen.getByRole('heading', { name: /^profile$/i })).toBeInTheDocument()
  })

  it('shows profile-related description in header when Profile is active', () => {
    renderAdminDashboard()
    openProfileSection()
    expect(screen.getByText(/manage your account settings/i)).toBeInTheDocument()
  })

  // --- Profile tab bar ------------------------------------------------------

  it('renders all three profile tabs in the Profile section', () => {
    renderAdminDashboard()
    openProfileSection()
    expect(screen.getByRole('button', { name: /profile information/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /security/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /preferences/i })).toBeInTheDocument()
  })

  it('shows the Profile Information tab by default', () => {
    renderAdminDashboard()
    openProfileSection()
    expect(screen.getByDisplayValue('Given')).toBeInTheDocument()
  })

  it('switches to the Security tab when clicked', () => {
    renderAdminDashboard()
    openProfileSection()
    // There can be multiple Security buttons (sidebar settings tab + profile tab).
    // Click the one inside the profile tab bar (last one visible after opening profile).
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    fireEvent.click(securityButtons[securityButtons.length - 1])
    expect(screen.getByText(/change password/i)).toBeInTheDocument()
  })

  it('switches to the Preferences tab when clicked', () => {
    renderAdminDashboard()
    openProfileSection()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    expect(screen.getByText(/email preferences/i)).toBeInTheDocument()
  })

  // --- Profile Information tab – form fields --------------------------------

  it('displays default admin profile form fields', () => {
    renderAdminDashboard()
    openProfileSection()
    expect(screen.getByDisplayValue('Given')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Kibanza')).toBeInTheDocument()
    expect(screen.getByDisplayValue('given@thestartuplegal.co.za')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+27 11 234 5678')).toBeInTheDocument()
    expect(screen.getByDisplayValue(/sandton/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('Platform Administrator')).toBeInTheDocument()
  })

  it('allows editing the first name field', () => {
    renderAdminDashboard()
    openProfileSection()
    const input = screen.getByDisplayValue('Given')
    fireEvent.change(input, { target: { value: 'Sarah' } })
    expect(screen.getByDisplayValue('Sarah')).toBeInTheDocument()
  })

  it('allows editing the last name field', () => {
    renderAdminDashboard()
    openProfileSection()
    const input = screen.getByDisplayValue('Kibanza')
    fireEvent.change(input, { target: { value: 'Smith' } })
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
  })

  it('allows editing the email field', () => {
    renderAdminDashboard()
    openProfileSection()
    const input = screen.getByDisplayValue('given@thestartuplegal.co.za')
    fireEvent.change(input, { target: { value: 'new@tsl.co.za' } })
    expect(screen.getByDisplayValue('new@tsl.co.za')).toBeInTheDocument()
  })

  it('allows editing the phone field', () => {
    renderAdminDashboard()
    openProfileSection()
    const input = screen.getByDisplayValue('+27 11 234 5678')
    fireEvent.change(input, { target: { value: '+27 21 000 9999' } })
    expect(screen.getByDisplayValue('+27 21 000 9999')).toBeInTheDocument()
  })

  it('allows editing the job title field', () => {
    renderAdminDashboard()
    openProfileSection()
    const input = screen.getByDisplayValue('Platform Administrator')
    fireEvent.change(input, { target: { value: 'Super Admin' } })
    expect(screen.getByDisplayValue('Super Admin')).toBeInTheDocument()
  })

  // --- Cancel & Save --------------------------------------------------------

  it('resets form to baseline values when Cancel is clicked', () => {
    renderAdminDashboard()
    openProfileSection()
    const input = screen.getByDisplayValue('Given')
    fireEvent.change(input, { target: { value: 'Changed' } })
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.getByDisplayValue('Given')).toBeInTheDocument()
  })

  it('calls adminApi.updateProfile when Save Changes is clicked', async () => {
    renderAdminDashboard()
    openProfileSection()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(mockAdminUpdateProfile).toHaveBeenCalledTimes(1))
    expect(mockAdminUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: 'Given', lastName: 'Kibanza' })
    )
  })

  it('shows success message after profile is saved', async () => {
    renderAdminDashboard()
    openProfileSection()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByText(/profile saved successfully/i)).toBeInTheDocument())
  })

  it('shows error message when profile save fails', async () => {
    mockAdminUpdateProfile.mockResolvedValueOnce({ success: false, message: 'Save failed.' })
    renderAdminDashboard()
    openProfileSection()
    fireEvent.click(screen.getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByText(/save failed/i)).toBeInTheDocument())
  })

  // --- Security tab ---------------------------------------------------------

  it('renders three password input fields in the Security tab', () => {
    renderAdminDashboard()
    openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    fireEvent.click(securityButtons[securityButtons.length - 1])
    const passwordInputs = screen.getAllByPlaceholderText(/password/i)
    expect(passwordInputs.length).toBeGreaterThanOrEqual(3)
  })

  it('shows validation error when password fields are empty on submit', async () => {
    renderAdminDashboard()
    openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    fireEvent.click(securityButtons[securityButtons.length - 1])
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })

  it('shows error when new password and confirm password do not match', async () => {
    renderAdminDashboard()
    openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    fireEvent.click(securityButtons[securityButtons.length - 1])

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'different123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(screen.getByText(/must match/i)).toBeInTheDocument())
  })

  it('calls adminApi.changePassword with correct payload', async () => {
    renderAdminDashboard()
    openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    fireEvent.click(securityButtons[securityButtons.length - 1])

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

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
    renderAdminDashboard()
    openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    fireEvent.click(securityButtons[securityButtons.length - 1])

    fireEvent.change(screen.getByPlaceholderText(/enter current password/i), { target: { value: 'oldpass' } })
    fireEvent.change(screen.getByPlaceholderText(/enter new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByPlaceholderText(/confirm new password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument())
  })

  it('renders Two-Factor Authentication section in Security tab', () => {
    renderAdminDashboard()
    openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    fireEvent.click(securityButtons[securityButtons.length - 1])
    expect(screen.getByText(/two-factor authentication/i)).toBeInTheDocument()
  })

  it('renders Active Sessions section in Security tab', () => {
    renderAdminDashboard()
    openProfileSection()
    const securityButtons = screen.getAllByRole('button', { name: /^security$/i })
    fireEvent.click(securityButtons[securityButtons.length - 1])
    expect(screen.getByText(/active sessions/i)).toBeInTheDocument()
  })

  // --- Preferences tab ------------------------------------------------------

  it('renders all three email preference items in Preferences tab', () => {
    renderAdminDashboard()
    openProfileSection()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    expect(screen.getByText(/workflow updates/i)).toBeInTheDocument()
    expect(screen.getByText(/weekly summary/i)).toBeInTheDocument()
    expect(screen.getByText(/product updates/i)).toBeInTheDocument()
  })

  it('renders three checkbox toggles in Preferences tab', () => {
    renderAdminDashboard()
    openProfileSection()
    fireEvent.click(screen.getByRole('button', { name: /preferences/i }))
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
  })

  // --- Sign out -------------------------------------------------------------

  it('calls clearAuthSession and navigates to / on Sign Out', () => {
    renderAdminDashboard()
    fireEvent.click(screen.getByRole('button', { name: /sign out/i }))
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

    renderAdminDashboard()
    openProfileSection()

    await waitFor(() => expect(screen.getByDisplayValue('Alice')).toBeInTheDocument())
    expect(screen.getByDisplayValue('Mokoena')).toBeInTheDocument()
    expect(screen.getByDisplayValue('alice@tsl.co.za')).toBeInTheDocument()
  })

  // --- Accessible structure -------------------------------------------------

  it('has a non-empty root element', () => {
    const { container } = renderAdminDashboard()
    expect(container.firstChild).toBeTruthy()
  })
})
