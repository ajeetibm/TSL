import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WhyChooseTSLSection } from './WhyChooseTSLSection'

describe('WhyChooseTSLSection', () => {
  describe('Rendering', () => {
    it('should render a section element', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render the eyebrow label', () => {
      render(<WhyChooseTSLSection />)

      expect(screen.getByText('Why Choose TSL')).toBeInTheDocument()
    })

    it('should render the main heading', () => {
      render(<WhyChooseTSLSection />)

      expect(
        screen.getByRole('heading', { level: 2 })
      ).toHaveTextContent('Why This Beats DIY AI Solutions')
    })

    it('should render all six reason cards', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const articles = container.querySelectorAll('article')
      expect(articles).toHaveLength(6)
    })
  })

  describe('Card Titles', () => {
    it('should render "Outcome Over Text"', () => {
      render(<WhyChooseTSLSection />)

      expect(screen.getByText('Outcome Over Text')).toBeInTheDocument()
    })

    it('should render "Receiver Acceptance"', () => {
      render(<WhyChooseTSLSection />)

      expect(screen.getByText('Receiver Acceptance')).toBeInTheDocument()
    })

    it('should render "Jurisdiction Accuracy"', () => {
      render(<WhyChooseTSLSection />)

      expect(screen.getByText('Jurisdiction Accuracy')).toBeInTheDocument()
    })

    it('should render "Audit Integrity"', () => {
      render(<WhyChooseTSLSection />)

      expect(screen.getByText('Audit Integrity')).toBeInTheDocument()
    })

    it('should render "Records Stay Accurate"', () => {
      render(<WhyChooseTSLSection />)

      expect(screen.getByText('Records Stay Accurate')).toBeInTheDocument()
    })

    it('should render "Predictable Cost"', () => {
      render(<WhyChooseTSLSection />)

      expect(screen.getByText('Predictable Cost')).toBeInTheDocument()
    })
  })

  describe('Card Descriptions', () => {
    it('should render the "Outcome Over Text" description', () => {
      render(<WhyChooseTSLSection />)

      expect(
        screen.getByText(/AI generates paragraphs; we provide signed transactions/i)
      ).toBeInTheDocument()
    })

    it('should render the "Receiver Acceptance" description', () => {
      render(<WhyChooseTSLSection />)

      expect(
        screen.getByText(/Deterministic PDFs \+ hashes \+ QR verification/i)
      ).toBeInTheDocument()
    })

    it('should render the "Jurisdiction Accuracy" description', () => {
      render(<WhyChooseTSLSection />)

      expect(
        screen.getByText(/POPIA, Companies Act, BCEA, LRA, CPA compliance/i)
      ).toBeInTheDocument()
    })

    it('should render the "Audit Integrity" description', () => {
      render(<WhyChooseTSLSection />)

      expect(
        screen.getByText(/Preserved redlines, approvals, blacklines/i)
      ).toBeInTheDocument()
    })

    it('should render the "Records Stay Accurate" description', () => {
      render(<WhyChooseTSLSection />)

      expect(
        screen.getByText(/Automated Company Snapshot sync/i)
      ).toBeInTheDocument()
    })

    it('should render the "Predictable Cost" description', () => {
      render(<WhyChooseTSLSection />)

      expect(
        screen.getByText(/Metered runs \+ clear overage/i)
      ).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should have a grey background on the section', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-[#F5F5F5]')
    })

    it('should render each card as a rounded white article', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        expect(article).toHaveClass('rounded-3xl')
        expect(article).toHaveClass('bg-white')
      })
    })

    it('should render each card with centred text', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        expect(article).toHaveClass('text-center')
      })
    })

    it('should render the card grid container', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Card Icons', () => {
    it('should render an SVG icon inside every card', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        expect(article.querySelector('svg')).toBeInTheDocument()
      })
    })

    it('should render six icon wrapper spans in total', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const iconSpans = container.querySelectorAll('article span')
      expect(iconSpans).toHaveLength(6)
    })
  })

  describe('Typography', () => {
    it('should render the main heading with bold weight', () => {
      render(<WhyChooseTSLSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('font-bold')
    })

    it('should render card titles as h3 headings', () => {
      render(<WhyChooseTSLSection />)

      const h3s = screen.getAllByRole('heading', { level: 3 })
      expect(h3s).toHaveLength(6)
    })

    it('should render each card title with bold weight', () => {
      render(<WhyChooseTSLSection />)

      const h3s = screen.getAllByRole('heading', { level: 3 })
      h3s.forEach((h3) => {
        expect(h3).toHaveClass('font-bold')
      })
    })

    it('should render each card title with the dark navy colour', () => {
      render(<WhyChooseTSLSection />)

      const h3s = screen.getAllByRole('heading', { level: 3 })
      h3s.forEach((h3) => {
        expect(h3).toHaveClass('text-[#0D1B2A]')
      })
    })
  })

  describe('Accessibility', () => {
    it('should use a semantic section element', () => {
      const { container } = render(<WhyChooseTSLSection />)

      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should have a single h2 heading', () => {
      render(<WhyChooseTSLSection />)

      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h2s).toHaveLength(1)
    })

    it('should use semantic article elements for each card', () => {
      const { container } = render(<WhyChooseTSLSection />)

      const articles = container.querySelectorAll('article')
      expect(articles).toHaveLength(6)
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders without errors', () => {
      const { rerender } = render(<WhyChooseTSLSection />)

      expect(screen.getByText('Why This Beats DIY AI Solutions')).toBeInTheDocument()

      rerender(<WhyChooseTSLSection />)

      expect(screen.getByText('Why This Beats DIY AI Solutions')).toBeInTheDocument()
    })

    it('should render all six titles on every render', () => {
      const titles = [
        'Outcome Over Text',
        'Receiver Acceptance',
        'Jurisdiction Accuracy',
        'Audit Integrity',
        'Records Stay Accurate',
        'Predictable Cost',
      ]

      render(<WhyChooseTSLSection />)

      titles.forEach((title) => {
        expect(screen.getByText(title)).toBeInTheDocument()
      })
    })
  })
})
