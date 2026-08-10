---
name: AI Stocks Pulse
description: A daily one-page reader for the AI stocks sector — price ledger, composite chart, and curated news.
colors:
  paper: "#eef2ea"
  panel: "#ffffff"
  panel-raised: "#f6f9f2"
  hairline: "#dde3d6"
  hairline-strong: "#c5cdbc"
  ink: "#1c231d"
  ink-dim: "#5c6a5c"
  ink-faint: "#8b9789"
  accent-navy: "#2d4a6b"
  accent-navy-dim: "rgba(45, 74, 107, 0.1)"
  rise-green: "#2f7a4f"
  rise-green-dim: "rgba(47, 122, 79, 0.1)"
  fall-red: "#a13a2f"
  fall-red-dim: "rgba(161, 58, 47, 0.1)"
  mixed-ochre: "#8a7233"
  mixed-ochre-dim: "rgba(138, 114, 51, 0.1)"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "0.98rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', 'Roboto Mono', Menlo, Consolas, 'Liberation Mono', monospace"
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
    backgroundColor: "{colors.mixed-ochre-dim}"
    textColor: "{colors.mixed-ochre}"
    rounded: "{rounded.pill}"
---

# Design System: AI Stocks Pulse

## Overview

**Creative North Star: "The Quiet Terminal"**

A calm, considered instrument for reading the AI stocks sector — not another black AI-dashboard clone with a purple-to-teal glow, and not generic glossy abstract art either (both were tried and explicitly rejected during this project). The system borrows its materiality from the accounting ledger — pale sage paper, near-black ink, red ink for losses — and its discipline from a financial terminal: tabular numbers, a real ticker tape, a real composite chart. Nothing performs; everything reports.

The system is deliberately single-theme (light only). A ledger page doesn't have a dark mode any more than a terminal has a light one — committing to one world was a conscious choice, not an omission.

**Key Characteristics:**
- Pale sage-green paper background, never pure white or black
- One accent color (fountain-pen navy) reserved for brand/interactive moments only
- A separate, distinct semantic triad (green/red/ochre) for rise/fall/mixed — never reuses the accent hue
- Two deliberate type voices: a plain sans for reading, a tracked-out monospace for every number and label
- Flat surfaces, hairline dividers, real data visualizations (ticker tape, composite chart, sparklines) instead of decorative imagery

## Colors

A desaturated, paper-and-ink palette: one considered accent, a separate semantic triad, and neutrals with a consistent sage-green bias rather than true grays.

### Primary
- **Fountain-Pen Navy** (`#2d4a6b`): the single accent. Brand mark, active filter state, focus rings, hairline accent on the hero panel, hover states on links/ghost buttons. Used sparingly — its rarity is the point (see The One Voice Rule).

### Secondary (semantic — separate from the accent, never overlapping it)
- **Ledger Green** (`#2f7a4f`): price rises, bullish tags, "live" status dot.
- **Ledger Red** (`#a13a2f`): price falls, bearish tags — literally "in the red."
- **Ledger Ochre** (`#8a7233`): mixed/neutral sentiment, the third state between rise and fall.

### Neutral
- **Ledger Sage** (`#eef2ea`): page background (`--paper`). Never pure white.
- **Panel White** (`#ffffff`): card/panel surface — the hero readout, ticker tape, toast — distinguishable from the page itself.
- **Raised Sage** (`#f6f9f2`): subtle hover tint for ledger rows (`--panel-raised`).
- **Sage Hairline** (`#dde3d6`): the default divider — between ledger rows, news rows, ticker items.
- **Sage Rule** (`#c5cdbc`): a stronger hairline for structural borders (input/chip outlines, the ledger header rule).
- **Ledger Ink** (`#1c231d`): primary text. Near-black with a deliberate green bias, never a true black.
- **Faded Ink** (`#5c6a5c`): secondary text (sub-copy, blurbs, chip labels at rest).
- **Pencil Grey** (`#8b9789`): tertiary/faint text (captions, stat labels, placeholders).

### Named Rules
**The One Voice Rule.** Fountain-Pen Navy is the only brand accent on the page. It never appears twice for two different reasons in the same view — if a color is doing semantic work (rise/fall/mixed), it is never navy.

**The No-Black Rule.** No `#000000` and no `#ffffff` stands alone as a surface without the sage bias — even "white" panels sit on sage paper, and "black" text carries a green undertone. Pure neutrals read as generic; the tint is what makes it this system.

## Typography

**Display Font:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif (system sans)
**Body Font:** same system sans stack as Display
**Label/Mono Font:** ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", Menlo, Consolas, "Liberation Mono", monospace

**Character:** Two voices doing two different jobs, not one family styled two ways. The system sans reads like prose — the hero headline, the sector summary, news headlines. The monospace is the "data voice": every price, every percentage, every ticker, every timestamp, every uppercase label runs through it, in tracked-out capitals. The contrast between the two is the system's main typographic move.

### Hierarchy
- **Display** (700, `clamp(1.6rem, 3vw, 2.3rem)`, 1.2 line-height, -0.015em tracking): the hero H1 only. `text-wrap: balance` keeps it from ragging badly at any width.
- **Body** (400, 0.98rem–1rem, 1.55–1.65 line-height): sector summary, hero subhead, news headlines, stock blurbs. Capped near 46ch on the widest body block.
- **Label** (600, 0.63rem–0.78rem, uppercase, 0.02–0.12em tracking, monospace): eyebrows, filter chips, badges, stat labels, table headers, ticker items. This tier doubles as the numeric voice — every price and percentage uses `font-variant-numeric: tabular-nums` so columns of digits align.

### Named Rules
**The Two-Voice Rule.** If it's read, it's the sans. If it's a number, a ticker, or a short label, it's the tracked-out monospace. Never mix the two within a single value (a price is never set in the sans; a headline is never set in mono).

## Layout

A single centered column, `max-width: 1180px`, 24px side padding (16px under 640px). Vertical rhythm is generous by design — section padding runs 40–56px top on desktop, tightened but never removed on mobile — because the brief was explicitly "more minimalist," not dense.

The hero is the one asymmetric moment: a 1.15fr/0.85fr split (text left, readout panel right) that collapses to a single column under 860px. Below the hero, everything else is a single-column stack: ticker tape (full-bleed, edge-to-edge), then the ledger table, then the news list.

The stock ledger uses a fixed column template (`minmax(190px, 1.6fr) 88px 78px 116px 92px` — company / price / change / trend / signal) shared between the header row and every data row, so columns stay aligned. Under 640px this collapses to a 2-column stacked layout per row (id spans full width, price/change pair up, sparkline and tag each span full width) rather than trying to preserve five columns on a phone.

## Elevation & Depth

Flat by default — no ambient drop shadows anywhere in the resting UI. Depth is conveyed by hairline dividers (`--line` / `--line-strong`) and small tonal shifts (`--panel` vs `--panel-raised` on row hover), not by shadow layering. This matches the ledger-paper metaphor: paper doesn't float.

### Shadow Vocabulary
- **Toast float** (`box-shadow: 0 10px 30px -12px rgba(28, 35, 29, 0.35)`): the one deliberate exception. The toast is a transient overlay that must read as sitting above the page, so it's the only element allowed a real shadow.
- **Live-status halo** (`box-shadow: 0 0 0 3px var(--rise-dim)`): not elevation — a soft focus ring around the "live" status dot when data is real (vs. demo).

### Named Rules
**The Flat-By-Default Rule.** Elevation is earned only by things that are genuinely temporary or floating above the page (the toast). A permanent, in-flow element never gets a drop shadow — use a hairline or a tonal shift instead.

## Shapes

Two radii, applied by role, never mixed within it:
- **Pill (`999px`)**: every interactive/status element — buttons, filter chips, badges (sentiment, demo/live pill, stock tags), the toast.
- **Sharp (`4px`)**: every structural container — the hero readout panel, the search input. Reads closer to a cut paper edge than a soft app card.

Borders are hairlines throughout (1px), never thick. The one deliberate exception is the hero panel's 2px navy top border — a single accent stroke marking it as "the instrument," distinct from the passive hairlines everywhere else.

### Named Rules
**The Two-Radius Rule.** If it's something you click or a status you read, it's a pill. If it's something you read data inside of, it's 4px. No third radius, no card-style 12–16px anywhere.

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

### News Row
- **Style:** same hairline-row logic as the ledger, but 3-column (status dot / headline+meta / ticker tag). A 7×7px rounded-square dot (not a circle) carries semantic color; the ticker tag renders as bracketed monospace text (`[NVDA]`) rather than a pill, keeping the row visually quieter than the ledger's tagged rows.

### Sentiment / Status Badges
- **Style:** pill, tinted background at ~10% opacity of the semantic color, full-opacity text in the same color. Same recipe for sector sentiment, per-stock tags, and the demo/live status pill (which uses green when live, neutral gray dot otherwise).
- **State:** the demo/live pill additionally gets a small leading dot; when live, the dot carries the halo shadow described in Elevation.

### Inputs
- **Style:** 4px radius (sharp, matches the panel language, not the pill language), `--line-strong` border, `--panel` background.
- **Focus:** border shifts to `--accent`; no glow, no shadow — consistent with Flat-By-Default.

### Ticker Tape (signature component)
- **Style:** full-bleed strip, `--panel` background, top and bottom hairlines, continuously scrolling monospace items (ticker / price / change, tabular-nums) separated by hairline rules. Pauses on hover; falls back to a manually scrollable static strip under `prefers-reduced-motion`.

### Navigation (topbar)
- **Style:** single row, 68px tall (auto height under 640px), brand mark + wordmark left, status pill + install button right. No shadow, no border — separated from the ticker tape below it only by the tape's own top hairline.

## Do's and Don'ts

### Do:
- **Do** keep the accent (Fountain-Pen Navy) exclusive to brand/interactive moments — never reuse it for rise/fall/mixed semantics.
- **Do** run every number, ticker, and short label through the monospace label voice with `tabular-nums`; keep sentences in the sans.
- **Do** use hairlines and tonal shifts for hierarchy and depth; reach for the toast's shadow only for genuinely floating, temporary UI.
- **Do** apply the pill radius to anything clickable or status-bearing, and the 4px radius to anything you read data inside of — no other radius value.
- **Do** treat real data (sparklines, the composite chart, the ticker tape) as the page's visual anchor instead of decorative imagery — this project explicitly rejected a generated abstract-art background for looking generic and off-palette.

### Don't:
- **Don't** introduce a dark mode or a black background — the light ledger-paper world is a deliberate, single-theme commitment established after two prior directions (black terminal, then this) were tried and moved away from.
- **Don't** add drop shadows to permanent in-flow elements (cards, rows, panels).
- **Don't** default to rounded-lg (8–16px) cards; the system has exactly two radii and both are already assigned.
- **Don't** reach for a three-equal-column card grid for the stock list — it's a ledger table with a shared column grid, not a card grid, and that structural choice is what keeps this page from reading as a generic dashboard.
- **Don't** add gradients, glows, or glossy/3D abstract imagery — explicitly tried and rejected during this project for reading as generic AI-generated art.
