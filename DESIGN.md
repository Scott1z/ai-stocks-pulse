---
name: AI Stocks Pulse
description: A daily one-page reader for the AI stocks sector — price ledger, composite chart, and curated news.
colors:
  paper: "#f3efe2"
  panel: "#fffdf7"
  panel-raised: "#ece4cf"
  hairline: "#ddd3ba"
  hairline-strong: "#c7ba98"
  ink: "#16212f"
  ink-dim: "#5a6472"
  ink-faint: "#8b93a0"
  accent-navy: "#1c3a5e"
  accent-navy-dim: "rgba(28, 58, 94, 0.1)"
  accent-gold: "#b8933f"
  accent-gold-dim: "rgba(184, 147, 63, 0.14)"
  rise-green: "#2e7d4f"
  rise-green-dim: "rgba(46, 125, 79, 0.1)"
  fall-red: "#9e3a2f"
  fall-red-dim: "rgba(158, 58, 47, 0.1)"
  mixed-slate: "#5b6b7a"
  mixed-slate-dim: "rgba(91, 107, 122, 0.1)"
typography:
  display:
    fontFamily: "'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "clamp(1.6rem, 3vw, 2.3rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  body:
    fontFamily: "'General Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
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

A calm, considered instrument for reading the AI stocks sector — not another black AI-dashboard clone with a purple-to-teal glow, not generic glossy abstract art, and not eco-toned ledger paper either (all three were tried and explicitly rejected during this project, the last for "not feeling like finance"). The system now borrows its materiality from the engraved stock certificate — warm parchment, navy ink, a rare stroke of gold — the dual-tone financial institutions have used on certificates and letterhead for a century. Its discipline still comes from a terminal: tabular numbers, a real ticker tape, a real composite chart. Nothing performs; everything reports.

The system is deliberately single-theme (light only). This material doesn't have a dark mode any more than a certificate does — committing to one world was a conscious choice, not an omission.

**Key Characteristics:**
- Warm parchment background, never green-tinted, pure white, or black
- Navy as the primary interactive accent; gold as a deliberately scarce second accent (never both at once in the same moment)
- A separate, distinct semantic triad (green/red/slate) for rise/fall/mixed — never reuses either accent hue
- Two deliberate type voices: a plain sans for reading, a tracked-out monospace for every number and label
- Flat surfaces, hairline dividers, real data visualizations (ticker tape, composite chart, sparklines) instead of decorative imagery
- Reading an article's summary happens in place (a modal), never an automatic redirect off the page

## Colors

A warm parchment-and-ink palette: two accents used for different jobs, a separate semantic triad, and neutrals with a consistent warm-paper bias rather than true grays.

### Primary
- **Fountain-Pen Navy** (`#1c3a5e`): the primary accent. Brand mark, active filter state, focus rings, links, hover states on ghost buttons. Used often, but never for anything semantic.

### Secondary (semantic — separate from both accents, never overlapping them)
- **Ledger Green** (`#2e7d4f`): price rises, bullish tags, "live" status dot.
- **Ledger Red** (`#9e3a2f`): price falls, bearish tags — literally "in the red."
- **Ink Slate** (`#5b6b7a`): mixed/neutral sentiment, the third state between rise and fall.

### Tertiary — rare, deliberate
- **Certificate Gold** (`#b8933f`): the scarce second accent. Used in exactly two places by design: the hero panel's top border (marking it as "the instrument") and the news-modal panel's top border. Never a fill, never body text, never used alongside navy for the same purpose — if navy is doing the job, gold doesn't also appear.

### Neutral
- **Parchment** (`#f3efe2`): page background (`--paper`). Warm, not green — the paper of a certificate, not a plant.
- **Certificate White** (`#fffdf7`): card/panel surface — the hero readout, ticker tape, modal, toast — distinguishable from the page itself, still warm-toned rather than clinical white.
- **Raised Parchment** (`#ece4cf`): subtle hover tint for ledger rows and news rows (`--panel-raised`).
- **Parchment Hairline** (`#ddd3ba`): the default divider — between ledger rows, news rows, ticker items.
- **Parchment Rule** (`#c7ba98`): a stronger hairline for structural borders (input/chip outlines, the ledger header rule).
- **Navy Ink** (`#16212f`): primary text. Near-black with a deliberate navy bias, never a true black.
- **Faded Ink** (`#5a6472`): secondary text (sub-copy, blurbs, chip labels at rest).
- **Pencil Grey** (`#8b93a0`): tertiary/faint text (captions, stat labels, placeholders).

### Named Rules
**The One Voice Rule.** Fountain-Pen Navy is the primary accent; Certificate Gold is a rare second one. Neither ever does semantic work — if a color means rise/fall/mixed, it is never navy or gold.

**The No-Black Rule.** No `#000000` and no clinical `#ffffff` stands alone as a surface without the warm-parchment bias — even "white" panels sit on parchment, and "black" text carries a navy undertone. Pure neutrals read as generic; the warmth is what makes it this system.

**The Gold Scarcity Rule.** Gold appears in exactly two places (hero panel border, modal panel border) and nowhere else. The moment gold shows up a third time, it stops reading as "rare" and starts reading as decoration — don't let that happen.

## Typography

**Display Font:** General Sans (self-hosted, `fonts/GeneralSans-*.woff2`; falls back to the OS system sans if it fails to load)
**Body Font:** same General Sans stack as Display

General Sans was chosen specifically as an open-license alternative to SF Pro — actual SF Pro isn't redistributable on the open web, and the previous system-font stack fell back to Segoe UI on Windows and Roboto on Android, which read as generic and inconsistent with the "considered instrument" character the rest of the system commits to. Self-hosted (not a CDN link) so it works offline in the PWA and doesn't depend on a third party at runtime.
**Label/Mono Font:** ui-monospace, "SF Mono", "Cascadia Code", "Roboto Mono", Menlo, Consolas, "Liberation Mono", monospace

**Character:** Two voices doing two different jobs, not one family styled two ways. The system sans reads like prose — the hero headline, the sector summary, news headlines, the modal's article summary. The monospace is the "data voice": every price, every percentage, every ticker, every timestamp, every uppercase label runs through it, in tracked-out capitals. The contrast between the two is the system's main typographic move.

### Hierarchy
- **Display** (700, `clamp(1.6rem, 3vw, 2.3rem)`, 1.2 line-height, -0.015em tracking): the hero H1 only. `text-wrap: balance` keeps it from ragging badly at any width.
- **Body** (400, 0.95rem–1rem, 1.55–1.65 line-height): sector summary, hero subhead, news headlines, stock blurbs, the modal's article summary.
- **Label** (600, 0.63rem–0.78rem, uppercase, 0.02–0.12em tracking, monospace): eyebrows, filter chips, badges, stat labels, table headers, ticker items, the modal's ticker tag and meta line. This tier doubles as the numeric voice — every price and percentage uses `font-variant-numeric: tabular-nums` so columns of digits align.

### Named Rules
**The Two-Voice Rule.** If it's read, it's the sans. If it's a number, a ticker, or a short label, it's the tracked-out monospace. Never mix the two within a single value (a price is never set in the sans; a headline is never set in mono).

## Layout

A single centered column, `max-width: 1180px`, 24px side padding (16px under 640px). Vertical rhythm is generous by design — section padding runs 40–56px top on desktop, tightened but never removed on mobile.

The hero is the one asymmetric moment: a 1.15fr/0.85fr split (text left, readout panel right) that collapses to a single column under 860px. Below the hero: ticker tape (full-bleed, edge-to-edge), then the ledger table, then the news list.

The stock ledger uses a fixed column template (`minmax(190px, 1.6fr) 88px 78px 116px 92px` — company / price / change / trend / signal) shared between the header row and every data row, so columns stay aligned. Under 640px this collapses to a 2-column stacked layout per row rather than preserving five columns on a phone.

The news modal centers over the page with a fixed-position dark scrim behind it (`rgba(22, 33, 47, 0.45)`), capped at `520px` wide and `85vh` tall with internal scroll — never full-screen, always readable as "a card lifted above the page," dismissible by close button, clicking the scrim, or Escape.

## Elevation & Depth

Flat by default — no ambient drop shadows anywhere in the resting UI. Depth is conveyed by hairline dividers and small tonal shifts (`--panel` vs `--panel-raised` on row hover), not by shadow layering. Paper doesn't float — except the two things that genuinely do.

### Shadow Vocabulary
- **Toast float** (`box-shadow: 0 10px 30px -12px rgba(22, 33, 47, 0.35)`): the transient status toast.
- **Modal float** (`box-shadow: 0 20px 50px -16px rgba(22, 33, 47, 0.4)`): the news-summary modal — heavier than the toast because it sits over a dark scrim and needs to read as clearly detached from the page beneath it.
- **Live-status halo** (`box-shadow: 0 0 0 3px var(--rise-dim)`): not elevation — a soft focus ring around the "live" status dot when data is real (vs. demo).

### Named Rules
**The Flat-By-Default Rule.** Elevation is earned only by things that are genuinely temporary or floating above the page (the toast, the modal). A permanent, in-flow element never gets a drop shadow — use a hairline or a tonal shift instead.

## Shapes

Two radii, applied by role, never mixed within it:
- **Pill (`999px`)**: every interactive/status element — buttons, filter chips, badges (sentiment, demo/live pill, stock tags), the toast, the modal's close button.
- **Sharp (`4px`)**: every structural container — the hero readout panel, the search input, the news modal panel. Reads closer to a cut paper edge than a soft app card.

Borders are hairlines throughout (1px), never thick. The two deliberate exceptions are the hero panel's and the modal panel's 2px gold top borders — see The Gold Scarcity Rule.

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

### News Row
- **Style:** same hairline-row logic as the ledger, but 3-column (status dot / headline+meta / ticker tag). A 7×7px rounded-square dot carries semantic color; the ticker tag renders as bracketed monospace text (`[NVDA]`).
- **Interaction:** the entire row is clickable/focusable (`role="button"`, `tabindex="0"`) — clicking or pressing Enter/Space opens the News Modal with that article's summary. It never navigates away on its own; leaving the page to read the original source is an explicit, separate choice made inside the modal.
- **Hover/Focus:** `--panel-raised` background tint, same as a ledger row.

### News Modal (signature component)
- **Purpose:** read a curated ~25-word summary of an article without leaving the page — the site's whole premise is "the story in 30 seconds," so a redirect-by-default was working against that.
- **Structure:** ticker tag (mono, hidden if the article isn't ticker-specific) → headline (display-weight, but smaller than the hero H1) → source/time meta (mono) → summary (body voice) → an explicit "Leer artículo original ↗" link, hidden when no source URL exists.
- **Style:** `--panel` background, 2px gold top border (see Shapes), 4px radius, modal-float shadow, over a navy-tinted scrim.
- **Dismissal:** close button (pill, top-right), click on the scrim, or Escape. Background scroll is locked while open.

### Sentiment / Status Badges
- **Style:** pill, tinted background at ~10–14% opacity of the semantic/accent color, full-opacity text in the same color. Same recipe for sector sentiment, per-stock tags, and the demo/live status pill.
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
- **Do** keep Fountain-Pen Navy as the everyday interactive accent, and Certificate Gold rare (exactly two borders, nowhere else) — never let either do rise/fall/mixed semantic work.
- **Do** run every number, ticker, and short label through the monospace label voice with `tabular-nums`; keep sentences in the sans.
- **Do** use hairlines and tonal shifts for hierarchy and depth; reach for a shadow only for the toast and the modal — things genuinely floating above the page.
- **Do** apply the pill radius to anything clickable or status-bearing, and the 4px radius to anything you read data or an article inside of — no other radius value.
- **Do** let a visitor read an article summary in place (the modal) rather than redirecting them off the page by default; the external link stays available but explicit.
- **Do** treat real data (sparklines, the composite chart, the ticker tape) as the page's visual anchor instead of decorative imagery.

### Don't:
- **Don't** introduce a dark mode or a black background, and don't drift back toward green-tinted "eco" paper — parchment-and-navy-and-gold is a deliberate commitment made after two prior directions (black terminal, then sage ledger paper) were tried and moved away from, the second explicitly for "not feeling like finance."
- **Don't** add drop shadows to permanent in-flow elements (cards, rows, panels) — only the toast and the modal get one.
- **Don't** default to rounded-lg (8–16px) cards; the system has exactly two radii and both are already assigned.
- **Don't** reach for a three-equal-column card grid for the stock list — it's a ledger table with a shared column grid, not a card grid.
- **Don't** add gradients, glows, or glossy/3D abstract imagery — explicitly tried and rejected during this project for reading as generic AI-generated art.
- **Don't** make a news row (or any link out of the page) navigate automatically on click — the summary appears in place first; leaving the page is the visitor's explicit next choice, not the default one.
