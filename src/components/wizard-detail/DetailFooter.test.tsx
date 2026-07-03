import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DetailFooter } from './DetailFooter'

describe('DetailFooter', () => {
  describe('Rendering', () => {
    it('should render the footer', () => {
      const { container } = render(<DetailFooter />)

      const footer = container.querySelector('footer')
      expect(footer).toBeInTheDocument()
    })

    it('should render the brand title', () => {
      render(<DetailFooter />)

      expect(screen.getByRole('heading', { name: 'The Startup Legal' })).toBeInTheDocument()
    })

    it('should render the brand description', () => {
      render(<DetailFooter />)

      expect(
        screen.getByText(/Simplifying South African legal processes for startups and SMEs/i)
      ).toBeInTheDocument()
    })
  })

  describe('Social Links', () => {
    it('should render LinkedIn social link', () => {
      render(<DetailFooter />)

      const linkedInLink = screen.getByLabelText('LinkedIn')
      expect(linkedInLink).toBeInTheDocument()
      expect(linkedInLink).toHaveAttribute('href', 'https://linkedin.com')
    })

    it('should render Instagram social link', () => {
      render(<DetailFooter />)

      const instagramLink = screen.getByLabelText('Instagram')
      expect(instagramLink).toBeInTheDocument()
      expect(instagramLink).toHaveAttribute('href', 'https://instagram.com')
    })

    it('should render social link text', () => {
      render(<DetailFooter />)

      expect(screen.getByText('in')).toBeInTheDocument()
      expect(screen.getByText('ig')).toBeInTheDocument()
    })

    it('should have proper social link classes', () => {
      const { container } = render(<DetailFooter />)

      const socialLinks = container.querySelectorAll('.detail-footer__social-mark')
      expect(socialLinks).toHaveLength(2)
    })
  })

  describe('Footer Link Groups', () => {
    it('should render Quick Links section', () => {
      render(<DetailFooter />)

      expect(screen.getByRole('heading', { name: 'Quick Links' })).toBeInTheDocument()
    })

    it('should render Services section', () => {
      render(<DetailFooter />)

      expect(screen.getByRole('heading', { name: 'Services' })).toBeInTheDocument()
    })

    it('should render Legal section', () => {
      render(<DetailFooter />)

      expect(screen.getByRole('heading', { name: 'Legal' })).toBeInTheDocument()
    })

    it('should render all Quick Links items', () => {
      render(<DetailFooter />)

      const quickLinks = ['About Us', 'How It Works', 'Pricing', 'FAQ', 'Contact']
      quickLinks.forEach((link) => {
        expect(screen.getAllByText(link).length).toBeGreaterThan(0)
      })
    })

    it('should render all Services items', () => {
      render(<DetailFooter />)

      const services = [
        'Wizards',
        'Get Counsel',
        'Playbooks',
        'CIPC Services',
        'Company Registration',
      ]
      services.forEach((service) => {
        expect(screen.getAllByText(service).length).toBeGreaterThan(0)
      })
    })

    it('should render all Legal items', () => {
      render(<DetailFooter />)

      const legalLinks = [
        'Privacy Policy',
        'Terms & Conditions',
        'POPIA Compliance',
        'Refund Policy',
      ]
      legalLinks.forEach((link) => {
        expect(screen.getAllByText(link).length).toBeGreaterThan(0)
      })
    })

    it('should have all links pointing to /contact', () => {
      const { container } = render(<DetailFooter />)

      const groupLinks = container.querySelectorAll('.detail-footer__group a')
      groupLinks.forEach((link) => {
        expect(link).toHaveAttribute('href', '/contact')
      })
    })
  })

  describe('Styling Classes', () => {
    it('should have detail-footer class', () => {
      const { container } = render(<DetailFooter />)

      const footer = container.querySelector('footer')
      expect(footer).toHaveClass('detail-footer')
    })

    it('should have detail-footer__inner class', () => {
      const { container } = render(<DetailFooter />)

      const inner = container.querySelector('.detail-footer__inner')
      expect(inner).toBeInTheDocument()
    })

    it('should have detail-footer__main class', () => {
      const { container } = render(<DetailFooter />)

      const main = container.querySelector('.detail-footer__main')
      expect(main).toBeInTheDocument()
    })

    it('should have detail-footer__brand class', () => {
      const { container } = render(<DetailFooter />)

      const brand = container.querySelector('.detail-footer__brand')
      expect(brand).toBeInTheDocument()
    })

    it('should have detail-footer__group class', () => {
      const { container } = render(<DetailFooter />)

      const groups = container.querySelectorAll('.detail-footer__group')
      expect(groups).toHaveLength(3)
    })
  })

  describe('Layout Structure', () => {
    it('should have proper container hierarchy', () => {
      const { container } = render(<DetailFooter />)

      const footer = container.querySelector('.detail-footer')
      const inner = footer?.querySelector('.detail-footer__inner')
      const main = inner?.querySelector('.detail-footer__main')

      expect(footer).toBeInTheDocument()
      expect(inner).toBeInTheDocument()
      expect(main).toBeInTheDocument()
    })

    it('should have brand section in main', () => {
      const { container } = render(<DetailFooter />)

      const main = container.querySelector('.detail-footer__main')
      const brand = main?.querySelector('.detail-footer__brand')

      expect(brand).toBeInTheDocument()
    })

    it('should have three link groups', () => {
      const { container } = render(<DetailFooter />)

      const groups = container.querySelectorAll('.detail-footer__group')
      expect(groups).toHaveLength(3)
    })

    it('should render groups as nav elements', () => {
      const { container } = render(<DetailFooter />)

      const navs = container.querySelectorAll('nav.detail-footer__group')
      expect(navs).toHaveLength(3)
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<DetailFooter />)

      const h2 = screen.getByRole('heading', { level: 2 })
      const h3Headings = screen.getAllByRole('heading', { level: 3 })

      expect(h2).toBeInTheDocument()
      expect(h3Headings).toHaveLength(3)
    })

    it('should have aria-labels for social links', () => {
      render(<DetailFooter />)

      expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
      expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    })

    it('should use semantic HTML', () => {
      const { container } = render(<DetailFooter />)

      expect(container.querySelector('footer')).toBeInTheDocument()
      expect(container.querySelectorAll('nav')).toHaveLength(3)
    })

    it('should have accessible link text', () => {
      render(<DetailFooter />)

      const links = screen.getAllByRole('link')
      links.forEach((link) => {
        expect(link.textContent).toBeTruthy()
      })
    })
  })

  describe('Content Verification', () => {
    it('should render exactly 3 link groups', () => {
      const { container } = render(<DetailFooter />)

      const groups = container.querySelectorAll('.detail-footer__group')
      expect(groups).toHaveLength(3)
    })

    it('should render correct number of Quick Links', () => {
      render(<DetailFooter />)

      const quickLinks = ['About Us', 'How It Works', 'Pricing', 'FAQ', 'Contact']
      expect(quickLinks).toHaveLength(5)
    })

    it('should render correct number of Services', () => {
      render(<DetailFooter />)

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
      render(<DetailFooter />)

      const legalLinks = [
        'Privacy Policy',
        'Terms & Conditions',
        'POPIA Compliance',
        'Refund Policy',
      ]
      expect(legalLinks).toHaveLength(4)
    })

    it('should render exactly 2 social links', () => {
      const { container } = render(<DetailFooter />)

      const socialLinks = container.querySelectorAll('.detail-footer__social-mark')
      expect(socialLinks).toHaveLength(2)
    })
  })

  describe('Responsive Design', () => {
    it('should maintain structure across viewports', () => {
      const viewports = [320, 560, 900, 1280]

      viewports.forEach((width) => {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))

        const { container } = render(<DetailFooter />)
        expect(container.querySelector('.detail-footer')).toBeInTheDocument()
      })
    })

    it('should have responsive main grid', () => {
      const { container } = render(<DetailFooter />)

      const main = container.querySelector('.detail-footer__main')
      expect(main).toHaveClass('detail-footer__main')
    })
  })

  describe('Typography', () => {
    it('should render brand title as h2', () => {
      render(<DetailFooter />)

      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading.textContent).toBe('The Startup Legal')
    })

    it('should render section titles as h3', () => {
      render(<DetailFooter />)

      const h3Headings = screen.getAllByRole('heading', { level: 3 })
      const titles = h3Headings.map((h) => h.textContent)

      expect(titles).toContain('Quick Links')
      expect(titles).toContain('Services')
      expect(titles).toContain('Legal')
    })

    it('should render description in paragraph', () => {
      const { container } = render(<DetailFooter />)

      const brand = container.querySelector('.detail-footer__brand')
      const paragraph = brand?.querySelector('p')
      expect(paragraph).toBeInTheDocument()
    })
  })

  describe('Brand Section', () => {
    it('should render complete brand description', () => {
      const { container } = render(<DetailFooter />)

      const brand = container.querySelector('.detail-footer__brand')
      const paragraph = brand?.querySelector('p')
      expect(paragraph?.textContent).toContain('Simplifying South African legal processes')
    })

    it('should have social links container', () => {
      const { container } = render(<DetailFooter />)

      const brand = container.querySelector('.detail-footer__brand')
      const socialContainer = brand?.querySelector('div')
      expect(socialContainer).toBeInTheDocument()
    })

    it('should render social links in brand section', () => {
      const { container } = render(<DetailFooter />)

      const brand = container.querySelector('.detail-footer__brand')
      const links = brand?.querySelectorAll('a')
      expect(links).toHaveLength(2)
    })
  })

  describe('Link Groups Structure', () => {
    it('should have heading in each group', () => {
      const { container } = render(<DetailFooter />)

      const groups = container.querySelectorAll('.detail-footer__group')
      groups.forEach((group) => {
        const heading = group.querySelector('h3')
        expect(heading).toBeInTheDocument()
      })
    })

    it('should have links in each group', () => {
      const { container } = render(<DetailFooter />)

      const groups = container.querySelectorAll('.detail-footer__group')
      groups.forEach((group) => {
        const links = group.querySelectorAll('a')
        expect(links.length).toBeGreaterThan(0)
      })
    })

    it('should render groups in correct order', () => {
      render(<DetailFooter />)

      const headings = screen.getAllByRole('heading', { level: 3 })
      const titles = headings.map((h) => h.textContent)

      expect(titles[0]).toBe('Quick Links')
      expect(titles[1]).toBe('Services')
      expect(titles[2]).toBe('Legal')
    })
  })

  describe('Edge Cases', () => {
    it('should render without errors', () => {
      expect(() => render(<DetailFooter />)).not.toThrow()
    })

    it('should render consistently on multiple renders', () => {
      const { rerender } = render(<DetailFooter />)

      expect(screen.getByText('The Startup Legal')).toBeInTheDocument()

      rerender(<DetailFooter />)

      expect(screen.getByText('The Startup Legal')).toBeInTheDocument()
      expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
    })

    it('should maintain structure after re-render', () => {
      const { container, rerender } = render(<DetailFooter />)

      const initialGroups = container.querySelectorAll('.detail-footer__group')
      expect(initialGroups).toHaveLength(3)

      rerender(<DetailFooter />)

      const rerenderedGroups = container.querySelectorAll('.detail-footer__group')
      expect(rerenderedGroups).toHaveLength(3)
    })
  })

  describe('External Links', () => {
    it('should have external links for social media', () => {
      render(<DetailFooter />)

      const linkedIn = screen.getByLabelText('LinkedIn')
      const instagram = screen.getByLabelText('Instagram')

      expect(linkedIn.getAttribute('href')).toContain('linkedin.com')
      expect(instagram.getAttribute('href')).toContain('instagram.com')
    })

    it('should have internal links for footer groups', () => {
      const { container } = render(<DetailFooter />)

      const groupLinks = container.querySelectorAll('.detail-footer__group a')
      groupLinks.forEach((link) => {
        expect(link.getAttribute('href')).toBe('/contact')
      })
    })
  })
})

// Made with Bob
