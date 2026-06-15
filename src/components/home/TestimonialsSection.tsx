import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { testimonials } from '../../data/testimonials'
import { Container } from '../layout/Container'
import { SectionHeader } from './SectionHeader'

export function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = testimonials[activeIndex]

  const showPrevious = () => {
    setActiveIndex((index) => (index === 0 ? testimonials.length - 1 : index - 1))
  }

  const showNext = () => {
    setActiveIndex((index) => (index === testimonials.length - 1 ? 0 : index + 1))
  }

  return (
    <section className="bg-navy-primary py-20 text-white lg:py-28">
      <Container>
        <SectionHeader
          eyebrow="Client Stories"
          title="Founders trust TSL to make legal work feel clear"
          description="Real feedback from startup teams building with better legal foundations."
          inverse
        />

        <div className="mx-auto mt-14 max-w-4xl rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-premium backdrop-blur md:p-10">
          <AnimatePresence mode="wait">
            <motion.article
              key={active.name}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.35 }}
            >
              <Quote className="text-gold" size={42} />
              <p className="mt-8 text-xl font-semibold leading-9 text-white md:text-2xl">
                "{active.quote}"
              </p>
              <div className="mt-8">
                <h3 className="font-black">{active.name}</h3>
                <p className="mt-1 text-sm text-white/60">
                  {active.role}, {active.company}
                </p>
              </div>
            </motion.article>
          </AnimatePresence>

          <div className="mt-10 flex items-center justify-between">
            <div className="flex gap-2">
              {testimonials.map((item, index) => (
                <button
                  key={item.name}
                  type="button"
                  className={index === activeIndex ? 'h-2.5 w-8 rounded-full bg-gold' : 'h-2.5 w-2.5 rounded-full bg-white/30'}
                  aria-label={`Show testimonial ${index + 1}`}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={showPrevious} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 hover:bg-white/10" aria-label="Previous testimonial">
                <ChevronLeft size={20} />
              </button>
              <button type="button" onClick={showNext} className="grid h-11 w-11 place-items-center rounded-full border border-white/15 hover:bg-white/10" aria-label="Next testimonial">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
