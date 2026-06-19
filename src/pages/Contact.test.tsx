import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Contact from './Contact'

// Mock ContactSection component
vi.mock('../components/home/ContactSection', () => ({
  ContactSection: () => <div data-testid="contact-section">Contact Section</div>,
}))

vi.mock('../services/metadata', () => ({
  setPageMetadata: vi.fn(),
}))

describe('Contact Page', () => {
  it('renders without crashing', () => {
    render(<Contact />)
    expect(screen.getByTestId('contact-section')).toBeInTheDocument()
  })

  it('renders ContactSection component', () => {
    render(<Contact />)
    expect(screen.getByTestId('contact-section')).toBeInTheDocument()
  })

  it('has accessible structure', () => {
    const { container } = render(<Contact />)
    expect(container.firstChild).toBeTruthy()
  })
})

// Made with Bob
