import { WandSparkles } from 'lucide-react'
import { Container } from '../layout/Container'

export function CounselCreditsSection() {
  return (
    <section className="bg-white py-10 lg:py-14">
      <Container>
        <div className="rounded-3xl bg-[#F0EBE3] px-10 py-12 lg:px-14 lg:py-14">

          {/* Heading */}
          <div className="flex items-center gap-3 mb-8">
            <WandSparkles size={24} className="text-gold shrink-0" />
            <h2 className="text-xl font-bold text-[#0D1B2A] font-display">
              About Counsel Credits
            </h2>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-6 max-w-4xl">
            {/* Block 1 */}
            <div className="flex flex-col gap-2">
              <p className="text-base font-bold text-[#0D1B2A]">
                Counsel is available in all tiers.
              </p>
              <p className="text-base font-normal text-[#333333] leading-relaxed">
                Request inside the wizard. The vetted lawyer works in the same negotiation room.
                Credits reset monthly. There is no rollover. A credit is used on submission.
              </p>
            </div>

            {/* Block 2 */}
            <div className="flex flex-col gap-2">
              <p className="text-base font-bold text-[#0D1B2A]">
                Time and scope:
              </p>
              <p className="text-base font-normal text-[#333333] leading-relaxed">
                Up to 30 minutes asynchronous work on a single document state. Up to 10 pages or
                1,500 words. Up to 5 clauses changed. One counterparty round considered.
              </p>
            </div>

            {/* Block 3 */}
            <div className="flex flex-col gap-2">
              <p className="text-base font-bold text-[#0D1B2A]">
                Deliverable:
              </p>
              <p className="text-base font-normal text-[#333333] leading-relaxed">
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
