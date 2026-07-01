import type { Variants } from 'framer-motion'

export const revealUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
}

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
}

// Improved viewport settings for better scroll reveal
export const defaultViewport = {
  once: true,
  margin: '0px 0px -100px 0px', // Trigger when element is 100px from bottom of viewport
  amount: 0.2, // Trigger when 20% of element is visible
}

export const eagerViewport = {
  once: true,
  margin: '0px 0px -50px 0px', // Trigger earlier for better UX
  amount: 0.1, // Trigger when 10% of element is visible
}
