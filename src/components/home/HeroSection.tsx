import { ArrowRight, BookOpen, CircleCheck, FileText, Lightbulb, Scale, Shield, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { Container } from '../layout/Container'

const tags = [
  { label: 'Legal Templates', icon: FileText },
  { label: 'SME Consulting', icon: Users },
  { label: 'Legal Education', icon: BookOpen },
  { label: 'LegalTech Solutions', icon: Lightbulb },
]

export function HeroSection() {
  const openSignUp = () => {
    window.dispatchEvent(new CustomEvent('tsl-open-auth-modal', { detail: { mode: 'signup' } }))
  }

  return (
    <section className="relative isolate min-h-screen overflow-hidden bg-navy-primary pb-20 pt-28 text-white sm:pb-24 sm:pt-32 lg:pb-28 lg:pt-36" id="home">
      <div className="absolute -left-20 top-72 h-[26rem] w-[26rem] rounded-full bg-gold/15 blur-[64px]" />
      <div className="absolute right-[-6rem] top-[28rem] h-[27rem] w-[27rem] rounded-full bg-gold/10 blur-[64px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.045),transparent_34%)]" />

      <Container className="relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto inline-flex items-center gap-4 rounded-full bg-navy-secondary px-7 py-4 shadow-2xl shadow-black/20 ring-1 ring-white/5 backdrop-blur"
        >
          <div className="flex items-center">
            <span className="relative z-10 grid h-10 w-10 place-items-center rounded-full border-[3px] border-[#e2e8f0] bg-gold text-white">
              <Scale size={20} />
            </span>
            <span className="relative -ml-4 z-20 grid h-10 w-10 place-items-center rounded-full border-[3px] border-[#e2e8f0] bg-[#1E2939] text-white">
              <Shield size={20} />
            </span>
            <span className="relative -ml-4 z-30 grid h-10 w-10 place-items-center rounded-full border-[3px] border-[#e2e8f0] bg-gold text-white">
              <CircleCheck size={20} />
            </span>
          </div>
          <span className="text-left text-xs sm:text-sm">
            <strong className="block text-white">300+ SA SMEs Empowered</strong>
            <span className="text-white/65">Your legal partner, not just your lawyer</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.65 }}
          className="mx-auto mt-14 max-w-[750px] font-sans text-[60px] font-bold leading-[75px] tracking-[0px] text-center text-white"
        >
          Simplifying the Law for <span className="text-gold">South African SMEs</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.65 }}
          className="mx-auto mt-8 max-w-3xl text-base leading-8 text-white/75 sm:text-lg"
        >
          We turn legal language into plain language. Making quality legal services accessible,
          simplified, and affordable for entrepreneurs.
        </motion.p>

        <p
          className="mx-auto mt-8 max-w-[750px] text-center text-[16px] font-normal italic leading-[28px] tracking-[0px] text-[#C79A3BE6]"
          style={{ fontFamily: "Merriweather, Georgia, 'Times New Roman', serif" }}
        >
          Legal confidence starts here. Your business, your terms, your future.
        </p>

        <div className="mx-auto mt-16 flex max-w-4xl flex-wrap items-center justify-center gap-x-9 gap-y-4 text-sm text-white/70">
          {tags.map(({ label, icon: Icon }) => (
            <span key={label} className="inline-flex items-center gap-2">
              <Icon size={16} className="text-gold" />
              {label}
            </span>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={openSignUp}
            className="inline-flex min-h-13 min-w-[200px] items-center justify-center gap-3 rounded-full bg-gold px-8 font-sans font-semibold text-[14px] leading-[20px] tracking-[0px] text-center text-white shadow-premium transition hover:-translate-y-1 hover:bg-gold-light hover:text-white"
          >
            Get Started Today
            <ArrowRight size={18} />
          </button>
          <a
            href="#about"
            className="inline-flex h-[56px] w-[145.92px] items-center justify-center rounded-[24px] border-2 border-white/30 bg-white/10 px-8 font-sans font-semibold text-[14px] leading-[20px] text-white transition hover:-translate-y-1"
          >
            Learn More
          </a>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {['Clear & Approachable', 'Empowering Solutions', 'Affordable Pricing'].map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5 font-sans font-semibold text-[14px] leading-[20px] text-white">
              <span className="font-sans font-normal text-[16px] leading-none text-white">✓</span>
              {item}
            </span>
          ))}
        </div>
      </Container>
    </section>
  )
}
