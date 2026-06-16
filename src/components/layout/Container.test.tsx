import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Container } from './Container'

describe('Container', () => {
  describe('Rendering', () => {
    it('should render children content', () => {
      render(
        <Container>
          <div>Test Content</div>
        </Container>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render multiple children', () => {
      render(
        <Container>
          <h1>Title</h1>
          <p>Paragraph</p>
          <button>Button</button>
        </Container>
      )

      expect(screen.getByRole('heading', { name: 'Title' })).toBeInTheDocument()
      expect(screen.getByText('Paragraph')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Button' })).toBeInTheDocument()
    })

    it('should render with default layout-container class', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('layout-container')
    })
  })

  describe('Custom className', () => {
    it('should apply custom className alongside default class', () => {
      const { container } = render(
        <Container className="custom-class">
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('layout-container')
      expect(containerDiv).toHaveClass('custom-class')
    })

    it('should apply multiple custom classes', () => {
      const { container } = render(
        <Container className="class-one class-two class-three">
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('layout-container')
      expect(containerDiv).toHaveClass('class-one')
      expect(containerDiv).toHaveClass('class-two')
      expect(containerDiv).toHaveClass('class-three')
    })

    it('should work without custom className', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('layout-container')
      expect(containerDiv.className).toBe('layout-container')
    })
  })

  describe('Layout and Structure', () => {
    it('should render as a div element', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      expect(container.firstChild?.nodeName).toBe('DIV')
    })

    it('should have full width styling', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      const styles = window.getComputedStyle(containerDiv)
      expect(styles.width).toBe('100%')
    })

    it('should have max-width constraint', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      const styles = window.getComputedStyle(containerDiv)
      expect(styles.maxWidth).toBe('80rem')
    })

    it('should have auto horizontal margins for centering', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      const styles = window.getComputedStyle(containerDiv)
      expect(styles.marginInline).toBe('auto')
    })

    it('should have horizontal padding', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      const styles = window.getComputedStyle(containerDiv)
      expect(styles.paddingInline).toBe('1rem')
    })
  })

  describe('Responsive Design', () => {
    it('should increase padding on small screens (640px)', () => {
      // Set viewport to 640px
      window.innerWidth = 640
      window.dispatchEvent(new Event('resize'))

      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('layout-container')
    })

    it('should increase padding on large screens (1024px)', () => {
      // Set viewport to 1024px
      window.innerWidth = 1024
      window.dispatchEvent(new Event('resize'))

      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('layout-container')
    })

    it('should maintain layout-container class across all screen sizes', () => {
      const viewports = [320, 640, 768, 1024, 1280, 1920]

      viewports.forEach((width) => {
        window.innerWidth = width
        window.dispatchEvent(new Event('resize'))

        const { container } = render(
          <Container>
            <div>Content</div>
          </Container>
        )

        const containerDiv = container.firstChild as HTMLElement
        expect(containerDiv).toHaveClass('layout-container')
      })
    })
  })

  describe('Content Flexibility', () => {
    it('should handle text content', () => {
      render(
        <Container>
          Simple text content
        </Container>
      )

      expect(screen.getByText('Simple text content')).toBeInTheDocument()
    })

    it('should handle complex nested structures', () => {
      render(
        <Container>
          <header>
            <nav>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </nav>
          </header>
          <main>
            <section>
              <h1>Main Content</h1>
            </section>
          </main>
        </Container>
      )

      expect(screen.getByText('Item 1')).toBeInTheDocument()
      expect(screen.getByText('Item 2')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Main Content' })).toBeInTheDocument()
    })

    it('should handle React fragments', () => {
      render(
        <Container>
          <>
            <div>Fragment Child 1</div>
            <div>Fragment Child 2</div>
          </>
        </Container>
      )

      expect(screen.getByText('Fragment Child 1')).toBeInTheDocument()
      expect(screen.getByText('Fragment Child 2')).toBeInTheDocument()
    })

    it('should handle conditional rendering', () => {
      const showContent = true

      render(
        <Container>
          {showContent && <div>Conditional Content</div>}
        </Container>
      )

      expect(screen.getByText('Conditional Content')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty children', () => {
      const { container } = render(
        <Container>
          {null}
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toBeInTheDocument()
      expect(containerDiv).toHaveClass('layout-container')
    })

    it('should handle undefined children', () => {
      const { container } = render(
        <Container>
          {undefined}
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toBeInTheDocument()
      expect(containerDiv).toHaveClass('layout-container')
    })

    it('should handle boolean children', () => {
      const { container } = render(
        <Container>
          {false}
          {true}
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toBeInTheDocument()
      expect(containerDiv).toHaveClass('layout-container')
    })

    it('should handle empty string className', () => {
      const { container } = render(
        <Container className="">
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('layout-container')
    })

    it('should handle whitespace-only className', () => {
      const { container } = render(
        <Container className="   ">
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv).toHaveClass('layout-container')
    })
  })

  describe('Accessibility', () => {
    it('should not have any implicit ARIA roles', () => {
      const { container } = render(
        <Container>
          <div>Content</div>
        </Container>
      )

      const containerDiv = container.firstChild as HTMLElement
      expect(containerDiv.getAttribute('role')).toBeNull()
    })

    it('should allow children to define their own accessibility attributes', () => {
      render(
        <Container>
          <button aria-label="Custom Button">Click me</button>
        </Container>
      )

      const button = screen.getByRole('button', { name: 'Custom Button' })
      expect(button).toBeInTheDocument()
    })

    it('should preserve semantic HTML structure', () => {
      render(
        <Container>
          <article>
            <h1>Article Title</h1>
            <p>Article content</p>
          </article>
        </Container>
      )

      expect(screen.getByRole('article')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
    })
  })

  describe('Integration', () => {
    it('should work as a wrapper for page sections', () => {
      render(
        <Container>
          <section>
            <h2>Section Title</h2>
            <p>Section content</p>
          </section>
        </Container>
      )

      expect(screen.getByRole('heading', { name: 'Section Title' })).toBeInTheDocument()
      expect(screen.getByText('Section content')).toBeInTheDocument()
    })

    it('should work with form elements', () => {
      render(
        <Container>
          <form>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
            <button type="submit">Submit</button>
          </form>
        </Container>
      )

      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    })

    it('should work with navigation elements', () => {
      render(
        <Container>
          <nav aria-label="Main navigation">
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/about">About</a></li>
            </ul>
          </nav>
        </Container>
      )

      expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'About' })).toBeInTheDocument()
    })
  })
})

// Made with Bob
