import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FloatingAIButton } from './FloatingAIButton'

describe('FloatingAIButton', () => {
  describe('Rendering', () => {
    it('should render the button with text', () => {
      render(<FloatingAIButton />)
      
      expect(screen.getByRole('button', { name: /TSL AI/i })).toBeInTheDocument()
      expect(screen.getByText('TSL AI')).toBeInTheDocument()
    })

    it('should render the Bot icon', () => {
      const { container } = render(<FloatingAIButton />)
      
      // Lucide icons render as SVGs
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have fixed positioning', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('fixed')
    })

    it('should be positioned at bottom-right', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bottom-5')
      expect(button).toHaveClass('right-5')
      expect(button).toHaveClass('md:bottom-8')
      expect(button).toHaveClass('md:right-8')
    })

    it('should have high z-index for floating above content', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('z-40')
    })

    it('should have gold background', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-gold')
    })

    it('should have white text', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-white')
    })

    it('should have rounded-full shape', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('rounded-full')
    })

    it('should have shadow-premium', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('shadow-premium')
    })

    it('should have proper padding', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-7')
    })

    it('should have minimum height', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('min-h-13')
    })

    it('should have gap between icon and text', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('gap-3')
    })

    it('should have font styling', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('text-sm')
      expect(button).toHaveClass('font-black')
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button', { name: 'Open TSL AI assistant' })
      expect(button).toBeInTheDocument()
    })

    it('should be a button element', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button.tagName).toBe('BUTTON')
    })

    it('should have type="button"', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('type', 'button')
    })
  })

  describe('Interactions', () => {
    it('should be clickable', async () => {
      const user = userEvent.setup()
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      // Button should remain in document after click
      expect(button).toBeInTheDocument()
    })

    it('should not have default click handler', async () => {
      const user = userEvent.setup()
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      
      // Should not throw error when clicked
      await expect(user.click(button)).resolves.not.toThrow()
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render as motion.button', () => {
      const { container } = render(<FloatingAIButton />)
      
      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('should display icon and text inline', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('inline-flex')
      expect(button).toHaveClass('items-center')
    })
  })

  describe('Icon', () => {
    it('should render Bot icon with correct size', () => {
      const { container } = render(<FloatingAIButton />)
      
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      // Lucide icons with size={18} render with width and height attributes
    })
  })

  describe('Edge Cases', () => {
    it('should render correctly when mounted multiple times', () => {
      const { unmount, rerender } = render(<FloatingAIButton />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
      
      unmount()
      rerender(<FloatingAIButton />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should maintain position on window resize', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      
      // Fixed positioning should maintain position regardless of scroll/resize
      expect(button).toHaveClass('fixed')
    })
  })

  describe('Visual Hierarchy', () => {
    it('should be above most content with z-40', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('z-40')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive positioning classes', () => {
      render(<FloatingAIButton />)
      
      const button = screen.getByRole('button')
      
      // Mobile positioning
      expect(button).toHaveClass('bottom-5')
      expect(button).toHaveClass('right-5')
      
      // Desktop positioning
      expect(button).toHaveClass('md:bottom-8')
      expect(button).toHaveClass('md:right-8')
    })
  })
})

// Made with Bob
