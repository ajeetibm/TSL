import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ServicesSection } from './ServicesSection'

describe('ServicesSection', () => {
  describe('Rendering', () => {
    it('should render the section header', () => {
      render(<ServicesSection />)
      
      expect(screen.getByText('What You Actually Get')).toBeInTheDocument()
      expect(screen.getByText('Every Run Delivers Proof, Not Just Papers')).toBeInTheDocument()
    })

    it('should render all five service cards', () => {
      render(<ServicesSection />)
      
      expect(screen.getByText('Wizards')).toBeInTheDocument()
      expect(screen.getByText('Counsel')).toBeInTheDocument()
      expect(screen.getByText('Evidence Pack')).toBeInTheDocument()
      expect(screen.getByText('QR Verification')).toBeInTheDocument()
      expect(screen.getByText('Auto Sync')).toBeInTheDocument()
    })

    it('should render card descriptions', () => {
      render(<ServicesSection />)
      
      expect(screen.getByText('Legally compliant documents that third parties accept.')).toBeInTheDocument()
      expect(screen.getByText('Expert legal guidance for complex decisions.')).toBeInTheDocument()
      expect(screen.getByText('Complete audit trail with hashes and timestamps.')).toBeInTheDocument()
      expect(screen.getByText('Instant verification by third parties.')).toBeInTheDocument()
      expect(screen.getByText('Records stay accurate automatically.')).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('should render icons for all cards', () => {
      const { container } = render(<ServicesSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(5)
      
      articles.forEach(article => {
        const icon = article.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })

    it('should render CheckCircle2 icon in eyebrow', () => {
      render(<ServicesSection />)
      
      const eyebrow = screen.getByText('What You Actually Get').closest('span')
      expect(eyebrow?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should have white background', () => {
      const { container } = render(<ServicesSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-white')
    })

    it('should have proper padding', () => {
      const { container } = render(<ServicesSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('pb-[112px]')
      expect(section).toHaveClass('pt-[118px]')
    })

    it('should have grid layout for cards', () => {
      const { container } = render(<ServicesSection />)
      
      const grid = container.querySelector('.grid-cols-5')
      expect(grid).toBeInTheDocument()
    })

    it('should render cards as article elements', () => {
      const { container } = render(<ServicesSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(5)
    })
  })

  describe('Card Structure', () => {
    it('should have proper card styling', () => {
      render(<ServicesSection />)
      
      const card = screen.getByText('Wizards').closest('article')
      expect(card).toHaveClass('rounded-[26px]')
      expect(card).toHaveClass('bg-white')
      expect(card).toHaveClass('border')
    })

    it('should have icon containers with dark background', () => {
      render(<ServicesSection />)
      
      const card = screen.getByText('Wizards').closest('article')
      const iconContainer = card?.querySelector('.bg-\\[\\#08192B\\]')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have rounded icon containers', () => {
      render(<ServicesSection />)
      
      const card = screen.getByText('Wizards').closest('article')
      const iconContainer = card?.querySelector('.rounded-full')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have fixed height cards', () => {
      render(<ServicesSection />)
      
      const card = screen.getByText('Wizards').closest('article')
      expect(card).toHaveClass('h-[194px]')
    })
  })

  describe('Typography', () => {
    it('should have proper heading styles', () => {
      render(<ServicesSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[42px]')
      expect(heading).toHaveClass('font-bold')
      expect(heading).toHaveClass('md:text-[46px]')
    })

    it('should have proper card title styles', () => {
      render(<ServicesSection />)
      
      const title = screen.getByText('Wizards')
      expect(title).toHaveClass('text-[18px]')
      expect(title).toHaveClass('font-bold')
    })

    it('should have proper description styles', () => {
      render(<ServicesSection />)
      
      const description = screen.getByText('Legally compliant documents that third parties accept.')
      expect(description).toHaveClass('text-[14px]')
    })
  })

  describe('Eyebrow Badge', () => {
    it('should have proper badge styling', () => {
      render(<ServicesSection />)
      
      const badge = screen.getByText('What You Actually Get').closest('span')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('border')
      expect(badge).toHaveClass('font-bold')
    })

    it('should have icon in badge', () => {
      render(<ServicesSection />)
      
      const badge = screen.getByText('What You Actually Get').closest('span')
      const icon = badge?.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should use semantic article elements for cards', () => {
      const { container } = render(<ServicesSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(5)
    })

    it('should use semantic section element', () => {
      const { container } = render(<ServicesSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<ServicesSection />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
      
      const h3s = screen.getAllByRole('heading', { level: 3 })
      expect(h3s).toHaveLength(5)
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive heading size', () => {
      render(<ServicesSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[42px]')
      expect(heading).toHaveClass('md:text-[46px]')
    })
  })

  describe('Color Scheme', () => {
    it('should use dark navy for icon backgrounds', () => {
      const { container } = render(<ServicesSection />)
      
      const iconContainers = container.querySelectorAll('.bg-\\[\\#08192B\\]')
      expect(iconContainers.length).toBe(5)
    })

    it('should use gold for eyebrow icon', () => {
      render(<ServicesSection />)
      
      const eyebrow = screen.getByText('What You Actually Get').closest('span')
      const icon = eyebrow?.querySelector('.text-\\[\\#D4A437\\]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<ServicesSection />)
      
      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<ServicesSection />)
      
      expect(screen.getByText('Wizards')).toBeInTheDocument()
      
      rerender(<ServicesSection />)
      
      expect(screen.getByText('Wizards')).toBeInTheDocument()
    })

    it('should render all cards with consistent structure', () => {
      const { container } = render(<ServicesSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(5)
      
      articles.forEach(article => {
        expect(article.querySelector('h3')).toBeInTheDocument()
        expect(article.querySelector('p')).toBeInTheDocument()
        expect(article.querySelector('svg')).toBeInTheDocument()
      })
    })
  })

  describe('Content Accuracy', () => {
    it('should have correct Wizards description', () => {
      render(<ServicesSection />)
      
      expect(screen.getByText('Legally compliant documents that third parties accept.')).toBeInTheDocument()
    })

    it('should have correct Counsel description', () => {
      render(<ServicesSection />)
      
      expect(screen.getByText('Expert legal guidance for complex decisions.')).toBeInTheDocument()
    })

    it('should have correct Evidence Pack description', () => {
      render(<ServicesSection />)
      
      expect(screen.getByText('Complete audit trail with hashes and timestamps.')).toBeInTheDocument()
    })

    it('should have correct QR Verification description', () => {
      render(<ServicesSection />)
      
      expect(screen.getByText('Instant verification by third parties.')).toBeInTheDocument()
    })

    it('should have correct Auto Sync description', () => {
      render(<ServicesSection />)
      
      expect(screen.getByText('Records stay accurate automatically.')).toBeInTheDocument()
    })
  })

  describe('Card Positioning', () => {
    it('should have centered text in cards', () => {
      render(<ServicesSection />)
      
      const card = screen.getByText('Wizards').closest('article')
      expect(card).toHaveClass('text-center')
    })

    it('should have absolute positioned icons', () => {
      render(<ServicesSection />)
      
      const card = screen.getByText('Wizards').closest('article')
      const iconContainer = card?.querySelector('.absolute')
      expect(iconContainer).toBeInTheDocument()
    })
  })
})

// Made with Bob
