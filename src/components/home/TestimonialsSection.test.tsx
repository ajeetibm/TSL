import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TestimonialsSection } from './TestimonialsSection'

// Mock testimonials data
vi.mock('../../data/testimonials', () => ({
  testimonials: [
    {
      name: 'John Doe',
      role: 'CEO',
      company: 'Tech Startup',
      quote: 'This is an amazing service that helped us tremendously.',
    },
    {
      name: 'Jane Smith',
      role: 'Founder',
      company: 'Innovation Co',
      quote: 'The best legal platform we have ever used.',
    },
    {
      name: 'Bob Johnson',
      role: 'CTO',
      company: 'Digital Solutions',
      quote: 'Highly recommended for all startups.',
    },
  ],
}))

describe('TestimonialsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the section header', () => {
      render(<TestimonialsSection />)
      
      expect(screen.getByText('Client Stories')).toBeInTheDocument()
      expect(screen.getByText('Founders trust TSL to make legal work feel clear')).toBeInTheDocument()
    })

    it('should render the first testimonial by default', () => {
      render(<TestimonialsSection />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('CEO, Tech Startup')).toBeInTheDocument()
      expect(screen.getByText(/This is an amazing service/i)).toBeInTheDocument()
    })

    it('should render navigation buttons', () => {
      render(<TestimonialsSection />)
      
      expect(screen.getByRole('button', { name: /Previous testimonial/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Next testimonial/i })).toBeInTheDocument()
    })

    it('should render pagination dots', () => {
      render(<TestimonialsSection />)
      
      const dots = screen.getAllByRole('button', { name: /Show testimonial/i })
      expect(dots).toHaveLength(3)
    })

    it('should render Quote icon', () => {
      const { container } = render(<TestimonialsSection />)
      
      const quoteIcon = container.querySelector('svg')
      expect(quoteIcon).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('should show next testimonial when next button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestimonialsSection />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      
      const nextButton = screen.getByRole('button', { name: /Next testimonial/i })
      await user.click(nextButton)
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    })

    it('should show previous testimonial when previous button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestimonialsSection />)
      
      const prevButton = screen.getByRole('button', { name: /Previous testimonial/i })
      await user.click(prevButton)
      
      // Should wrap to last testimonial
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })

    it('should wrap to first testimonial after last one', async () => {
      const user = userEvent.setup()
      render(<TestimonialsSection />)
      
      const nextButton = screen.getByRole('button', { name: /Next testimonial/i })
      
      // Click through all testimonials
      await user.click(nextButton) // Jane
      await user.click(nextButton) // Bob
      await user.click(nextButton) // Should wrap to John
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should navigate to specific testimonial when dot is clicked', async () => {
      const user = userEvent.setup()
      render(<TestimonialsSection />)
      
      const dots = screen.getAllByRole('button', { name: /Show testimonial/i })
      await user.click(dots[2]) // Click third dot
      
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })
  })

  describe('Pagination Dots', () => {
    it('should highlight active dot', () => {
      render(<TestimonialsSection />)
      
      const dots = screen.getAllByRole('button', { name: /Show testimonial/i })
      
      // First dot should be active (wider)
      expect(dots[0]).toHaveClass('w-8')
      expect(dots[0]).toHaveClass('bg-gold')
    })

    it('should show inactive dots differently', () => {
      render(<TestimonialsSection />)
      
      const dots = screen.getAllByRole('button', { name: /Show testimonial/i })
      
      // Other dots should be smaller
      expect(dots[1]).toHaveClass('w-2.5')
      expect(dots[1]).toHaveClass('bg-white/30')
    })

    it('should update active dot when navigating', async () => {
      const user = userEvent.setup()
      render(<TestimonialsSection />)
      
      const nextButton = screen.getByRole('button', { name: /Next testimonial/i })
      await user.click(nextButton)
      
      const dots = screen.getAllByRole('button', { name: /Show testimonial/i })
      expect(dots[1]).toHaveClass('bg-gold')
    })
  })

  describe('Layout and Structure', () => {
    it('should have navy-primary background', () => {
      const { container } = render(<TestimonialsSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-navy-primary')
    })

    it('should have white text', () => {
      const { container } = render(<TestimonialsSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('text-white')
    })

    it('should have proper padding', () => {
      const { container } = render(<TestimonialsSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('py-20')
      expect(section).toHaveClass('lg:py-28')
    })

    it('should render testimonial as article element', () => {
      const { container } = render(<TestimonialsSection />)
      
      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })
  })

  describe('Testimonial Card', () => {
    it('should have proper card styling', () => {
      const { container } = render(<TestimonialsSection />)
      
      const card = container.querySelector('.rounded-\\[2rem\\]')
      expect(card).toBeInTheDocument()
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('bg-white/10')
    })

    it('should have backdrop blur effect', () => {
      const { container } = render(<TestimonialsSection />)
      
      const card = container.querySelector('.backdrop-blur')
      expect(card).toBeInTheDocument()
    })

    it('should have shadow effect', () => {
      const { container } = render(<TestimonialsSection />)
      
      const card = container.querySelector('.shadow-premium')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should have proper quote styling', () => {
      render(<TestimonialsSection />)
      
      const quote = screen.getByText(/This is an amazing service/i)
      expect(quote).toHaveClass('text-xl')
      expect(quote).toHaveClass('font-semibold')
      expect(quote).toHaveClass('md:text-2xl')
    })

    it('should have proper name styling', () => {
      render(<TestimonialsSection />)
      
      const name = screen.getByText('John Doe')
      expect(name).toHaveClass('font-black')
    })

    it('should have proper role styling', () => {
      render(<TestimonialsSection />)
      
      const role = screen.getByText('CEO, Tech Startup')
      expect(role).toHaveClass('text-sm')
      expect(role).toHaveClass('text-white/60')
    })

    it('should wrap quote in quotation marks', () => {
      render(<TestimonialsSection />)
      
      const quote = screen.getByText(/This is an amazing service/i)
      expect(quote.textContent).toMatch(/^".*"$/)
    })
  })

  describe('Icons', () => {
    it('should render Quote icon with gold color', () => {
      const { container } = render(<TestimonialsSection />)
      
      const quoteIcon = container.querySelector('.text-gold')
      expect(quoteIcon).toBeInTheDocument()
    })

    it('should render ChevronLeft icon in previous button', () => {
      render(<TestimonialsSection />)
      
      const prevButton = screen.getByRole('button', { name: /Previous testimonial/i })
      expect(prevButton.querySelector('svg')).toBeInTheDocument()
    })

    it('should render ChevronRight icon in next button', () => {
      render(<TestimonialsSection />)
      
      const nextButton = screen.getByRole('button', { name: /Next testimonial/i })
      expect(nextButton.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use semantic section element', () => {
      const { container } = render(<TestimonialsSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should use semantic article element for testimonial', () => {
      const { container } = render(<TestimonialsSection />)
      
      const article = container.querySelector('article')
      expect(article).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<TestimonialsSection />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
      
      const h3 = screen.getByRole('heading', { level: 3 })
      expect(h3).toBeInTheDocument()
    })

    it('should have aria-labels for navigation buttons', () => {
      render(<TestimonialsSection />)
      
      expect(screen.getByRole('button', { name: /Previous testimonial/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Next testimonial/i })).toBeInTheDocument()
    })

    it('should have aria-labels for pagination dots', () => {
      render(<TestimonialsSection />)
      
      const dots = screen.getAllByRole('button', { name: /Show testimonial \d+/i })
      expect(dots).toHaveLength(3)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive padding', () => {
      const { container } = render(<TestimonialsSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('lg:py-28')
    })

    it('should have responsive quote size', () => {
      render(<TestimonialsSection />)
      
      const quote = screen.getByText(/This is an amazing service/i)
      expect(quote).toHaveClass('text-xl')
      expect(quote).toHaveClass('md:text-2xl')
    })

    it('should have responsive card padding', () => {
      const { container } = render(<TestimonialsSection />)
      
      const card = container.querySelector('.p-6')
      expect(card).toHaveClass('md:p-10')
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<TestimonialsSection />)
      
      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should use AnimatePresence for transitions', () => {
      render(<TestimonialsSection />)
      
      // Component should render without errors
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<TestimonialsSection />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      
      rerender(<TestimonialsSection />)
      
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should handle rapid navigation clicks', async () => {
      const user = userEvent.setup()
      render(<TestimonialsSection />)
      
      const nextButton = screen.getByRole('button', { name: /Next testimonial/i })
      
      // Rapid clicks
      await user.click(nextButton)
      await user.click(nextButton)
      
      // Should still work correctly
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
    })
  })

  describe('Navigation Controls', () => {
    it('should have proper button styling', () => {
      render(<TestimonialsSection />)
      
      const prevButton = screen.getByRole('button', { name: /Previous testimonial/i })
      expect(prevButton).toHaveClass('rounded-full')
      expect(prevButton).toHaveClass('border')
    })

    it('should have hover effects on buttons', () => {
      render(<TestimonialsSection />)
      
      const prevButton = screen.getByRole('button', { name: /Previous testimonial/i })
      expect(prevButton).toHaveClass('hover:bg-white/10')
    })
  })
})

// Made with Bob
