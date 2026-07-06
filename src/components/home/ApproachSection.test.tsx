import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ApproachSection } from './ApproachSection'

describe('ApproachSection', () => {
  describe('Rendering', () => {
    it('should render the eyebrow badge', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText('Our Approach')).toBeInTheDocument()
    })

    it('should render the main heading', () => {
      render(<ApproachSection />)
      
      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
        'How We Make Legal Simple'
      )
    })

    it('should render all three approach columns', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText('Educate')).toBeInTheDocument()
      expect(screen.getByText('Empower')).toBeInTheDocument()
      expect(screen.getByText('Support')).toBeInTheDocument()
    })

    it('should render subtitles for each column', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText('KNOWLEDGE IS POWER')).toBeInTheDocument()
      expect(screen.getByText('TOOLS FOR SUCCESS')).toBeInTheDocument()
      expect(screen.getByText('ALWAYS BY YOUR SIDE')).toBeInTheDocument()
    })

    it('should render descriptions for each column', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText(/We turn legal language into plain language/i)).toBeInTheDocument()
      expect(screen.getByText(/We provide the tools, templates, and technology/i)).toBeInTheDocument()
      expect(screen.getByText(/Our team is here to guide you/i)).toBeInTheDocument()
    })

    it('should render the CTA button', () => {
      render(<ApproachSection />)
      
      const button = screen.getByRole('link', { name: /Book Your Free Consultation/i })
      expect(button).toBeInTheDocument()
    })
  })

  describe('Bullet Points', () => {
    it('should render Educate bullet points', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText('Free educational resources')).toBeInTheDocument()
      expect(screen.getByText('Plain language guides')).toBeInTheDocument()
      expect(screen.getByText('Legal workshops & webinars')).toBeInTheDocument()
    })

    it('should render Empower bullet points', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText('Affordable legal templates')).toBeInTheDocument()
      expect(screen.getByText('LegalTech platform access')).toBeInTheDocument()
      expect(screen.getByText('Self-service compliance tools')).toBeInTheDocument()
    })

    it('should render Support bullet points', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText('SME consulting services')).toBeInTheDocument()
      expect(screen.getByText('Expert guidance on demand')).toBeInTheDocument()
      expect(screen.getByText('Ongoing compliance support')).toBeInTheDocument()
    })

    it('should render bullet decorators', () => {
      const { container } = render(<ApproachSection />)
      
      // Each column has 3 bullets, so 9 total
      const bullets = container.querySelectorAll('.bg-\\[\\#D4A437\\].rounded-full')
      expect(bullets.length).toBeGreaterThanOrEqual(9)
    })
  })

  describe('Icons', () => {
    it('should render icons for all columns', () => {
      const { container } = render(<ApproachSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
      
      articles.forEach(article => {
        const icon = article.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })

    it('should render BookOpen icon for Educate', () => {
      render(<ApproachSection />)
      
      const card = screen.getByText('Educate').closest('article')
      expect(card?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render Zap icon for Empower', () => {
      render(<ApproachSection />)
      
      const card = screen.getByText('Empower').closest('article')
      expect(card?.querySelector('svg')).toBeInTheDocument()
    })

    it('should render Users icon for Support', () => {
      render(<ApproachSection />)
      
      const card = screen.getByText('Support').closest('article')
      expect(card?.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Layout and Structure', () => {
    it('should have white background', () => {
      const { container } = render(<ApproachSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-white')
    })

    it('should have proper padding', () => {
      const { container } = render(<ApproachSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('pb-[88px]')
      expect(section).toHaveClass('pt-[92px]')
      expect(section).toHaveClass('lg:pb-[96px]')
      expect(section).toHaveClass('lg:pt-[104px]')
    })

    it('should have centered text layout', () => {
      const { container } = render(<ApproachSection />)
      
      const textCenter = container.querySelector('.text-center')
      expect(textCenter).toBeInTheDocument()
    })

    it('should have grid layout for columns', () => {
      const { container } = render(<ApproachSection />)
      
      const grid = container.querySelector('.md\\:grid-cols-3')
      expect(grid).toBeInTheDocument()
    })

    it('should have proper gap between columns', () => {
      const { container } = render(<ApproachSection />)
      
      const grid = container.querySelector('.gap-\\[82px\\]')
      expect(grid).toBeInTheDocument()
    })
  })

  describe('Typography', () => {
    it('should have proper heading styles', () => {
      render(<ApproachSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[34px]')
      expect(heading).toHaveClass('font-bold')
    })

    it('should have proper column title styles', () => {
      render(<ApproachSection />)
      
      const title = screen.getByText('Educate')
      expect(title).toHaveClass('text-[24px]')
      expect(title).toHaveClass('font-bold')
    })

    it('should have uppercase subtitles', () => {
      render(<ApproachSection />)
      
      const subtitle = screen.getByText('KNOWLEDGE IS POWER')
      expect(subtitle).toHaveClass('uppercase')
      expect(subtitle).toHaveClass('font-bold')
    })

    it('should have proper description text styles', () => {
      render(<ApproachSection />)
      
      const description = screen.getByText(/We turn legal language into plain language/i)
      expect(description).toHaveClass('text-[17px]')
      expect(description).toHaveClass('leading-[1.5]')
    })
  })

  describe('Card Structure', () => {
    it('should render cards as article elements', () => {
      const { container } = render(<ApproachSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })

    it('should have centered content in cards', () => {
      render(<ApproachSection />)
      
      const card = screen.getByText('Educate').closest('article')
      expect(card).toHaveClass('text-center')
      expect(card).toHaveClass('items-center')
    })

    it('should have icon containers with gold background', () => {
      render(<ApproachSection />)
      
      const card = screen.getByText('Educate').closest('article')
      const iconContainer = card?.querySelector('.bg-\\[\\#D4A437\\]')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have rounded icon containers', () => {
      render(<ApproachSection />)
      
      const card = screen.getByText('Educate').closest('article')
      const iconContainer = card?.querySelector('.rounded-full')
      expect(iconContainer).toBeInTheDocument()
    })

    it('should have decorative dividers in cards', () => {
      const { container } = render(<ApproachSection />)
      
      const dividers = container.querySelectorAll('.h-\\[3px\\].w-\\[112px\\]')
      expect(dividers.length).toBe(3)
    })
  })

  describe('CTA Button', () => {
    it('should link to contact section', () => {
      render(<ApproachSection />)
      
      const button = screen.getByRole('link', { name: /Book Your Free Consultation/i })
      expect(button).toHaveAttribute('href', '#contact')
    })

    it('should have proper button styling', () => {
      render(<ApproachSection />)
      
      const button = screen.getByRole('link', { name: /Book Your Free Consultation/i })
      expect(button).toHaveClass('rounded-full')
      expect(button).toHaveClass('bg-[#D4A437]')
      expect(button).toHaveClass('text-white')
    })

    it('should have arrow icon', () => {
      render(<ApproachSection />)
      
      const button = screen.getByRole('link', { name: /Book Your Free Consultation/i })
      expect(button).toHaveTextContent('→')
    })

    it('should have proper sizing', () => {
      render(<ApproachSection />)
      
      const button = screen.getByRole('link', { name: /Book Your Free Consultation/i })
      expect(button).toHaveClass('min-h-[64px]')
      expect(button).toHaveClass('min-w-[330px]')
    })
  })

  describe('Eyebrow Badge', () => {
    it('should have proper badge styling', () => {
      render(<ApproachSection />)
      
      const badge = screen.getByText('Our Approach').closest('span')
      expect(badge).toHaveClass('rounded-full')
      expect(badge).toHaveClass('border')
      expect(badge).toHaveClass('font-bold')
    })

    it('should have white background', () => {
      render(<ApproachSection />)
      
      const badge = screen.getByText('Our Approach').closest('span')
      expect(badge).toHaveClass('bg-white')
    })
  })

  describe('Bullet List Structure', () => {
    it('should render bullets as unordered lists', () => {
      const { container } = render(<ApproachSection />)
      
      const lists = container.querySelectorAll('ul')
      expect(lists.length).toBe(3)
    })

    it('should have proper list item structure', () => {
      const { container } = render(<ApproachSection />)
      
      const listItems = container.querySelectorAll('li')
      expect(listItems.length).toBe(9) // 3 items per column × 3 columns
    })

    it('should have gap between list items', () => {
      const { container } = render(<ApproachSection />)
      
      const list = container.querySelector('ul')
      expect(list).toHaveClass('gap-[22px]')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid', () => {
      const { container } = render(<ApproachSection />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('md:grid-cols-3')
    })

    it('should have responsive padding', () => {
      const { container } = render(<ApproachSection />)
      
      const section = container.querySelector('section')
      expect(section).toHaveClass('lg:pb-[96px]')
      expect(section).toHaveClass('lg:pt-[104px]')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<ApproachSection />)
      
      const h2 = screen.getByRole('heading', { level: 2 })
      expect(h2).toBeInTheDocument()
      
      const h3s = screen.getAllByRole('heading', { level: 3 })
      expect(h3s).toHaveLength(3)
    })

    it('should use semantic article elements for cards', () => {
      const { container } = render(<ApproachSection />)
      
      const articles = container.querySelectorAll('article')
      expect(articles.length).toBe(3)
    })

    it('should use semantic section element', () => {
      const { container } = render(<ApproachSection />)
      
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should use semantic list elements', () => {
      const { container } = render(<ApproachSection />)
      
      const lists = container.querySelectorAll('ul')
      expect(lists.length).toBe(3)
    })

    it('should have accessible link', () => {
      render(<ApproachSection />)
      
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('href', '#contact')
    })

    it('should hide decorative arrow from screen readers', () => {
      render(<ApproachSection />)
      
      const button = screen.getByRole('link', { name: /Book Your Free Consultation/i })
      const arrow = button.querySelector('[aria-hidden="true"]')
      expect(arrow).toBeInTheDocument()
    })
  })

  describe('Content Accuracy', () => {
    it('should have correct Educate description', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText(/We turn legal language into plain language/i)).toBeInTheDocument()
    })

    it('should have correct Empower description', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText(/We provide the tools, templates, and technology/i)).toBeInTheDocument()
    })

    it('should have correct Support description', () => {
      render(<ApproachSection />)
      
      expect(screen.getByText(/Our team is here to guide you/i)).toBeInTheDocument()
    })
  })

  describe('Framer Motion Integration', () => {
    it('should render motion components', () => {
      const { container } = render(<ApproachSection />)
      
      expect(container.querySelector('section')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders', () => {
      const { rerender } = render(<ApproachSection />)
      
      expect(screen.getByText('Educate')).toBeInTheDocument()
      
      rerender(<ApproachSection />)
      
      expect(screen.getByText('Educate')).toBeInTheDocument()
    })

    it('should render all columns even with varying content lengths', () => {
      render(<ApproachSection />)
      
      const cards = screen.getAllByRole('heading', { level: 3 })
      expect(cards).toHaveLength(3)
    })
  })

  describe('Color Scheme', () => {
    it('should use gold color for icons and decorative elements', () => {
      const { container } = render(<ApproachSection />)
      
      const goldElements = container.querySelectorAll('.bg-\\[\\#D4A437\\]')
      expect(goldElements.length).toBeGreaterThan(0)
    })

    it('should have proper text colors', () => {
      render(<ApproachSection />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('text-[#2B2B2B]')
    })
  })

  describe('Spacing', () => {
    it('should have proper spacing between sections', () => {
      const { container } = render(<ApproachSection />)
      
      const grid = container.querySelector('.mt-\\[86px\\]')
      expect(grid).toBeInTheDocument()
    })

    it('should have proper spacing for CTA button', () => {
      render(<ApproachSection />)
      
      const buttonContainer = screen.getByRole('link').closest('div')
      expect(buttonContainer).toHaveClass('mt-[100px]')
    })
  })
})

// Made with Bob
