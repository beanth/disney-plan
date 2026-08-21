// app.js — all behavior for the trip guide. Split out of index.html 16 Aug.
// Subsystems, in file order: #test flag · sky phase + moon · chrome/mood per
// scrolled day · DAYS (the trip schedule driving the countdown, "up next",
// urgency and park-close lines) · card folding · live waits (themeparks.wiki)
// · Anaheim weather (open-meteo) · Multi Pass clock (localStorage) · reference
// accordion. Invariants: DAYS events chronological per day; a card's
// data-until times non-decreasing down each day section. fold-test.mjs
// asserts the fold behavior at fifteen frozen clock points.

(function () {
  // ---- TEST MODE (temporary) ----
  // Open the page with #test (or ?test) and every time-gated state renders at
  // once: nothing folds, a "Now" ring on each day's first block, the urgent
  // countdown and park-close line with example text, and the live strip showing
  // the whole trip's rides across both parks. The clock still drives the sky.
  // Remove by deleting the TEST branches; the normal path is untouched.
  var TEST = /(^|[?#&])test/.test(location.search + location.hash);

  // ---- time of day sky ----
  function setPhase() {
    var h = new Date().getHours();
    var phase = (h >= 5 && h < 9) ? "dawn"
              : (h >= 9 && h < 16) ? "day"
              : (h >= 16 && h < 20) ? "dusk"
              : "night";
    document.body.setAttribute("data-phase", phase);
  }

  // ---- moon phase, so the orb matches the real sky ----
  var SYNODIC = 29.530588853;
  var NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // reference new moon

  function setMoon(now) {
    var orb = document.getElementById("orb");
    if (!orb) return;
    var days = (now.getTime() - NEW_MOON) / 864e5;
    var frac = ((days / SYNODIC) % 1 + 1) % 1;          // 0 = new, .5 = full
    var lit = (1 - Math.cos(2 * Math.PI * frac)) / 2;   // illuminated fraction
    var dx = (frac < 0.5 ? -1 : 1) * lit * 112;         // waxing lights the right limb
    orb.style.setProperty("--moon-dx", dx.toFixed(1) + "%");
  }

  // ---- palette follows the calendar ----
  // must stay in sync with --chrome-NN in the stylesheet, light then dark
  var CHROME = {
    "19": ["#b05412", "#8a3f0d"],
    "20": ["#8a6a1c", "#6b5218"],
    "21": ["#6b3fa0", "#533080"]
  };

  function setChromeMeta(day) {
    var pair = CHROME[day] || ["#3d2352", "#171221"];
    var l = document.getElementById("tc-light");
    var d = document.getElementById("tc-dark");
    if (l) l.setAttribute("content", pair[0]);
    if (d) d.setAttribute("content", pair[1]);
  }

  // 8/21 is Halloween Time day one at Disneyland Park. 8/20 is the final night
  // of the 70th's shows (the anniversary itself ended 8/9), so gold not pumpkin.
  // 8/19 gets the halloween mood because DCA is very likely already dressed:
  // Oogie Boogie Bash starts there 8/18 and the Cars Land overlays flip 8/17.
  // That's an inference, not a read fact — Monsters After Dark is separately
  // dated 8/21 and does *not* run on the 19th. See "When Halloween actually
  // starts" for the split between the two parks.
  var MOOD = { "19": "halloween", "20": "seventieth", "21": "halloween" };

  // ---- per-day chrome takeover on scroll ----
  function watchSections() {
    if (!("IntersectionObserver" in window)) return;
    var seen = {};
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { seen[e.target.id] = e.intersectionRatio; });
      var best = null, bestRatio = 0;
      Object.keys(seen).forEach(function (id) {
        if (seen[id] > bestRatio) { bestRatio = seen[id]; best = id; }
      });
      if (best && bestRatio > 0.12) {
        var day = best.replace("day", "");
        document.body.setAttribute("data-day", day);
        document.body.setAttribute("data-mood", MOOD[day] || "halloween");
        setChromeMeta(day);
      } else {
        document.body.removeAttribute("data-day");
        document.body.setAttribute("data-mood", "halloween");
        setChromeMeta(null);
      }
    }, { threshold: [0, .12, .3, .5, .75, 1] });

    ["day19", "day20", "day21"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  // ---- trip schedule (local device time; you'll be in Pacific) ----
  var TRIP_START = new Date(2026, 7, 18); // Aug 18
  var DAYS = {
    "2026-08-18": { label: "Travel day", note: "Land, rest up. It starts tomorrow.", nav: null, greet: "Anaheim · arrival" },
    // A 4th element marks a *hard* deadline — a door that shuts, which the header
    // escalates for inside 20 minutes. Everything else absorbs a late start, so
    // don't mark a step just because it has a clock time.
    "2026-08-19": { label: "California Adventure", nav: "day19", greet: "California Adventure", close: [22, 0], events: [
      [7,  0,  "Breakfast at the hotel — first seating, out by 7:25", 1],
      [7,  25, "Walk to the Toy Story lot — bus to the Esplanade"],
      [9,  0,  "In and riding — rebook a pass every time you tap one in"],
      [12, 50, "Carthay Circle Lounge, 12:50 pm — ask for indoors", 1],
      [18, 20, "Lamplight Lounge, 6:20 pm", 1],
      [19, 50, "Out of Lamplight — the gap fits one: Racers, or Grizzly (wet for the show)"],
      [20, 50, "Walk to your World of Color entrance"],
      [21, 0,  "World of Color – ONE, 9:00 — Yellow or Blue entrance", 1],
      [21, 10, "Guardians window opens — Monsters After Dark, straight from the show", 1],
      [21, 55, "Out through the Cars Land neon — bus from the Esplanade"]
    ]},
    "2026-08-20": { label: "Disneyland · Day 1", nav: "day20", greet: "Paint the Night · final night", close: [24, 0], events: [
      [7,  0,  "Breakfast from 7:00 — bus whenever you're ready, park opens 8:00"],
      [8,  0,  "Book Indiana Jones the moment you scan in — it drifts latest"],
      [9,  0,  "Rebook every tap-in — Rise is standby or Single Pass, never Multi Pass"],
      [12, 50, "Café Orléans — drinks stop, 12:50 pm", 1],
      [14, 0,  "Out of Café Orléans — walk back for Savi's, check in by 2:25", 1],
      [14, 30, "Savi's Workshop — booked, 2:30", 1],
      [16, 0,  "Blue Bayou, 4:00 pm", 1],
      [19, 0,  "Late showings tonight — no curb camp; ride while the 8:45 crowd sits"],
      [21, 35, "Wondrous Journeys, 9:35 — its only show, final night: be under open sky", 1],
      [22, 30, "Fantasmic! — the 10:30 show", 1],
      [22, 45, "Paint the Night second parade steps off — meet its far end ~11:05 after Fantasmic"],
      [23, 45, "Out and walking back — 25-30 min"]
    ]},
    "2026-08-21": { label: "Disneyland · Day 2", nav: "day21", greet: "Halloween Time · day one", close: [24, 0], events: [
      [7,  0,  "Breakfast from 7:00 — sold-out day; scanning in is what arms the booking clock"],
      [8,  0,  "Scan in, book Haunted Mansion Holiday first — then ride an hour or two"],
      [10, 0,  "Head out — book again every time the 2-hour clock lapses"],
      [17, 40, "Carnation Café, 5:40 pm — dinner service ends 7:00", 1],
      [19, 0,  "Spend the stack — Fantasmic is off, so the windows run to 9:15"],
      [21, 15, "Plant for Screams — Hub end keeps you 8 min from the table", 1],
      [21, 30, "Halloween Screams ~9:30 (confirm time in app)"],
      [21, 40, "Blue Bayou, 9:40 pm", 1],
      [23, 0,  "Out of dinner — last hour: unspent passes, Mansion standby, Pirates next door"],
      [23, 45, "Out and walking back — 25-30 min"]
    ]},
    "2026-08-22": { label: "Last day in Cali", note: "No parks today — Downtown Disney from 7am, then the drive to ONT. Safe travels home.", nav: null, greet: "Anaheim · heading home" }
  };

  function dayKey(d) {
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  // ---- auto-collapse blocks once they're behind you ----
  // A day is "over" at 3am the next morning, not midnight — you're still walking
  // home from the park when the calendar flips.
  var DAY_SECTIONS = { "2026-08-19": "day19", "2026-08-20": "day20", "2026-08-21": "day21" };

  function prepFolds() {
    document.querySelectorAll('section[id^="day"] .card').forEach(function (card) {
      if (card.querySelector(":scope > .fold")) return;
      var fold = document.createElement("div");
      fold.className = "fold";
      Array.prototype.slice.call(card.children).forEach(function (el) {
        var isHead = el.classList.contains("tag") || el.tagName === "H3" || el.classList.contains("when");
        if (!isHead) fold.appendChild(el);
      });
      card.appendChild(fold);

      if (card.hasAttribute("data-until")) {
        // Both live outside .fold so they survive folding; CSS decides which shows.
        var badge = document.createElement("div");
        badge.className = "nowtag";
        badge.textContent = "Now";
        card.insertBefore(badge, fold);

        var hint = document.createElement("div");
        hint.className = "reopen";
        hint.textContent = "Done · tap to reopen";
        card.insertBefore(hint, fold);
      }

      card.addEventListener("click", function (ev) {
        if (!card.classList.contains("folded")) return;
        if (ev.target.closest("a")) return;
        card.classList.remove("folded");
        card.dataset.manual = "1";
      });
    });
  }

  function applyFolds(now) {
    if (TEST) {
      Object.keys(DAY_SECTIONS).forEach(function (k) {
        var sec = document.getElementById(DAY_SECTIONS[k]);
        if (!sec) return;
        sec.classList.remove("day-done");
        var first = true;
        sec.querySelectorAll(".card[data-until]").forEach(function (card) {
          card.classList.remove("folded");
          card.classList.toggle("now", first);
          first = false;
        });
      });
      return;
    }
    var todayKey = dayKey(now);
    Object.keys(DAY_SECTIONS).forEach(function (k) {
      var sec = document.getElementById(DAY_SECTIONS[k]);
      if (!sec) return;
      var p = k.split("-");
      var over = now >= new Date(+p[0], +p[1] - 1, +p[2] + 1, 3, 0, 0, 0);

      if (over && !sec.dataset.manual) {
        sec.classList.add("day-done");
        if (!sec.querySelector(".dayreopen")) {
          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "dayreopen";
          var EMO = { day19: "🎃 ", day20: "✨ ", day21: "👻 " };
          btn.textContent = (EMO[DAY_SECTIONS[k]] || "") + "Day complete · tap to reopen";
          btn.addEventListener("click", function () {
            sec.dataset.manual = "1";
            sec.classList.remove("day-done");
            btn.remove();
          });
          sec.querySelector(".day-head").insertAdjacentElement("afterend", btn);
        }
      }

      var isToday = (k === todayKey);
      var cards = sec.querySelectorAll(".card[data-until]");

      cards.forEach(function (card) {
        if (card.dataset.manual) return;
        // `over` lags by three hours, so between midnight and 3am the calendar has
        // moved on but the section hasn't closed — keep yesterday's blocks folded.
        var past = over || k < todayKey;
        if (!past && isToday) {
          var hm = card.getAttribute("data-until").split(":");
          var t = new Date(now);
          t.setHours(+hm[0], +hm[1], 0, 0);
          past = now >= t;
        }
        card.classList.toggle("folded", past);
      });

      // Mark the block you're actually in. Derived from the clock rather than from
      // which cards are folded, so a card you reopened by hand doesn't claim "now".
      var live = null;
      if (isToday && !over) {
        for (var i = 0; i < cards.length; i++) {
          var chm = cards[i].getAttribute("data-until").split(":");
          var ct = new Date(now);
          ct.setHours(+chm[0], +chm[1], 0, 0);
          if (now < ct) { live = cards[i]; break; }
        }
      }
      cards.forEach(function (card) { card.classList.toggle("now", card === live); });
    });
  }

  // "in 12 min" / "in 1h 20m" — the thing the plan never told you.
  function untilText(mins) {
    if (mins <= 0) return "now";
    if (mins < 60) return "in " + mins + " min";
    var h = Math.floor(mins / 60), m = mins % 60;
    return "in " + h + "h" + (m ? " " + m + "m" : "");
  }

  // ---- live waits ----
  // themeparks.wiki: the one wait-time API that sends CORS headers, so a static
  // page can call it. Its server cache is 60s, so polling faster than update()'s
  // minute would only re-read the same cached payload. queue-times.com has the
  // same data but no CORS — a browser can't use it.
  var LW_URL = "https://api.themeparks.wiki/v1/entity/disneylandresort/live";
  var LW_PARKS = {
    day19: { id: "832fcd51-ea19-4e77-85c7-75d5843b127c", label: "California Adventure", plan: "dca" },
    day20: { id: "7340550b-c14d-4def-80bb-acdb51d49a66", label: "Disneyland", plan: "dl" },
    day21: { id: "7340550b-c14d-4def-80bb-acdb51d49a66", label: "Disneyland", plan: "dl" }
  };
  // Only the rides the plan actually rides, per park — the "Not in the plan"
  // rides stay off this list on purpose. Keys are matched as substrings of the
  // API's names after normalising ™ ’ etc.
  var LW_PLAN = {
    dca: [
      ["guardians of the galaxy", "Guardians"],
      ["radiator springs", "Racers"],
      ["web slingers", "WEB SLINGERS"],
      ["midway mania", "Toy Story Mania"],
      ["soarin", "Soarin'"],
      ["incredicoaster", "Incredicoaster"],
      ["luigi", "Luigi's"],
      ["mater s junkyard", "Mater's"],
      ["grizzly river", "Grizzly River Run"],
      ["goofy s sky school", "Goofy's Sky School"],
      ["little mermaid", "Little Mermaid"],
      ["monsters inc", "Monsters Inc."]
    ],
    dl: [
      ["indiana jones adventure", "Indiana Jones"],
      ["rise of the resistance", "Rise of the Resistance"],
      ["millennium falcon", "Smugglers Run"],
      ["big thunder", "Big Thunder"],
      ["matterhorn", "Matterhorn"],
      ["space mountain", "Space Mountain"],
      ["pirates of the caribbean", "Pirates"],
      ["haunted mansion", "Haunted Mansion"],
      ["peter pan", "Peter Pan"],
      ["alice in wonderland", "Alice"],
      ["runaway railway", "Runaway Railway"],
      ["roger rabbit", "Roger Rabbit"],
      ["tiana s bayou", "Tiana's"],
      ["buzz lightyear", "Buzz Lightyear"],
      ["jungle cruise", "Jungle Cruise"],
      ["sailing ship columbia", "Columbia"],
      ["mark twain", "Mark Twain"]
    ]
  };

  // Sort: longest standby first, then walk-in "open", then down, then closed —
  // the top of the list is where a Lightning Lane earns the most.
  function lwRank(e) {
    var q = e.queue || {};
    if (e.status === "OPERATING") return (q.STANDBY && q.STANDBY.waitTime != null) ? 0 : 1;
    if (lwStale(e)) return 4;
    if (e.status === "DOWN") return 2;
    return 3;
  }

  // Disney parks a closed ride's record and stops updating it — Haunted
  // Mansion sat on an 8/9 REFURBISHMENT the evening the Holiday overlay
  // opened early (8/20, seen in the park), so the strip printed "closed"
  // for a ride that was running. A non-operating status on a record older
  // than a day is the feed not tracking, not a fact about the gate.
  function lwStale(e) {
    var t = Date.parse(e.lastUpdated || "");
    return !(t && Date.now() - t < 24 * 3600 * 1000);
  }
  var lwData = null, lwAt = 0, lwErr = false, lwBusy = false;

  function lwNorm(s) {
    return s.toLowerCase().replace(/[’'™®:!.,\-–&]/g, " ").replace(/\s+/g, " ").trim();
  }

  function clockShort(iso) {
    var d = new Date(iso);
    var h = d.getHours(), m = d.getMinutes(), ap = h >= 12 ? "p" : "a";
    h = h % 12 || 12;
    return h + ":" + String(m).padStart(2, "0") + ap;
  }

  function lwFetch() {
    if (lwBusy) return;
    lwBusy = true;
    fetch(LW_URL).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (d) {
      lwData = d.liveData || [];
      lwAt = Date.now();
      lwErr = false;
    }).catch(function () {
      lwErr = true;
    }).then(function () {
      lwBusy = false;
      lwRender(new Date());
    });
  }

  // The waits card lives from 8:00 to 22:00 at DCA and to 23:59 on Disneyland
  // days (the parks' own closes); all day in #test.
  function lwWindow(now, park) {
    var h = now.getHours();
    return h >= 8 && h < (park && park.plan === "dl" ? 24 : 22);
  }

  function lwRender(now) {
    var card = document.getElementById("livewaits");
    var today = DAYS[dayKey(now)];
    var park = today && today.nav && LW_PARKS[today.nav];
    card.hidden = TEST ? false : !(park && lwWindow(now, park));
    if (card.hidden) return;
    document.getElementById("lw-park").textContent = TEST ? "test · both parks" : park.label;
    var list = document.getElementById("lw-list");
    var meta = document.getElementById("lw-meta");
    if (!lwData) {
      list.textContent = "";
      meta.textContent = lwErr ? "Can't reach wait times — use the app." : "Fetching wait times…";
      return;
    }
    var pool = lwData.filter(function (e) {
      return (TEST || e.parkId === park.id) && e.entityType === "ATTRACTION" &&
             lwNorm(e.name).indexOf("single rider") === -1;
    });
    var rides;
    if (TEST) {
      rides = LW_PLAN.dca.concat(LW_PLAN.dl);
    } else {
      rides = LW_PLAN[park.plan];
    }
    var rows = [];
    // A key can match more than one entity: seasonal overlays are separate
    // API entries (Guardians runs as "Mission: BREAKOUT!" by day and "Monsters
    // After Dark" at night, one CLOSED while the other operates), so take the
    // best-ranked match, not the first — payload order isn't meaningful.
    rides.forEach(function (row) {
      var best = null;
      for (var i = 0; i < pool.length; i++) {
        if (lwNorm(pool[i].name).indexOf(row[0]) !== -1 &&
            (!best || lwRank(pool[i]) < lwRank(best))) {
          best = pool[i];
        }
      }
      if (best) rows.push({ label: row[1], e: best });
    });
    rows.sort(function (a, b) {
      var r = lwRank(a.e) - lwRank(b.e);
      if (r) return r;
      var wa = (a.e.queue && a.e.queue.STANDBY && a.e.queue.STANDBY.waitTime) || 0;
      var wb = (b.e.queue && b.e.queue.STANDBY && b.e.queue.STANDBY.waitTime) || 0;
      return wb - wa;
    });
    list.textContent = "";
    rows.forEach(function (row) {
      var hit = row.e, q = hit.queue || {};
      var div = document.createElement("div"); div.className = "kv";
      var k = document.createElement("span"); k.className = "k"; k.textContent = row.label;
      var v = document.createElement("span"); v.className = "v";
      if (hit.status !== "OPERATING" && lwStale(hit)) { v.textContent = "no data"; v.classList.add("lw-na"); }
      else if (hit.status === "DOWN") { v.textContent = "down"; v.classList.add("lw-down"); }
      else if (hit.status !== "OPERATING") { v.textContent = "closed"; v.classList.add("lw-down"); }
      else {
        var sb = q.STANDBY ? q.STANDBY.waitTime : null;
        v.textContent = (sb == null) ? "open" : sb + " min";
        if (sb != null && sb <= 15) v.classList.add("lw-go");
        var extras = [];
        if (q.SINGLE_RIDER && q.SINGLE_RIDER.waitTime != null) extras.push("SR " + q.SINGLE_RIDER.waitTime);
        if (q.RETURN_TIME) {
          extras.push(q.RETURN_TIME.returnStart ? "LL " + clockShort(q.RETURN_TIME.returnStart) : "LL out");
        } else if (q.PAID_RETURN_TIME) {
          extras.push(q.PAID_RETURN_TIME.returnStart ? "SP " + clockShort(q.PAID_RETURN_TIME.returnStart) : "SP out");
        }
        if (extras.length) {
          var sub = document.createElement("span");
          sub.className = "sub";
          sub.textContent = " · " + extras.join(" · ");
          v.appendChild(sub);
        }
      }
      div.appendChild(k); div.appendChild(v); list.appendChild(div);
    });
    var age = Math.round((Date.now() - lwAt) / 60000);
    meta.textContent = (lwErr ? "Offline — showing old times · " : "") +
      (age < 1 ? "updated just now" : "updated " + age + " min ago") +
      " · longest waits first · themeparks.wiki, not Disney — the app is the truth";
  }

  // ---- Anaheim weather (open-meteo, CORS-open, no key) ----
  // Park days only, one call per 10 minutes — the "current" reading itself
  // only refreshes every 15 on the server.
  var WX_URL = "https://api.open-meteo.com/v1/forecast?latitude=33.81&longitude=-117.92&current=temperature_2m&temperature_unit=fahrenheit";
  var wxAt = 0, wxBusy = false;

  function wxFetch() {
    if (wxBusy) return;
    wxBusy = true;
    fetch(WX_URL).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (d) {
      var t = d && d.current && d.current.temperature_2m;
      var el = document.getElementById("wx");
      if (t != null && el) {
        el.textContent = " · " + Math.round(t) + "°";
        el.hidden = false;
      }
      wxAt = Date.now();
    }).catch(function () {
      // retry in about a minute rather than waiting the full ten
      wxAt = Date.now() - 9 * 60000;
    }).then(function () { wxBusy = false; });
  }

  // ---- Multi Pass clock ----
  // The guide's most-repeated instruction is "run a two-hour timer". This is that
  // timer. One tap when you book; localStorage so it survives reloads. Per-device
  // by nature — whichever phone taps it is the phone that carries it.
  var MP_KEY = "mp-clock-start";
  function mpGet() { try { return +localStorage.getItem(MP_KEY) || 0; } catch (e) { return 0; } }
  function mpSet(v) { try { localStorage.setItem(MP_KEY, String(v)); } catch (e) {} }

  function mpRender(now) {
    var card = document.getElementById("mptimer");
    var today = DAYS[dayKey(now)];
    card.hidden = !TEST && !(today && today.nav);
    if (card.hidden) return;
    var btn = document.getElementById("mp-btn");
    var t = mpGet();
    if (!t) {
      btn.className = "mp-btn";
      btn.textContent = "Booked a pass? Tap to start the 2-hour clock";
    } else {
      var left = Math.ceil((t + 7200000 - now.getTime()) / 60000);
      if (left > 0) {
        btn.className = "mp-btn run";
        btn.textContent = "Next pass unlocks " + untilText(left) + " · tap if you book again";
      } else {
        btn.className = "mp-btn due";
        btn.textContent = "Clock's up — book another pass, then tap";
      }
    }
  }

  document.getElementById("mp-btn").addEventListener("click", function () {
    mpSet(Date.now());
    mpRender(new Date());
  });

  function update() {
    setPhase();
    var now = new Date();
    setMoon(now);
    applyFolds(now);
    var box = document.getElementById("countdown");
    var big = document.getElementById("cd-big");
    var small = document.getElementById("cd-small");
    var closing = document.getElementById("cd-close");
    var greet = document.getElementById("greeting");
    box.hidden = false;
    closing.hidden = true;
    box.classList.remove("urgent");

    // clear any previous today marker
    document.querySelectorAll("nav a.today").forEach(function (a) { a.classList.remove("today"); });

    if (TEST) {
      document.body.setAttribute("data-trip", "halloween");
      big.textContent = "Test mode";
      small.textContent = "";
      var tl = document.createElement("span");
      tl.className = "cd-in";
      tl.textContent = "in 8 min";
      small.appendChild(tl);
      small.appendChild(document.createTextNode(" · World of Color virtual queue — join at 12:00:00 (example)"));
      box.classList.add("urgent");
      closing.hidden = false;
      closing.textContent = "Park closes in 40 min · anyone in line at closing still rides (example)";
      greet.textContent = "Test mode · all timed states exposed";
      mpRender(now);
      lwRender(now);
      if (!document.hidden && Date.now() - lwAt > 55000) lwFetch();
      if (!document.hidden && Date.now() - wxAt > 10 * 60000) wxFetch();
      return;
    }

    var key = dayKey(now);
    var today = DAYS[key];

    // Your first likely-decorated park day is 8/19 (DCA, hosting Bash nights from
    // 8/18), so the palette turns over then and stays turned. Disneyland Park's own
    // season doesn't open until 8/21.
    var trip = today ? (key >= "2026-08-19" ? "halloween" : "trip")
             : (now < TRIP_START ? "pre" : "post");
    document.body.setAttribute("data-trip", trip);

    if (today) {
      // ---- trip mode ----
      big.textContent = today.label;
      if (today.nav) {
        var tab = document.querySelector('nav a[href="#' + today.nav + '"]');
        if (tab) tab.classList.add("today");
      }
      if (today.events) {
        var next = null, nextIn = 0;
        for (var i = 0; i < today.events.length; i++) {
          var e = today.events[i];
          var t = new Date(now); t.setHours(e[0], e[1], 0, 0);
          if (t > now) { next = e; nextIn = Math.round((t - now) / 60000); break; }
        }
        small.textContent = "";
        if (next) {
          var lede = document.createElement("span");
          lede.className = "cd-in";
          lede.textContent = untilText(nextIn);
          small.appendChild(lede);
          small.appendChild(document.createTextNode(" · " + next[2]));
        } else {
          small.textContent = "That's the day. Enjoy the night.";
        }
        // Escalate only for doors that shut, and only once they're close enough
        // that the warning is actionable.
        box.classList.toggle("urgent", !!(next && next[3] && nextIn <= 20));
      } else {
        small.textContent = today.note || "";
      }

      // Park close, once it's near enough to change whether you join a queue.
      if (today.close) {
        var cl = new Date(now); cl.setHours(today.close[0], today.close[1], 0, 0);
        var clIn = Math.round((cl - now) / 60000);
        if (clIn > 0 && clIn <= 90) {
          closing.hidden = false;
          closing.textContent = "Park closes " + untilText(clIn) +
            " · anyone in line at closing still rides";
        }
      }
      greet.textContent = today.greet || "Anaheim";
      if (today.nav && lwWindow(now, LW_PARKS[today.nav]) && !document.hidden && Date.now() - lwAt > 55000) lwFetch();
      if (today.nav && !document.hidden && Date.now() - wxAt > 10 * 60000) wxFetch();
      if (!today.nav) document.getElementById("wx").hidden = true;
    } else if (now < TRIP_START) {
      // ---- countdown mode ----
      var midnightNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var days = Math.round((TRIP_START - midnightNow) / 864e5);
      big.textContent = days === 1 ? "1 day to go" : days + " days to go";
      small.textContent = days === 1 ? "Wheels up tomorrow" : "Until wheels up on Aug 18";
    } else {
      // ---- after the trip ----
      big.textContent = "Trip complete";
      small.textContent = "Hope it was magical. See you next time.";
    }

    mpRender(now);
    lwRender(now);
  }

  // ---- reference cards behave as an accordion ----
  // One open at a time, so the reference list stays scannable on a phone instead of
  // becoming a mile of prose. Collapsing a card that sits *above* the one you just
  // tapped pulls the page up under your thumb, so re-anchor the scroll afterwards to
  // leave the tapped header exactly where your finger left it. html has
  // scroll-behavior:smooth, which would animate that correction into a visible drift,
  // so the fix is forced instant.
  function accordion() {
    // livewaits is a details.card too, but it's a dashboard, not a reference
    // page — it stays open independently of the accordion.
    var cards = [].slice.call(document.querySelectorAll("details.card")).filter(function (c) {
      return c.id !== "livewaits";
    });
    var root = document.documentElement;
    cards.forEach(function (card) {
      card.addEventListener("toggle", function () {
        if (!card.open) return;
        var before = card.getBoundingClientRect().top;
        var closedAny = false;
        cards.forEach(function (other) {
          if (other !== card && other.open) { other.open = false; closedAny = true; }
        });
        if (!closedAny) return;
        var delta = card.getBoundingClientRect().top - before;
        if (!delta) return;
        var prev = root.style.scrollBehavior;
        root.style.scrollBehavior = "auto";
        window.scrollBy(0, delta);
        root.style.scrollBehavior = prev;
      });
    });
  }

  // It's a Halloween trip, so the page wears it by default rather than waiting
  // for the calendar to catch up.
  document.body.setAttribute("data-mood", "halloween");
  accordion();
  prepFolds();   // must run before the first update(), which folds what's already past
  update();
  watchSections();
  setInterval(update, 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) update();
  });
})();
