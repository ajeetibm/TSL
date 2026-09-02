/**
 * playbookPdfBuilder.ts
 *
 * Generates multi-page PDF blobs for static playbook guides.
 * Uses raw PDF 1.4 syntax — no external dependency required.
 *
 * Each exported function returns a `string` object-URL so react-pdf
 * can load it directly via <Document file={url}>.
 * Call URL.revokeObjectURL() when the modal closes if memory is a concern.
 */

const PAGE_W = 595 // A4 width (pts)
const PAGE_H = 842 // A4 height (pts)

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

// ─── Branded playbook layout ────────────────────────────────────────────────

type BrandedSection = {
  title: string
  body: string[]
  callout?: string[]
}

const NAVY = '0.047 0.114 0.21'
const GOLD = '0.82 0.62 0.16'
const INK = '0.075 0.13 0.22'
const MUTED = '0.34 0.39 0.47'
const CREAM = '0.96 0.91 0.79'
const PLAYBOOK_INSET = 58
const PLAYBOOK_WIDTH = PAGE_W - PLAYBOOK_INSET * 2

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (next.length > maxChars && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/**
 * Produces the visual treatment used by the authored playbooks: a navy cover
 * panel, gold category treatment, generous content area, highlighted callouts
 * and a consistent TSL footer. It is intentionally separate from the compact
 * text-only builder above because static compliance playbooks are read as
 * documents rather than exported form data.
 */
function buildBrandedPlaybookPdf(
  title: string,
  meta: string,
  pages: BrandedSection[][],
): Blob {
  const pageCount = pages.length
  const fontRegObj = 3 + pageCount * 2
  const fontBoldObj = fontRegObj + 1
  const totalObjs = fontBoldObj
  const pageObjNums = Array.from({ length: pageCount }, (_, index) => 3 + index)
  const contentObjNums = Array.from({ length: pageCount }, (_, index) => 3 + pageCount + index)
  const objects: string[] = new Array(totalObjs + 1)

  const rect = (colour: string, x: number, y: number, width: number, height: number) =>
    `q ${colour} rg ${x} ${y} ${width} ${height} re f Q`
  const strokeRect = (colour: string, x: number, y: number, width: number, height: number) =>
    `q ${colour} RG 0.8 w ${x} ${y} ${width} ${height} re S Q`
  const text = (value: string, x: number, y: number, size: number, bold = false, colour = INK) =>
    `BT ${colour} rg ${bold ? '/F2' : '/F1'} ${size} Tf ${x} ${y} Td (${esc(value)}) Tj ET`

  objects[1] = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj'
  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((number) => `${number} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj`

  pages.forEach((sections, pageIndex) => {
    const ops: string[] = [rect('1 1 1', 0, 0, PAGE_W, PAGE_H)]
    let cursorY: number

    if (pageIndex === 0) {
      // Match the authored playbooks: the cover is an inset panel, not a
      // full-bleed band, leaving a consistent white page margin on both sides.
      ops.push(rect(NAVY, PLAYBOOK_INSET, 727, PLAYBOOK_WIDTH, 115))
      ops.push(text('PLAYBOOK  ·  COMPLIANCE', 80, 808, 10, true, GOLD))
      wrapText(title, 34).forEach((line, index) => {
        ops.push(text(line, 80, 770 - index * 28, 21, true, '1 1 1'))
      })
      ops.push(text(meta, 80, 742, 10, false, '0.77 0.82 0.9'))
      cursorY = 682
    } else {
      ops.push(rect(NAVY, PLAYBOOK_INSET, 766, PLAYBOOK_WIDTH, 76))
      ops.push(text(`THE STARTUP LEGAL  ·  ${title.toUpperCase()}`, 72, 798, 11, true, '1 1 1'))
      cursorY = 724
    }

    sections.forEach((section) => {
      ops.push(text(section.title.toUpperCase(), 72, cursorY, 12, true, INK))
      cursorY -= 19
      section.body.forEach((paragraph) => {
        wrapText(paragraph, 76).forEach((line) => {
          ops.push(text(line, 72, cursorY, 10, false, '0.16 0.23 0.34'))
          cursorY -= 15
        })
        cursorY -= 8
      })
      if (section.callout) {
        const calloutLines = section.callout.flatMap((line) => wrapText(line, 70))
        const height = Math.max(58, calloutLines.length * 15 + 24)
        const bottom = cursorY - height + 14
        ops.push(rect(CREAM, 72, bottom, 451, height))
        ops.push(strokeRect(GOLD, 72, bottom, 451, height))
        let calloutY = cursorY - 12
        calloutLines.forEach((line) => {
          ops.push(text(line, 92, calloutY, 10, false, INK))
          calloutY -= 15
        })
        cursorY = bottom - 30
      } else {
        cursorY -= 10
      }
    })

    ops.push(`0.88 0.89 0.91 RG 0.7 w ${PLAYBOOK_INSET} 42 m ${PAGE_W - PLAYBOOK_INSET} 42 l S`)
    ops.push(text('© The StartUp Legal (Pty) Ltd. All rights reserved.', 173, 24, 9, false, MUTED))
    const stream = ops.join('\n')
    const pageNumber = pageObjNums[pageIndex]
    const contentNumber = contentObjNums[pageIndex]
    objects[pageNumber] = `${pageNumber} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Contents ${contentNumber} 0 R /Resources << /Font << /F1 ${fontRegObj} 0 R /F2 ${fontBoldObj} 0 R >> >> >>\nendobj`
    objects[contentNumber] = `${contentNumber} 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj`
  })

  objects[fontRegObj] = `${fontRegObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj`
  objects[fontBoldObj] = `${fontBoldObj} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj`

  const header = '%PDF-1.4\n'
  const offsets: number[] = []
  const body: string[] = []
  let position = header.length
  for (let index = 1; index <= totalObjs; index++) {
    offsets.push(position)
    const object = `${objects[index]}\n`
    body.push(object)
    position += object.length
  }
  const xref = ['xref', `0 ${totalObjs + 1}`, '0000000000 65535 f ', ...offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n `)].join('\n')
  const trailer = `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${position}\n%%EOF`
  return new Blob([header, ...body, xref, '\n', trailer], { type: 'application/pdf' })
}

// ─── POPIA Compliance Essentials ─────────────────────────────────────────────

export function buildPopiaEssentialsPdf(): string {
  const pdf = buildBrandedPlaybookPdf(
    'POPIA Compliance Essentials',
    '6 steps  ·  12 min read  ·  Available from the Launchpad plan',
    [
      [
        {
          title: 'What is POPIA?',
          body: [
            'The Protection of Personal Information Act (POPIA) is South Africa\'s primary data privacy law. It regulates how organisations collect, store, use, and share personal information of natural and juristic persons.',
            'POPIA came into full effect on 1 July 2021. Non-compliance can result in fines of up to R10 million and/or imprisonment of up to 10 years.',
          ],
          callout: [
            'WHY IT MATTERS',
            'Every business that processes personal information must establish accountable, transparent and secure data practices.',
          ],
        },
        {
          title: 'The 8 conditions for lawful processing',
          body: [
            'Accountability; Processing Limitation; Purpose Specification; Further Processing Limitation; Information Quality; Openness; Security Safeguards; and Data Subject Participation.',
          ],
        },
      ],
      [
        {
          title: 'Your action checklist',
          body: [
            '1. Register your Information Officer with the Information Regulator.  2. Map the personal information you collect.  3. Publish a POPIA-compliant Privacy & Cookies Policy.  4. Obtain valid consent where required.',
            '5. Implement a Data Breach Response Plan.  6. Train staff on data handling.  7. Review data-processor agreements.  8. Set up a Data Subject Request channel.',
          ],
          callout: [
            'START HERE',
            'Your public privacy notice and an accountable Information Officer are the foundations of a compliant privacy programme.',
          ],
        },
        {
          title: 'Information Officer responsibilities',
          body: [
            'Register with the Regulator, maintain the PAIA Manual, handle access requests, report relevant breaches, and conduct regular privacy impact assessments.',
          ],
        },
      ],
      [
        {
          title: 'Key deadlines and penalties',
          body: [
            'Breach notification: as soon as reasonably possible after discovering a breach. Data-subject requests: respond within 30 days, subject to a permitted extension with notice. Administrative fines can reach R10 million, and serious offences may carry criminal penalties.',
          ],
          callout: [
            'PRACTICAL REMINDER',
            'Keep an incident log and a clear escalation route. A prompt, documented response is essential when a privacy incident occurs.',
          ],
        },
        {
          title: 'Recommended blueprints',
          body: [
            'Privacy & Cookies Policy - publish your POPIA-compliant notice. Data Processing Agreement - govern third-party processors. Non-Disclosure Agreement - protect confidential information shared externally.',
          ],
        },
        {
          title: 'Important',
          body: [
            'This playbook is educational guidance only and is not legal advice. Consult a qualified attorney for advice on your specific circumstances.',
          ],
        },
      ],
    ],
  )
  return URL.createObjectURL(pdf)
}

// ─── Website Legal Compliance ─────────────────────────────────────────────────

export function buildWebsiteLegalPdf(): string {
  const pdf = buildBrandedPlaybookPdf(
    'Website Legal Compliance',
    '5 steps  ·  10 min read  ·  Available from the Launchpad plan',
    [
      // Page 1
      [
        {
          title: 'Why website legal compliance matters',
          body: [
            'Operating a website or app in South Africa without the correct legal notices exposes your business to regulatory risk under POPIA, the ECT Act, and the Consumer Protection Act.',
            'This guide covers every document your site needs and explains what each one must contain.',
          ],
          callout: [
            'KEY RISK',
            'A missing or non-compliant Privacy Policy is the single most common POPIA enforcement trigger for online businesses.',
          ],
        },
        {
          title: 'Required documents checklist',
          body: [
            'Privacy & Cookies Policy — mandatory if you collect any personal data. Terms and Conditions — governs use of your website or app. Cookie Consent Banner — required before placing non-essential cookies. Disclaimer — for advice-giving, news, or informational sites. Returns & Refund Policy — mandatory under the CPA for e-commerce.',
          ],
        },
      ],
      // Page 2
      [
        {
          title: 'Privacy & Cookies Policy',
          body: [
            'Required if you collect any personal information — including name, email, IP address, cookie identifiers, or analytics data. Your policy must disclose what you collect and why, who you share it with, how long you retain it, and how users can access, correct or delete their data.',
          ],
          callout: [
            'POPIA REQUIREMENT',
            'The policy must be published in plain language and be easily accessible from every page of your website, typically in the footer.',
          ],
        },
        {
          title: 'Cookie consent requirements',
          body: [
            'Under POPIA you must obtain informed consent before placing non-essential cookies. Your banner must list cookie categories (strictly necessary, analytics, marketing), allow accept or reject per category, record consent with a timestamp, and let users change preferences at any time.',
          ],
        },
        {
          title: 'Terms and Conditions',
          body: [
            'Protects your business by setting out acceptable use, IP ownership, limitation of liability, governing law (South Africa), and the dispute resolution process.',
          ],
        },
      ],
      // Page 3
      [
        {
          title: 'ECT Act obligations',
          body: [
            'The Electronic Communications and Transactions Act requires online sellers to prominently display: full legal name and registration number, physical address and contact details, pricing inclusive of VAT, delivery terms, and a 7-day cooling-off period for distance sales.',
          ],
          callout: [
            'E-COMMERCE NOTE',
            'Failure to display ECT Act information can render your online sale voidable at the consumer\'s election.',
          ],
        },
        {
          title: 'Recommended blueprints',
          body: [
            'Privacy & Cookies Policy — POPIA-compliant notice for your website. Service Agreement — governs your online service delivery terms. Non-Disclosure Agreement — protects confidential information shared with partners or suppliers.',
          ],
        },
        {
          title: 'Important',
          body: [
            'This playbook is educational guidance only and is not legal advice. Consult a qualified attorney for advice specific to your business and website.',
          ],
        },
      ],
    ],
  )
  return URL.createObjectURL(pdf)
}

// ─── BBBEE Verification Guide ─────────────────────────────────────────────────

export function buildBbbeeVerificationPdf(): string {
  const pdf = buildBrandedPlaybookPdf(
    'BBBEE Verification Guide',
    '8 steps  ·  15 min read  ·  Available from the Launchpad plan',
    [
      // Page 1
      [
        {
          title: 'What is B-BBEE?',
          body: [
            'Broad-Based Black Economic Empowerment (B-BBEE) is a South African government policy designed to increase the economic participation of black people. It is governed by the B-BBEE Act (Act 53 of 2003) and the Codes of Good Practice.',
            'Your B-BBEE level affects your ability to win government tenders, be listed as a preferred supplier, and access certain public-sector contracts.',
          ],
          callout: [
            'WHY IT MATTERS',
            'Many corporates and all government departments require a valid B-BBEE certificate before awarding contracts or preferred-supplier status.',
          ],
        },
        {
          title: 'The 5 B-BBEE scorecard elements',
          body: [
            'Ownership (25 pts) — black shareholding and economic interest. Management Control (19 pts) — black representation in board and senior management. Skills Development (20 pts) — training spend on black employees. Enterprise & Supplier Development (40 pts) — supporting black-owned businesses. Socio-Economic Development (5 pts) — community contributions.',
          ],
        },
      ],
      // Page 2
      [
        {
          title: 'B-BBEE levels and procurement recognition',
          body: [
            'Level 1: 135%+ recognition (100+ pts). Level 2: 125% (95-99 pts). Level 3: 110% (90-94 pts). Level 4: 100% (80-89 pts). Level 5: 80% (75-79 pts). Level 6: 60% (70-74 pts). Level 7: 50% (55-69 pts). Level 8: 10% (40-54 pts). Non-compliant: 0% (below 40 pts).',
          ],
          callout: [
            'QUICK WIN',
            'Even a Level 4 rating provides 100% procurement recognition — a significant advantage when bidding for public-sector or large corporate contracts.',
          ],
        },
        {
          title: 'Exempted Micro Enterprises (EMEs)',
          body: [
            'Businesses with annual turnover up to R10 million are EMEs. They are automatically Level 4 with no formal verification required. If 51% or more black-owned, they qualify as Level 1; if 30% or more black women-owned, as Level 2. Only a sworn affidavit is needed — not a formal certificate.',
          ],
        },
        {
          title: 'Qualifying Small Enterprises (QSEs)',
          body: [
            'Businesses with turnover between R10 million and R50 million are QSEs. They measure only 4 of the 5 scorecard elements and need formal verification by a SANAS-accredited agency. Black-owned QSEs can still claim automatic Level 1 or 2 status via affidavit.',
          ],
        },
      ],
      // Page 3
      [
        {
          title: 'Verification process (step by step)',
          body: [
            '1. Determine your entity size — EME, QSE, or Generic. 2. Gather supporting documents (shareholding register, payroll, audited financials). 3. Engage a SANAS-accredited B-BBEE verification agency. 4. Submit documentation for desktop or on-site review. 5. Respond to any queries from the verifier. 6. Receive your B-BBEE Verification Certificate. 7. Upload the certificate to supplier portals. 8. Diarise the renewal date — certificates are valid for 12 months.',
          ],
          callout: [
            'DOCUMENTS YOU WILL NEED',
            'Audited financials, MOI or trust deed, share register, payroll records, employment equity report, skills spend invoices, and ESD supplier invoices.',
          ],
        },
        {
          title: 'Common mistakes to avoid',
          body: [
            'Using an expired certificate. Failing to include all subsidiaries in a group measurement. Claiming skills development spend without supporting invoices or attendance records. Not updating the certificate after a major ownership change.',
          ],
        },
        {
          title: 'Important',
          body: [
            'This playbook is educational guidance only and is not legal advice. Consult a qualified attorney or accredited B-BBEE consultant for advice specific to your situation.',
          ],
        },
      ],
    ],
  )
  return URL.createObjectURL(pdf)
}

// ─── Pre-Seed Fundraising Preparation ────────────────────────────────────────

export function buildPreSeedFundraisingPdf(): string {
  const pdf = buildBrandedPlaybookPdf(
    'Pre-Seed Fundraising Preparation',
    '7 steps  ·  14 min read  ·  Available from the Launchpad plan',
    [
      // Page 1
      [
        {
          title: 'What is pre-seed fundraising?',
          body: [
            'Pre-seed is the earliest formal funding round — typically R500k to R5 million — raised from founders, friends and family, angel investors, or early-stage accelerators before a product has significant traction.',
            'Getting the legal and corporate structure right before you raise protects founders, attracts investors, and prevents expensive restructuring later.',
          ],
          callout: [
            'FOUNDER TIP',
            'Investors at pre-seed back the team as much as the idea. A clean cap table and properly signed founder agreements signal professionalism and reduce perceived risk.',
          ],
        },
        {
          title: 'Step 1 — Incorporate the right entity',
          body: [
            'Register a private company (Pty) Ltd with the CIPC. Ensure shares are properly issued, the MOI is investor-friendly, and all IP created before incorporation is formally assigned to the company.',
          ],
        },
        {
          title: 'Step 2 — Sign a founder agreement',
          body: [
            'A founder agreement sets out equity splits, vesting schedules (typically 4 years with a 1-year cliff), roles, decision-making rights, and what happens when a founder leaves. Do this before external money enters.',
          ],
        },
      ],
      // Page 2
      [
        {
          title: 'Step 3 — Protect your IP',
          body: [
            'Ensure all intellectual property — code, designs, brand, processes — is owned by the company and not by individual founders or contractors. Have all contributors sign IP assignment agreements.',
          ],
          callout: [
            'INVESTOR RED FLAG',
            'Unassigned IP is one of the most common deal-breakers in early-stage due diligence. Sort this out before you start investor conversations.',
          ],
        },
        {
          title: 'Step 4 — Clean up your cap table',
          body: [
            'Maintain an accurate shareholder register and cap table from day one. Avoid informal share promises. Every equity grant should be documented in a shareholder agreement or board resolution.',
          ],
        },
        {
          title: 'Step 5 — Prepare your data room',
          body: [
            'Create a secure folder with: company registration documents, MOI, founder agreement, share register, IP assignments, key contracts, financial statements or projections, and a brief company overview.',
          ],
        },
      ],
      // Page 3
      [
        {
          title: 'Step 6 — Use NDAs for investor conversations',
          body: [
            'Before sharing financials, pitch decks, or proprietary information with potential investors, have them sign a Non-Disclosure Agreement. Most institutional investors will not sign NDAs, but angels and early-stage partners often will.',
          ],
          callout: [
            'PRACTICAL NOTE',
            'Even where an NDA is declined, sharing a dated copy of your pitch deck creates a paper trail that establishes prior disclosure of your idea.',
          ],
        },
        {
          title: 'Step 7 — Understand your funding instruments',
          body: [
            'Pre-seed deals are commonly structured as: SAFE (Simple Agreement for Future Equity) — converts to equity at a future round with a valuation cap or discount. Convertible note — a loan that converts to equity, with interest and a maturity date. Priced equity round — immediate share issuance at an agreed valuation.',
          ],
        },
        {
          title: 'Recommended blueprints',
          body: [
            'Founder Agreement — equity, vesting and governance. Non-Disclosure Agreement — protect confidential information. Shareholder Resolutions — document key board and shareholder decisions.',
          ],
        },
        {
          title: 'Important',
          body: [
            'This playbook is educational guidance only and is not legal advice. Consult a qualified attorney before entering into any investment agreement.',
          ],
        },
      ],
    ],
  )
  return URL.createObjectURL(pdf)
}

// ─── Understanding Term Sheets ────────────────────────────────────────────────

export function buildTermSheetsPdf(): string {
  const pdf = buildBrandedPlaybookPdf(
    'Understanding Term Sheets',
    '6 steps  ·  12 min read  ·  Available from the Launchpad plan',
    [
      // Page 1
      [
        {
          title: 'What is a term sheet?',
          body: [
            'A term sheet is a non-binding document that sets out the key commercial terms of an investment before the parties commit to drafting full legal agreements. It aligns expectations early and reduces the cost of negotiation.',
            'Term sheets are typically non-binding except for confidentiality and exclusivity clauses, which are legally enforceable.',
          ],
          callout: [
            'KEY PRINCIPLE',
            'A term sheet is not a binding agreement — but the commercial terms you agree to here will flow directly into the shareholders\' agreement and investment contract.',
          ],
        },
        {
          title: 'Valuation terms',
          body: [
            'Pre-money valuation — the company value before the investment is added. Post-money valuation — pre-money valuation plus the investment amount. These determine what percentage of the company the investor receives.',
          ],
        },
        {
          title: 'Equity and ownership',
          body: [
            'The term sheet will specify the number and class of shares to be issued, the price per share, and the resulting ownership percentage. Understand the fully-diluted cap table — this includes option pools which dilute founder ownership.',
          ],
        },
      ],
      // Page 2
      [
        {
          title: 'Liquidation preferences',
          body: [
            'A liquidation preference determines who gets paid first — and how much — in an exit or wind-up. A 1x non-participating preference means investors recover their investment before founders share proceeds. Participating preferences allow investors to recover their investment AND share in remaining proceeds.',
          ],
          callout: [
            'WATCH OUT FOR',
            'A 2x or higher liquidation preference significantly reduces founder returns in a modest exit. Try to negotiate a 1x non-participating preference.',
          ],
        },
        {
          title: 'Anti-dilution protection',
          body: [
            'Anti-dilution clauses protect investors if future rounds are priced lower (a "down round"). Broad-based weighted average is founder-friendly. Full ratchet is very investor-friendly and can severely dilute founders in a down round.',
          ],
        },
        {
          title: 'Board composition',
          body: [
            'The term sheet will specify the board structure — typically founder seats, investor seats, and an independent director. Founders should maintain board control at pre-seed. Watch for provisions requiring investor consent for key decisions.',
          ],
        },
      ],
      // Page 3
      [
        {
          title: 'Pro-rata rights and information rights',
          body: [
            'Pro-rata rights give investors the right to participate in future rounds to maintain their ownership percentage. Information rights require the company to provide regular financial updates, management accounts, and board minutes.',
          ],
          callout: [
            'NEGOTIATION TIP',
            'Information rights are standard and reasonable. Agree to them — they build investor confidence and are a sign of good governance.',
          ],
        },
        {
          title: 'Vesting and founder lock-in',
          body: [
            'Investors often require founders to be subject to vesting or reverse vesting to ensure continued commitment. Standard terms: 4-year vesting, 1-year cliff, monthly thereafter. If a founder leaves, unvested shares are bought back at cost.',
          ],
        },
        {
          title: 'Exclusivity and confidentiality',
          body: [
            'The exclusivity clause (no-shop) prevents founders from negotiating with other investors for a fixed period — typically 30 to 60 days. The confidentiality clause requires both parties to keep the terms private.',
          ],
        },
        {
          title: 'Important',
          body: [
            'This playbook is educational guidance only and is not legal advice. Have a qualified corporate attorney review any term sheet before you sign it.',
          ],
        },
      ],
    ],
  )
  return URL.createObjectURL(pdf)
}

// ─── Due Diligence Readiness ──────────────────────────────────────────────────

export function buildDueDiligenceReadinessPdf(): string {
  const pdf = buildBrandedPlaybookPdf(
    'Due Diligence Readiness',
    '8 steps  ·  16 min read  ·  Available from the Launchpad plan',
    [
      // Page 1
      [
        {
          title: 'What is due diligence?',
          body: [
            'Due diligence (DD) is the process by which an investor, acquirer, or partner independently verifies the claims made by a company before committing capital or completing a transaction.',
            'Being DD-ready means having organised, accurate, and complete documentation available in a secure data room before an investor asks for it.',
          ],
          callout: [
            'WHY IT MATTERS',
            'Disorganised or incomplete due diligence is one of the most common reasons deals slow down or fall apart. A well-prepared data room signals professionalism and accelerates closing.',
          ],
        },
        {
          title: 'Step 1 — Corporate and legal documents',
          body: [
            'Certificate of Incorporation and CIPC confirmation. Memorandum of Incorporation (MOI). Share register and cap table (fully diluted). All shareholder agreements and amendments. Board and shareholder resolutions.',
          ],
        },
        {
          title: 'Step 2 — Founder and team documents',
          body: [
            'Signed founder agreements with vesting schedules. Employment contracts for all key employees. Contractor or consultant agreements. Any restraint of trade or non-compete agreements. IP assignment agreements for all contributors.',
          ],
        },
      ],
      // Page 2
      [
        {
          title: 'Step 3 — Intellectual property',
          body: [
            'IP assignment agreements for all founders and developers. Trademark registrations or pending applications. Software licences used in the product (check open-source obligations). Any third-party IP licences or white-label agreements.',
          ],
          callout: [
            'CRITICAL CHECK',
            'Confirm that all code, designs, and product IP were created by employees or contractors who signed IP assignments. Unassigned IP will stop a deal.',
          ],
        },
        {
          title: 'Step 4 — Commercial contracts',
          body: [
            'Customer contracts and MSAs. Supplier and vendor agreements. Partnership and distribution agreements. Any material contracts over R100k or with significant obligations. Letters of intent or MOUs with key customers or partners.',
          ],
        },
        {
          title: 'Step 5 — Financial records',
          body: [
            'Audited or management financial statements for the past 2-3 years. Most recent management accounts. Cash flow projections and financial model. VAT registration and tax clearance certificate. SARS correspondence and tax returns.',
          ],
        },
      ],
      // Page 3
      [
        {
          title: 'Step 6 — Regulatory and compliance',
          body: [
            'CIPC annual returns (up to date). B-BBEE certificate or affidavit. POPIA compliance documentation — privacy notice, information officer registration. Any industry-specific licences or permits.',
          ],
          callout: [
            'COMPLIANCE NOTE',
            'Investors in regulated industries (fintech, health, education) will scrutinise licences and regulatory compliance very carefully. Have these documents ready before the first meeting.',
          ],
        },
        {
          title: 'Step 7 — Litigation and disputes',
          body: [
            'Disclose all current, pending, or threatened litigation. Include any regulatory investigations, CCMA disputes, or IP infringement claims. Investors need to understand contingent liabilities.',
          ],
        },
        {
          title: 'Step 8 — Data room best practices',
          body: [
            'Organise documents into clearly labelled folders. Use version-controlled files with dates. Redact personal information not relevant to the investor. Track who accesses the data room. Update documents as circumstances change.',
          ],
        },
        {
          title: 'Important',
          body: [
            'This playbook is educational guidance only and is not legal advice. Consult a qualified attorney before sharing sensitive documents with potential investors.',
          ],
        },
      ],
    ],
  )
  return URL.createObjectURL(pdf)
}
