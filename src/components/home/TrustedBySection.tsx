import { motion } from 'framer-motion'
import { revealUp, staggerContainer, defaultViewport } from '../../hooks/useScrollReveal'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

const reviews = [
  {
    stars: 5,
    quote:
      'The StartUp Legal saved us over R45,000 in legal fees during our first year. The CIPC integration is seamless.',
    avatar: '👨🏿‍💼',
    name: 'Thabo Molefe',
    role: 'Founder',
    company: 'PayFast Alternative',
  },
  {
    stars: 5,
    quote:
      'We went from waiting 2 weeks for document reviews to getting everything done in 48 hours.',
    avatar: '👩🏼‍💼',
    name: 'Sarah van der Merwe',
    role: 'CEO',
    company: 'Cape Commerce',
  },
  {
    stars: 5,
    quote:
      'Their understanding of BEE requirements made our funding round so much smoother.',
    avatar: '👩🏾‍💼',
    name: 'Lindiwe Khumalo',
    role: 'Co-founder',
    company: 'CloudServe SA',
  },
]

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-2" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="#FACC15"
          className="h-6 w-6"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.539-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.063 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  )
}

export function TrustedBySection() {
  return (
    <section className="bg-[#0D1B2A] pb-20 pt-10 lg:pb-28 lg:pt-14">
      <Container>
        <SectionHeader
          title="Trusted by SA Entrepreneurs"
          description="Hear from founders who've transformed their legal operations"
          inverse
        />

        <motion.div
          className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          variants={staggerContainer}
        >
          {reviews.map((review) => (
            <motion.article
              key={review.name}
              variants={revealUp}
              className="flex flex-col rounded-[36px] border border-[rgba(148,163,184,0.35)] bg-[#253342] p-8 shadow-[0_8px_32px_rgba(0,0,0,0.22)]"
            >
              {/* Quote icon */}
              <span
                className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-[#D4A02A] shadow-[0_4px_12px_rgba(0,0,0,0.30)]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[22px] w-[22px]"
                  aria-hidden="true"
                >
                  <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
                  <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z" />
                </svg>
              </span>

              {/* Stars */}
              <div className="mt-6">
                <StarRating count={review.stars} />
              </div>

              {/* Quote text */}
              <p className="mt-6 flex-1 text-[15px] font-light leading-[1.5] tracking-[0] text-[#E5E7EB]" style={{ fontStyle: 'italic' }}>
                "{review.quote}"
              </p>

              {/* Divider */}
              <hr className="my-8 border-[rgba(148,163,184,0.25)]" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <span className="text-4xl leading-none" aria-hidden="true">
                  {review.avatar}
                </span>
                <div>
                  <p className="text-[16px] font-bold text-white">{review.name}</p>
                  <p className="text-[14px] text-white/55">{review.role}</p>
                  <p className="text-[14px] text-[#A78BFA]">{review.company}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
