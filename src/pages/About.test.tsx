import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import About from './About'

// Mock child components
vi.mock('../components/home/AboutSection', () => ({
  AboutSection: () => <div data-testid="about-section">About Section</div>,
}))

vi.mock('../components/home/StatisticsSection', () => ({
  StatisticsSection: () => <div data-testid="statistics-section">Statistics Section</div>,
}))

vi.mock('../components/home/ApproachSection', () => ({
  ApproachSection: () => <div data-testid="approach-section">Approach Section</div>,
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
    
    expect(screen.getByTestId('about-section')).toBeInTheDocument()
    expect(screen.getByTestId('statistics-section')).toBeInTheDocument()
    expect(screen.getByTestId('approach-section')).toBeInTheDocument()
  })

  it('renders sections in correct order', () => {
    const { container } = render(<About />)
    const sections = container.querySelectorAll('[data-testid]')
    
    expect(sections[0]).toHaveAttribute('data-testid', 'about-section')
    expect(sections[1]).toHaveAttribute('data-testid', 'statistics-section')
    expect(sections[2]).toHaveAttribute('data-testid', 'approach-section')
  })

  it('has accessible structure', () => {
    const { container } = render(<About />)
    expect(container.firstChild).toBeTruthy()
  })
})

// Made with Bob
