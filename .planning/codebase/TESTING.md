# Testing Patterns

**Analysis Date:** 2026-08-11

## There is no automated test suite in this repository

This was verified directly, not assumed:

- No test files exist anywhere in the repo: `find . -iname "*test*" -not -path "./.git/*"` returns zero results (no `*.test.js`, `*.spec.js`, `test_*.py`, `*_test.py`, `test/`, `tests/`, or `__tests__/` directory).
- No JS test runner is configured: there is no `package.json` at all in the repo, so there is no `test` script, no Jest/Vitest/Mocha/Playwright/Cypress dependency, and no `jest.config.*`/`vitest.config.*`/`playwright.config.*` file.
- No Python test runner is configured: `pipeline/requirements.txt` contains exactly one dependency (`anthropic>=0.121.0,<1.0.0`) — no `pytest`, no `unittest` extras, nothing test-related. `grep -rn "pytest\|unittest"` across the entire repo (all file types) returns zero matches.
- No lint/format/typecheck config exists either (`.eslintrc*`, `.prettierrc*`, `eslint.config.*`, `biome.json`, `mypy.ini`, `pyrightconfig.json` — none present), so there is no static-analysis safety net standing in for tests.
- CI (`.github/workflows/refresh-data.yml`) runs exactly one job, `refresh`, with four steps: checkout, set up Python 3.12, `pip install -r pipeline/requirements.txt`, `python3 pipeline/fetch_and_curate.py`, then commit+push the resulting data files. **There is no test step in CI** — the workflow's only job is to execute the real pipeline against real APIs and commit the output; it is a scheduled data-refresh job (hourly cron + manual `workflow_dispatch`), not a CI/test pipeline. A failed pipeline run simply fails that GitHub Actions run (visible in the Actions tab) and leaves the previous `data.json` committed — there is no automated regression check.

**Do not assume a test framework exists or invent test file locations/naming conventions.** If asked to "add tests," there is no existing convention to extend — a testing setup would need to be introduced from scratch, and the choice of framework/structure should be raised as an explicit decision, not inferred from this codebase.

## How verification is actually done instead

**Frontend (`app.js`, `styles.css`, `index.html`, `service-worker.js`): manual browser verification against a local static server.**
- The site is 100% static with zero build step, so "testing" a change means serving the repo root over HTTP and reloading in a browser. `fetch("data.json", ...)` (`app.js:389`) requires an `http(s)://` origin — opening `index.html` directly via `file://` will not work for the real-data path (though it will still render, since `loadData()` falls back to `DEMO_*` data on fetch failure — see `CONVENTIONS.md` § Error Handling). Serve locally with any static file server, e.g.:
  ```bash
  python3 -m http.server 8000
  # then open http://localhost:8000/
  ```
- Verification is ad hoc and manual: reload the page, exercise the changed feature by hand (click through modals, toggle filters, check both themes, check the "DATOS DE DEMOSTRACIÓN" vs "DATOS EN VIVO" pill via `renderDataSourcePill()`), and visually confirm the result. There is no scripted/automated way to assert this.
- Evidence this is the established practice, found in the project's own documentation (not just inferred): `PRODUCT.md:55` describes a security fix for `escapeHtml()` as "confirmed by test with a `<img onerror=...>` payload that it renders as inert text, not markup" — i.e., a manual one-off check performed once in a browser, not a committed regression test. `DESIGN.md:303` similarly notes a canvas/theme feature was "verified both ways in testing" (light and dark) — again, manual, not automated.
- Cross-browser/PWA-specific checks (service worker caching, install prompt, offline behavior) are necessarily manual too, since there is no headless-browser or PWA-testing tooling configured (no Playwright/Puppeteer/Lighthouse-CI config anywhere in the repo).
- No visual regression tooling, no accessibility test automation (`aria-*` attributes and semantic HTML in `index.html`/`app.js` are hand-verified, not asserted by e.g. axe-core).

**Pipeline (`pipeline/fetch_and_curate.py`): one-off, uncommitted Python scripts using `unittest.mock`, run via a shell and discarded.**
- The commit history documents this practice explicitly. Commit `06096fb` ("Fix crítico: el pipeline se rompía y dejaba de actualizar todo") states in its message: *"Verificado con payloads simulados (respuesta de rate-limit, estimate no numérico, excepción inesperada a mitad del batch de OHLC): en los tres casos ya no crashea y persiste lo que se pudo obtener."* ("Verified with simulated payloads... in all three cases it no longer crashes and persists what could be obtained.") — this describes writing a throwaway script that mocked bad API responses (an Alpha Vantage rate-limit response instead of real CSV, a non-numeric `estimate` field, a mid-batch exception) to exercise the try/except fixes in `fetch_earnings_calendar()` and `fetch_daily_batch()` (see `CONVENTIONS.md` § Error Handling for the actual code). That script is not checked into the repo — it does not exist anywhere in the working tree or git history (confirmed: no `test_*.py`/`*_test.py` file in any commit).
- This is the expected pattern for verifying pipeline changes going forward: write a small local script (or interactive Python session) that imports the relevant function(s) from `pipeline/fetch_and_curate.py`, monkeypatches/mocks `urlopen` (or the specific `fetch_*` function) with `unittest.mock.patch`/`Mock` to return a crafted bad/edge-case payload, calls the function, and asserts on the result by hand (print + eyeball, or a bare `assert`) — then discard the script rather than committing it. Do not create a `pipeline/test_*.py` file expecting it to be picked up by any runner; nothing in this repo will execute it automatically.
- The safe way to test real API integration end-to-end is the documented manual flow in `pipeline/README.md`: set up a `.venv`, copy `.env.example` to `.env`, fill in the three real API keys (Alpha Vantage, Finnhub, Anthropic), export them into the shell, and run `python3 fetch_and_curate.py` directly. Success looks like the printed summary line `OK — 50 precios, 8 noticias, 6 resultados próximos y 41 últimos resultados reportados escritos en .../data.json`; the change is then verified by opening `../data.json` and reloading the frontend to confirm the "DATOS DE DEMOSTRACIÓN" pill switches to "DATOS EN VIVO" (`pipeline/README.md`, "Probalo a mano" section). This costs real API quota (Finnhub 60 calls/min free tier, Alpha Vantage 25 requests/day free tier — see `pipeline/README.md` for the full budget breakdown), so it is not something to run repeatedly/automatically.
- `fetch_and_curate.py` never talks to real external services unless invoked with all three env vars present — each fetch function calls `sys.exit()` immediately if its required key is missing (see `CONVENTIONS.md` § Error Handling), so a script that only exercises the pure/local functions (`pre_filter()`, `_mentions()`, `_first_number()`, `_strip_markdown_fence()`, `update_price_history()`, `update_summary_archive()`) can be run safely without any API keys at all, since those functions take plain Python data structures in and out and don't call `urlopen` themselves.

## Run Commands

```bash
# Frontend — serve locally (any static server works, this is the simplest):
python3 -m http.server 8000
# open http://localhost:8000/ and verify by hand in the browser

# Pipeline — run for real against live APIs (costs real API quota):
cd pipeline
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in ALPHAVANTAGE_API_KEY, FINNHUB_API_KEY, ANTHROPIC_API_KEY
export $(grep -v '^#' .env | xargs)
python3 fetch_and_curate.py
# success = "OK — N precios, N noticias, ..." printed to stdout;
# then inspect ../data.json and reload the frontend

# Pipeline — verify a fix without hitting real APIs (ad hoc, not committed):
# write a throwaway script, e.g. in a scratch file, that does:
#   from unittest.mock import patch, Mock
#   import fetch_and_curate as p
#   with patch("fetch_and_curate.urlopen") as mock_urlopen:
#       mock_urlopen.return_value.__enter__.return_value.read.return_value = b"<bad payload>"
#       result = p.fetch_earnings_calendar(p.AI_TICKERS)
#       assert result == [], result
# run it directly with python3, delete it when done — do not commit it
```

## Test File Organization

Not applicable — there is no test file convention to describe. If a real test suite is introduced later, it does not yet have an established location, naming pattern, or runner in this codebase; that would be a new decision, not an extension of an existing pattern.

## Coverage

**Requirements:** none — there is no coverage tool configured and nothing to measure coverage of, since there are no automated tests.

## What to check by hand when touching each part of the codebase

**`app.js` changes:**
- Reload with the local static server running and confirm the affected section renders in both light and dark theme (toggle via the theme switcher; see `applyTheme()`/`initThemeManager()`).
- If the change touches `loadData()`/`normalizeRealData()`, verify both code paths: with a valid `data.json` present (real-data path) and with `data.json` renamed/removed or malformed (fallback-to-`DEMO_*` path) — both must render without a blank page or console error.
- If the change touches `localStorage`-backed state (favorites, cost-basis/position, theme choice), test in a normal window and confirm the try/catch fallback doesn't throw in restrictive contexts (private browsing is the closest manual approximation).
- If the change touches externally-sourced text rendering (news headlines/summaries/`source`), confirm `escapeHtml()` still runs on it before `innerHTML` insertion — this is a security-relevant manual check, not just a visual one (see `PRODUCT.md:55`).

**`pipeline/fetch_and_curate.py` changes:**
- If the change is inside a per-ticker loop (`fetch_prices`, `fetch_fundamentals`, `fetch_earnings_actuals`), mock a single bad response for one ticker and confirm the loop still completes for the rest and the failed ticker gets its documented `None`/empty placeholder plus an `Aviso:` line on stderr.
- If the change is inside a `main()`-level optional feature (OHLC batch, earnings calendar, LLM curation, archive update), confirm that an exception raised inside it still allows `data.json` to be written with the rest of the payload intact — this is the exact regression class fixed in commit `06096fb`.
- If the change adds a new required env var / API key, confirm the `sys.exit()` check is placed before any of that function's own try/except blocks (see `CONVENTIONS.md` § Error Handling for why) and is not swallowed by a caller's `except Exception`.
- Never run a real verification pass against Alpha Vantage more than necessary — its free tier is a hard 25 requests/day shared across the whole pipeline (see `pipeline/README.md`), and burning it during manual testing can starve the next real scheduled run.

---

*Testing analysis: 2026-08-11*
