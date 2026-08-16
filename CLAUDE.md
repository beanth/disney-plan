# CLAUDE.md

## Git workflow

Commit and push directly to `main`. Do not create feature branches or pull requests — this is a personal single-page site and `main` is the only branch that matters. (PR #1 and the `claude/*` branches in the history predate this rule.)

## What this repo is

`index.html` is a Disneyland trip guide for Aug 18–22, 2026 (party of four — two couples). All content, core styles, and scripts live in that file; `festive.css` is the seasonal decoration layer (the page works identically without it). There is no build step. (The repo was single-file until 16 Aug, when the user lifted that rule for the decoration split.)

## Standard for facts

Prices, times and menu items were checked against Disney's pages and menu aggregators during July 2026. They are **not** continuously re-verified and go stale quickly — Disney raises prices in sweeps and changes menus monthly.

So: when adding or changing a fact, verify it, and when you can't, say so in the guide rather than asserting it. Do not delete an existing hedge to make a sentence read better — several were lost that way already. If a verification pass could not open a source directly (fetching is often blocked here), the resulting claim is *reported*, not *verified*, and should be worded that way.

Verification claims in commit messages must carry their limits — if something was tested against a shim rather than a browser, or synthesised from search results rather than read from the source, say that.
