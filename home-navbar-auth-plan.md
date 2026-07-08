# Plan: White Navbar Background on Home Tab When Logged In

## Top-Level Overview

**Goal:** When a user is logged in (any role: user, admin, or counsel), navigating back to the home page (`/`) should show the same white-background navbar (`navbar--light`) that all other pages show. Currently, the home page always renders the dark navbar regardless of auth state.

**Scope:** Single change in `src/components/layout/Navbar.tsx` — the condition that controls whether `navbar--light` is applied.

**Approach:** Extend the `isHomePage` / `navbar--light` condition to also account for `isAuthenticated`. If the user is authenticated, always apply `navbar--light`, regardless of the current route.

---

## Sub-Tasks

### Sub-Task 1 — Update navbar background condition in `Navbar.tsx`

- **Status:** [ ] pending

#### Intent
The navbar class logic at line 76 currently only applies `navbar--light` when the path is NOT `/`. We need to also apply it when the user IS authenticated, so that a logged-in user always sees the white-background header (matching the experience on all other pages).

#### Expected Outcomes
- A logged-in user visiting `/` (home) sees the white navbar with their username dropdown, identical to visiting `/about`, `/features`, etc.
- An unauthenticated visitor on `/` still sees the original dark navbar.
- An unauthenticated visitor on any other page still sees the white navbar (existing behaviour unchanged).

#### Todo List
1. Open `src/components/layout/Navbar.tsx`.
2. Locate line 76:
   ```tsx
   <header className={cn('navbar', !isHomePage && 'navbar--light')}>
   ```
3. Change the condition to:
   ```tsx
   <header className={cn('navbar', (!isHomePage || isAuthenticated) && 'navbar--light')}>
   ```
   - `!isHomePage` → true on any page except `/` (existing behaviour)
   - `isAuthenticated` → true when logged in, forcing `navbar--light` even on `/`

#### Relevant Context
- **File:** `src/components/layout/Navbar.tsx`
- **Line 32:** `const isHomePage = location.pathname === '/'`
- **Line 30:** `const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('tsl-authenticated') === 'true')`
- **Line 76:** `<header className={cn('navbar', !isHomePage && 'navbar--light')}>`
- **CSS:** `src/components/layout/Navbar.css` — `.navbar` = dark, `.navbar--light` = white background

#### No Additional CSS Changes Needed
The `navbar__account` (username dropdown) button and its children are already styled to work on both dark and light navbar backgrounds. The `navbar--light` class already handles text colour changes for all child elements. No new CSS rules are required.
