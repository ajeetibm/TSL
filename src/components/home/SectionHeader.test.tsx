import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionHeader } from './SectionHeader'

describe('SectionHeader', () => {
  describe('Rendering', () => {
    it('should render eyebrow, title, and description', () => {
      render(
        <SectionHeader
          eyebrow="Test Eyebrow"
          title="Test Title"
          description="Test description text"
        />
      )

      expect(screen.getByText('Test Eyebrow')).toBeInTheDocument()
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test description text')).toBeInTheDocument()
    })

    it('should render without description', () => {
      render(
        <SectionHeader
          eyebrow="Test Eyebrow"
          title="Test Title"
        />
      )

      expect(screen.getByText('Test Eyebrow')).toBeInTheDocument()
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })

    it('should render eyebrow as ReactNode', () => {
      render(
        <SectionHeader
          eyebrow={
            <span>
              <strong>Bold</strong> Eyebrow
            </span>
          }
          title="Test Title"
        />
      )

      expect(screen.getByText('Bold')).toBeInTheDocument()
      expect(screen.getByText('Eyebrow')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should apply default (non-inverse) styles', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
        />
      )

      const eyebrow = screen.getByText('Test').closest('span')
      expect(eyebrow).toHaveClass('border-[rgba(13,27,42,0.1)]')
      expect(eyebrow).toHaveClass('bg-[rgba(13,27,42,0.05)]')
      expect(eyebrow).toHaveClass('text-[#333]')

      const title = screen.getByText('Title')
      expect(title).toHaveClass('text-navy-primary')
    })

    it('should apply inverse styles when inverse prop is true', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
          description="Description"
          inverse
        />
      )

      const eyebrow = screen.getByText('Test').closest('span')
      expect(eyebrow).toHaveClass('border-white/15')
      expect(eyebrow).toHaveClass('bg-white/10')
      expect(eyebrow).toHaveClass('text-white')

      const title = screen.getByText('Title')
      expect(title).toHaveClass('text-white')

      const description = screen.getByText('Description')
      expect(description).toHaveClass('text-white/70')
    })

    it('should apply correct description styles for non-inverse', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
          description="Description"
        />
      )

      const description = screen.getByText('Description')
      expect(description).toHaveClass('text-[#333]')
    })
  })

  describe('Layout', () => {
    it('should have centered text layout', () => {
      const { container } = render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('text-center')
    })

    it('should have max-width constraint', () => {
      const { container } = render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
        />
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('max-w-[1312px]')
    })

    it('should constrain description width', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
          description="Description"
        />
      )

      const description = screen.getByText('Description')
      expect(description).toHaveClass('max-w-[660px]')
    })
  })

  describe('Typography', () => {
    it('should apply correct title typography', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
        />
      )

      const title = screen.getByText('Title')
      expect(title).toHaveClass('font-display')
      expect(title).toHaveClass('font-bold')
      expect(title).toHaveClass('text-[32px]')
      expect(title).toHaveClass('md:text-[48px]')
    })

    it('should apply correct eyebrow typography', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
        />
      )

      const eyebrow = screen.getByText('Test').closest('span')
      expect(eyebrow).toHaveClass('text-sm')
      expect(eyebrow).toHaveClass('font-semibold')
    })

    it('should apply correct description typography', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
          description="Description"
        />
      )

      const description = screen.getByText('Description')
      expect(description).toHaveClass('text-base')
      expect(description).toHaveClass('leading-7')
    })
  })

  describe('Accessibility', () => {
    it('should render title as h2 heading', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Test Title"
        />
      )

      const title = screen.getByRole('heading', { level: 2 })
      expect(title).toHaveTextContent('Test Title')
    })

    it('should render description as paragraph', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
          description="Test description"
        />
      )

      const description = screen.getByText('Test description')
      expect(description.tagName).toBe('P')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty string title', () => {
      render(
        <SectionHeader
          eyebrow="Test"
          title=""
        />
      )

      const title = screen.getByRole('heading', { level: 2 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('')
    })

    it('should handle long title text', () => {
      const longTitle = 'This is a very long title that should still render correctly and maintain proper styling'
      render(
        <SectionHeader
          eyebrow="Test"
          title={longTitle}
        />
      )

      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('should handle long description text', () => {
      const longDescription = 'This is a very long description that should still render correctly within the max-width constraints and maintain proper line height and spacing for readability.'
      render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
          description={longDescription}
        />
      )

      expect(screen.getByText(longDescription)).toBeInTheDocument()
    })

    it('should handle complex eyebrow with icons', () => {
      render(
        <SectionHeader
          eyebrow={
            <>
              <svg data-testid="icon" />
              <span>Text with Icon</span>
            </>
          }
          title="Title"
        />
      )

      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByText('Text with Icon')).toBeInTheDocument()
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion.div wrapper', () => {
      const { container } = render(
        <SectionHeader
          eyebrow="Test"
          title="Title"
        />
      )

      // Motion components render as divs
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement)
    })
  })
})

// Made with Bob
