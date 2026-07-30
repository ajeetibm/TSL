import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'

type FAQItem = { question: string; answer: string; category: string }

const faqs: FAQItem[] = [
  {
    category: 'General',
    question: 'What Is The Startup Legal?',
    answer:
      'The Startup Legal is a South African legal services platform that specializes in helping new business owners with company registration, CIPC compliance, due diligence, director updates, and other essential legal services. We combine technology with legal expertise to make business compliance simple and affordable.',
  },
  {
    category: 'General',
    question: 'Who should use The Startup Legal?',
    answer:
      'The Startup Legal is designed for founders, entrepreneurs, and SMEs in South Africa who need reliable legal support without the overhead of a traditional law firm. Whether you are registering a new company, updating your compliance documents, or managing contracts, our platform is built for you.',
  },
  {
    category: 'General',
    question: 'Is my business data secure?',
    answer:
      'Yes. All data is stored with deterministic PDFs, cryptographic hashes, and QR verification so any third party can verify document authenticity at any time. We follow strict data-security practices and comply fully with POPIA.',
  },
  {
    category: 'General',
    question: 'What makes TSL different from traditional law firms?',
    answer:
      'TSL combines technology with vetted legal expertise to deliver faster, more affordable outcomes. Instead of hourly billing and email chains, you get guided wizards, automated document generation, transparent pricing, and a full audit trail — all in one platform.',
  },
  {
    category: 'General',
    question: 'Do you provide support in multiple languages?',
    answer:
      'Our platform is currently available in English. We are actively working to support additional South African languages. If you need assistance in another language, please contact our support team and we will do our best to help.',
  },
  {
    category: 'Features',
    question: 'What features does TSL offer?',
    answer:
      'TSL offers company registration, CIPC compliance management, due diligence reports, director updates, contract generation, guided legal wizards, and a secure document vault — all accessible from a single dashboard.',
  },
  {
    category: 'Counsel',
    question: 'Can I speak to a real lawyer?',
    answer:
      'Yes. Our Counsel feature connects you with vetted South African attorneys for on-demand legal advice, document review, and representation — all within the platform.',
  },
  {
    category: 'Playbooks',
    question: 'What are Playbooks?',
    answer:
      'Playbooks are step-by-step legal guides built for common startup scenarios such as raising funding, hiring employees, or entering contracts. They walk you through each legal requirement so nothing gets missed.',
  },
  {
    category: 'Pricing',
    question: 'How is TSL priced?',
    answer:
      'TSL offers transparent, fixed-fee pricing with no hidden costs. You only pay for the services you use. We have monthly plans for ongoing compliance as well as one-off fees for individual documents and registrations.',
  },
  {
    category: 'Technical Support',
    question: 'What if I run into a technical issue?',
    answer:
      'Our support team is available via live chat and email during business hours. For urgent technical matters you can also call us directly. We typically respond within 2–4 hours.',
  },
]

const categories = ['General', 'Features', 'Counsel', 'Playbooks', 'Pricing', 'Technical Support']

function AccordionItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(index === 0)

  return (
    <motion.div
      variants={revealUp}
      className="rounded-[28px] border-2 border-[#E5E7EB] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
    >
      <button
        type="button"
        className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={`faq-answer-${index}`}
      >
        <span className="font-sans text-[15px] font-semibold leading-snug text-[#0D1B2A]">
          {item.question}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex shrink-0 text-[#9CA3AF]"
        >
          <ChevronDown size={18} strokeWidth={1.75} />
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
            <hr className="border-[#E5E7EB]" />
            <p className="px-7 pb-4 pt-3 font-sans text-[12px] leading-[1.7] text-[#333333]">
              {item.answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function FAQSection() {
  const [activeCategory, setActiveCategory] = useState('General')

  const filtered = faqs.filter((f) => f.category === activeCategory)

  return (
    <section className="bg-white py-20 lg:py-28">
      <Container>
        {/* Heading */}
        <motion.div
          className="mx-auto max-w-[760px] text-center"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={revealUp}
        >
          <h2 className="font-display text-[40px] font-bold leading-[1.15] tracking-[-0.02em] text-[#0D1B2A] md:text-[36px]">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto mt-4 max-w-[560px] text-[16px] leading-[1.6] text-[#6B7280]">
            Everything you need to know about The StartUp Legal and our services
          </p>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={revealUp}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={
                cat === activeCategory
                  ? 'rounded-full bg-[#C9982A] px-5 py-2 text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(201,152,42,0.40)] transition-all'
                  : 'rounded-full px-5 py-2 text-[14px] font-medium text-[#374151] transition-all hover:bg-[#F3F4F6]'
              }
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Divider below tabs */}
        <hr className="mx-auto mt-6 max-w-[900px] border-[#E5E7EB]" />

        {/* Accordion list */}
        <motion.div
          className="mx-auto mt-8 flex max-w-[900px] flex-col gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
          key={activeCategory}
        >
          {filtered.map((item, i) => (
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
          <h3 className="font-display text-[20px] font-bold tracking-[-0.01em] text-[#0D1B2A]">Still have questions?</h3>
          <p className="mt-3 text-[14px] leading-relaxed text-[#5F6368]">
            Our team is here to help you get started with confidence
          </p>
          <a
            href="/contact"
            className="mt-8 inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#C9982A] px-10 font-sans text-[14px] font-semibold tracking-wide text-white shadow-[0_6px_22px_rgba(201,152,42,0.45)] transition-all duration-200 hover:bg-[#b8881f] hover:-translate-y-[2px] hover:shadow-[0_10px_28px_rgba(201,152,42,0.55)] active:translate-y-0 active:shadow-[0_4px_14px_rgba(201,152,42,0.40)]"
          >
            Contact Support
          </a>
        </motion.div>
      </Container>
    </section>
  )
}
