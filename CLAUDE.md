# CLAUDE.md

## Git workflow

Commit and push directly to `main` — it is the only branch, local and remote.
Do not create feature branches or pull requests. (Historical `claude/*`
branches are deleted; this environment's git credentials cannot delete remote
refs — a `git push --delete` 403s — so never create branches expecting to
clean them up.)

## What this repo is

A phone-first Disneyland trip guide for Aug 18–22 2026 (party of four — two
couples, one vegetarian; 8/19 DCA, 8/20–21 Disneyland). Served by GitHub Pages
from `main`; also opens from disk. No build step, no dependencies.

| File | Owns |
|---|---|
| `index.html` | Content and markup only |
| `styles.css` | Core layout, palette, dark mode, and the header/sky + day-card animations |
| `festive.css` | Body/content seasonal decoration. The page must work identically without this file |
| `app.js` | All behavior: sky phase/moon, per-day chrome, `DAYS` schedule (countdown, "up next", urgency, park close), card folding, live waits, weather, Multi Pass clock, accordion |
| `fold-test.mjs` | Browser test of the fold lifecycle at fifteen frozen clock points |
| `HANDOFF.md` | Deep context: decisions, sources, reversals, price conflicts. **Read it before changing any fact or re-opening any decision** |

Cascade note: `festive.css` is linked *before* `styles.css` and wins where it
needs to via specificity, not order. Keep that link order.

## Working rules

- **Layer discipline.** Decoration never obscures text; animations are
  opacity/transform only, long-period; every animation name appears in a
  `prefers-reduced-motion` kill list in its own file (`styles.css` and
  `festive.css` each carry one). Selector specificity can defeat the kill
  list — the night-star bug — so when gating an animation behind
  `body[data-...]`, repeat that selector in the reduce block.
- **`#test` mode** (append `#test` to the URL) renders every time-gated state
  at once and must keep working. It is reviewable by the user at any date; the
  normal path must show zero behavior change and zero network calls when the
  flag is absent.
- **Invariants after any edit**, both asserted by tests: `DAYS` events
  chronological within each day; `data-until` non-decreasing down each day
  section.
- **Verify in real Chromium, no screenshots** (user preference): computed-style
  and geometry assertions, frozen clocks via `addInitScript` wrapping `Date`,
  network mocked with `page.route`. Chromium binary:
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (`npm i playwright`
  first). Instant-scroll before measuring positions — `html` has
  `scroll-behavior: smooth`, which races measurements. Run `node fold-test.mjs`
  plus a 390px render check (no console errors, no horizontal overflow, in
  light and dark schemes).
- **Network.** Two external APIs, both chosen for CORS (`allow-origin: *`,
  verified by sending an Origin header): `api.themeparks.wiki` for waits
  (60s server cache — never poll faster) and `api.open-meteo.com` for weather
  (10 min cadence). Everything degrades gracefully offline and makes zero
  calls outside trip days. queue-times.com has no CORS — do not switch to it.
- **When changing any claim, grep the whole repo — comments included.** A JS
  comment carrying the correct fact once sat under a card asserting the
  opposite; the comment was right. An existing contradiction is evidence you
  may be the one who's wrong.
- **The user's browser beats this environment.** `disneyland.disney.go.com`
  403s from here; the user reading a Disney page and relaying it has already
  reversed one months-old claim. When Disney's live pages matter, ask.

## Standard for facts

Prices, times and menu items were checked against Disney's pages and menu
aggregators through mid-August 2026. They are **not** continuously re-verified
and go stale quickly — Disney raises prices in sweeps and changes menus
monthly.

So: when adding or changing a fact, verify it, and when you can't, say so in
the guide rather than asserting it. Do not delete an existing hedge to make a
sentence read better — several were lost that way already. If a verification
pass could not open a source directly, the resulting claim is *reported*, not
*verified*, and should be worded that way.

Verification claims in commit messages must carry their limits — if something
was tested against a shim rather than a browser, or synthesised from search
results rather than read from the source, say that.

Two traps with a body count (details in HANDOFF): a **season-level date does
not settle an attraction-level question**, and **wrong-coast contamination** —
Disney publishes parallel DLR and WDW versions of the same posts; check the
`/dlr/` path before believing anything naming a show both resorts run.
