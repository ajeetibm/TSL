import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { revealUp, defaultViewport } from '../../hooks/useScrollReveal'
import { cn } from '../../utils/cn'

interface SectionHeaderProps {
  eyebrow: ReactNode
  title: string
  description?: string
  inverse?: boolean
}

export function SectionHeader({ eyebrow, title, description, inverse }: SectionHeaderProps) {
  return (
    <motion.div
      className="mx-auto max-w-[1312px] text-center"
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={revealUp}
    >
      <span
        className={cn(
          'inline-flex min-h-[38px] items-center gap-3 rounded-full border px-4 text-sm font-semibold leading-5',
          inverse
            ? 'border-white/15 bg-white/10 text-white'
            : 'border-[rgba(13,27,42,0.1)] bg-[rgba(13,27,42,0.05)] text-[#333] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          'mt-8 font-display text-[32px] font-bold leading-[1.12] tracking-[0] md:mt-[30px] md:text-[48px] md:leading-[48px]',
          inverse ? 'text-white' : 'text-navy-primary',
        )}
      >
        {title}
      </h2>
      {description && (
        <p className={cn('mx-auto mt-5 max-w-[660px] text-base leading-7', inverse ? 'text-white/70' : 'text-[#333]')}>
          {description}
        </p>
      )}
    </motion.div>
  )
}
