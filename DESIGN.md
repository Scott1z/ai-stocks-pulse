---
name: AI QuickCap
description: A daily one-page reader for the AI stocks sector — price ledger, composite chart, and curated news.
colors:
  paper: "#f7f8fa"
  panel: "#ffffff"
  panel-raised: "#eef1f5"
  hairline: "#e2e6ec"
  hairline-strong: "#ccd3dc"
  ink: "#101828"
  ink-dim: "#475467"
  ink-faint: "#666c79"
  accent-navy: "#1c3a5e"
  accent-navy-dim: "rgba(28, 58, 94, 0.08)"
  rise-green: "#2e7d4f"
  rise-green-dim: "rgba(46, 125, 79, 0.1)"
  fall-red: "#9e3a2f"
  fall-red-dim: "rgba(158, 58, 47, 0.1)"
  mixed-slate: "#5b6b7a"
  mixed-slate-dim: "rgba(91, 107, 122, 0.1)"
typography:
  body:
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    letterSpacing: "0.08em"
rounded:
  pill: "999px"
  sm: "4px"
components:
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "9px 16px"
  button-ghost-hover:
    textColor: "{colors.accent-navy}"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dim}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  chip-active:
    backgroundColor: "{colors.accent-navy}"
    textColor: "{colors.panel}"
    rounded: "{rounded.pill}"
  stock-tag-bullish:
    backgroundColor: "{colors.rise-green-dim}"
    textColor: "{colors.rise-green}"
    rounded: "{rounded.pill}"
  stock-tag-bearish:
    backgroundColor: "{colors.fall-red-dim}"
    textColor: "{colors.fall-red}"
    rounded: "{rounded.pill}"
  stock-tag-mixed:
    backgroundColor: "{colors.mixed-slate-dim}"
    textColor: "{colors.mixed-slate}"
    rounded: "{rounded.pill}"
  modal-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "32px 28px 28px"
---

# Design System: AI QuickCap

## Overview

**Creative North Star: "The Quiet Terminal"**

A calm, considered instrument for reading the AI stocks sector. This palette went through four directions before landing here — a black terminal (too generic-AI-dashboard), sage-green ledger paper (too "eco," didn't read as financial), a parchment-and-gold stock-certificate motif (distinctive, but more editorial than "commonly used and comfortable") — and settled on the colors people already recognize from finance software itself: a cool neutral white/grey base with a single navy-blue accent, the convention most banking and trading apps actually use, chosen for legibility over long daily sessions rather than for novelty. One accent, everywhere, per the Lila Rule — no second accent competing for attention.

The system originally shipped single-theme (light only) — "committing to one world," not an omission — but grew a dark mode later at the user's request. The two themes are not two different design languages: dark mode reuses every token, ratio, and rule in this document unchanged, just with the color variable block swapped (see "Dark Mode" below). Nothing about the page's structure, spacing, iconography, or the One Accent Rule changes between themes.

**Key Characteristics:**
- Cool neutral white/light-grey background — the convention of banking and trading software, not an invented editorial palette
- One accent only: navy blue, used identically everywhere (brand mark, active states, focus rings, the two structural top-border accents)
- A separate, distinct semantic triad (green/red/slate) for rise/fall/mixed — never reuses the accent hue
- One typeface everywhere (Montserrat) — numbers and labels are distinguished from prose by size/weight/tracking/case, not by switching to a second font
- Flat surfaces, hairline dividers, real data visualizations (ticker tape, composite chart, sparklines) instead of decorative imagery
- Reading an article's summary happens in place (a modal), never an automatic redirect off the page

## Colors

A cool, neutral palette with exactly one accent and a separate semantic triad — the same restraint most finance software uses, and for the same reason: the data is the thing people are there to read, not the chrome around it.

### Primary
- **Ledger Navy** (`#1c3a5e`): the single accent. Brand mark, active filter state, focus rings, links, hover states on ghost buttons, and the two structural top-border accents (hero panel, modals). Used often and consistently — the same blue everywhere, never a second competing accent.

### Secondary (semantic — separate from the accent, never overlapping it)
- **Ledger Green** (`#15803d`): price rises, bullish tags, "live" status dot, up candles in the brand mark. Recalibrated from an earlier, more muted `#2e7d4f` at the user's explicit request ("que el verde sea más verde") — a more saturated true green, chosen to land at essentially the same WCAG AA contrast margin against white (~5:1) as the value it replaced, so "more vivid" didn't come at the cost of the accessibility bar the palette already held itself to.
- **Ledger Red** (`#b91c1c`): price falls, bearish tags — literally "in the red" — down candles in the brand mark. Same story as Ledger Green ("que el rojo sea más rojo"): more saturated than the earlier `#9e3a2f`, still comfortably clears AA (~6.5:1 on white).
- **Ink Slate** (`#5b6b7a`): mixed/neutral sentiment, the third state between rise and fall.

### Tertiary (icon-only, deliberate exception to the One Accent Rule)
- **Icon Teal** (`#1f7a72`) and **Icon Indigo** (`#4a5a8f`): reserved exclusively for the small category-icon set (section headers, hero stats, fundamentals) described under Components. Added at the user's explicit request, inspired by how broker sites like invertironline color-code an icon per product category, after five rounds of otherwise locking the page to one accent. Scoped tightly: these two colors never appear on text, badges, borders, or any other surface, only on the 16px icon glyphs.

### Neutral
- **Cool White** (`#f7f8fa`): page background (`--paper`). Neutral, not warm — the background of a banking dashboard, not a stationery brand.
- **Panel White** (`#ffffff`): card/panel surface — the hero readout, ticker tape, modal, toast — distinguishable from the page itself.
- **Raised Grey** (`#eef1f5`): subtle hover tint for ledger rows and news rows (`--panel-raised`).
- **Hairline** (`#e2e6ec`): the default divider — between ledger rows, news rows, ticker items.
- **Hairline Strong** (`#ccd3dc`): a stronger hairline for structural borders (input/chip outlines, the ledger header rule).
- **Ink** (`#101828`): primary text. Cool near-black, never a true `#000`.
- **Faded Ink** (`#475467`): secondary text (sub-copy, blurbs, chip labels at rest).
- **Pencil Grey** (`#666c79`): tertiary/faint text (captions, stat labels, placeholders, footer copy). Darkened from an earlier `#98a2b3` after an accessibility pass found the lighter value only hit 2.6:1 contrast on white (and less on the page's paper background): below WCAG AA's 4.5:1 floor for regular text. Same hue and saturation, just deeper, so the "faint" hierarchy step still reads distinctly lighter than Faded Ink while passing AA with margin on both `--panel` and `--paper`.

### Named Rules
**The One Accent Rule.** Ledger Navy is the only brand accent on the page, full stop — not "the primary one among two." It never does semantic work — if a color means rise/fall/mixed, it is never navy. The category icon set (Icon Teal, Icon Indigo, plus reused Navy/Green) is a deliberate, narrowly-scoped exception: icon-only, never applied to text, badges, or surfaces, so the rule still holds everywhere it originally mattered.

**The No-Black Rule.** No `#000000` and no clinical, context-free `#ffffff` — panels and text both carry a deliberate cool bias rather than being pure values. Pure neutrals read as generic; the considered cool tone is what makes it this system.

### Dark Mode
- **Why it works with zero structural changes:** every color on the page already routed through the CSS custom properties above — audited before implementing (no hardcoded hex in `styles.css` outside the `:root` variable block, none in `app.js` at all). So dark mode is a second variable block, not a second design pass: charts, badges, hairlines, gradients all inherit it automatically.
- **Palette, recalibrated twice at the user's explicit request:** first pass matched finance.yahoo.com's dark mode (a neutral charcoal `#14181c`, replacing the original navy-tinted near-black `#0a1120`). The user then said that charcoal still read as "blue" to them, so a second pass pushed it further toward true neutral/black: `--paper` is now `#0e0e10` (R/G/B within 2 points of each other — essentially hue-free), `--panel` `#17171a`, darker overall than the Yahoo-matched version, still not pure `#000` (No-Black Rule holds). `--rise`/`--fall` were recalibrated in the same pass as the light-mode green/red ("más verde", "más rojo" — see Colors → Secondary): `#17d968` and `#ff3b3b`, both saturated and verified to clear WCAG AA with wide margin (~10:1 and ~5.5:1) against the new, darker background. `--accent` keeps the light sky-blue from the Yahoo pass — that part of the read wasn't what the user objected to.
- **Activation, two paths:**
  1. **No saved preference:** pure CSS, `@media (prefers-color-scheme: dark)`, applies automatically at first paint. Zero JavaScript involved on this path specifically so there's no flash-of-wrong-theme — the alternative (setting `data-theme` via an inline `<script>` in `<head>`, the usual fix for this) isn't available here since the page has zero inline scripts by design (see PRODUCT.md's `script-src 'self'` CSP).
  2. **Explicit choice:** the topbar toggle (sun/moon icon, next to the demo/live pill) sets `data-theme="light"` or `"dark"` on `<html>` and persists it to `localStorage` (`aisp_theme`) — this always wins over system preference.
- **Toggle icon:** sun visible in light mode, moon in dark — the icon shows the *active* mode, not the mode you'd switch to. Same dual-path logic as the color variables (explicit attribute or media-query fallback) so the icon never mismatches the actual rendered theme on load.
- **Also swapped:** the `<meta name="theme-color">` tag (mobile browser chrome color) and `color-scheme` (native form control/scrollbar theming), both updated by the same `applyTheme()` call that sets the attribute.

## Typography

**Font:** Montserrat (self-hosted, `fonts/Montserrat-*.woff2`; falls back to the OS system sans if it fails to load) — the **only** typeface on the page, everywhere, prose and data alike.

Montserrat replaced the previous General Sans at the user's explicit request (they supplied the font files directly). It's a geometric grotesque with more visual presence and a wider stance than General Sans. Self-hosted (not a CDN link) so it works offline in the PWA and doesn't depend on a third party at runtime; four weights are shipped (Regular, Medium, SemiBold, Bold), not the full variable-font family.

**One-Font Rule (superseded the Two-Voice Rule).** The page used to run a second "data voice" typeface for every number, ticker, and label — first the OS monospace stack, then a self-hosted Azeret Mono. Both were retired at the user's explicit, repeated request (they supplied the Montserrat family files a second time after the first Montserrat swap only replaced the prose voice and left the mono data voice in place, which the user considered not done). There is now exactly one font-family on the entire page — `--font-prose` and `--font-data` both resolve to the same Montserrat stack (kept as two CSS variables only so every existing rule referencing either one didn't need to be touched, not because they differ). `font-variant-numeric: tabular-nums` is still applied wherever it was before, since Montserrat's numerals support it and columns of digits still benefit from aligning.

A serif hero headline (Cormorant Garamond, inspired by cluely.com's EB Garamond) was tried and then reverted at the user's explicit request ("me parece horrible") — the page stays strictly one typeface, no exceptions, no serif, no second mono voice.

### Hierarchy
- **Display/Section Heading** (Montserrat, 700, `clamp(1.6rem, 3vw, 2.3rem)` down to 1rem depending on level): the hero `<h1>` and every other heading on the page (section titles, modal headlines).
- **Body** (Montserrat, 400, 0.95rem–1rem, 1.55–1.65 line-height): sector summary, hero subhead, news headlines, stock blurbs, the modal's article summary.
- **Label** (Montserrat, 600, 0.63rem–0.78rem, uppercase, 0.02–0.12em tracking): eyebrows, filter chips, badges, stat labels, table headers, ticker items, the modal's ticker tag and meta line. Same font as everything else now — this tier is distinguished by size/weight/tracking/case, not by switching typeface. Every price and percentage still uses `font-variant-numeric: tabular-nums` so columns of digits align.

## Layout

A single centered column, `max-width: 1180px`, 24px side padding (16px under 640px). Vertical rhythm is generous by design — section padding runs 40–56px top on desktop, tightened but never removed on mobile.

The hero is the one asymmetric moment: a 1.15fr/0.85fr split (text left, readout panel right) that collapses to a single column under 860px. Below the hero: ticker tape (full-bleed, edge-to-edge), then the ledger table, then the news list.

The stock ledger uses a fixed column template (`minmax(190px, 1.6fr) 88px 78px 116px 92px` — company / price / change / trend / signal) shared between the header row and every data row, so columns stay aligned. Under 640px this collapses to a 2-column stacked layout per row rather than preserving five columns on a phone.

Both modals (News, Stock Detail) center over the page with a fixed-position dark scrim behind them (`rgba(16, 24, 40, 0.45)`), capped in width with internal scroll — never full-screen, always readable as "a card lifted above the page," dismissible by close button, clicking the scrim, or Escape.

## Elevation & Depth

Flat by default — no ambient drop shadows anywhere in the resting UI. Depth is conveyed by hairline dividers and small tonal shifts (`--panel` vs `--panel-raised` on row hover), not by shadow layering.

### Shadow Vocabulary
- **Toast float** (`box-shadow: 0 10px 30px -12px rgba(16, 24, 40, 0.35)`): the transient status toast.
- **Modal float** (`box-shadow: 0 20px 50px -16px rgba(16, 24, 40, 0.4)`): both modals — heavier than the toast because they sit over a dark scrim and need to read as clearly detached from the page beneath them.
- **Live-status halo** (`box-shadow: 0 0 0 3px var(--rise-dim)`): not elevation — a soft focus ring around the "live" status dot when data is real (vs. demo).

### Named Rules
**The Flat-By-Default Rule.** Elevation is earned only by things that are genuinely temporary or floating above the page (the toast, the two modals). A permanent, in-flow element never gets a drop shadow — use a hairline or a tonal shift instead.

## Shapes

Two radii, applied by role, never mixed within it:
- **Pill (`999px`)**: every interactive/status element — buttons, filter chips, badges (sentiment, demo/live pill, stock tags), the toast, the modal close buttons.
- **Sharp (`4px`)**: every structural container — the hero readout panel, the search input, both modal panels. Reads closer to a real financial document than a soft consumer-app card.

Borders are hairlines throughout (1px), never thick. The two deliberate exceptions are the hero panel's and the modal panels' 2px navy top borders — the single accent marking "this is the instrument," not a second color.

### Named Rules
**The Two-Radius Rule.** If it's something you click or a status you read, it's a pill. If it's something you read data or an article inside of, it's 4px. No third radius, no card-style 12–16px anywhere.

## Motion

The page shipped almost entirely static for most of its life — hover/focus color transitions, the ticker-tape scroll, and modal open/close were the only motion anywhere. At the user's explicit request ("llevar esta interfaz de un 5 a un 10 con cosas dinámicas"), a dedicated motion pass added six coordinated pieces, all sharing one constraint: everything routes through the sitewide `prefers-reduced-motion` rule (`* { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }`), so no new motion needed its own reduced-motion special-case — reduced-motion users get the same end state, just without the transitions.

- **Number count-up** (`animateNumber()` in `app.js`): a shared utility that tweens a number's displayed text with ease-out-cubic easing, formatting each frame exactly like the final static string would (no visual "snap" at completion). Applied to the hero's three stats (counts from the previous value on a live refresh, from 0 on first load) and the Stock Detail Modal's price/change (counts from 0 every time the modal opens — a discrete moment, not something that needs continuity with a "previous" value). Deliberately *not* applied per-row in the ledger, news, or history lists — see List Entrance below for why those get a different treatment instead.
- **List entrance** (`.stagger-item` in `styles.css`, `staggerDelay(i)` in `app.js`): every list that rebuilds its DOM wholesale on render (ledger rows, news items, heatmap tiles, history cards) fades + slides its items in with a per-index delay (capped at 200ms total so a long list doesn't feel slower to finish than a short one). Because these renders already destroy and recreate the DOM nodes on every filter/search/sort/refresh, the animation needs no manual "restart" logic — new elements always get a fresh keyframe run. This intentionally fires on *every* re-render, not just first load: a filter change or a live data refresh replacing the list is treated as "new content," the same read a stagger-in gives on first paint.
- **Chart reveal** (`.sparkline`, `.hero-chart-svg`, `.stock-detail-chart` share one `clip-path` keyframe): every SVG line chart on the page — ledger sparklines, the hero/comparador composite chart, the Stock Detail Modal's line-fallback and real-candlestick chart — draws itself in left-to-right on creation instead of appearing fully formed. `clip-path` instead of measuring real path length with `getTotalLength()`: same visual result for these shapes, and doesn't need per-element JS on up to 50 ledger sparklines at once. Plays once per SVG creation, then holds at its end state — safe alongside the hero chart's interactive crosshair, which only toggles opacity on child elements well after the 0.6s reveal has settled.
- **Tactile feedback**: every pill/button/row that didn't already have an `:active` state (chips, hero-mover buttons, the list-toggle, calendar entries/nav, compare suggestions, the share button, the theme toggle, ledger rows, news rows) now gets a small `scale()` press on `:active`. Never a shadow-based "lift" — that would break the Shadow Vocabulary's "no drop shadows on permanent in-flow elements" rule below, so the tactile cue here is purely a physical scale/border-color response, consistent with the flat, hairline language everywhere else.
- **Scroll reveal** (`initScrollReveal()`, `.reveal-target`/`.reveal-pending` in `styles.css`): the five below-the-fold sections (Empresas, Comparar, Noticias, Calendario, Historial) fade + slide in the first time they cross into the viewport, via `IntersectionObserver`. Sections already visible at load time (checked with `getBoundingClientRect` before the class is ever added) are explicitly excluded from the pending state, so nothing above the fold ever flashes invisible-then-visible on first paint — only genuinely below-the-fold content gets the reveal treatment.
- **Silent auto-refresh** (`refreshData()`, `initAutoRefresh()`): polls `data.json` every 5 minutes (paused while the tab is hidden, via the Page Visibility API, and re-checked immediately when the tab becomes visible again after being backgrounded) and — only if `updated_at` actually changed — re-renders the whole page through the exact same `render*()` functions the initial load uses, then shows a small "Datos actualizados" toast. A failed background poll is silent and simply retried next cycle; unlike the initial `loadData()`, it never falls back to demo data, since that would replace already-good live data with placeholders over a transient network hiccup.
- **Relative time ticking** (`tickRelativeTimes()`): news items' "hace X min/h" timestamps recompute every 60 seconds from the real `data-published-at` ISO timestamp already on each row, without touching the rest of the DOM — far cheaper than re-rendering the whole news list just to keep a clock from going stale while the tab stays open.
- **Favorite price-move alert** (`checkFavoritePriceAlerts()`): reuses the same toast as "Datos actualizados" rather than a new component. Fires once, ~800ms after the preloader clears (so it never appears hidden behind it), comparing each favorite's current price against a `localStorage` snapshot from the visitor's last visit — not the daily change — and rewriting that snapshot afterward. Unlike the auto-refresh toast, this one never repeats mid-session.

## Components

### Buttons
- **Shape:** pill (999px)
- **Ghost (the only variant in use — "Instalar app"):** transparent background, `--line-strong` border, `--text` label. 9px/16px padding, 600 weight, 0.82rem.
- **Hover / Focus:** border and text shift to `--accent`; `:active` scales to 0.96 for tactile press feedback; `:focus-visible` gets a 2px navy outline with 2px offset.

### Chips (filter pills)
- **Style:** transparent, `--line-strong` border, `--text-dim` label, uppercase tracked text (label voice, same Montserrat as everything else).
- **State:** `.active` fills solid navy with panel-white text — the only place a chip becomes a filled surface.
- **Hover (inactive):** border and text shift to `--accent`, background stays transparent.
- **Two independent rows, combined with AND, not OR:** the sentiment/favorites row (Todas/Alcistas/Bajistas/Mixtas/Favoritas) and the sub-sector row (Semis/Software y nube/Mega-cap) are separate filter axes — picking "Alcistas" and "Semis" together narrows to stocks matching both, never replaces one selection with the other. Kept as two rows instead of merging into one long chip list specifically so that combination stays legible — one flat row of 8 chips would hide which ones are mutually exclusive and which aren't.
- **Secondary row is visually quieter, same component:** the sub-sector row reuses the exact same `.chip` markup/behavior at a smaller font-size and more muted resting color (`.filter-group-secondary`) — a size/weight step down, not a different component, so the two rows read as "primary filter, secondary refinement" without inventing new chip styling.

### Ledger Row (signature component)
- **Corner Style:** none — flat row, not a card.
- **Background:** transparent at rest, `--panel-raised` on hover.
- **Border:** single bottom hairline (`--line`); no top border, no side borders, no box.
- **Internal layout:** fixed 5-column grid shared with the header row (see Layout); ticker + name + one-line blurb in column 1 (label-voice ticker, body-voice name/blurb), tabular-nums price and change right-aligned, a compact SVG sparkline, and a pill sentiment tag.
- **Sub-sector tag:** appended inline to the name (`NVIDIA · Semis`), same `--text-faint` muted styling as the name itself — not a colored badge, since color in this row is reserved for sentiment. It's supplementary metadata riding on an existing line, not a new visual element competing for attention.
- **Interaction:** the entire row is clickable/focusable (`role="button"`, `tabindex="0"`) — opens the Stock Detail Modal. This is deliberate: a table of bare numbers reads as a spreadsheet, so every row is a door to a richer view instead of decoration bolted onto the layout.

### Sortable Ledger Header
- **Purpose:** "Empresa," "Precio," and "Var." in the ledger header are real buttons, not static labels — click to sort ascending/descending, click again to flip direction. "Tendencia" and "Señal" stay plain labels since a sparkline or a sentiment pill isn't a meaningfully sortable value.
- **State:** the active sort column turns `--accent` and gets a small ▲/▼ glyph appended; every other header stays `--text-faint`. `aria-sort` is set on the active button (`ascending`/`descending`) so screen readers get the same signal.
- **Defaults:** first click on a numeric column (Precio, Var.) sorts descending — "biggest first" is the more useful default for a finance table — while Empresa defaults to ascending (A–Z). A second click on the same column flips it.

### Watchlist Star
- **Purpose:** a small star button at the start of each ledger row lets a visitor mark tickers they personally care about, persisted in `localStorage` (no account, no backend). A fifth filter chip, "★ Favoritas," shows only starred tickers.
- **Style:** unfilled outline in `--line-strong` at rest (quiet, doesn't compete with the ticker), fills solid `--accent` once starred — the same "active state = accent" language already used for the active filter chip.
- **Interaction:** clicking the star toggles it without opening the Stock Detail Modal (the click is stopped from bubbling to the row); the row itself remains a separate, full-size click target for the modal.
- **Empty state:** the "★ Favoritas" filter with nothing starred yet shows an honest instruction ("Tocá la estrella junto al ticker para agregarla") instead of just an empty list.

### Heatmap del Sector (alternate view, not a new section)
- **Purpose:** an instant visual read of the whole tracked catalog ("who's up, who's down, how much") — the Ledger Row is precise but sequential (read one row at a time), the heatmap trades precision for a single glance. Deliberately not a new page section: it's a second view of the exact same "Empresas del sector" data, sharing filters, search, and click-through to the Stock Detail Modal, toggled by a small "Tabla / Mapa de calor" segmented control next to the section heading.
- **Sizing, not a continuous treemap:** tiles come in 3 fixed sizes by market-cap rank (top 3 = large, next 7 = medium, the rest = small), laid out with CSS Grid `grid-auto-flow: dense` — not a computed squarified treemap. Simpler, and doesn't risk a broken layout as the catalog grows past 50 tickers; a company missing market-cap coverage (Finnhub free-tier gaps happen) sorts to the small tier rather than being guessed at.
- **Color, not a new palette:** intensity steps (flat / ±1 / ±2 / ±3) of the same `--rise`/`--fall` tokens via `color-mix()` against `--panel` — no new hues, and the mix happens live against whichever theme (light/dark) is active, so there's no separate dark-mode heatmap palette to maintain.
- **Sync discipline:** any action that changes which tickers are starred, filtered, or searched re-renders both views (`renderStocksViews()`), even while only one is visible — so switching from Table to Heatmap never shows stale data from before a favorite was toggled on the other view.

### List Toggle (collapse / "Ver más")
- **Purpose:** both the ledger (up to 21 rows) and the news list (8 curated items) load collapsed to their first 3 entries, with a "Ver N más" button at the end. Landing on a wall of 21 rows read as overwhelming; three is enough to show the page is alive without demanding a scroll before a visitor has even decided the page is worth reading.
- **Style:** a full-width text button, label voice (uppercase, tracked), centered, separated from the last visible row by a hairline — the same "quiet, functional" register as everything else in the list, not a prominent CTA.
- **State:** toggling switches the label to "Ver menos" and reveals every remaining item; clicking again collapses back to 3. Changing the active filter chip or typing in search resets the ledger back to collapsed (a new result set should be judged from the top, not mid-scroll), sorting does not.

### News Row
- **Style:** same hairline-row logic as the ledger, but 3-column (status dot / headline+meta / ticker tag). A 7×7px rounded-square dot carries semantic color; the ticker tag renders as bracketed label-voice text (`[NVDA]`).
- **Interaction:** the entire row is clickable/focusable (`role="button"`, `tabindex="0"`) — clicking or pressing Enter/Space opens the News Modal with that article's summary. It never navigates away on its own; leaving the page to read the original source is an explicit, separate choice made inside the modal.
- **Hover/Focus:** `--panel-raised` background tint, same as a ledger row.
- **Thumbnail (when the source article has one):** a 56px square, `object-fit: cover`, radius-sm-cornered image slots in before the status dot, and the row's grid gains a fourth track (`.has-thumb`) rather than every row reserving empty space for one. This was added specifically to break up the page's mostly-typographic feel — real editorial photos read as "live news," not decoration. Never fabricated or swapped for a stock photo: an article Finnhub didn't supply an image for just keeps the 3-column layout, and one whose image URL fails to load client-side (404, hotlink block, link rot) is detected and removed at runtime, falling back to the same no-thumbnail row rather than a broken-image icon.

### Earnings Calendar
- **Purpose:** a forward-looking view — the next ~3 months of quarterly earnings reports for every ticker we track (Alpha Vantage `EARNINGS_CALENDAR`, filtered locally to our list), so a visitor knows what's coming, not just what already happened. Deliberately scoped to real earnings dates only; there is no reliable API for "important product events" (keynotes, launches), so the page doesn't fabricate that list.
- **Structure:** a real month grid (7 columns, Monday-first), not a flat list — replaced the original list-with-month-dividers at the user's request for more visual dynamism. One month at a time, with prev/next navigation in a small header (`‹ Agosto 2026 ›`). A day cell with a report gets a filled `--accent-dim` background and one small ticker pill per company reporting that day (title attribute carries the company name + session timing, when Finnhub-sourced demo data has it); empty days are just a muted day number. Today's cell gets an accent-colored day number as a "you are here" cue, same idea as the section nav's active link.
- **Navigation bounds:** can't go earlier than the current month — this section has no historical data behind it, so a past month would only ever be empty. No forward cap: the grid will render however far ahead you click, honestly showing "nothing scheduled" once you're past the ~3-month data horizon rather than blocking navigation before you get there.
- **Interaction:** clicking a ticker pill opens the Stock Detail Modal for that ticker, same destination as a ledger row or a Hero Mover — one more path in, not a dead end.
- **Data source note:** this used to come from Finnhub's `/calendar/earnings`, but that endpoint has a known, unfixed bug where near-term earnings dates go missing or come back wrong — caught in production when NVDA's actual next report wasn't showing up at all. Switched to Alpha Vantage, whose free `EARNINGS_CALENDAR` doesn't report before/after-market timing the way Finnhub did, so that detail is only available for the bundled demo data now (shown as a tooltip on the pill), not for real pipeline data — correctness over completeness.
- **Empty state:** if the pipeline has no upcoming earnings for any tracked ticker at all, the whole section hides itself rather than showing an empty shell. A single month within the grid that happens to have nothing scheduled just renders as a normal, entirely blank calendar — that's expected, not an empty state.

### Historial del Sector
- **Purpose:** the Earnings Calendar looks forward; this looks back — a rolling 30-day archive of the sector summary (sentiment, narrative text, breadth stats, top mover/loser), one card per day, newest first. Its own section after Calendario, with its own nav entry, deliberately not folded into the hero card (which only ever shows today).
- **Reuses, doesn't reinvent:** each day-card is built entirely from components that already exist elsewhere on the page — the `sentiment-badge` pill (same one on the hero), the `stat-value` mini-metric (same recipe as the Hero Stats block), and the `hero-mover` button (same ticker-tag-plus-change control as the Hero Movers, including the click-through to the Stock Detail Modal). A visitor who already learned what these look like on the main page doesn't have to learn a second visual language for the archive.
- **Upsert, not append:** the pipeline runs hourly, but a day only ever gets one entry — each run overwrites *today's* entry with the latest snapshot rather than appending a new one, so the archive never balloons to 24 rows per day. Trimmed to the last 30 days on every write (`ARCHIVE_DAYS_KEPT` in `pipeline/fetch_and_curate.py`).
- **Empty state:** the whole section hides itself if the archive is empty — notably, this includes the moment right after this feature first deploys, before the pipeline has run even once with the new field. It deliberately does **not** fall back to demo archive days the way the rest of the page falls back to demo data on a missing `data.json`: doing so under a "live" data badge would present fabricated history as real, which the Earnings Calendar's "no fabricated events" honesty rule already rules out elsewhere on this page.

### News Modal (signature component)
- **Purpose:** read a curated ~25-word summary of an article without leaving the page — the site's whole premise is "the story in 30 seconds," so a redirect-by-default was working against that.
- **Structure:** an edge-to-edge cover image at the top when the article has one (same honest-degradation rule as the News Row thumbnail — absent or broken just means no image, never a placeholder) → ticker tag (label voice, hidden if the article isn't ticker-specific) → headline (display-weight, but smaller than the hero H1) → source/time meta (label voice) → summary (body voice) → an explicit "Leer artículo original ↗" link, hidden when no source URL exists.
- **Cover image:** negative-margined to cancel the panel's own padding so it bleeds to both edges and nests under the 2px accent top border, capped at 220px tall with `object-fit: cover` so wildly different source aspect ratios don't distort or blow out the modal's height.
- **Style:** `--panel` background, 2px navy top border (see Shapes), 4px radius, modal-float shadow, over a navy-tinted scrim.
- **Dismissal:** close button (pill, top-right), click on the scrim, or Escape. Background scroll is locked while open.

### Stock Detail Modal (signature component)
- **Purpose:** a ledger row is necessarily terse (one line, truncated blurb); clicking it opens the full picture — large price/change, an enlarged chart, and every related headline — without leaving the page. This is the main answer to "the table reads like a spreadsheet": real content on demand, not decoration.
- **Structure:** ticker + company name + large price/change (mirrors the ledger row's data, just bigger) → sentiment tag → enlarged chart → an honest caption stating what the chart is built from → "Noticias relacionadas" list filtered to that ticker.
- **The chart is real candles when the pipeline has them.** Once `daily_ohlc.json` has data for a ticker (Alpha Vantage `TIME_SERIES_DAILY`, fetched once a day — see `pipeline/README.md`), the modal renders genuine open/high/low/close candlesticks: a wick from high to low, a body from open to close, colored by direction. Before that first daily fetch lands (or for a ticker Alpha Vantage has no data for), it falls back to the same accumulated `price_history.json` line chart as before, and the caption changes to match which one is showing — never claims candle precision it doesn't have. Since the 2026-08-11 expansion to 50 tracked tickers, this "no coverage" fallback is a permanent, structural state for 27 of them, not just a transient one before the first fetch: Alpha Vantage's free tier caps real candles at 23 tickers (`OHLC_TICKERS`), a hard quota limit, not a rollout-in-progress. The line-chart fallback was already built to handle "no data for this ticker" honestly, so it absorbs this without any new UI — same component, same caption logic, just a permanent reason instead of a temporary one for some tickers.
- **Related news are clickable too:** each item swaps this modal for the News Modal with that article — a chain, not a dead end. An empty state ("Sin noticias recientes para este ticker") is shown honestly rather than hidden.
- **Style:** same recipe as the News Modal (navy top border, `--panel` background, modal-float shadow) but wider (`600px` vs `520px`) to fit the chart.

### Stat Block (Fundamentals Grid, Hero Stats)
- **Purpose:** the one reusable way to show 2-6 labeled numbers side by side — the sector hero's up-count/avg-change/news-count, and the Stock Detail Modal's P/E, market cap, 52-week range, EPS, ROE, and net margin.
- **Structure:** `stat-value` (label voice, tabular-nums, bold) stacked over `stat-label` (small, `--text-faint`, sentence case), in a `repeat(3, 1fr)` grid with a hairline top border. The fundamentals grid additionally gets a hairline bottom border since it sits mid-modal, not at a section's end.
- **Missing data:** shown honestly as a muted "N/D" in place of the value — never a fabricated number, never the row silently disappearing. Finnhub's free-tier coverage varies by ticker, so this state is common, not an edge case.

### Fundamentals Glossary (collapsible)
- **Purpose:** the Stat Block shows numbers, not meaning — P/E, ROE, and net margin are opaque to anyone outside finance. Rather than explaining them to everyone by default, a "¿Qué significan estos números?" text toggle sits right under the grid, collapsed by default, and expands into plain-language definitions in place.
- **Why contextual, not a page-level panel:** the explanation only matters at the exact moment someone is looking at unfamiliar numbers. A permanent panel on the main page would be noise for the (majority of) visitors who already know what a P/E is, and would be disconnected from the numbers it explains.
- **Style:** a `<dl>` of term/definition pairs — `dt` in the label voice, `dd` in small prose — separated by hairlines, closing with an italic one-line disclaimer ("información educativa, no asesoría de inversión"). The toggle itself is a plain text button, no border or fill, with a chevron that rotates 180° on expand.

### Sentiment / Status Badges
- **Style:** pill, tinted background at ~8–10% opacity of the semantic/accent color, full-opacity text in the same color. Same recipe for sector sentiment, per-stock tags, and the demo/live status pill.
- **State:** the demo/live pill additionally gets a small leading dot; when live, the dot carries the halo shadow described in Elevation.

### Trend Glyphs
- **Purpose:** the first of two deliberate "finance element" passes, added after looking at how brokers like invertironline signal money/market context visually. Rather than borrow their illustration style (or their color palette, which we explicitly moved away from), every place a rise/fall/mixed sentiment already gets a semantic color now also gets a small drawn glyph: a diagonal arrow for bullish, a diagonal arrow for bearish, a short wave for mixed.
- **Why a glyph, not an icon-library import:** the project has no build step and no icon-library dependency, so hand-rolling three simple geometric marks (the taste-skill's permitted exception for hand-rolled SVG) was more honest than adding a dependency for three shapes. The stroke language deliberately matches the sparkline and chart paths elsewhere on the page, so the badge glyph reads as a tiny version of the same chart line, not a foreign icon set.
- **Implementation:** three SVG data URIs stored once as CSS custom properties (`--icon-trend-up/down/mixed`), applied via `mask-image` + `background-color: currentColor` wherever a sentiment class already exists (sector badge, stock tags, news dots) — one glyph definition, zero new HTML, colored automatically by the same rise/fall/mixed tokens already in place.
- **Bonus:** the shape now carries the same information as the color, which helps at a glance and for colorblind readers who could not previously distinguish the plain dot's color alone.

### Category Icons
- **Purpose:** the second, bolder finance-element pass. The user asked explicitly to go further than the restrained trend glyphs, using invertironline's per-product icon coloring as the reference, and to skip the taste-skill's usual restraint for this round. Rather than adopt IOL's illustration style or palette, the page got its own small icon-per-category system: a 16px line icon, in one of four fixed colors (Navy, Teal, Indigo, Green), placed next to whatever it labels.
- **Where:** the three section headers (pulse icon for "Resumen del sector," building for "Empresas del sector," newspaper for "Últimas noticias"), the three hero stats (building/teal for company count, pulse/navy for average change, newspaper/indigo for news count — matching their section header for continuity), and the six fundamentals in the Stock Detail Modal (scale for P/E, coin for Cap. de mercado and EPS, calendar for the 52-week range, percent-circle for ROE and net margin).
- **Color is assigned by concept, not per instance:** every "this is a dollar figure" stat gets the coin icon in Green: every "this is a ratio" stat gets scale or percent-circle in Indigo. Reusing an icon+color pairing across the page is intentional — it teaches the icon's meaning the second time a visitor sees it, rather than reading as twelve unrelated decorations.
- **Why hand-rolled SVG again:** same reasoning as the Trend Glyphs — no build step, no icon-library dependency. Same stroke weight and rounded-cap language as the rest of the page's line work.
- **Scope of the One Accent Rule exception:** these are the only four places on the page where a color besides Navy/Green/Red/Slate appears, and they only ever color a 16px icon, never text, a badge, or a border. See the Colors section's Tertiary palette and the amended One Accent Rule.

### Pulse Rings (decorative)
- **Purpose:** the hero card's top-right corner was flat, opaque space — visually correct but part of what read as "mostly typographic" feedback on the page. A set of concentric circles radiating from behind the "Resumen del sector" card is a literal read of the product's own name ("Pulse"), tried after looking at how bullmarket.com.ar uses a near-identical radiating-rings motif in one of its sections (only the visual technique was taken — no copied markup, brand, or content).
- **Implementation:** four plain `<circle>`s in one inline SVG, `fill: none`, single-color stroke at `var(--accent)`, 14% opacity — same "one hand-rolled SVG, no icon-library dependency" approach as the Trend Glyphs and Category Icons. `position: absolute; z-index: -1` inside the hero card's own stacking context (`.hero-card` gets `position: relative; z-index: 0` specifically so the ring is contained there, not free to escape behind the whole page) — the ring layer sits fully behind the card's opaque background, so it competes with nothing; only the portion that pokes past the card's own top/right edge into the section's empty padding is ever visible. `pointer-events: none` and `aria-hidden="true"` — it carries no information, so it's inert to input and screen readers.
- **Restraint:** one instance, one location, low opacity. This is the only decorative (non-data-bearing) graphic on the page — everything else drawn is either a real chart, a real icon labeling real content, or a trend glyph carrying real sentiment. Kept deliberately singular so it reads as a brand touch, not a pattern to repeat.

### Hero Movers
- **Purpose:** fills the hero-text column's remaining space below the badges with real, useful data instead of decoration — the sector's top gainer and top loser, computed client-side from `STOCKS` on every render. Replaced an illustrated-asset attempt the user rejected outright ("pésimo") after seeing it installed; the lesson taken was to reach for real data before reaching for imagery.
- **Structure:** a small label ("Mayor suba" / "Mayor baja") over a `stock-tag` (reusing the existing ticker pill with its trend glyph, so no new visual language) plus the change percentage in the tabular-nums data voice. Separated from the badges above by a hairline, echoing the Stat Block's own top-hairline convention.
- **Interaction:** each one is a real button; clicking either opens the Stock Detail Modal for that ticker, same as clicking its row in the ledger below — one more path to the same destination, not a dead-end decoration.

### Composite Sector Chart (signature component)
- **Purpose:** the very first real content in the hero card, "Índice compuesto del sector" — an equal-weighted % return across every tracked ticker. Originally a plain straight-segment polyline with a flat-opacity fill; redesigned after the user called it "horrible" and asked for something new, using the taste-skill's anti-slop review as the process (Redesign-Preserve mode: reuse this project's own established tokens and patterns rather than importing a foreign visual language).
- **Curve:** the line is a Catmull-Rom-to-cubic-Bézier conversion (`smoothPath()` in `app.js`, uniform tension) through the real data points, not a decorative smoothing — same values as before, read more naturally as a trend instead of a jagged EKG line.
- **Fill:** a real vertical `<linearGradient>` (same semantic rise/fall color, 30% opacity at the line fading to 0% at the baseline) replaces the old flat 14%-opacity area — adds depth without introducing a new hue, so it still passes the One Accent Rule and the taste-skill's Color Consistency Lock.
- **Endpoint halo:** the current-value dot now carries the same "Live-status halo" recipe already used on the demo/live pill and market-status pill (`--rise-dim`/`--fall-dim` ring behind a solid dot) — reused, not invented, so the chart's "this is the live number" cue reads as the same visual sentence as the rest of the page's live-data indicators.
- **Axis labels:** the start and end date (or "Inicio"/"Ahora" for the "Hoy" range, which has no real per-point dates) print in small muted label voice at the bottom corners — the chart previously had zero time-axis context at all.
- **Crosshair + tooltip:** hovering (or touching, on mobile) reveals a vertical guide line, a highlighted dot on the curve, and a fixed-position tooltip with the exact date and % return at that point (`initHeroChartInteraction()`). This is the chart's main functional upgrade, not just decoration — it was previously impossible to read any value except the final one. The crosshair/tooltip specifically is interaction-driven only, never ambient or auto-playing — it's live UI state, not a one-time entrance effect. (The chart's line itself does get a one-time draw-in reveal on creation — see Motion above — but that's a distinct, since-added layer that settles before the crosshair becomes interactive, not a contradiction of this rule.)
- **Range toggle:** a segmented control (Hoy / 30 días / 60 días) above the chart, reusing the Chips visual language at a smaller size rather than inventing a second toggle style. "Hoy" resamples the short hourly `spark` window; the two longer ranges resample real daily closes (`stock.ohlc`) across every tracked ticker with OHLC coverage into the same equal-weighted % composite.
- **Honesty boundary:** there is deliberately no "90 días" option. The pipeline only keeps 60 days of daily candles (`OHLC_DAYS_KEPT` in `pipeline/fetch_and_curate.py`), and only 23 of the 50 tracked tickers have OHLC coverage at all (see Earnings Calendar and PRODUCT.md) — offering a range or a ticker set the product can't actually deliver would be the same kind of overpromise the Earnings Calendar's "no fabricated events" rule exists to avoid.
- **Empty state:** if too few tickers have OHLC coverage yet for the selected range, the chart area shows a plain sentence ("Todavía no hay suficiente historial diario para este rango") instead of an empty or broken chart.

### Comparador de Acciones (signature component)
- **Purpose:** overlay up to 3 tickers' % return on one chart — the natural next question after the Composite Sector Chart ("how's the sector doing") is "how does X stack up against Y." Its own section between the Ledger and News, with its own nav entry.
- **Multi-line color, a scoped exception:** three fixed colors by position (`--accent`, `--icon-teal`, `--icon-indigo`), not one hue per ticker. This directly extends the Category Icons exception to the One Accent Rule (tertiary, desaturated, already established) to a second use — rather than inventing a fresh multi-series palette, which the One Accent Rule would otherwise forbid outright.
- **Everything else is reused, not reinvented:** the curve (`smoothPath()`), the SVG chart shell (`.hero-chart-svg`, `.hero-chart-axis-label`), and the Hoy/30 días/60 días range toggle are the exact same code and classes as the Composite Sector Chart — same visual language, same honesty boundary about OHLC coverage (see below).
- **Picker:** a search input with a live autocomplete dropdown (ticker or company name), and removable chips for the current selection — each chip's dot matches its line's color, so the legend-to-chip mapping needs no separate key. Adding is capped at 3 (the input silently stops suggesting once full); nothing below 2 tickers renders a chart (a single line isn't a comparison).
- **Legend:** ticker + final % return per line, dot-colored to match, sitting above the chart rather than as SVG-embedded labels — keeps the chart itself uncluttered and the legend independently legible/selectable.
- **Honesty boundary, ticker-specific:** since only the original 23 tickers have OHLC coverage (see Composite Sector Chart and PRODUCT.md), comparing a newer ticker on 30d/60d either quietly drops it from the chart (if 2+ others remain) with a small note naming which ticker(s) were excluded, or — if fewer than 2 tickers end up with real data — shows an explicit message naming the missing ticker(s) rather than a generic "not enough data," so the user understands it's a coverage gap, not a bug.

### Compartir Resumen (share-as-image)
- **Purpose:** a "Compartir" button next to the "Resumen del sector" heading generates a shareable image (1200×630, OG-card proportions) of the day's brand, timestamp, sentiment, sector summary, and top mover/loser — for posting the LLM-written summary somewhere else without a screenshot.
- **No dependency, by necessity:** hand-drawn on `<canvas>`, not `html2canvas` or similar — those would need a CDN script, which `script-src 'self'` already blocks outright. Manual layout (a small `wrapCanvasText()` word-wrapper) instead of a library.
- **Theme-aware for free:** colors are read from the live CSS custom properties (`getComputedStyle(document.documentElement)`) at draw time, not a duplicated palette — the generated image automatically matches whichever theme (light/dark, system or user-chosen) was active when the button was clicked. Verified both ways in testing.
- **Output path:** `navigator.share()` with the PNG as a `File` when the Web Share API + file sharing is available (mobile, mostly); otherwise a plain `<a download>` triggers a browser download, with a toast confirming it. A cancelled share sheet (`AbortError`) is treated as a no-op, not an error toast.
- **Button state:** disabled + "Generando…" label while the canvas builds (`document.fonts.ready` is awaited first, so text never draws in a fallback font), restored on completion or failure either way.

### Watchlist Position ("Mi posición")
- **Purpose:** turns the existing favorites/watchlist star from a bookmark into something with numbers attached — record what you paid and how many shares, see the position's total value and gain/loss now. Deliberately scoped to the Stock Detail Modal, not the ledger row: the row stays terse (that's the whole point of the Ledger Row / Stock Detail Modal split), and a purchase price + share count is a "clicked in for the full picture" kind of detail.
- **Gating:** only offered once a ticker is already favorited — the star is the declared "I care about this one" signal; asking for a purchase price on every row the user glances at would be noise. A non-favorited ticker shows a one-line nudge to favorite it first instead of a form.
- **Data:** purchase price and share count live in `localStorage` only (`aisp_cost_basis`, `{price, shares}` per ticker), never sent to the pipeline or any server. Same no-backend-needed pattern as the favorites star itself. Share count is optional — a position saved with only a price (or from before this field existed) still shows the % gain/loss, just not a total $ figure, rather than forcing a re-entry.
- **Structure:** a small labeled panel (`--panel-raised` background, hairline border) between the sentiment tag and the chart — the first personal, not-shared-with-every-visitor thing in the modal. Empty state is two inputs (price, share count) + "Guardar"; filled state shows total gain/loss ($ and %, when share count is set) plus the position's current total value, in the same up/down color and tabular-nums voice as everywhere else on the page, with a plain-text "Borrar" to clear it.

### Last Earnings Badge (beat/miss)
- **Purpose:** the Earnings Calendar looks forward (when's the next report); this looks backward (how did the last one go) — real reported EPS vs. the consensus estimate, from Finnhub `/stock/earnings`, not a computed or inferred number.
- **Structure:** a small pill (reusing the Sentiment Badge recipe — tinted background, full-opacity text) reading "Superó la estimación en X%" / "Por debajo de la estimación en X%" / "En línea con la estimación", plus a quieter meta line with the period and the actual-vs-estimate figures. Sits right under the chart caption in the Stock Detail Modal.
- **Empty state:** hidden entirely (`:empty { display: none }`) for any ticker Finnhub hasn't reported a completed quarter for yet — no placeholder, no "coming soon."

### Investment Thesis (weekly)
- **Purpose:** a short "why this ticker, what to watch for" — the Fundamentals Grid gives numbers, this gives the one sentence a visitor would actually want before clicking away. LLM-written, but on a deliberately slow cadence (once every 7 days, see `pipeline/README.md`) since a thesis doesn't need hourly freshness the way news does.
- **Structure:** a section title matching the "Fundamentales" / "Noticias relacionadas" label voice, a single prose sentence (`--text-dim`, same size/line-height as the Fundamentals Glossary's definitions), and — when the pipeline supplied one — a quieter one-line catalyst underneath in the same muted meta voice as the Last Earnings Badge's period line. No new typography, no new color.
- **Empty state:** the whole section (title included) is hidden via the `[hidden]` attribute for any ticker the weekly pipeline call hasn't produced a thesis for yet — never a placeholder, never a fabricated sentence. Same honesty pattern as the Last Earnings Badge and the Earnings Calendar.

### Inputs
- **Style:** 4px radius (sharp, matches the panel language, not the pill language), `--line-strong` border, `--panel` background.
- **Focus:** border shifts to `--accent`; no glow, no shadow — consistent with Flat-By-Default.

### Ticker Tape (signature component)
- **Style:** full-bleed strip, `--panel` background, top and bottom hairlines, continuously scrolling label-voice items (ticker / price / change, tabular-nums) separated by hairline rules. Pauses on hover; falls back to a manually scrollable static strip under `prefers-reduced-motion`.

### Preloader
- **Purpose:** covers the empty-shell flash while `init()` fetches `data.json` and renders — and doubles as a brand moment, the logo the visitor sees for a beat before the page proper appears.
- **Structure:** a fixed, full-viewport `--paper` overlay, centered flex column: the 40px brand mark with a slow scale/opacity pulse, and the wordmark below it (same "AI Stocks **Pulse**" markup and accent-on-"Pulse" treatment as the topbar's brand lockup).
- **Timing:** removed from `init()` once real content has painted, not on a fixed timer or on window `load` (which would wait on fonts/icons that don't block first paint) — `load` is kept only as a safety net in case `init()` throws. A 250ms floor keeps it from flashing imperceptibly on a fast local fetch. Fades via opacity over 0.4s, then the node is removed from the DOM entirely.
- **Motion:** the pulse animation is skipped under `prefers-reduced-motion`.

### Navigation (topbar)
- **Style:** single row, 68px tall (auto height under 640px), brand mark + wordmark left, section nav center, market status pill + demo/live status pill + install button right. `position: sticky` with a `--paper` background and a hairline bottom border (added when the topbar became sticky — before that, the ticker tape's own top hairline was enough separation on its own).
- **Section nav:** Resumen / Empresas / Noticias / Calendario, plain anchor links to each section's `id`. Sticky so the nav stays reachable at any scroll position, not just at the top of the page — a link list that only works before you've scrolled anywhere isn't much of a nav. Hidden under 640px (same declutter rule as the market-status and demo/live pills) rather than collapsing into a hamburger menu — four extra targets crowd a phone-width topbar more than they help.
- **Active state:** an `IntersectionObserver` (`initSectionNav()` in `app.js`) tracks which section occupies the vertical center of the viewport and highlights the matching link (`--accent-dim` background, `--accent` text — the Sentiment/Status Badge recipe, not the Chip's solid-fill active state, because this is a "you are here" indicator, not a pressed toggle).
- **Scrolling:** `html { scroll-behavior: smooth }` with `scroll-padding-top` matched to the sticky topbar's height, so an anchor jump doesn't land with the section heading tucked under the header. Reverts to instant (`scroll-behavior: auto`) under `prefers-reduced-motion`.

### Market Status Pill
- **Purpose:** a small credibility detail — "Mercado abierto" / "Mercado cerrado" for NYSE/Nasdaq regular trading hours (9:30–16:00 America/New_York, weekdays), computed client-side from `Intl.DateTimeFormat` (so DST is handled correctly without manual offset math) and refreshed every 60 seconds without a page reload.
- **Style:** identical recipe to the demo/live pill next to it (hairline border, leading dot, `--rise` + halo when "open," `--text-faint` when "closed") so the two read as one family of status indicators, not two different components.
- **Known simplification, stated honestly:** doesn't account for market holidays (Thanksgiving, etc.) — weekday + hours only. Hidden on mobile (`< 640px`) along with the demo/live pill to keep the topbar uncluttered at that width.

## Do's and Don'ts

### Do:
- **Do** keep Ledger Navy as the only accent, used identically everywhere — one color, not "a primary and a rare secondary."
- **Do** run every number, ticker, and short label through the label voice (uppercase, tracked, `tabular-nums`); keep sentences in the body voice — same font either way.
- **Do** use hairlines and tonal shifts for hierarchy and depth; reach for a shadow only for the toast and the two modals — things genuinely floating above the page.
- **Do** apply the pill radius to anything clickable or status-bearing, and the 4px radius to anything you read data or an article inside of — no other radius value.
- **Do** let a visitor read an article summary in place (the modal) rather than redirecting them off the page by default; the external link stays available but explicit.
- **Do** make every ledger row a door to a richer detail view (chart + related news) rather than adding decorative imagery to fill space — a data table's answer to "feels empty" is more real content, not illustration.
- **Do** be explicit about which chart a visitor is looking at — the Stock Detail Modal's caption always says whether it's real daily OHLC candles or the line-chart fallback, never implying more precision than the pipeline actually has for that ticker right now.
- **Do** treat real data (sparklines, the composite chart, the ticker tape) as the page's visual anchor instead of decorative imagery.
- **Do** route every new transition/animation through the sitewide `prefers-reduced-motion` rule instead of writing a per-feature reduced-motion special case — it already catches everything.

### Don't:
- **Don't** introduce a second accent color or warm-tinted neutrals — this cool-neutral, single-navy-accent palette is a deliberate commitment made after three prior directions (black terminal, sage ledger paper, parchment-and-gold) were tried and moved away from, each for a specific, remembered reason (too generic, didn't feel financial, more editorial than "commonly used and comfortable"). (Dark mode was added later, at the user's request — a second color-variable block, not a second accent or a warm palette, so it doesn't violate this rule; see Colors → Dark Mode.)
- **Don't** add drop shadows to permanent in-flow elements (cards, rows, panels) — only the toast and the two modals get one.
- **Don't** default to rounded-lg (8–16px) cards; the system has exactly two radii and both are already assigned.
- **Don't** reach for a three-equal-column card grid for the stock list — it's a ledger table with a shared column grid, not a card grid.
- **Don't** add gradients, glows, or glossy/3D abstract imagery — explicitly tried and rejected during this project for reading as generic AI-generated art.
- **Don't** make a news row (or any link out of the page) navigate automatically on click — the summary appears in place first; leaving the page is the visitor's explicit next choice, not the default one.
