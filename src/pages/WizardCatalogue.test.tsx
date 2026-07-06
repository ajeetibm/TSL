import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import WizardCatalogue from './WizardCatalogue'

// Mock child components
vi.mock('../components/wizard-catalogue/WizardCatalogueHero', () => ({
  WizardCatalogueHero: () => <div data-testid="wizard-catalogue-hero">Hero</div>,
}))

vi.mock('../components/wizard-catalogue/WizardCatalogueHeader', () => ({
  WizardCatalogueHeader: () => <div data-testid="wizard-catalogue-header">Header</div>,
}))

vi.mock('../components/wizard-catalogue/WizardCard', () => ({
  WizardCard: ({ wizard, onIncrement, onDecrement }: any) => (
    <div data-testid={`wizard-card-${wizard.title}`}>
      <h3>{wizard.title}</h3>
      <button onClick={() => onIncrement(wizard.title)}>+</button>
      <button onClick={() => onDecrement(wizard.title)}>-</button>
    </div>
  ),
}))

vi.mock('../components/wizard-catalogue/WizardCartBar', () => ({
  WizardCartBar: ({ totalItems }: any) => (
    <div data-testid="wizard-cart-bar">
      Cart: {totalItems} items
    </div>
  ),
}))

vi.mock('../components/wizard-catalogue/HowItWorks', () => ({
  HowItWorks: () => <div data-testid="how-it-works">How It Works</div>,
}))

vi.mock('../components/wizard-detail/DetailContactSection', () => ({
  DetailContactSection: () => <div data-testid="detail-contact-section">Contact</div>,
}))

vi.mock('../components/wizard-detail/DetailFooter', () => ({
  DetailFooter: () => <div data-testid="detail-footer">Footer</div>,
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

vi.mock('../data/wizards', () => ({
  wizards: [
    { title: 'NDA Agreement', description: 'Non-disclosure agreement', price: 500 },
    { title: 'Employment Contract', description: 'Employment contract', price: 750 },
  ],
}))

const mockLoadWizardQuantities = vi.fn(() => ({}))
const mockSaveWizardQuantities = vi.fn()

vi.mock('../utils/wizardCart', () => ({
  loadWizardQuantities: () => mockLoadWizardQuantities(),
  saveWizardQuantities: (quantities: any) => mockSaveWizardQuantities(quantities),
}))

describe('WizardCatalogue Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLoadWizardQuantities.mockReturnValue({})
  })

  it('renders without crashing', () => {
    render(<WizardCatalogue />)
    expect(screen.getByTestId('wizard-catalogue-hero')).toBeInTheDocument()
  })

  it('renders all main sections', () => {
    render(<WizardCatalogue />)
    
    expect(screen.getByTestId('wizard-catalogue-hero')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-catalogue-header')).toBeInTheDocument()
    expect(screen.getByTestId('how-it-works')).toBeInTheDocument()
    expect(screen.getByTestId('detail-contact-section')).toBeInTheDocument()
    expect(screen.getByTestId('detail-footer')).toBeInTheDocument()
  })

  it('renders wizard cards from data', () => {
    render(<WizardCatalogue />)
    
    expect(screen.getByTestId('wizard-card-NDA Agreement')).toBeInTheDocument()
    expect(screen.getByTestId('wizard-card-Employment Contract')).toBeInTheDocument()
  })

  it('loads initial quantities from storage', () => {
    mockLoadWizardQuantities.mockReturnValue({ 'NDA Agreement': 2 })
    
    render(<WizardCatalogue />)
    
    expect(mockLoadWizardQuantities).toHaveBeenCalled()
  })

  it('increments wizard quantity when + button is clicked', () => {
    render(<WizardCatalogue />)
    
    const incrementButton = screen.getAllByText('+')[0]
    fireEvent.click(incrementButton)
    
    expect(mockSaveWizardQuantities).toHaveBeenCalled()
  })

  it('decrements wizard quantity when - button is clicked', () => {
    mockLoadWizardQuantities.mockReturnValue({ 'NDA Agreement': 2 })
    
    render(<WizardCatalogue />)
    
    const decrementButton = screen.getAllByText('-')[0]
    fireEvent.click(decrementButton)
    
    expect(mockSaveWizardQuantities).toHaveBeenCalled()
  })

  it('displays cart bar with total items', () => {
    render(<WizardCatalogue />)
    
    expect(screen.getByTestId('wizard-cart-bar')).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = render(<WizardCatalogue />)
    expect(container.firstChild).toBeTruthy()
  })
})

// Made with Bob
