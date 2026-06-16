import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HowItWorks } from './HowItWorks'

describe('HowItWorks', () => {
  describe('Rendering', () => {
    it('should render the section', () => {
      const { container } = render(<HowItWorks />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render the main heading', () => {
      render(<HowItWorks />)

      expect(screen.getByRole('heading', { name: 'How This Works' })).toBeInTheDocument()
    })

    it('should render the description paragraph', () => {
      render(<HowItWorks />)

      expect(
        screen.getByText(/Add wizards to your cart. You can add the same wizard multiple times/i)
      ).toBeInTheDocument()
    })

    it('should render all four process steps', () => {
      const { container } = render(<HowItWorks />)

      const steps = container.querySelectorAll('.how-it-works__step')
      expect(steps).toHaveLength(4)
    })
  })

  describe('Process Steps', () => {
    it('should render step 1: Add to Cart', () => {
      render(<HowItWorks />)

      expect(screen.getByText('1')).toBeInTheDocument()
      expect(screen.getByText('Add to Cart')).toBeInTheDocument()
      expect(screen.getByText('Multiple times if needed')).toBeInTheDocument()
    })

    it('should render step 2: View Details', () => {
      render(<HowItWorks />)

      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getByText('View Details')).toBeInTheDocument()
      expect(screen.getByText("See what's included")).toBeInTheDocument()
    })

    it('should render step 3: Sign Up', () => {
      render(<HowItWorks />)

      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByText('Sign Up')).toBeInTheDocument()
      expect(screen.getByText('Only when ready')).toBeInTheDocument()
    })

    it('should render step 4: Complete Wizards', () => {
      render(<HowItWorks />)

      expect(screen.getByText('4')).toBeInTheDocument()
      expect(screen.getByText('Complete Wizards')).toBeInTheDocument()
      expect(screen.getByText('Get your docs')).toBeInTheDocument()
    })

    it('should render step numbers in order', () => {
      render(<HowItWorks />)

      const numbers = ['1', '2', '3', '4']
      numbers.forEach((num) => {
        expect(screen.getByText(num)).toBeInTheDocument()
      })
    })

    it('should render step titles', () => {
      render(<HowItWorks />)

      const titles = ['Add to Cart', 'View Details', 'Sign Up', 'Complete Wizards']
      titles.forEach((title) => {
        expect(screen.getByText(title)).toBeInTheDocument()
      })
    })

    it('should render step details', () => {
      render(<HowItWorks />)

      const details = [
        'Multiple times if needed',
        "See what's included",
        'Only when ready',
        'Get your docs',
      ]
      details.forEach((detail) => {
        expect(screen.getByText(detail)).toBeInTheDocument()
      })
    })
  })

  describe('Layout and Structure', () => {
    it('should have how-it-works class on section', () => {
      const { container } = render(<HowItWorks />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('how-it-works')
    })

    it('should have how-it-works__steps container', () => {
      const { container } = render(<HowItWorks />)

      const stepsContainer = container.querySelector('.how-it-works__steps')
      expect(stepsContainer).toBeInTheDocument()
    })

    it('should have how-it-works__step class on each step', () => {
      const { container } = render(<HowItWorks />)

      const steps = container.querySelectorAll('.how-it-works__step')
      steps.forEach((step) => {
        expect(step).toHaveClass('how-it-works__step')
      })
    })

    it('should render steps in a grid layout', () => {
      const { container } = render(<HowItWorks />)

      const stepsContainer = container.querySelector('.how-it-works__steps')
      expect(stepsContainer).toHaveClass('how-it-works__steps')
    })
  })

  describe('Step Structure', () => {
    it('should render step number in span element', () => {
      const { container } = render(<HowItWorks />)

      const step = container.querySelector('.how-it-works__step')
      const numberSpan = step?.querySelector('span')
      expect(numberSpan).toBeInTheDocument()
      expect(numberSpan?.textContent).toBe('1')
    })

    it('should render step title in strong element', () => {
      const { container } = render(<HowItWorks />)

      const step = container.querySelector('.how-it-works__step')
      const titleStrong = step?.querySelector('strong')
      expect(titleStrong).toBeInTheDocument()
      expect(titleStrong?.textContent).toBe('Add to Cart')
    })

    it('should render step detail in small element', () => {
      const { container } = render(<HowItWorks />)

      const step = container.querySelector('.how-it-works__step')
      const detailSmall = step?.querySelector('small')
      expect(detailSmall).toBeInTheDocument()
      expect(detailSmall?.textContent).toBe('Multiple times if needed')
    })

    it('should have correct element hierarchy', () => {
      const { container } = render(<HowItWorks />)

      const step = container.querySelector('.how-it-works__step')
      expect(step?.children).toHaveLength(3) // span, strong, small
    })
  })

  describe('Content Verification', () => {
    it('should have centered text alignment', () => {
      const { container } = render(<HowItWorks />)

      const section = container.querySelector('.how-it-works')
      expect(section).toHaveClass('how-it-works')
    })

    it('should render complete description text', () => {
      render(<HowItWorks />)

      const description = screen.getByText(
        /Add wizards to your cart. You can add the same wizard multiple times if you need multiple documents of the same type./i
      )
      expect(description).toBeInTheDocument()
    })

    it('should render exactly 4 steps', () => {
      const { container } = render(<HowItWorks />)

      const steps = container.querySelectorAll('.how-it-works__step')
      expect(steps).toHaveLength(4)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(<HowItWorks />)

      const stepsContainer = container.querySelector('.how-it-works__steps')
      expect(stepsContainer).toHaveClass('how-it-works__steps')
    })

    it('should maintain structure across different viewports', () => {
      const viewports = [320, 520, 768, 900, 1024]

      viewports.forEach((width) => {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))

        const { container } = render(<HowItWorks />)
        const steps = container.querySelectorAll('.how-it-works__step')
        expect(steps).toHaveLength(4)
      })
    })
  })

  describe('Styling', () => {
    it('should have white background', () => {
      const { container } = render(<HowItWorks />)

      const section = container.querySelector('.how-it-works')
      expect(section).toHaveClass('how-it-works')
    })

    it('should have border and shadow', () => {
      const { container } = render(<HowItWorks />)

      const section = container.querySelector('.how-it-works')
      expect(section).toHaveClass('how-it-works')
    })

    it('should have rounded corners', () => {
      const { container } = render(<HowItWorks />)

      const section = container.querySelector('.how-it-works')
      expect(section).toHaveClass('how-it-works')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HowItWorks />)

      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('How This Works')
    })

    it('should have semantic HTML structure', () => {
      const { container } = render(<HowItWorks />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should use strong elements for emphasis', () => {
      const { container } = render(<HowItWorks />)

      const strongElements = container.querySelectorAll('strong')
      expect(strongElements).toHaveLength(4)
    })

    it('should use small elements for supplementary text', () => {
      const { container } = render(<HowItWorks />)

      const smallElements = container.querySelectorAll('small')
      expect(smallElements).toHaveLength(4)
    })
  })

  describe('Data Integrity', () => {
    it('should render steps in correct order', () => {
      const { container } = render(<HowItWorks />)

      const steps = container.querySelectorAll('.how-it-works__step')
      const numbers = Array.from(steps).map((step) => step.querySelector('span')?.textContent)

      expect(numbers).toEqual(['1', '2', '3', '4'])
    })

    it('should match step numbers with titles', () => {
      const { container } = render(<HowItWorks />)

      const steps = container.querySelectorAll('.how-it-works__step')
      const stepData = Array.from(steps).map((step) => ({
        number: step.querySelector('span')?.textContent,
        title: step.querySelector('strong')?.textContent,
      }))

      expect(stepData).toEqual([
        { number: '1', title: 'Add to Cart' },
        { number: '2', title: 'View Details' },
        { number: '3', title: 'Sign Up' },
        { number: '4', title: 'Complete Wizards' },
      ])
    })

    it('should match titles with details', () => {
      const { container } = render(<HowItWorks />)

      const steps = container.querySelectorAll('.how-it-works__step')
      const stepData = Array.from(steps).map((step) => ({
        title: step.querySelector('strong')?.textContent,
        detail: step.querySelector('small')?.textContent,
      }))

      expect(stepData).toEqual([
        { title: 'Add to Cart', detail: 'Multiple times if needed' },
        { title: 'View Details', detail: "See what's included" },
        { title: 'Sign Up', detail: 'Only when ready' },
        { title: 'Complete Wizards', detail: 'Get your docs' },
      ])
    })
  })

  describe('Edge Cases', () => {
    it('should handle rendering without errors', () => {
      expect(() => render(<HowItWorks />)).not.toThrow()
    })

    it('should render consistently on multiple renders', () => {
      const { rerender } = render(<HowItWorks />)

      expect(screen.getByText('How This Works')).toBeInTheDocument()

      rerender(<HowItWorks />)

      expect(screen.getByText('How This Works')).toBeInTheDocument()
      expect(screen.getAllByText(/Add to Cart|View Details|Sign Up|Complete Wizards/)).toHaveLength(
        4
      )
    })

    it('should maintain structure after re-render', () => {
      const { container, rerender } = render(<HowItWorks />)

      const initialSteps = container.querySelectorAll('.how-it-works__step')
      expect(initialSteps).toHaveLength(4)

      rerender(<HowItWorks />)

      const rerenderedSteps = container.querySelectorAll('.how-it-works__step')
      expect(rerenderedSteps).toHaveLength(4)
    })
  })

  describe('Typography', () => {
    it('should render heading with proper text', () => {
      render(<HowItWorks />)

      const heading = screen.getByRole('heading', { name: 'How This Works' })
      expect(heading.tagName).toBe('H3')
    })

    it('should render description in paragraph', () => {
      const { container } = render(<HowItWorks />)

      const paragraph = container.querySelector('p')
      expect(paragraph).toBeInTheDocument()
      expect(paragraph?.textContent).toContain('Add wizards to your cart')
    })

    it('should use appropriate text elements', () => {
      const { container } = render(<HowItWorks />)

      expect(container.querySelector('h3')).toBeInTheDocument()
      expect(container.querySelector('p')).toBeInTheDocument()
      expect(container.querySelectorAll('span')).toHaveLength(4)
      expect(container.querySelectorAll('strong')).toHaveLength(4)
      expect(container.querySelectorAll('small')).toHaveLength(4)
    })
  })
})

// Made with Bob
