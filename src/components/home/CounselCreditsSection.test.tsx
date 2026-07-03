import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CounselCreditsSection } from './CounselCreditsSection'

describe('CounselCreditsSection', () => {
  describe('Rendering', () => {
    it('should render a section element', () => {
      const { container } = render(<CounselCreditsSection />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render the heading', () => {
      render(<CounselCreditsSection />)

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'About Counsel Credits'
      )
    })

    it('should render the WandSparkles icon', () => {
      const { container } = render(<CounselCreditsSection />)

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Content Blocks', () => {
    it('should render the "Counsel is available in all tiers." label', () => {
      render(<CounselCreditsSection />)

      expect(
        screen.getByText('Counsel is available in all tiers.')
      ).toBeInTheDocument()
    })

    it('should render the counsel availability body text', () => {
      render(<CounselCreditsSection />)

      expect(
        screen.getByText(/Request inside the wizard\. The vetted lawyer works/i)
      ).toBeInTheDocument()
    })

    it('should render the "Time and scope:" label', () => {
      render(<CounselCreditsSection />)

      expect(screen.getByText('Time and scope:')).toBeInTheDocument()
    })

    it('should render the time and scope body text', () => {
      render(<CounselCreditsSection />)

      expect(
        screen.getByText(/Up to 30 minutes asynchronous work/i)
      ).toBeInTheDocument()
    })

    it('should render the "Deliverable:" label', () => {
      render(<CounselCreditsSection />)

      expect(screen.getByText('Deliverable:')).toBeInTheDocument()
    })

    it('should render the deliverable body text', () => {
      render(<CounselCreditsSection />)

      expect(
        screen.getByText(/Tracked edits or a short note with recommendations/i)
      ).toBeInTheDocument()
    })

    it('should render the footer note', () => {
      render(<CounselCreditsSection />)

      expect(
        screen.getByText(/Note: CIPC filing fees and third-party costs/i)
      ).toBeInTheDocument()
    })

    it('should render exactly three content blocks', () => {
      const { container } = render(<CounselCreditsSection />)

      // Each block has a bold label paragraph
      const boldLabels = container.querySelectorAll('.flex.flex-col.gap-2')
      expect(boldLabels.length).toBe(3)
    })
  })

  describe('Layout and Structure', () => {
    it('should have white background on the section', () => {
      const { container } = render(<CounselCreditsSection />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-white')
    })

    it('should render the beige card container', () => {
      const { container } = render(<CounselCreditsSection />)

      const card = container.querySelector('.rounded-3xl')
      expect(card).toBeInTheDocument()
    })

    it('should have the correct card background colour', () => {
      const { container } = render(<CounselCreditsSection />)

      const card = container.querySelector('.bg-\\[\\#EDE8DF\\]')
      expect(card).toBeInTheDocument()
    })

    it('should have a flex row for the heading and icon', () => {
      const { container } = render(<CounselCreditsSection />)

      const headingRow = container.querySelector('.flex.items-center.gap-3')
      expect(headingRow).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should style the heading as bold', () => {
      render(<CounselCreditsSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('font-bold')
    })

    it('should style the heading with the dark navy colour', () => {
      render(<CounselCreditsSection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[#0D1B2A]')
    })

    it('should style block labels as bold', () => {
      render(<CounselCreditsSection />)

      const label = screen.getByText('Counsel is available in all tiers.')
      expect(label).toHaveClass('font-bold')
    })

    it('should style block labels with dark navy colour', () => {
      render(<CounselCreditsSection />)

      const label = screen.getByText('Time and scope:')
      expect(label).toHaveClass('text-[#0D1B2A]')
    })
  })

  describe('Icon', () => {
    it('should render the icon with gold colour class', () => {
      const { container } = render(<CounselCreditsSection />)

      const svg = container.querySelector('svg')
      expect(svg).toHaveClass('text-gold')
    })

    it('should render the icon inside the heading row', () => {
      const { container } = render(<CounselCreditsSection />)

      const headingRow = container.querySelector('.flex.items-center.gap-3')
      expect(headingRow?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Footer Note', () => {
    it('should render the footer note with muted text colour', () => {
      render(<CounselCreditsSection />)

      const note = screen.getByText(/Note: CIPC filing fees/i)
      expect(note).toHaveClass('text-sm')
    })

    it('should render the footer note centred', () => {
      render(<CounselCreditsSection />)

      const note = screen.getByText(/Note: CIPC filing fees/i)
      expect(note).toHaveClass('text-center')
    })
  })

  describe('Accessibility', () => {
    it('should use a semantic section element', () => {
      const { container } = render(<CounselCreditsSection />)

      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should have a single h2 heading', () => {
      render(<CounselCreditsSection />)

      const headings = screen.getAllByRole('heading', { level: 2 })
      expect(headings).toHaveLength(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders without errors', () => {
      const { rerender } = render(<CounselCreditsSection />)

      expect(screen.getByText('About Counsel Credits')).toBeInTheDocument()

      rerender(<CounselCreditsSection />)

      expect(screen.getByText('About Counsel Credits')).toBeInTheDocument()
    })
  })
})

// Made with Bob
