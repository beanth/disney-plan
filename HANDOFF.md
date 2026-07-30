# Handoff — Disneyland, Aug 18–22 2026

State of the plan as of 29 July 2026. Everything below is either settled or
explicitly flagged as open. The guide itself is `index.html`; this file is the
context behind it.

## Trip parameters

- **Aug 18–22 2026.** Land late on the 18th at **Ontario (ONT)**, fly home from
  ONT on the 22nd.
- **Party of four — two couples**, separate rooms, tickets linked in the app.
  The guide is written for *one* couple: prices are scoped to two, logistics to
  four.
- **One vegetarian.**
- Hotel is 1.3 mi from the gate. You walk it, both ways, every day. Breakfast is
  included and opens at **7:00** — that pins every morning.
- **Park days: 8/19 DCA, 8/20 and 8/21 Disneyland.**

## Bookings — all settled

| Day | Time | Where |
|---|---|---|
| Wed 8/19 | 12:50 | Carthay Circle Lounge |
| Wed 8/19 | 6:20 | Lamplight Lounge (downstairs) |
| Thu 8/20 | 12:50 | Café Orléans |
| Thu 8/20 | **2:30** | **Savi's Workshop** |
| Thu 8/20 | 4:00 | Blue Bayou |
| Fri 8/21 | 1:20 | Blue Bayou |
| Fri 8/21 | 6:10 | River Belle Terrace |

Wine Country Trattoria was **cancelled** — with wine off the table it had three
spritzes and a courtyard that isn't really air-conditioned. Carthay replaced it:
it's the only serious cocktail list in either park, and 12:50 is the only slot
on the trip that reaches it (it shuts at 8:00, and Wednesday evening is
Lamplight). Booked as **"Carthay Circle Lounge – Alfresco Dining"**; ask for the
downstairs room at check-in, which is the air-conditioned half.

## Galaxy's Edge

- **Savi's: one builder booked, 2:30 on 8/20, $249.99.** Bring the card used at
  booking — it must be presented, and a no-show charges it in full.
- **Droid Depot: walk-up, 10:00 on 8/20, $119.99.** Ask for an **R-series**; the
  goal is a **clear dome** (the R3 look), which is a standard part in the
  rotation. The belt is luck of the draw — put back what you don't want and let
  it come round. If it never appears, buy a dome over the counter (~$15,
  unadvertised, ask at the register) and swap the head.
- **Your share: $369.98 before tax.**
- **Getting them home:** saber and droid ride in the backpack they come with.
  Neither goes on Big Thunder; the droid shouldn't get wet. Shipping was
  rejected at $74.99.

## Decisions worth not relitigating

- **Savi's over Dok-Ondar's.** Dok-Ondar's is a retail counter; legacy hilts run
  $159.99–400 *plus* a $44.99–49.99 blade, and there's no experience attached.
  Savi's includes hilt, blade, case and pin, and is the only path to a
  colour-swappable saber.
- **The double Blue Bayou stays**, deliberately. Thursday is food-forward on the
  dinner menu; Friday is drinks-forward on the lunch menu and gets the $34 Monte
  Cristo that Thursday structurally cannot serve (lunch ends 3:55). Don't repeat
  an order across the two.
- **Oga's moved from 10:00 to 11:30 on Thursday**, so a slow queue eats the
  block's own slack instead of everything feeding the 2:30 Savi's deadline. Not
  seated by 10:30 → walk away; Friday night has it again.
- **Seventeen rides are out of the plan** (see the "Not in the plan" card).
  Nothing is budgeted for them and nothing depends on them. Mr. Toad is the one
  with a real case if it's posting short.
- **Thursday's curb: all four claim it together at 7:00.** No splitting into
  pairs — that was tried and rejected. The arithmetic still holds: the 8:45
  step-off is at the small world gate, so the parade doesn't reach the north end
  of Main Street until ~9:05 and Wondrous Journeys is 9:30, which makes 7:00
  125/150 minutes early against normal busy-night guidance of 90–120. The risk
  is the crowd, not the clock — it's the final night for both shows and Oogie
  Boogie Bash empties DCA into this park at 6pm — so if it looks brutal on the
  walk up, go earlier.
- **Flag Retreat cut** from the Friday loop — 45 minutes of a 180-minute block,
  and a round trip inside a card tagged "no backtracking."

## Open items

1. **The other couple's Savi's builder must land in the same 2:30 slot**, on
   their own card. Outside our control and the only unresolved booking.
2. **The Odyssey in IMAX 70mm, 8/22.** Regal Edwards Ontario Palace, ~10 min
   from ONT, one of ~25 US venues running 15-perf 70mm. 172 min plus a reported
   extended trailer ≈ 3h15m–3h25m in seat, so it's a morning/early-afternoon
   show against an evening flight. **Seats are the constraint, not the format** —
   as of late July there were no 70mm seats in LA or NY through 19 August and
   resales were reportedly into four figures. Four together, book immediately or
   drop it.
3. **Decide whether to make the repo private.** It's public with Pages live. The
   hotel name has been stripped and the page carries `noindex`, but the dates and
   party size are still there, and commit metadata carries a real name and email.
4. **Check the Halloween Time 2026 foodie guide** the week before — it wasn't
   published as of late July, and Halloween Time opens 8/21, your last park day.
5. **Confirm showtimes in the app each morning.** Nothing on either Disneyland
   night is confirmable a month out.

## Known limits on the facts

The guide's standard is in `CLAUDE.md`: verify, and where you can't, say so.
Where that standard is strained:

- **Roughly 40 dining prices came from search-result synthesis, not Disney's own
  pages** — fetching is blocked in this environment. Treat every price as a
  floor and expect drift; Disney raises prices in sweeps.
- **The 31 Royal Street Julep ($10.25, Friday's Blue Bayou pick) is probably
  non-alcoholic** — it names no spirit and sits far below the $18–20.50 cocktail
  band. Check before ordering.
- **Silly Symphony Swings may reopen.** It's a refurbishment, not a permanent
  closure, and parts were reportedly returning in July.
- **Fantasmic, Wondrous Journeys and Halloween Screams times are unconfirmed**
  and timed within minutes of each other on both Disneyland nights.

## Things that bit us, so they don't again

- **Lightning Lane Multi Pass stacks.** The guide asserted the opposite for a
  long time — that a new booking replaces the one you hold. It doesn't: you can
  hold several, and the 120-minute clock gives you a new pass whether or not
  you've ridden. All three mornings now carry a 10:00 "book another" beat.
- **Two separate timeline bugs came from inserting an event without checking
  chronological order.** The `DAYS` arrays in the `<script>` block drive the
  "up next" widget by linear scan, so an out-of-order entry silently hides
  everything after it — the 2:30 Grizzly alarm never fired for a while because
  of this. **Always re-verify order after touching `DAYS`.**
- **Deletion passes cost hedges.** Two "not confirmed for 2026" notes were
  removed to make sentences read better, and the pinned-vs-provisional showtime
  distinction was lost with a deleted card. Don't trade a hedge for prose.

## Repo

`index.html` is the whole product — one file, no build, no dependencies.
Commit and push straight to `main`; no branches, no PRs. `CLAUDE.md` carries the
working rules. After August this is a keepsake, not a live document.
