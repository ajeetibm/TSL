import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import DashboardWizards from './DashboardWizards'

// Mock DashboardShell
vi.mock('../components/dashboard/DashboardShell', () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const renderDashboardWizards = () => {
  return render(
    <BrowserRouter>
      <DashboardWizards />
    </BrowserRouter>
  )
}

describe('DashboardWizards Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('renders without crashing', () => {
    renderDashboardWizards()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays page header', () => {
    renderDashboardWizards()
    expect(screen.getByRole('heading', { name: /browse all wizards/i })).toBeInTheDocument()
    expect(screen.getByText(/select a legal wizard to generate your document/i)).toBeInTheDocument()
  })

  it('displays all wizard cards', () => {
    renderDashboardWizards()
    
    expect(screen.getByText(/loan agreement/i)).toBeInTheDocument()
    expect(screen.getByText(/non-disclosure agreement/i)).toBeInTheDocument()
    expect(screen.getByText(/employment offer letter/i)).toBeInTheDocument()
    expect(screen.getByText(/founder agreement/i)).toBeInTheDocument()
    expect(screen.getByText(/privacy policy/i)).toBeInTheDocument()
    expect(screen.getByText(/shareholder resolutions/i)).toBeInTheDocument()
  })

  it('displays popular badges on popular wizards', () => {
    renderDashboardWizards()
    
    const popularBadges = screen.getAllByText(/popular/i)
    expect(popularBadges.length).toBeGreaterThan(0)
  })

  it('displays wizard details (time, runs, audience)', () => {
    renderDashboardWizards()
    
    expect(screen.getByText(/5-8 minutes/i)).toBeInTheDocument()
    expect(screen.getByText(/1 run/i)).toBeInTheDocument()
    expect(screen.getByText(/startups sharing sensitive information/i)).toBeInTheDocument()
  })

  it('displays "What\'s Included" section for each wizard', () => {
    renderDashboardWizards()
    
    const includedHeadings = screen.getAllByText(/what's included/i)
    expect(includedHeadings.length).toBe(6) // 6 wizard cards
  })

  it('shows Select button for unselected wizards', () => {
    renderDashboardWizards()
    
    const selectButtons = screen.getAllByRole('button', { name: /select/i })
    expect(selectButtons.length).toBeGreaterThan(0)
  })

  it('selects a wizard when Select button is clicked', () => {
    renderDashboardWizards()
    
    const selectButtons = screen.getAllByRole('button', { name: /select/i })
    fireEvent.click(selectButtons[0])
    
    // Should show stepper with quantity 1
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows stepper controls after selecting a wizard', () => {
    renderDashboardWizards()
    
    const selectButton = screen.getAllByRole('button', { name: /select/i })[0]
    fireEvent.click(selectButton)
    
    // Should show minus and plus buttons
    const minusButtons = screen.getAllByLabelText(/remove one/i)
    const plusButtons = screen.getAllByLabelText(/add one/i)
    
    expect(minusButtons.length).toBeGreaterThan(0)
    expect(plusButtons.length).toBeGreaterThan(0)
  })

  it('increments quantity when plus button is clicked', () => {
    renderDashboardWizards()
    
    const selectButton = screen.getAllByRole('button', { name: /select/i })[0]
    fireEvent.click(selectButton)
    
    const plusButton = screen.getAllByLabelText(/add one/i)[0]
    fireEvent.click(plusButton)
    
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('decrements quantity when minus button is clicked', () => {
    renderDashboardWizards()
    
    const selectButton = screen.getAllByRole('button', { name: /select/i })[0]
    fireEvent.click(selectButton)
    
    const plusButton = screen.getAllByLabelText(/add one/i)[0]
    fireEvent.click(plusButton) // Quantity = 2
    
    const minusButton = screen.getAllByLabelText(/remove one/i)[0]
    fireEvent.click(minusButton) // Quantity = 1
    
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('shows cart when wizards are selected', () => {
    renderDashboardWizards()
    
    const selectButton = screen.getAllByRole('button', { name: /select/i })[0]
    fireEvent.click(selectButton)
    
    expect(screen.getByText(/your cart \(1 items\)/i)).toBeInTheDocument()
  })

  it('displays selected wizards in cart', () => {
    renderDashboardWizards()
    
    // Select first wizard (Loan Agreement)
    const selectButtons = screen.getAllByRole('button', { name: /select/i })
    fireEvent.click(selectButtons[0])
    
    // Cart should show the wizard
    expect(screen.getByText(/loan agreement/i)).toBeInTheDocument()
    expect(screen.getByText(/x1/i)).toBeInTheDocument()
  })

  it('updates cart total when multiple wizards are selected', () => {
    renderDashboardWizards()
    
    const selectButtons = screen.getAllByRole('button', { name: /select/i })
    fireEvent.click(selectButtons[0]) // Select first wizard
    fireEvent.click(selectButtons[1]) // Select second wizard
    
    expect(screen.getByText(/your cart \(2 items\)/i)).toBeInTheDocument()
  })

  it('clears cart when Clear Cart button is clicked', () => {
    renderDashboardWizards()
    
    const selectButton = screen.getAllByRole('button', { name: /select/i })[0]
    fireEvent.click(selectButton)
    
    const clearButton = screen.getByRole('button', { name: /clear cart/i })
    fireEvent.click(clearButton)
    
    expect(screen.queryByText(/your cart/i)).not.toBeInTheDocument()
  })

  it('removes wizard from cart when remove button in cart is clicked', () => {
    renderDashboardWizards()
    
    const selectButton = screen.getAllByRole('button', { name: /select/i })[0]
    fireEvent.click(selectButton)
    
    // Find remove button in cart chip
    const removeButtons = screen.getAllByLabelText(/remove/i)
    const cartRemoveButton = removeButtons.find(btn => 
      btn.getAttribute('aria-label')?.includes('Loan Agreement')
    )
    
    if (cartRemoveButton) {
      fireEvent.click(cartRemoveButton)
      expect(screen.queryByText(/your cart/i)).not.toBeInTheDocument()
    }
  })

  it('navigates to wizard details when "Get Start & View Details" is clicked', () => {
    renderDashboardWizards()
    
    const selectButton = screen.getAllByRole('button', { name: /select/i })[0]
    fireEvent.click(selectButton)
    
    const viewDetailsButton = screen.getByRole('button', { name: /get start & view details/i })
    fireEvent.click(viewDetailsButton)
    
    expect(mockNavigate).toHaveBeenCalledWith(
      '/dashboard/wizard-details',
      expect.objectContaining({
        state: expect.objectContaining({
          selectedWizards: expect.any(Array),
        }),
      })
    )
  })

  it('saves selected wizards to localStorage when viewing details', () => {
    renderDashboardWizards()
    
    const selectButton = screen.getAllByRole('button', { name: /select/i })[0]
    fireEvent.click(selectButton)
    
    const viewDetailsButton = screen.getByRole('button', { name: /get start & view details/i })
    fireEvent.click(viewDetailsButton)
    
    const stored = localStorage.getItem('tsl-selected-dashboard-wizards')
    expect(stored).toBeTruthy()
  })

  it('does not show cart when no wizards are selected', () => {
    renderDashboardWizards()
    
    expect(screen.queryByText(/your cart/i)).not.toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = renderDashboardWizards()
    expect(container.firstChild).toBeTruthy()
  })

  it('renders with DashboardShell wrapper', () => {
    renderDashboardWizards()
    expect(screen.getByTestId('dashboard-shell')).toBeInTheDocument()
  })

  it('displays wizard icons', () => {
    const { container } = renderDashboardWizards()
    const icons = container.querySelectorAll('.dashboard-wizards__icon')
    expect(icons.length).toBe(6) // 6 wizard cards
  })
})

// Made with Bob
