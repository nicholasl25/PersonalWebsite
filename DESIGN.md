# Design choices — personal portfolio

This document summarizes intentional design and UX decisions for this static site (`index.html`, `styles.css`, `script.js`).

## Stack and philosophy

- **Static first:** HTML, CSS, and vanilla JavaScript only. No build step, so the site is easy to host (e.g. GitHub Pages) and simple to maintain.
- **Recruiter-oriented:** Scannable sections, clear labels, and concrete tech names alongside short narrative copy.

## Visual language

### Color and surface

- **Warm neutrals** for the page background (`--bg`, `--bg-alt`) to avoid a cold “default gray” feel.
- **White cards** (`--surface`) with light borders and layered shadows for depth without heavy chrome.
- **Blue accent** (`--accent`, `--accent-hover`, `--accent-light`) for links, primary buttons, and active states. Chosen for a professional, readable contrast on warm paper-like backgrounds.

### Section striping

Main sections alternate **default page background** (`--bg`) and **muted band** (`--bg-alt`) so long scrolls stay oriented:

| Section      | Background |
|-------------|------------|
| Hero        | `--bg` (inherits body) |
| About       | `--bg-alt` |
| Education   | `--bg` |
| Experience  | `--bg-alt` |
| Projects    | `--bg` |
| Random      | `--bg-alt` |
| Contact     | `--bg` |

### Typography

- **Inter** for body and UI: legible at small sizes, neutral, common in product and engineering contexts.
- **Source Serif 4** for headings and the nav wordmark: adds a slightly editorial, personal tone without feeling ornate.
- **Tight negative letter-spacing** on large titles for a contemporary headline look.

### Layout

- **Max content width** (`--max-width: 960px`) keeps line length and section width comfortable on large displays.
- **Consistent section rhythm** (padding, heading style with a short accent underline) so each block feels like part of one system.
- **Section vertical padding** is moderate (`~4.25rem` desktop, tighter on small screens) so blocks feel connected without huge dead space between them.

## Information architecture

1. **Hero** — Identity, one-line focus, explicit “this is a portfolio” purpose line, quick credential pills, primary CTA to projects, secondary text link to experience. Headshot only here (not repeated in About) to reduce redundancy.
2. **About** — Personal and human context (location, interests, dog), plus skill tags grouped by category.
3. **Education** — Cornell-focused cards with logo thumbnails.
4. **Experience** — Employer logos, narrative paragraphs, technology tags.
5. **Projects** — Cards with circular project art, tech tags, links; GeoData project intentionally has no demo link per earlier requirements.
6. **Random** — A separate band between Projects and Contact. Holds only the **Git Skyline** embed (3D GitHub contribution view): section title **Random**, left-aligned like other headings, one short paragraph (`.random-desc`) with tool credit and interaction hints, then the iframe. The year and other embed flags live in the iframe `src` on `index.html` (no separate “how to edit the URL” note on the page).
7. **Contact** — Centered layout, clear outbound actions.

## Hero and CTAs (homepage clarity)

- **Explicit purpose** (`hero-purpose`) states that the site is a portfolio and what to do next, in the spirit of “don’t make me think” for first-time visitors.
- **Single primary action:** “View projects” as the filled button; “Work experience” as a secondary underlined link so the first click is obvious.

## Navigation

- **Fixed navbar** with slight blur and shadow on scroll for separation from content.
- **Brand link** “N. Lombardo” returns to hero; receives active styling when the hero is the current scroll context.
- **In-page links** include **Random** (`#random`) for the skyline section, between Projects and Contact.
- **Scroll spy** updates which nav item is “current” based on scroll position (sections: hero, about, education, experience, projects, random, contact), with a bottom-of-page rule so the last section still highlights correctly.
- **Active state styling** is deliberately visible: pill background, stronger weight, and for the contact button a double ring so the current section is obvious at a glance.
- **Mobile:** hamburger menu with the same links; active item uses the same pill treatment for consistency.

## Intro splash (letter wheels)

- **Short branded moment:** Two vertical strips spin and land on **N** then **L**, staggered so the second wheel finishes after the first.
- **Session behavior:** `sessionStorage` plus an early `html` class avoids flashing the splash on every refresh in the same tab.
- **Reduced motion:** If the user prefers reduced motion, the strip snaps to the final letters and the overlay dismisses quickly.

## Motion and polish

- **Scroll-triggered fade-in** on major blocks (cards, about block, contact row, Random description, skyline iframe container) for a light sense of depth, without heavy animation elsewhere.
- **Smooth scrolling** for in-page anchor links (with JS fallback where needed).
- **Hover states** on cards and buttons use shadow and small translate for feedback.

## Projects section

- **Circular thumbnails** in a row with title and tags for a compact “app tile” feel.
- **Demo + GitHub** where applicable.

## Random section (Git Skyline)

- **Placement:** Own section so striping stays regular and Projects stays purely project cards.
- **Embedding:** Third-party iframe ([Git Skyline](https://git-skyline.huakun.tech/)); lazy-loaded, strict referrer policy.
- **Copy:** Brief description only; no duplicate “Random” footer label under the graph.

## Assets

- **Raster images** live under `assets/img/` so the repo root stays tidy and paths are predictable (`assets/img/...`).

## Accessibility touches

- Splash uses **`role="dialog"`**, **`aria-modal`**, and a screen-reader-only title; it is hidden from assistive tech when dismissed.
- Random section ties the visible title to the region with **`aria-labelledby`** on the section pointing at the **Random** heading.
- Nav active links set **`aria-current="true"`** when appropriate.
- **Reduced motion** respected for the splash sequence; hero cursor blink is toned down under reduced motion in CSS.

## What we deliberately avoided

- No heavy JS framework or CSS framework, to keep load and complexity low.
- No duplicate hero headshot in About (clearer story flow).
- No custom-built 3D commit chart in favor of an **embedded, maintained tool** (Git Skyline) for reliability and less maintenance.

---

*Update this file when you make major layout or branding changes so future you (or collaborators) know why things look the way they do.*
