import { useEffect, useRef, useState } from 'react'

interface UseStickyScrollOptions {
  offset?: number
  enabled?: boolean
}

export function useStickyScroll(options: UseStickyScrollOptions = {}) {
  const { offset = 80, enabled = true } = options
  const sectionRef = useRef<HTMLElement>(null)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const handleScroll = () => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const shouldBeSticky = rect.top <= offset && rect.bottom > offset

      setIsSticky(shouldBeSticky)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Check initial state

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [offset, enabled])

  return { sectionRef, isSticky }
}

// Made with Bob
