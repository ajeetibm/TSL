import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import About from './About'

// Mock child components
vi.mock('../components/home/HeroSection', () => ({
  HeroSection: () => <div data-testid="hero-section">Hero Section</div>,
}))

vi.mock('../components/home/AboutSection', () => ({
  AboutSection: () => <div data-testid="about-section">About Section</div>,
}))

vi.mock('../components/home/MetricsSection', () => ({
  MetricsSection: () => <div data-testid="metrics-section">Metrics Section</div>,
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

vi.mock('../components/home/CounselCreditsSection', () => ({
  CounselCreditsSection: () => <div data-testid="counsel-credits-section">Counsel Credits Section</div>,
}))

vi.mock('../components/home/WhyChooseTSLSection', () => ({
  WhyChooseTSLSection: () => <div data-testid="why-choose-tsl-section">Why Choose TSL Section</div>,
}))

vi.mock('../components/home/TrustedBySection', () => ({
  TrustedBySection: () => <div data-testid="trusted-by-section">Trusted By Section</div>,
}))

vi.mock('../components/home/FAQSection', () => ({
  FAQSection: () => <div data-testid="faq-section">FAQ Section</div>,
}))

vi.mock('../components/home/ContactSection', () => ({
  ContactSection: () => <div data-testid="contact-section">Contact Section</div>,
}))

vi.mock('../components/wizard-detail/DetailFooter', () => ({
  DetailFooter: () => <div data-testid="detail-footer">Detail Footer</div>,
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

describe('About Page', () => {
  it('renders without crashing', () => {
    render(<About />)
    expect(screen.getByTestId('about-section')).toBeInTheDocument()
  })

  it('renders all sections', () => {
    render(<About />)

    expect(screen.getByTestId('hero-section')).toBeInTheDocument()
    expect(screen.getByTestId('about-section')).toBeInTheDocument()
    expect(screen.getByTestId('metrics-section')).toBeInTheDocument()
    expect(screen.getByTestId('approach-section')).toBeInTheDocument()
    expect(screen.getByTestId('features-section')).toBeInTheDocument()
    expect(screen.getByTestId('services-section')).toBeInTheDocument()
    expect(screen.getByTestId('statistics-section')).toBeInTheDocument()
    expect(screen.getByTestId('pricing-section')).toBeInTheDocument()
    expect(screen.getByTestId('counsel-credits-section')).toBeInTheDocument()
    expect(screen.getByTestId('why-choose-tsl-section')).toBeInTheDocument()
    expect(screen.getByTestId('trusted-by-section')).toBeInTheDocument()
    expect(screen.getByTestId('faq-section')).toBeInTheDocument()
    expect(screen.getByTestId('contact-section')).toBeInTheDocument()
    expect(screen.getByTestId('detail-footer')).toBeInTheDocument()
  })

  it('renders sections in correct order', () => {
    const { container } = render(<About />)
    const sections = container.querySelectorAll('[data-testid]')

    expect(sections[0]).toHaveAttribute('data-testid', 'hero-section')
    expect(sections[1]).toHaveAttribute('data-testid', 'about-section')
    expect(sections[2]).toHaveAttribute('data-testid', 'metrics-section')
    expect(sections[3]).toHaveAttribute('data-testid', 'approach-section')
    expect(sections[4]).toHaveAttribute('data-testid', 'features-section')
    expect(sections[5]).toHaveAttribute('data-testid', 'services-section')
    expect(sections[6]).toHaveAttribute('data-testid', 'statistics-section')
    expect(sections[7]).toHaveAttribute('data-testid', 'pricing-section')
    expect(sections[8]).toHaveAttribute('data-testid', 'counsel-credits-section')
    expect(sections[9]).toHaveAttribute('data-testid', 'why-choose-tsl-section')
    expect(sections[10]).toHaveAttribute('data-testid', 'trusted-by-section')
    expect(sections[11]).toHaveAttribute('data-testid', 'faq-section')
    expect(sections[12]).toHaveAttribute('data-testid', 'contact-section')
    expect(sections[13]).toHaveAttribute('data-testid', 'detail-footer')
  })

  it('has accessible structure', () => {
    const { container } = render(<About />)
    expect(container.firstChild).toBeTruthy()
  })
})

// Made with Bob
