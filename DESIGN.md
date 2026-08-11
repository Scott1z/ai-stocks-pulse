---
name: AI Stocks Pulse
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
  display:
    fontFamily: "'Cormorant Garamond', Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.1rem, 4.4vw, 3.4rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "'Azeret Mono', ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', Menlo, Consolas, 'Liberation Mono', monospace"
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

# Design System: AI Stocks Pulse

## Overview

**Creative North Star: "The Quiet Terminal"**

A calm, considered instrument for reading the AI stocks sector. This palette went through four directions before landing here — a black terminal (too generic-AI-dashboard), sage-green ledger paper (too "eco," didn't read as financial), a parchment-and-gold stock-certificate motif (distinctive, but more editorial than "commonly used and comfortable") — and settled on the colors people already recognize from finance software itself: a cool neutral white/grey base with a single navy-blue accent, the convention most banking and trading apps actually use, chosen for legibility over long daily sessions rather than for novelty. One accent, everywhere, per the Lila Rule — no second accent competing for attention.

The system is deliberately single-theme (light only). This is a daily-use tool, not a themeable brand site — committing to one world was a conscious choice, not an omission.

**Key Characteristics:**
- Cool neutral white/light-grey background — the convention of banking and trading software, not an invented editorial palette
- One accent only: navy blue, used identically everywhere (brand mark, active states, focus rings, the two structural top-border accents)
- A separate, distinct semantic triad (green/red/slate) for rise/fall/mixed — never reuses the accent hue
- Two deliberate type voices: a plain sans for reading, a tracked-out monospace for every number and label
- Flat surfaces, hairline dividers, real data visualizations (ticker tape, composite chart, sparklines) instead of decorative imagery
- Reading an article's summary happens in place (a modal), never an automatic redirect off the page

## Colors

A cool, neutral palette with exactly one accent and a separate semantic triad — the same restraint most finance software uses, and for the same reason: the data is the thing people are there to read, not the chrome around it.

### Primary
- **Ledger Navy** (`#1c3a5e`): the single accent. Brand mark, active filter state, focus rings, links, hover states on ghost buttons, and the two structural top-border accents (hero panel, modals). Used often and consistently — the same blue everywhere, never a second competing accent.

### Secondary (semantic — separate from the accent, never overlapping it)
- **Ledger Green** (`#2e7d4f`): price rises, bullish tags, "live" status dot, up candles in the brand mark.
- **Ledger Red** (`#9e3a2f`): price falls, bearish tags — literally "in the red" — down candles in the brand mark.
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

## Typography

**Display Font:** Cormorant Garamond (self-hosted, `fonts/CormorantGaramond-SemiBold.woff2`; falls back to Georgia/Times New Roman/serif if it fails to load) — the hero H1 only, nowhere else.
**Body Font:** Montserrat (self-hosted, `fonts/Montserrat-*.woff2`; falls back to the OS system sans if it fails to load)

The serif display was added after studying cluely.com at the user's request: its hero headline uses EB Garamond for editorial gravitas, a distinctive move for a SaaS site. Rather than adopt EB Garamond itself (which would read as a direct copy) or restyle the whole page in serif, the page borrows the *principle* — one large, warm, old-style serif moment at the very top — using Cormorant Garamond, a different cut in the same Garamond family: thinner, more delicate, a distinct silhouette from EB Garamond's classic warmth. Scoped to the H1 alone; every other heading, all body copy, and all UI chrome stay on Montserrat. This is a deliberately narrow, single-element exception, the same pattern as the Tertiary icon colors or the Category Icons — not a reopening of "what font is this page."

Montserrat replaced the previous General Sans at the user's explicit request (they supplied the font files directly). It's a geometric grotesque with more visual presence and a wider stance than General Sans — the headline and body copy read a little bolder and more confident as a result. Self-hosted (not a CDN link) so it works offline in the PWA and doesn't depend on a third party at runtime; only the four weights the page actually uses (Regular, Medium, SemiBold, Bold) are shipped, not the full variable-font family.

**Label/Mono Font:** Azeret Mono (self-hosted, `fonts/AzeretMono-*.woff2`), falling back to the OS system monospace stack (SF Mono / Cascadia Code / Roboto Mono / Menlo / Consolas) if it fails to load. Left unchanged by both the Montserrat swap and the serif H1 — Montserrat has no monospace variant, and switching the numeric voice away from a tabular, slashed-zero mono face would break the Two-Voice Rule below, not extend it. Azeret Mono has a clearly slashed zero (distinct from capital O) and a technical, engineered character that suits a page whose whole data voice is built on tabular figures.

**Character:** Two voices doing two different jobs, not one family styled two ways, plus one narrowly-scoped serif accent. The system sans reads like prose — the sector summary, news headlines, stock blurbs, the modal's article summary. The monospace is the "data voice": every price, every percentage, every ticker, every timestamp, every uppercase label runs through it, in tracked-out capitals. The serif appears in exactly one place, the hero H1, as a single deliberate note of editorial warmth against an otherwise geometric, technical page.

### Hierarchy
- **Hero Headline** (Cormorant Garamond, 600, `clamp(2.1rem, 4.4vw, 3.4rem)`, 1.08 line-height, -0.01em tracking): the `<h1>` only, nowhere else on the page. `text-wrap: balance` keeps it from ragging badly at any width.
- **Display/Section Heading** (Montserrat, 700, `clamp(1.6rem, 3vw, 2.3rem)` down to 1rem depending on level): every other heading on the page (section titles, modal headlines).
- **Body** (Montserrat, 400, 0.95rem–1rem, 1.55–1.65 line-height): sector summary, hero subhead, news headlines, stock blurbs, the modal's article summary.
- **Label** (Azeret Mono, 600, 0.63rem–0.78rem, uppercase, 0.02–0.12em tracking): eyebrows, filter chips, badges, stat labels, table headers, ticker items, the modal's ticker tag and meta line. This tier doubles as the numeric voice — every price and percentage uses `font-variant-numeric: tabular-nums` so columns of digits align.

### Named Rules
**The Two-Voice Rule.** If it's read, it's the sans. If it's a number, a ticker, or a short label, it's the tracked-out monospace. Never mix the two within a single value (a price is never set in the sans; a headline is never set in mono). The hero H1's serif is the one documented exception to "sans for reading" — see Character above for why it's scoped so narrowly.

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

## Components

### Buttons
- **Shape:** pill (999px)
- **Ghost (the only variant in use — "Instalar app"):** transparent background, `--line-strong` border, `--text` label. 9px/16px padding, 600 weight, 0.82rem.
- **Hover / Focus:** border and text shift to `--accent`; `:active` scales to 0.96 for tactile press feedback; `:focus-visible` gets a 2px navy outline with 2px offset.

### Chips (filter pills)
- **Style:** transparent, `--line-strong` border, `--text-dim` label, monospace uppercase tracked text.
- **State:** `.active` fills solid navy with panel-white text — the only place a chip becomes a filled surface.
- **Hover (inactive):** border and text shift to `--accent`, background stays transparent.

### Ledger Row (signature component)
- **Corner Style:** none — flat row, not a card.
- **Background:** transparent at rest, `--panel-raised` on hover.
- **Border:** single bottom hairline (`--line`); no top border, no side borders, no box.
- **Internal layout:** fixed 5-column grid shared with the header row (see Layout); ticker + name + one-line blurb in column 1 (monospace ticker, sans name/blurb), tabular-nums price and change right-aligned, a compact SVG sparkline, and a pill sentiment tag.
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

### List Toggle (collapse / "Ver más")
- **Purpose:** both the ledger (up to 21 rows) and the news list (8 curated items) load collapsed to their first 3 entries, with a "Ver N más" button at the end. Landing on a wall of 21 rows read as overwhelming; three is enough to show the page is alive without demanding a scroll before a visitor has even decided the page is worth reading.
- **Style:** a full-width text button, monospace label voice, centered, separated from the last visible row by a hairline — the same "quiet, functional" register as everything else in the list, not a prominent CTA.
- **State:** toggling switches the label to "Ver menos" and reveals every remaining item; clicking again collapses back to 3. Changing the active filter chip or typing in search resets the ledger back to collapsed (a new result set should be judged from the top, not mid-scroll), sorting does not.

### News Row
- **Style:** same hairline-row logic as the ledger, but 3-column (status dot / headline+meta / ticker tag). A 7×7px rounded-square dot carries semantic color; the ticker tag renders as bracketed monospace text (`[NVDA]`).
- **Interaction:** the entire row is clickable/focusable (`role="button"`, `tabindex="0"`) — clicking or pressing Enter/Space opens the News Modal with that article's summary. It never navigates away on its own; leaving the page to read the original source is an explicit, separate choice made inside the modal.
- **Hover/Focus:** `--panel-raised` background tint, same as a ledger row.

### Earnings Calendar
- **Purpose:** a forward-looking list — the next ~100 days of quarterly earnings reports for every ticker we track (Finnhub `/calendar/earnings`, filtered locally to our list), so a visitor knows what's coming, not just what already happened. Deliberately scoped to real earnings dates only; there is no reliable API for "important product events" (keynotes, launches), so the page doesn't fabricate that list.
- **Structure:** a flat chronological list with an inline month divider (`Agosto 2026`, `Septiembre 2026`, …) inserted whenever the group changes — not separate sub-lists per month, so the List Toggle's collapse-to-3 still works on one continuous sequence.
- **Row:** date (large, tabular-nums, `--accent`) → ticker + company name → the reporting hour in plain Spanish ("Antes de apertura" / "Después del cierre" / "Durante la rueda"), same hairline-row and hover language as News Row. Clicking a row opens the Stock Detail Modal for that ticker, same as a ledger row — one more path in, not a dead end.
- **Empty state:** if the pipeline has no upcoming earnings for any tracked ticker in the window (or hasn't run yet), the whole section hides itself rather than showing an empty shell.

### News Modal (signature component)
- **Purpose:** read a curated ~25-word summary of an article without leaving the page — the site's whole premise is "the story in 30 seconds," so a redirect-by-default was working against that.
- **Structure:** ticker tag (mono, hidden if the article isn't ticker-specific) → headline (display-weight, but smaller than the hero H1) → source/time meta (mono) → summary (body voice) → an explicit "Leer artículo original ↗" link, hidden when no source URL exists.
- **Style:** `--panel` background, 2px navy top border (see Shapes), 4px radius, modal-float shadow, over a navy-tinted scrim.
- **Dismissal:** close button (pill, top-right), click on the scrim, or Escape. Background scroll is locked while open.

### Stock Detail Modal (signature component)
- **Purpose:** a ledger row is necessarily terse (one line, truncated blurb); clicking it opens the full picture — large price/change, an enlarged chart, and every related headline — without leaving the page. This is the main answer to "the table reads like a spreadsheet": real content on demand, not decoration.
- **Structure:** ticker + company name + large price/change (mirrors the ledger row's data, just bigger) → sentiment tag → enlarged chart → an honest caption stating what the chart is built from → "Noticias relacionadas" list filtered to that ticker.
- **The chart is real candles when the pipeline has them.** Once `daily_ohlc.json` has data for a ticker (Alpha Vantage `TIME_SERIES_DAILY`, fetched once a day — see `pipeline/README.md`), the modal renders genuine open/high/low/close candlesticks: a wick from high to low, a body from open to close, colored by direction. Before that first daily fetch lands (or for a ticker Alpha Vantage has no data for), it falls back to the same accumulated `price_history.json` line chart as before, and the caption changes to match which one is showing — never claims candle precision it doesn't have.
- **Related news are clickable too:** each item swaps this modal for the News Modal with that article — a chain, not a dead end. An empty state ("Sin noticias recientes para este ticker") is shown honestly rather than hidden.
- **Style:** same recipe as the News Modal (navy top border, `--panel` background, modal-float shadow) but wider (`600px` vs `520px`) to fit the chart.

### Stat Block (Fundamentals Grid, Hero Stats)
- **Purpose:** the one reusable way to show 2-6 labeled numbers side by side — the sector hero's up-count/avg-change/news-count, and the Stock Detail Modal's P/E, market cap, 52-week range, EPS, ROE, and net margin.
- **Structure:** `stat-value` (monospace, tabular-nums, bold) stacked over `stat-label` (small, `--text-faint`, sentence case), in a `repeat(3, 1fr)` grid with a hairline top border. The fundamentals grid additionally gets a hairline bottom border since it sits mid-modal, not at a section's end.
- **Missing data:** shown honestly as a muted "N/D" in place of the value — never a fabricated number, never the row silently disappearing. Finnhub's free-tier coverage varies by ticker, so this state is common, not an edge case.

### Fundamentals Glossary (collapsible)
- **Purpose:** the Stat Block shows numbers, not meaning — P/E, ROE, and net margin are opaque to anyone outside finance. Rather than explaining them to everyone by default, a "¿Qué significan estos números?" text toggle sits right under the grid, collapsed by default, and expands into plain-language definitions in place.
- **Why contextual, not a page-level panel:** the explanation only matters at the exact moment someone is looking at unfamiliar numbers. A permanent panel on the main page would be noise for the (majority of) visitors who already know what a P/E is, and would be disconnected from the numbers it explains.
- **Style:** a `<dl>` of term/definition pairs — `dt` in the monospace label voice, `dd` in small prose — separated by hairlines, closing with an italic one-line disclaimer ("información educativa, no asesoría de inversión"). The toggle itself is a plain text button, no border or fill, with a chevron that rotates 180° on expand.

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

### Hero Movers
- **Purpose:** fills the hero-text column's remaining space below the badges with real, useful data instead of decoration — the sector's top gainer and top loser, computed client-side from `STOCKS` on every render. Replaced an illustrated-asset attempt the user rejected outright ("pésimo") after seeing it installed; the lesson taken was to reach for real data before reaching for imagery.
- **Structure:** a small label ("Mayor suba" / "Mayor baja") over a `stock-tag` (reusing the existing ticker pill with its trend glyph, so no new visual language) plus the change percentage in the tabular-nums data voice. Separated from the badges above by a hairline, echoing the Stat Block's own top-hairline convention.
- **Interaction:** each one is a real button; clicking either opens the Stock Detail Modal for that ticker, same as clicking its row in the ledger below — one more path to the same destination, not a dead-end decoration.

### Inputs
- **Style:** 4px radius (sharp, matches the panel language, not the pill language), `--line-strong` border, `--panel` background.
- **Focus:** border shifts to `--accent`; no glow, no shadow — consistent with Flat-By-Default.

### Ticker Tape (signature component)
- **Style:** full-bleed strip, `--panel` background, top and bottom hairlines, continuously scrolling monospace items (ticker / price / change, tabular-nums) separated by hairline rules. Pauses on hover; falls back to a manually scrollable static strip under `prefers-reduced-motion`.

### Preloader
- **Purpose:** covers the empty-shell flash while `init()` fetches `data.json` and renders — and doubles as a brand moment, the logo the visitor sees for a beat before the page proper appears.
- **Structure:** a fixed, full-viewport `--paper` overlay, centered flex column: the 40px brand mark with a slow scale/opacity pulse, and the wordmark below it (same "AI Stocks **Pulse**" markup and accent-on-"Pulse" treatment as the topbar's brand lockup).
- **Timing:** removed from `init()` once real content has painted, not on a fixed timer or on window `load` (which would wait on fonts/icons that don't block first paint) — `load` is kept only as a safety net in case `init()` throws. A 250ms floor keeps it from flashing imperceptibly on a fast local fetch. Fades via opacity over 0.4s, then the node is removed from the DOM entirely.
- **Motion:** the pulse animation is skipped under `prefers-reduced-motion`.

### Navigation (topbar)
- **Style:** single row, 68px tall (auto height under 640px), brand mark + wordmark left, market status pill + demo/live status pill + install button right. No shadow, no border — separated from the ticker tape below it only by the tape's own top hairline.

### Market Status Pill
- **Purpose:** a small credibility detail — "Mercado abierto" / "Mercado cerrado" for NYSE/Nasdaq regular trading hours (9:30–16:00 America/New_York, weekdays), computed client-side from `Intl.DateTimeFormat` (so DST is handled correctly without manual offset math) and refreshed every 60 seconds without a page reload.
- **Style:** identical recipe to the demo/live pill next to it (hairline border, leading dot, `--rise` + halo when "open," `--text-faint` when "closed") so the two read as one family of status indicators, not two different components.
- **Known simplification, stated honestly:** doesn't account for market holidays (Thanksgiving, etc.) — weekday + hours only. Hidden on mobile (`< 640px`) along with the demo/live pill to keep the topbar uncluttered at that width.

## Do's and Don'ts

### Do:
- **Do** keep Ledger Navy as the only accent, used identically everywhere — one color, not "a primary and a rare secondary."
- **Do** run every number, ticker, and short label through the monospace label voice with `tabular-nums`; keep sentences in the sans.
- **Do** use hairlines and tonal shifts for hierarchy and depth; reach for a shadow only for the toast and the two modals — things genuinely floating above the page.
- **Do** apply the pill radius to anything clickable or status-bearing, and the 4px radius to anything you read data or an article inside of — no other radius value.
- **Do** let a visitor read an article summary in place (the modal) rather than redirecting them off the page by default; the external link stays available but explicit.
- **Do** make every ledger row a door to a richer detail view (chart + related news) rather than adding decorative imagery to fill space — a data table's answer to "feels empty" is more real content, not illustration.
- **Do** be explicit about which chart a visitor is looking at — the Stock Detail Modal's caption always says whether it's real daily OHLC candles or the line-chart fallback, never implying more precision than the pipeline actually has for that ticker right now.
- **Do** treat real data (sparklines, the composite chart, the ticker tape) as the page's visual anchor instead of decorative imagery.

### Don't:
- **Don't** introduce a second accent color, warm-tinted neutrals, or a dark mode — this cool-neutral, single-navy-accent palette is a deliberate commitment made after three prior directions (black terminal, sage ledger paper, parchment-and-gold) were tried and moved away from, each for a specific, remembered reason (too generic, didn't feel financial, more editorial than "commonly used and comfortable").
- **Don't** add drop shadows to permanent in-flow elements (cards, rows, panels) — only the toast and the two modals get one.
- **Don't** default to rounded-lg (8–16px) cards; the system has exactly two radii and both are already assigned.
- **Don't** reach for a three-equal-column card grid for the stock list — it's a ledger table with a shared column grid, not a card grid.
- **Don't** add gradients, glows, or glossy/3D abstract imagery — explicitly tried and rejected during this project for reading as generic AI-generated art.
- **Don't** make a news row (or any link out of the page) navigate automatically on click — the summary appears in place first; leaving the page is the visitor's explicit next choice, not the default one.
