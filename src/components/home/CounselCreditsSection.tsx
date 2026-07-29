import { Sparkles } from 'lucide-react'
import { Container } from '../layout/Container'

export function CounselCreditsSection() {
  return (
    <section className="bg-white pt-10 pb-10 lg:pt-12 lg:pb-14">
      <Container>
        <div className="rounded-3xl bg-[#F0EDE8] px-10 py-12 lg:px-14 lg:py-14">

          {/* Heading */}
          <div className="flex items-center gap-3 mb-6">
            <Sparkles size={20} className="text-gold shrink-0" strokeWidth={2} />
            <h2 className="font-display text-[18px] font-bold leading-snug tracking-[0] text-[#0D1B2A]">
              About Counsel Credits
            </h2>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-5 max-w-4xl">
            {/* Block 1 */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[14px] font-bold leading-[1.5] text-[#0D1B2A]">
                Counsel is available in all tiers.
              </p>
              <p className="text-[14px] font-normal leading-[1.6] text-[#333333]">
                Request inside the wizard. The vetted lawyer works in the same negotiation room.
                Credits reset monthly. There is no rollover. A credit is used on submission.
              </p>
            </div>

            {/* Block 2 */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[14px] font-bold leading-[1.5] text-[#0D1B2A]">
                Time and scope:
              </p>
              <p className="text-[14px] font-normal leading-[1.6] text-[#333333]">
                Up to 30 minutes asynchronous work on a single document state. Up to 10 pages or
                1,500 words. Up to 5 clauses changed. One counterparty round considered.
              </p>
            </div>

            {/* Block 3 */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[14px] font-bold leading-[1.5] text-[#0D1B2A]">
                Deliverable:
              </p>
              <p className="text-[14px] font-normal leading-[1.6] text-[#333333]">
                Tracked edits or a short note with recommendations. Up to 3 approved clause
                alternatives where relevant.
              </p>
            </div>
          </div>

        </div>

        {/* Footer note */}
        <p className="mt-8 text-sm font-normal text-center text-[rgba(51,51,51,0.7)]">
          Note: CIPC filing fees and third-party costs are additional where applicable. All
          documents are legally compliant with South African law.
        </p>
      </Container>
    </section>
  )
}
