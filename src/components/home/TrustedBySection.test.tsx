import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TrustedBySection } from './TrustedBySection'

describe('TrustedBySection', () => {
  describe('Rendering', () => {
    it('should render a section element', () => {
      const { container } = render(<TrustedBySection />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render the main heading', () => {
      render(<TrustedBySection />)

      expect(
        screen.getByRole('heading', { level: 2 })
      ).toHaveTextContent('Trusted by SA Entrepreneurs')
    })

    it('should render the subtitle description', () => {
      render(<TrustedBySection />)

      expect(
        screen.getByText(/Hear from founders who've transformed their legal operations/i)
      ).toBeInTheDocument()
    })

    it('should render three review cards', () => {
      const { container } = render(<TrustedBySection />)

      const articles = container.querySelectorAll('article')
      expect(articles).toHaveLength(3)
    })
  })

  describe('Card Content — Quotes', () => {
    it('should render the Thabo Molefe quote', () => {
      render(<TrustedBySection />)

      expect(
        screen.getByText(/The StartUp Legal saved us over R45,000 in legal fees/i)
      ).toBeInTheDocument()
    })

    it('should render the Sarah van der Merwe quote', () => {
      render(<TrustedBySection />)

      expect(
        screen.getByText(/We went from waiting 2 weeks for document reviews/i)
      ).toBeInTheDocument()
    })

    it('should render the Lindiwe Khumalo quote', () => {
      render(<TrustedBySection />)

      expect(
        screen.getByText(/Their understanding of BEE requirements/i)
      ).toBeInTheDocument()
    })
  })

  describe('Card Content — Author Names', () => {
    it('should render "Thabo Molefe"', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('Thabo Molefe')).toBeInTheDocument()
    })

    it('should render "Sarah van der Merwe"', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('Sarah van der Merwe')).toBeInTheDocument()
    })

    it('should render "Lindiwe Khumalo"', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('Lindiwe Khumalo')).toBeInTheDocument()
    })
  })

  describe('Card Content — Roles', () => {
    it('should render "Founder" role', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('Founder')).toBeInTheDocument()
    })

    it('should render "CEO" role', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('CEO')).toBeInTheDocument()
    })

    it('should render "Co-founder" role', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('Co-founder')).toBeInTheDocument()
    })
  })

  describe('Card Content — Companies', () => {
    it('should render "PayFast Alternative"', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('PayFast Alternative')).toBeInTheDocument()
    })

    it('should render "Cape Commerce"', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('Cape Commerce')).toBeInTheDocument()
    })

    it('should render "CloudServe SA"', () => {
      render(<TrustedBySection />)

      expect(screen.getByText('CloudServe SA')).toBeInTheDocument()
    })
  })

  describe('Star Ratings', () => {
    it('should render star rating groups for each card', () => {
      const { container } = render(<TrustedBySection />)

      const starGroups = container.querySelectorAll('[aria-label="5 out of 5 stars"]')
      expect(starGroups).toHaveLength(3)
    })

    it('should render 5 stars per card (15 star SVGs total)', () => {
      const { container } = render(<TrustedBySection />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        const starContainer = article.querySelector('[aria-label="5 out of 5 stars"]')
        const stars = starContainer?.querySelectorAll('svg[aria-hidden="true"]')
        expect(stars).toHaveLength(5)
      })
    })
  })

  describe('Quote Icons', () => {
    it('should render a quote icon wrapper span in each card', () => {
      const { container } = render(<TrustedBySection />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        const iconSpan = article.querySelector('span.grid')
        expect(iconSpan).toBeInTheDocument()
      })
    })
  })

  describe('Layout and Structure', () => {
    it('should have a dark navy background on the section', () => {
      const { container } = render(<TrustedBySection />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-[#0D1B2A]')
    })

    it('should render the card grid container', () => {
      const { container } = render(<TrustedBySection />)

      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
    })

    it('should render a divider hr inside each card', () => {
      const { container } = render(<TrustedBySection />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        expect(article.querySelector('hr')).toBeInTheDocument()
      })
    })

    it('should render each card with a dark card background', () => {
      const { container } = render(<TrustedBySection />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        expect(article).toHaveClass('bg-[#1A2B3C]')
      })
    })

    it('should render each card as a rounded article', () => {
      const { container } = render(<TrustedBySection />)

      const articles = container.querySelectorAll('article')
      articles.forEach((article) => {
        expect(article).toHaveClass('rounded-2xl')
      })
    })
  })

  describe('Typography', () => {
    it('should render the main heading with bold weight', () => {
      render(<TrustedBySection />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveClass('font-bold')
    })

    it('should render each author name with bold weight', () => {
      render(<TrustedBySection />)

      const nameEl = screen.getByText('Thabo Molefe')
      expect(nameEl).toHaveClass('font-bold')
    })
  })

  describe('Accessibility', () => {
    it('should use a semantic section element', () => {
      const { container } = render(<TrustedBySection />)

      expect(container.querySelector('section')).toBeInTheDocument()
    })

    it('should have a single h2 heading', () => {
      render(<TrustedBySection />)

      const h2s = screen.getAllByRole('heading', { level: 2 })
      expect(h2s).toHaveLength(1)
    })

    it('should use semantic article elements for each card', () => {
      const { container } = render(<TrustedBySection />)

      const articles = container.querySelectorAll('article')
      expect(articles).toHaveLength(3)
    })

    it('should provide accessible aria-label on each star rating', () => {
      const { container } = render(<TrustedBySection />)

      const ratingDivs = container.querySelectorAll('[aria-label="5 out of 5 stars"]')
      expect(ratingDivs.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle multiple renders without errors', () => {
      const { rerender } = render(<TrustedBySection />)

      expect(screen.getByText('Thabo Molefe')).toBeInTheDocument()

      rerender(<TrustedBySection />)

      expect(screen.getByText('Thabo Molefe')).toBeInTheDocument()
    })

    it('should render all three author names on every render', () => {
      const authors = ['Thabo Molefe', 'Sarah van der Merwe', 'Lindiwe Khumalo']

      render(<TrustedBySection />)

      authors.forEach((author) => {
        expect(screen.getByText(author)).toBeInTheDocument()
      })
    })

    it('should render all three company names on every render', () => {
      const companies = ['PayFast Alternative', 'Cape Commerce', 'CloudServe SA']

      render(<TrustedBySection />)

      companies.forEach((company) => {
        expect(screen.getByText(company)).toBeInTheDocument()
      })
    })
  })
})
