import { Quote } from 'lucide-react'
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
    <div className="flex gap-1" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="#D4A437"
          className="h-5 w-5"
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
    <section className="bg-[#0D1B2A] py-20 lg:py-28">
      <Container>
        <SectionHeader
          eyebrow="Trusted by SA Entrepreneurs"
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
              className="flex flex-col rounded-2xl bg-[#1A2B3C] p-8"
            >
              {/* Quote icon */}
              <span className="grid h-11 w-11 place-items-center rounded-full bg-[#D4A437]">
                <Quote size={20} fill="#fff" className="text-white" strokeWidth={0} />
              </span>

              {/* Stars */}
              <div className="mt-5">
                <StarRating count={review.stars} />
              </div>

              {/* Quote text */}
              <p className="mt-5 flex-1 text-[15px] italic leading-[1.65] text-white/85">
                "{review.quote}"
              </p>

              {/* Divider */}
              <hr className="my-6 border-white/10" />

              {/* Author */}
              <div className="flex items-center gap-3">
                <span className="text-3xl leading-none" aria-hidden="true">
                  {review.avatar}
                </span>
                <div>
                  <p className="text-[15px] font-bold text-white">{review.name}</p>
                  <p className="text-[13px] text-white/55">{review.role}</p>
                  <p className="text-[13px] text-[#D4A437]">{review.company}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </Container>
    </section>
  )
}
