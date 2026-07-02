# Pricing Section Sticky Scroll Plan

## Top-Level Overview

When the homepage is scrolled and the Pricing Section enters the viewport, the **entire section** (section header + pricing cards) should become sticky at the top of the screen. The feature comparison table — starting from "Company Registration" all the way through to the CTA footer — should scroll inside a fixed-height scrollable container within the section, allowing the user to scroll through the comparison rows without the pricing cards or section header leaving the screen.

**Scope:** Only `src/components/home/PricingSection.tsx` needs to change.
**Non-goal:** No changes to other sections, layout files, global styles, or scroll settings.

---

## Sub-Tasks

---

### Sub-Task 1 — Make the Pricing Section sticky on scroll

**Intent:**
Apply `position: sticky` with `top: 0` (accounting for the fixed navbar height) to the outer `<section>` element of `PricingSection`. This causes the entire section — header and pricing cards — to pin to the top of the viewport once the user scrolls into it.

**Expected Outcomes:**
- As the user scrolls the homepage and the Pricing Section enters the viewport, the section header and pricing cards row stick to the top of the screen.
- The section stays pinned while the scrollable feature comparison table (below) is being scrolled.
- Once the comparison table has been fully scrolled past, normal page scroll resumes.

**Todo List:**
1. In `PricingSection.tsx`, add `sticky top-16 lg:top-20 z-30` Tailwind classes to the outer `<section>` element (line 45). The `top-16`/`top-20` values match the fixed navbar spacer heights defined in `RootLayout.tsx`.

**Relevant Context:**
- `src/components/home/PricingSection.tsx` line 45 — outer `<section>` element
- `src/layouts/RootLayout.tsx` — navbar spacer is `h-16 lg:h-20`
- `src/components/layout/Navbar.css` — navbar is `position: fixed; z-index: 100`

**Status:** [ ] pending

---

### Sub-Task 2 — Make the feature comparison table scrollable inside the section

**Intent:**
Wrap the feature comparison content (from "Company Registration" onwards, i.e. the `<div className="bg-white">` block at line 160) in a scrollable container with a fixed max-height. This means the comparison rows scroll independently within the sticky section, rather than the entire page scrolling past them.

**Expected Outcomes:**
- The comparison table (Company Registration, Foundational Documents, Compliance & Governance, HR & Employment, Investor Ready, and CTA footer) renders inside a scrollable div.
- The pricing cards and section header remain fully visible and pinned while the user scrolls through the comparison rows.
- The scrollable area has a defined maximum height so it fits within the viewport beneath the sticky pricing cards.
- The scrollable container shows a visible scrollbar (or scrolls naturally on touch) so users know it is scrollable.

**Todo List:**
1. In `PricingSection.tsx`, locate the `<div className="bg-white">` wrapper at line 160 that wraps all the comparison sections.
2. Replace the plain `bg-white` class on that div with `bg-white overflow-y-auto max-h-[60vh]` (or an appropriate viewport-relative height that accounts for the sticky section header above it). The exact height value should leave the pricing cards fully visible — approximately `max-h-[calc(100vh-var(--pricing-header-height))]`; a safe starting value is `max-h-[55vh]`.

**Relevant Context:**
- `src/components/home/PricingSection.tsx` line 160 — `<div className="bg-white">` wrapping all comparison sections
- The sticky pricing cards block ends at approximately line 157; the scrollable area starts immediately after.

**Status:** [ ] pending

---

## Implementation Notes

- The navbar has `z-index: 100`. The sticky section should use `z-30` to stay below the navbar.
- Tailwind's `sticky` utility requires the parent chain to have no `overflow: hidden` set. The outer `<section>` has no such override. The `motion.div` at line 68 uses `overflow-hidden rounded-3xl` — the `overflow-hidden` on this wrapper **will prevent sticky from working on the section**. This wrapper must be checked and the `overflow-hidden` removed or replaced with `overflow-visible` while preserving the `rounded-3xl` and `border` visuals.
- The `sticky` positioning on the `<section>` element works relative to its scroll container, which is the page itself (`<main>` in `RootLayout.tsx`). This is the standard browser scroll context.
