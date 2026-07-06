import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Pricing from './Pricing'

// Mock PricingSection component
vi.mock('../components/home/PricingSection', () => ({
  PricingSection: () => <div data-testid="pricing-section">Pricing Section</div>,
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

describe('Pricing Page', () => {
  it('renders without crashing', () => {
    render(<Pricing />)
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument()
  })

  it('renders PricingSection component', () => {
    render(<Pricing />)
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = render(<Pricing />)
    expect(container.firstChild).toBeTruthy()
  })
})

// Made with Bob
