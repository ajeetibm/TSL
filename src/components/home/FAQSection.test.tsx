import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FAQSection } from './FAQSection'

describe('FAQSection', () => {
  describe('Rendering', () => {
    it('should render a section element', () => {
      const { container } = render(<FAQSection />)

      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should render the eyebrow label', () => {
      render(<FAQSection />)

      expect(screen.getByText('Got Questions?')).toBeInTheDocument()
    })

    it('should render the main heading', () => {
      render(<FAQSection />)

      expect(
        screen.getByRole('heading', { level: 2 })
      ).toHaveTextContent('Frequently Asked Questions')
    })

    it('should render the description text', () => {
      render(<FAQSection />)

      expect(
        screen.getByText(/Everything you need to know about The StartUp Legal/i)
      ).toBeInTheDocument()
    })

    it('should have a white background on the section', () => {
      const { container } = render(<FAQSection />)

      expect(container.querySelector('section')).toHaveClass('bg-white')
    })

    it('should render all five FAQ cards', () => {
      render(<FAQSection />)

      const toggles = screen
        .getAllByRole('button')
        .filter((btn) => btn.hasAttribute('aria-expanded'))
      expect(toggles).toHaveLength(5)
    })
  })

  describe('Question Labels', () => {
    it('should render "What Is The Startup Legal?"', () => {
      render(<FAQSection />)

      expect(screen.getByText('What Is The Startup Legal?')).toBeInTheDocument()
    })

    it('should render "Who should use The Startup Legal?"', () => {
      render(<FAQSection />)

      expect(screen.getByText('Who should use The Startup Legal?')).toBeInTheDocument()
    })

    it('should render "Is my business data secure?"', () => {
      render(<FAQSection />)

      expect(screen.getByText('Is my business data secure?')).toBeInTheDocument()
    })

    it('should render "What makes TSL different from traditional law firms?"', () => {
      render(<FAQSection />)

      expect(
        screen.getByText('What makes TSL different from traditional law firms?')
      ).toBeInTheDocument()
    })

    it('should render "Do you provide support in multiple languages?"', () => {
      render(<FAQSection />)

      expect(
        screen.getByText('Do you provide support in multiple languages?')
      ).toBeInTheDocument()
    })
  })

  describe('Default Open State', () => {
    it('should have the first item expanded by default', () => {
      render(<FAQSection />)

      const firstToggle = screen.getByRole('button', {
        name: /What Is The Startup Legal\?/i,
      })
      expect(firstToggle).toHaveAttribute('aria-expanded', 'true')
    })

    it('should show the first answer by default', () => {
      render(<FAQSection />)

      expect(
        screen.getByText(/specializes in helping new business owners with company registration/i)
      ).toBeInTheDocument()
    })

    it('should have all other items collapsed by default', () => {
      render(<FAQSection />)

      const collapsedQuestions = [
        /Who should use The Startup Legal\?/i,
        /Is my business data secure\?/i,
        /What makes TSL different from traditional law firms\?/i,
        /Do you provide support in multiple languages\?/i,
      ]
      collapsedQuestions.forEach((name) => {
        expect(
          screen.getByRole('button', { name })
        ).toHaveAttribute('aria-expanded', 'false')
      })
    })
  })

  describe('Accordion Interaction', () => {
    it('should expand a collapsed item when its button is clicked', async () => {
      const user = userEvent.setup()
      render(<FAQSection />)

      const btn = screen.getByRole('button', { name: /Who should use The Startup Legal\?/i })
      expect(btn).toHaveAttribute('aria-expanded', 'false')

      await user.click(btn)

      expect(btn).toHaveAttribute('aria-expanded', 'true')
    })

    it('should show the answer for "Who should use The Startup Legal?" when expanded', async () => {
      const user = userEvent.setup()
      render(<FAQSection />)

      await user.click(
        screen.getByRole('button', { name: /Who should use The Startup Legal\?/i })
      )

      expect(
        screen.getByText(/founders, entrepreneurs, and SMEs in South Africa/i)
      ).toBeInTheDocument()
    })

    it('should collapse an expanded item when clicked again', async () => {
      const user = userEvent.setup()
      render(<FAQSection />)

      const btn = screen.getByRole('button', { name: /What Is The Startup Legal\?/i })
      expect(btn).toHaveAttribute('aria-expanded', 'true')

      await user.click(btn)

      expect(btn).toHaveAttribute('aria-expanded', 'false')
    })

    it('should expand "Is my business data secure?" and show its answer', async () => {
      const user = userEvent.setup()
      render(<FAQSection />)

      await user.click(screen.getByRole('button', { name: /Is my business data secure\?/i }))

      expect(
        screen.getByText(/cryptographic hashes, and QR verification/i)
      ).toBeInTheDocument()
    })

    it('should expand "What makes TSL different from traditional law firms?" and show its answer', async () => {
      const user = userEvent.setup()
      render(<FAQSection />)

      await user.click(
        screen.getByRole('button', {
          name: /What makes TSL different from traditional law firms\?/i,
        })
      )

      expect(
        screen.getByText(/guided wizards, automated document generation/i)
      ).toBeInTheDocument()
    })

    it('should expand "Do you provide support in multiple languages?" and show its answer', async () => {
      const user = userEvent.setup()
      render(<FAQSection />)

      await user.click(
        screen.getByRole('button', {
          name: /Do you provide support in multiple languages\?/i,
        })
      )

      expect(
        screen.getByText(/currently available in English/i)
      ).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should render a single h2 heading', () => {
      render(<FAQSection />)

      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    })

    it('should render five accordion toggle buttons with aria-expanded', () => {
      render(<FAQSection />)

      const toggles = screen
        .getAllByRole('button')
        .filter((btn) => btn.hasAttribute('aria-expanded'))
      expect(toggles).toHaveLength(5)
    })

    it('should render each card with a rounded border', () => {
      const { container } = render(<FAQSection />)

      // Each accordion card carries rounded-[28px] — check via class string
      const allDivs = Array.from(container.querySelectorAll('div'))
      const cards = allDivs.filter((el) => el.className.includes('rounded-[28px]'))
      expect(cards.length).toBeGreaterThanOrEqual(5)
    })

    it('should render a flex column container for the cards', () => {
      const { container } = render(<FAQSection />)

      const list = container.querySelector('.flex-col')
      expect(list).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use a semantic section element', () => {
      const { container } = render(<FAQSection />)

      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should have a single h2', () => {
      render(<FAQSection />)

      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    })

    it('should set aria-expanded on every toggle button', () => {
      render(<FAQSection />)

      const toggles = screen
        .getAllByRole('button')
        .filter((btn) => btn.hasAttribute('aria-expanded'))
      expect(toggles.length).toBe(5)
      toggles.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-expanded')
      })
    })

    it('should set aria-controls on every toggle button', () => {
      render(<FAQSection />)

      const toggles = screen
        .getAllByRole('button')
        .filter((btn) => btn.hasAttribute('aria-expanded'))
      toggles.forEach((btn) => {
        expect(btn).toHaveAttribute('aria-controls')
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders without errors', () => {
      const { rerender } = render(<FAQSection />)

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

      rerender(<FAQSection />)

      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
    })

    it('should render all five question labels on every render', () => {
      const questions = [
        'What Is The Startup Legal?',
        'Who should use The Startup Legal?',
        'Is my business data secure?',
        'What makes TSL different from traditional law firms?',
        'Do you provide support in multiple languages?',
      ]

      render(<FAQSection />)

      questions.forEach((q) => {
        expect(screen.getByText(q)).toBeInTheDocument()
      })
    })
  })

  describe('Still Have Questions CTA', () => {
    it('should render the "Still have questions?" heading', () => {
      render(<FAQSection />)

      expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Still have questions?')
    })

    it('should render the subtitle text', () => {
      render(<FAQSection />)

      expect(
        screen.getByText(/Our team is here to help you get started with confidence/i)
      ).toBeInTheDocument()
    })

    it('should render a "Contact Support" link', () => {
      render(<FAQSection />)

      expect(screen.getByRole('link', { name: 'Contact Support' })).toBeInTheDocument()
    })

    it('should point the link to /contact', () => {
      render(<FAQSection />)

      expect(screen.getByRole('link', { name: 'Contact Support' })).toHaveAttribute('href', '/contact')
    })

    it('should render the link with a rounded-full class', () => {
      render(<FAQSection />)

      expect(screen.getByRole('link', { name: 'Contact Support' })).toHaveClass('rounded-full')
    })
  })
})
