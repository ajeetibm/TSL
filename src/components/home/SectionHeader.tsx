import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { revealUp, defaultViewport } from '../../hooks/useScrollReveal'
import { cn } from '../../utils/cn'

interface SectionHeaderProps {
  eyebrow?: ReactNode
  title: string
  description?: string
  inverse?: boolean
  titleStyle?: React.CSSProperties
}

export function SectionHeader({ eyebrow, title, description, inverse, titleStyle }: SectionHeaderProps) {
  return (
    <motion.div
      className="mx-auto max-w-[1312px] text-center"
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={revealUp}
    >
      {eyebrow != null && (
        <span
          className={cn(
            'inline-flex min-h-[38px] items-center gap-3 rounded-full border px-8 text-sm font-semibold leading-5',
            inverse
              ? 'border-white/15 bg-white/10 text-white'
              : 'border-[rgba(13,27,42,0.1)] bg-[rgba(13,27,42,0.05)] text-[#333] shadow-[0_1px_2px_rgba(0,0,0,0.04)]',
          )}
        >
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          'mx-auto max-w-[1190px] font-bold tracking-[0]',
          eyebrow != null ? 'mt-8 md:mt-[30px]' : 'mt-0',
          inverse ? 'text-white' : 'text-[#101828]',
        )}
        style={{ fontFamily: 'Montserrat, sans-serif', fontSize: '48px', lineHeight: '48px', ...titleStyle }}
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
