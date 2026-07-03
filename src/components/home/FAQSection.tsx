import { useState } from 'react'
import { CircleHelp, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

type FAQItem = { question: string; answer: string }

const faqs: FAQItem[] = [
  {
    question: 'What Is The Startup Legal?',
    answer:
      'The Startup Legal is a South African legal services platform that specializes in helping new business owners with company registration, CIPC compliance, due diligence, director updates, and other essential legal services. We combine technology with legal expertise to make business compliance simple and affordable.',
  },
  {
    question: 'Who should use The Startup Legal?',
    answer:
      'The Startup Legal is designed for founders, entrepreneurs, and SMEs in South Africa who need reliable legal support without the overhead of a traditional law firm. Whether you are registering a new company, updating your compliance documents, or managing contracts, our platform is built for you.',
  },
  {
    question: 'Is my business data secure?',
    answer:
      'Yes. All data is stored with deterministic PDFs, cryptographic hashes, and QR verification so any third party can verify document authenticity at any time. We follow strict data-security practices and comply fully with POPIA.',
  },
  {
    question: 'What makes TSL different from traditional law firms?',
    answer:
      'TSL combines technology with vetted legal expertise to deliver faster, more affordable outcomes. Instead of hourly billing and email chains, you get guided wizards, automated document generation, transparent pricing, and a full audit trail — all in one platform.',
  },
  {
    question: 'Do you provide support in multiple languages?',
    answer:
      'Our platform is currently available in English. We are actively working to support additional South African languages. If you need assistance in another language, please contact our support team and we will do our best to help.',
  },
]

function AccordionItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <motion.div
      variants={revealUp}
      className="rounded-[28px] border border-[rgba(13,27,42,0.1)] bg-white px-7 py-6 shadow-[0_1px_4px_rgba(13,27,42,0.06)]"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-6 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="text-[16px] font-semibold leading-snug text-[#0D1B2A]">
          {item.question}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex flex-shrink-0 text-[#0D1B2A]"
        >
          <ChevronDown size={20} strokeWidth={2} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`faq-answer-${index}`}
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-[15px] leading-[1.7] text-[#5F6368]">{item.answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQSection() {
  return (
    <section className="bg-white py-20 lg:py-28">
      <Container>
        <SectionHeader
          eyebrow={
            <>
              <CircleHelp size={16} className="text-[#D4A437]" strokeWidth={2.2} />
              Got Questions?
            </>
          }
          title="Frequently Asked Questions"
          description="Everything you need to know about The StartUp Legal and our services"
        />

        <motion.div
          className="mx-auto mt-12 flex max-w-3xl flex-col gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {faqs.map((item, i) => (
            <AccordionItem key={item.question} item={item} index={i} />
          ))}
        </motion.div>

        {/* Still have questions CTA */}
        <motion.div
          className="mx-auto mt-16 max-w-xl text-center"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={revealUp}
        >
          <h3 className="text-[22px] font-bold text-[#0D1B2A]">Still have questions?</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-[#5F6368]">
            Our team is here to help you get started with confidence
          </p>
          <a
            href="/contact"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#C9982A] px-10 text-[15px] font-semibold text-white shadow-[0_4px_16px_rgba(201,152,42,0.35)] transition hover:bg-[#b8881f] hover:scale-[1.02]"
          >
            Contact Support
          </a>
        </motion.div>
      </Container>
    </section>
  )
}
