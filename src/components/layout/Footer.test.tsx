import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Footer } from './Footer'

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
      <a href={to}>{children}</a>
    ),
  }
})

// Mock SITE constant
vi.mock('../../constants/site', () => ({
  SITE: {
    name: 'The Startup Legal',
  },
}))

const renderFooter = () => {
  return render(
    <BrowserRouter>
      <Footer />
    </BrowserRouter>
  )
}

describe('Footer', () => {
  describe('Rendering', () => {
    it('should render the footer element', () => {
      renderFooter()

      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    it('should render the brand title', () => {
      renderFooter()

      expect(screen.getByRole('heading', { name: 'The Startup Legal' })).toBeInTheDocument()
    })

    it('should render the brand description', () => {
      renderFooter()

      expect(
        screen.getByText(/Simplifying South African legal processes for startups and SMEs/i)
      ).toBeInTheDocument()
    })

    it('should render copyright text', () => {
      renderFooter()

      expect(
        screen.getByText(/© Copyright 2026 The Legal Startup. All rights reserved./i)
      ).toBeInTheDocument()
    })

    it('should render founder information', () => {
      renderFooter()

      expect(screen.getByText(/Founded by/i)).toBeInTheDocument()
      expect(screen.getByText('Muzukile Soni')).toBeInTheDocument()
      expect(screen.getByText(/Proudly South African/i)).toBeInTheDocument()
    })
  })

  describe('Social Links', () => {
    it('should render LinkedIn social link', () => {
      renderFooter()

      const linkedInLink = screen.getByLabelText('LinkedIn')
      expect(linkedInLink).toBeInTheDocument()
      expect(linkedInLink).toHaveAttribute('href', 'https://linkedin.com')
    })

    it('should render Instagram social link', () => {
      renderFooter()

      const instagramLink = screen.getByLabelText('Instagram')
      expect(instagramLink).toBeInTheDocument()
      expect(instagramLink).toHaveAttribute('href', 'https://instagram.com')
    })

    it('should render Link2 icon for LinkedIn', () => {
      const { container } = renderFooter()

      const linkedInLink = screen.getByLabelText('LinkedIn')
      const svg = linkedInLink.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('lucide-link-2')
    })

    it('should render CircleUserRound icon for Instagram', () => {
      const { container } = renderFooter()

      const instagramLink = screen.getByLabelText('Instagram')
      const svg = instagramLink.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('lucide-circle-user-round')
    })

    it('should have proper social link styling classes', () => {
      renderFooter()

      const linkedInLink = screen.getByLabelText('LinkedIn')
      const instagramLink = screen.getByLabelText('Instagram')

      expect(linkedInLink).toHaveClass('footer__social-link')
      expect(instagramLink).toHaveClass('footer__social-link')
    })
  })

  describe('Footer Link Groups', () => {
    it('should render Quick Links section', () => {
      renderFooter()

      expect(screen.getByRole('heading', { name: 'Quick Links' })).toBeInTheDocument()
    })

    it('should render Services section', () => {
      renderFooter()

      expect(screen.getByRole('heading', { name: 'Services' })).toBeInTheDocument()
    })

    it('should render Legal section', () => {
      renderFooter()

      expect(screen.getByRole('heading', { name: 'Legal' })).toBeInTheDocument()
    })

    it('should render all Quick Links items', () => {
      renderFooter()

      const quickLinks = ['About Us', 'How It Works', 'Pricing', 'FAQ', 'Contact']
      quickLinks.forEach((link) => {
        expect(screen.getByRole('link', { name: link })).toBeInTheDocument()
      })
    })

    it('should render all Services items', () => {
      renderFooter()

      const services = [
        'Wizards',
        'Get Counsel',
        'Playbooks',
        'CIPC Services',
        'Company Registration',
      ]
      services.forEach((service) => {
        expect(screen.getByRole('link', { name: service })).toBeInTheDocument()
      })
    })

    it('should render all Legal items', () => {
      renderFooter()

      const legalLinks = [
        'Privacy Policy',
        'Terms & Conditions',
        'POPIA Compliance',
        'Refund Policy',
      ]
      legalLinks.forEach((link) => {
        expect(screen.getByRole('link', { name: link })).toBeInTheDocument()
      })
    })

    it('should have all links pointing to /contact', () => {
      renderFooter()

      const allLinks = screen.getAllByRole('link')
      // Filter out social links
      const footerLinks = allLinks.filter(
        (link) => !link.getAttribute('aria-label')?.includes('LinkedIn') &&
                  !link.getAttribute('aria-label')?.includes('Instagram')
      )

      footerLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/contact')
      })
    })
  })

  describe('Layout Structure', () => {
    it('should have footer CSS class', () => {
      const { container } = renderFooter()

      const footer = container.querySelector('footer')
      expect(footer).toHaveClass('footer')
    })

    it('should have footer__top section', () => {
      const { container } = renderFooter()

      const topSection = container.querySelector('.footer__top')
      expect(topSection).toBeInTheDocument()
    })

    it('should have footer__bottom section', () => {
      const { container } = renderFooter()

      const bottomSection = container.querySelector('.footer__bottom')
      expect(bottomSection).toBeInTheDocument()
    })

    it('should have footer__links container', () => {
      const { container } = renderFooter()

      const linksContainer = container.querySelector('.footer__links')
      expect(linksContainer).toBeInTheDocument()
    })

    it('should have footer__socials container', () => {
      const { container } = renderFooter()

      const socialsContainer = container.querySelector('.footer__socials')
      expect(socialsContainer).toBeInTheDocument()
    })
  })

  describe('Styling Classes', () => {
    it('should apply footer__brand-title class to brand heading', () => {
      const { container } = renderFooter()

      const brandTitle = screen.getByRole('heading', { name: 'The Startup Legal' })
      expect(brandTitle).toHaveClass('footer__brand-title')
    })

    it('should apply footer__brand-copy class to description', () => {
      const { container } = renderFooter()

      const description = container.querySelector('.footer__brand-copy')
      expect(description).toBeInTheDocument()
      expect(description?.textContent).toContain('Simplifying South African legal processes')
    })

    it('should apply footer__group-title class to section headings', () => {
      const { container } = renderFooter()

      const groupTitles = container.querySelectorAll('.footer__group-title')
      expect(groupTitles).toHaveLength(3) // Quick Links, Services, Legal
    })

    it('should apply footer__group-list class to link lists', () => {
      const { container } = renderFooter()

      const groupLists = container.querySelectorAll('.footer__group-list')
      expect(groupLists).toHaveLength(3)
    })

    it('should apply footer__highlight class to founder name', () => {
      const { container } = renderFooter()

      const highlight = container.querySelector('.footer__highlight')
      expect(highlight).toBeInTheDocument()
      expect(highlight?.textContent).toBe('Muzukile Soni')
    })
  })

  describe('Accessibility', () => {
    it('should have proper footer role', () => {
      renderFooter()

      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    it('should have aria-labels for social links', () => {
      renderFooter()

      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      renderFooter()

      const h2 = screen.getByRole('heading', { level: 2, name: 'The Startup Legal' })
      const h3Headings = screen.getAllByRole('heading', { level: 3 })

      expect(h2).toBeInTheDocument()
      expect(h3Headings).toHaveLength(3) // Quick Links, Services, Legal
    })

    it('should have list structure for links', () => {
      const { container } = renderFooter()

      const lists = container.querySelectorAll('ul')
      expect(lists.length).toBeGreaterThan(0)

      lists.forEach((list) => {
        const items = list.querySelectorAll('li')
        expect(items.length).toBeGreaterThan(0)
      })
    })

    it('should have accessible link text', () => {
      renderFooter()

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link.textContent).toBeTruthy()
      })
    })
  })

  describe('Content Verification', () => {
    it('should render exactly 3 link groups', () => {
      const { container } = renderFooter()

      const groupTitles = container.querySelectorAll('.footer__group-title')
      expect(groupTitles).toHaveLength(3)
    })

    it('should render correct number of Quick Links', () => {
      renderFooter()

      const quickLinks = ['About Us', 'How It Works', 'Pricing', 'FAQ', 'Contact']
      expect(quickLinks).toHaveLength(5)
    })

    it('should render correct number of Services', () => {
      renderFooter()

      const services = [
        'Wizards',
        'Get Counsel',
        'Playbooks',
        'CIPC Services',
        'Company Registration',
      ]
      expect(services).toHaveLength(5)
    })

    it('should render correct number of Legal links', () => {
      renderFooter()

      const legalLinks = [
        'Privacy Policy',
        'Terms & Conditions',
        'POPIA Compliance',
        'Refund Policy',
      ]
      expect(legalLinks).toHaveLength(4)
    })

    it('should render exactly 2 social links', () => {
      renderFooter()

      const linkedIn = screen.getByLabelText('LinkedIn')
      const instagram = screen.getByLabelText('Instagram')

      expect(linkedIn).toBeInTheDocument()
      expect(instagram).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive footer__links grid', () => {
      const { container } = renderFooter()

      const linksContainer = container.querySelector('.footer__links')
      expect(linksContainer).toHaveClass('footer__links')
    })

    it('should have responsive footer__top grid', () => {
      const { container } = renderFooter()

      const topSection = container.querySelector('.footer__top')
      expect(topSection).toHaveClass('footer__top')
    })

    it('should have responsive footer__bottom flex', () => {
      const { container } = renderFooter()

      const bottomSection = container.querySelector('.footer__bottom')
      expect(bottomSection).toHaveClass('footer__bottom')
    })
  })

  describe('Container Integration', () => {
    it('should wrap top section in Container', () => {
      const { container } = renderFooter()

      const topContainer = container.querySelector('.footer__top')
      expect(topContainer).toHaveClass('layout-container')
    })

    it('should wrap bottom section in Container', () => {
      const { container } = renderFooter()

      const bottomContainer = container.querySelector('.footer__bottom')
      expect(bottomContainer).toHaveClass('layout-container')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing SITE.name gracefully', () => {
      // This test verifies the component doesn't crash
      renderFooter()

      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()
    })

    it('should render all link groups even if empty', () => {
      renderFooter()

      const quickLinks = screen.getByRole('heading', { name: 'Quick Links' })
      const services = screen.getByRole('heading', { name: 'Services' })
      const legal = screen.getByRole('heading', { name: 'Legal' })

      expect(quickLinks).toBeInTheDocument()
      expect(services).toBeInTheDocument()
      expect(legal).toBeInTheDocument()
    })

    it('should maintain structure with all elements present', () => {
      const { container } = renderFooter()

      expect(container.querySelector('.footer')).toBeInTheDocument()
      expect(container.querySelector('.footer__top')).toBeInTheDocument()
      expect(container.querySelector('.footer__bottom')).toBeInTheDocument()
      expect(container.querySelector('.footer__links')).toBeInTheDocument()
      expect(container.querySelector('.footer__socials')).toBeInTheDocument()
    })
  })

  describe('Link Behavior', () => {
    it('should have external links for social media', () => {
      renderFooter()

      const linkedIn = screen.getByLabelText('LinkedIn')
      const instagram = screen.getByLabelText('Instagram')

      expect(linkedIn.getAttribute('href')).toContain('linkedin.com')
      expect(instagram.getAttribute('href')).toContain('instagram.com')
    })

    it('should use React Router Link for internal navigation', () => {
      renderFooter()

      const aboutLink = screen.getByRole('link', { name: 'About Us' })
      expect(aboutLink).toHaveAttribute('href', '/contact')
    })
  })

  describe('Typography', () => {
    it('should render brand title as h2', () => {
      renderFooter()

      const brandTitle = screen.getByRole('heading', { level: 2 })
      expect(brandTitle.textContent).toBe('The Startup Legal')
    })

    it('should render section titles as h3', () => {
      renderFooter()

      const h3Headings = screen.getAllByRole('heading', { level: 3 })
      const titles = h3Headings.map((h) => h.textContent)

      expect(titles).toContain('Quick Links')
      expect(titles).toContain('Services')
      expect(titles).toContain('Legal')
    })

    it('should have highlighted founder name', () => {
      const { container } = renderFooter()

      const highlight = container.querySelector('.footer__highlight')
      expect(highlight).toHaveClass('footer__highlight')
      expect(highlight?.textContent).toBe('Muzukile Soni')
    })
  })
})

// Made with Bob
