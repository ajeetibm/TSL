import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import WizardDetails from './WizardDetails'

// Mock child components
vi.mock('../components/wizard-detail/WizardDetailOverview', () => ({
  WizardDetailOverview: () => <div data-testid="wizard-detail-overview">Overview</div>,
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

describe('WizardDetails Page', () => {
  it('renders without crashing', () => {
    render(<WizardDetails />)
    expect(screen.getByTestId('wizard-detail-overview')).toBeInTheDocument()
  })

  it('renders all sections', () => {
    render(<WizardDetails />)
    
    expect(screen.getByTestId('wizard-detail-overview')).toBeInTheDocument()
    expect(screen.getByTestId('detail-contact-section')).toBeInTheDocument()
    expect(screen.getByTestId('detail-footer')).toBeInTheDocument()
  })

  it('renders sections in correct order', () => {
    const { container } = render(<WizardDetails />)
    const sections = container.querySelectorAll('[data-testid]')
    
    expect(sections[0]).toHaveAttribute('data-testid', 'wizard-detail-overview')
    expect(sections[1]).toHaveAttribute('data-testid', 'detail-contact-section')
    expect(sections[2]).toHaveAttribute('data-testid', 'detail-footer')
  })

  it('has wizard-details-page class', () => {
    const { container } = render(<WizardDetails />)
    expect(container.querySelector('.wizard-details-page')).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = render(<WizardDetails />)
    expect(container.firstChild).toBeTruthy()
  })
})

// Made with Bob
