import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Features from './Features'

// Mock child components
vi.mock('../components/home/FeaturesSection', () => ({
  FeaturesSection: () => <div data-testid="features-section">Features Section</div>,
}))

vi.mock('../components/home/ServicesSection', () => ({
  ServicesSection: () => <div data-testid="services-section">Services Section</div>,
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

describe('Features Page', () => {
  it('renders without crashing', () => {
    render(<Features />)
    expect(screen.getByTestId('features-section')).toBeInTheDocument()
  })

  it('renders both sections', () => {
    render(<Features />)
    
    expect(screen.getByTestId('features-section')).toBeInTheDocument()
    expect(screen.getByTestId('services-section')).toBeInTheDocument()
  })

  it('renders sections in correct order', () => {
    const { container } = render(<Features />)
    const sections = container.querySelectorAll('[data-testid]')
    
    expect(sections[0]).toHaveAttribute('data-testid', 'features-section')
    expect(sections[1]).toHaveAttribute('data-testid', 'services-section')
  })

  it('has accessible structure', () => {
    const { container } = render(<Features />)
    expect(container.firstChild).toBeTruthy()
  })
})

// Made with Bob
