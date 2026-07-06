import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Home from './Home'

// Mock all child components
vi.mock('../components/home/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
}))

vi.mock('../components/home/AboutSection', () => ({
  AboutSection: () => <div data-testid="about-section">About Section</div>,
}))

vi.mock('../components/home/ApproachSection', () => ({
  ApproachSection: () => <div data-testid="approach-section">Approach Section</div>,
}))

vi.mock('../components/home/FeaturesSection', () => ({
  FeaturesSection: () => <div data-testid="features-section">Features Section</div>,
}))

vi.mock('../components/home/ServicesSection', () => ({
  ServicesSection: () => <div data-testid="services-section">Services Section</div>,
}))

vi.mock('../components/home/StatisticsSection', () => ({
  StatisticsSection: () => <div data-testid="statistics-section">Statistics Section</div>,
}))

vi.mock('../components/home/PricingSection', () => ({
  PricingSection: () => <div data-testid="pricing-section">Pricing Section</div>,
}))

vi.mock('../components/home/TestimonialsSection', () => ({
  TestimonialsSection: () => <div data-testid="testimonials-section">Testimonials Section</div>,
}))

vi.mock('../components/home/ContactSection', () => ({
  ContactSection: () => <div data-testid="contact-section">Contact Section</div>,
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

describe('Home Page', () => {
  it('renders without crashing', () => {
    render(<Home />)
    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
  })

  it('renders all sections in correct order', () => {
    render(<Home />)
    
    const sections = [
      'hero-section',
      'about-section',
      'approach-section',
      'features-section',
      'services-section',
      'statistics-section',
      'pricing-section',
      'testimonials-section',
      'contact-section',
    ]

    sections.forEach((sectionId) => {
      expect(screen.getByTestId(sectionId)).toBeInTheDocument()
    })
  })

  it('renders sections in the correct sequence', () => {
    const { container } = render(<Home />)
    const sections = container.querySelectorAll('[data-testid]')
    
    expect(sections[0]).toHaveAttribute('data-testid', 'hero-section')
    expect(sections[1]).toHaveAttribute('data-testid', 'about-section')
    expect(sections[2]).toHaveAttribute('data-testid', 'approach-section')
    expect(sections[3]).toHaveAttribute('data-testid', 'features-section')
    expect(sections[4]).toHaveAttribute('data-testid', 'services-section')
    expect(sections[5]).toHaveAttribute('data-testid', 'statistics-section')
    expect(sections[6]).toHaveAttribute('data-testid', 'pricing-section')
    expect(sections[7]).toHaveAttribute('data-testid', 'testimonials-section')
    expect(sections[8]).toHaveAttribute('data-testid', 'contact-section')
  })

  it('has accessible structure', () => {
    const { container } = render(<Home />)
    expect(container.firstChild).toBeTruthy()
  })
})

// Made with Bob
