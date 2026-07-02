/* The Super 7 — front-end logic
   - Landing: renders the club shields, notify form, scroll reveal.
   - Game: loads upcoming fixtures from /api/fixtures (TheSportsDB via a Vercel
     function), falling back to demo fixtures when the API isn't reachable.
   - Leaderboard: renders the standings table.
   Predictions persist in localStorage. */

(function () {
  "use strict";

  // ---- The Super 7 clubs (home colour schemes) ----
  const CLUBS = {
    ARS: { name: "Arsenal",    bg: "#EF0107", text: "#FFFFFF", border: "#DAA520", form: ["W","W","D","W","L"] },
    CHE: { name: "Chelsea",    bg: "#034694", text: "#FFFFFF", border: "#FFFFFF", form: ["W","D","W","L","W"] },
    LIV: { name: "Liverpool",  bg: "#C8102E", text: "#F6EB61", border: "#F6EB61", form: ["W","W","W","D","W"] },
    MCI: { name: "Man City",   bg: "#6CABDD", text: "#1C2C5B", border: "#1C2C5B", form: ["W","W","L","W","W"] },
    MUN: { name: "Man United", bg: "#DA291C", text: "#FFFFFF", border: "#000000", form: ["D","L","W","D","L"] },
    NEW: { name: "Newcastle",  bg: "#000000", text: "#FFFFFF", border: "#41B6E6", stripe: true, form: ["W","D","W","W","D"] },
    TOT: { name: "Tottenham",  bg: "#FFFFFF", text: "#132257", border: "#132257", form: ["L","W","D","L","W"] },
  };

  // Map various team-name spellings (from the API) to our club codes.
  const NAME_TO_CODE = {
    "arsenal": "ARS",
    "chelsea": "CHE",
    "liverpool": "LIV",
    "manchester city": "MCI", "man city": "MCI",
    "manchester united": "MUN", "man united": "MUN", "manchester utd": "MUN",
    "newcastle": "NEW", "newcastle united": "NEW",
    "tottenham": "TOT", "tottenham hotspur": "TOT", "spurs": "TOT",
  };

  // First-scorer suggestions per club (datalist hints; free text still allowed).
  const SCORERS = {
    ARS: ["Saka", "Havertz", "Martinelli", "Ødegaard", "Jesus", "Trossard"],
    CHE: ["Palmer", "Jackson", "Nkunku", "Madueke", "Neto", "Sterling"],
    LIV: ["Salah", "Núñez", "Gakpo", "Díaz", "Jota", "Szoboszlai"],
    MCI: ["Haaland", "Foden", "Doku", "Savinho", "B. Silva", "Marmoush"],
    MUN: ["Højlund", "Rashford", "Garnacho", "Fernandes", "Mount", "Zirkzee"],
    NEW: ["Isak", "Gordon", "Wilson", "Barnes", "Murphy", "Joelinton"],
    TOT: ["Son", "Solanke", "Richarlison", "Kulusevski", "Maddison", "Johnson"],
  };

  // Fallback fixtures (used when /api/fixtures is unavailable, e.g. opened locally).
  const DEMO_FIXTURES = [
    { id: "demo-0", home: "Arsenal",    away: "Aston Villa",    super7: "Arsenal" },
    { id: "demo-1", home: "Chelsea",    away: "Brighton",       super7: "Chelsea" },
    { id: "demo-2", home: "Everton",    away: "Liverpool",      super7: "Liverpool" },
    { id: "demo-3", home: "Man City",   away: "Wolves",         super7: "Man City" },
    { id: "demo-4", home: "Fulham",     away: "Man United",     super7: "Man United" },
    { id: "demo-5", home: "Newcastle",  away: "Brentford",      super7: "Newcastle" },
    { id: "demo-6", home: "Tottenham",  away: "Crystal Palace", super7: "Tottenham" },
  ];

  // Form guides and H2H metadata keyed by club code
  const FIXTURE_META = {
    "ARS": { form: ["W","W","D","W","L"], h2h_vs: { "CHE": "Arsenal won 3 of the last 5 H2H", "NEW": "Last 5: ARS 3W 1D 1L" } },
    "CHE": { form: ["W","D","W","L","W"], h2h_vs: { "ARS": "Chelsea won 2 of the last 5 H2H", "BHA": "Last 5: CHE 2W 2D 1L" } },
    "LIV": { form: ["W","W","W","D","W"], h2h_vs: { "MCI": "Liverpool won 3 of the last 5 H2H", "WOL": "Last 5: LIV 4W 1D 0L" } },
    "MCI": { form: ["W","W","L","W","W"], h2h_vs: { "LIV": "Man City won 2 of the last 5 H2H", "FUL": "Last 5: MCI 4W 1D 0L" } },
    "MUN": { form: ["D","L","W","D","L"], h2h_vs: { "TOT": "Last 5: even split", "BHA": "Last 5: MUN 2W 1D 2L" } },
    "NEW": { form: ["W","D","W","W","D"], h2h_vs: { "ARS": "Newcastle won 1 of last 5 H2H", "CRY": "Last 5: NEW 3W 1D 1L" } },
    "TOT": { form: ["L","W","D","L","W"], h2h_vs: { "MUN": "Spurs won 2 of last 5 H2H", "EVE": "Last 5: TOT 4W 0D 1L" } },
  };

  // Demo data for most popular predictions
  const POPULAR = [
    { fixture: "Arsenal vs Chelsea",      picks: [{ score: "2–1", pct: 34 }, { score: "1–0", pct: 21 }] },
    { fixture: "Brentford vs Chelsea",    picks: [{ score: "1–1", pct: 28 }, { score: "0–1", pct: 24 }] },
    { fixture: "Liverpool vs Wolves",     picks: [{ score: "3–0", pct: 42 }, { score: "2–0", pct: 31 }] },
    { fixture: "Man City vs Fulham",      picks: [{ score: "2–0", pct: 38 }, { score: "3–0", pct: 26 }] },
    { fixture: "Brighton vs Man United",  picks: [{ score: "1–1", pct: 29 }, { score: "1–0", pct: 22 }] },
    { fixture: "Newcastle vs Crystal Pal",picks: [{ score: "2–0", pct: 36 }, { score: "1–0", pct: 28 }] },
    { fixture: "Tottenham vs Everton",    picks: [{ score: "2–0", pct: 41 }, { score: "1–0", pct: 29 }] },
  ];

  const HISTORY = [
    {
      gw: 33, date: "Sat 31 May 2026",
      results: [
        { home: "Arsenal",    away: "Newcastle",      score: "3–1", super7: "Arsenal",    scorer: "Saka" },
        { home: "Brentford",  away: "Chelsea",        score: "1–2", super7: "Chelsea",    scorer: "Palmer" },
        { home: "Liverpool",  away: "Wolves",         score: "4–0", super7: "Liverpool",  scorer: "Salah" },
        { home: "Man City",   away: "Fulham",         score: "2–0", super7: "Man City",   scorer: "Haaland" },
        { home: "Brighton",   away: "Man United",     score: "1–1", super7: "Man United", scorer: "Højlund" },
        { home: "Newcastle",  away: "Crystal Palace", score: "2–0", super7: "Newcastle",  scorer: "Isak" },
        { home: "Tottenham",  away: "Everton",        score: "3–0", super7: "Tottenham",  scorer: "Son" },
      ]
    },
    {
      gw: 32, date: "Sat 24 May 2026",
      results: [
        { home: "Arsenal",    away: "Aston Villa",    score: "2–1", super7: "Arsenal",    scorer: "Martinelli" },
        { home: "Chelsea",    away: "Brighton",       score: "2–0", super7: "Chelsea",    scorer: "Jackson" },
        { home: "Everton",    away: "Liverpool",      score: "0–3", super7: "Liverpool",  scorer: "Núñez" },
        { home: "Man City",   away: "Bournemouth",    score: "3–1", super7: "Man City",   scorer: "Foden" },
        { home: "Man United", away: "Luton",          score: "2–0", super7: "Man United", scorer: "Rashford" },
        { home: "Newcastle",  away: "Sheffield Utd",  score: "3–0", super7: "Newcastle",  scorer: "Gordon" },
        { home: "Tottenham",  away: "Burnley",        score: "4–1", super7: "Tottenham",  scorer: "Son" },
      ]
    },
    {
      gw: 31, date: "Sat 17 May 2026",
      results: [
        { home: "Arsenal",    away: "Brentford",      score: "1–0", super7: "Arsenal",    scorer: "Havertz" },
        { home: "Chelsea",    away: "Nottm Forest",   score: "3–1", super7: "Chelsea",    scorer: "Nkunku" },
        { home: "Liverpool",  away: "Burnley",        score: "3–0", super7: "Liverpool",  scorer: "Salah" },
        { home: "Man City",   away: "Leicester",      score: "4–1", super7: "Man City",   scorer: "Doku" },
        { home: "Man United", away: "West Ham",       score: "2–0", super7: "Man United", scorer: "Garnacho" },
        { home: "Newcastle",  away: "Ipswich",        score: "3–1", super7: "Newcastle",  scorer: "Isak" },
        { home: "Tottenham",  away: "Southampton",    score: "4–0", super7: "Tottenham",  scorer: "Son" },
      ]
    },
  ];

  const LEADERBOARD = [
    { name: "GoonerGuru",     exact: 6, pts: 38 },
    { name: "KopEndKid",      exact: 5, pts: 34 },
    { name: "BlueMoonRising", exact: 5, pts: 31 },
    { name: "SpursTilIDie",   exact: 4, pts: 27 },
    { name: "RedDevil_07",    exact: 4, pts: 25 },
    { name: "TooneToon",      exact: 3, pts: 21 },
    { name: "StamfordSam",    exact: 3, pts: 19 },
    { name: "Pep_Roulette",   exact: 2, pts: 15 },
  ];

  const STORE_KEY = "super7.slip.v3";
  const SUBMIT_KEY = "super7.submitted.v1";
  const NOTIFY_KEY = "super7.notify";
  const NO_SCORER = "No goalscorer";
  const OWN_GOAL = "Own goal";
  const ENTRY_CUTOFF_MS = 3600000; // entries close 1 hour before first kickoff

  // Demo squad lists for opponents (used when the API can't provide squads).
  const FALLBACK_SQUADS = {
    "aston villa":     ["Watkins", "Rogers", "Bailey", "Tielemans", "McGinn", "Ramsey"],
    "brighton":        ["João Pedro", "Mitoma", "Welbeck", "Adingra", "Rutter", "O'Riley"],
    "everton":         ["Calvert-Lewin", "Ndiaye", "McNeil", "Doucouré", "Beto", "Harrison"],
    "wolves":          ["Cunha", "Strand Larsen", "Hwang", "Sarabia", "Bellegarde", "Aït-Nouri"],
    "fulham":          ["Jiménez", "Iwobi", "Muniz", "Wilson", "Smith Rowe", "Traoré"],
    "brentford":       ["Mbeumo", "Wissa", "Schade", "Damsgaard", "Lewis-Potter", "Janelt"],
    "crystal palace":  ["Mateta", "Eze", "Sarr", "Kamada", "Muñoz", "Hughes"],
  };

  // Season-long demo standings for the leaderboard's second tab.
  const SEASON_LEADERBOARD = [
    { name: "KopEndKid",      exact: 41, pts: 402 },
    { name: "GoonerGuru",     exact: 38, pts: 391 },
    { name: "Pep_Roulette",   exact: 35, pts: 356 },
    { name: "BlueMoonRising", exact: 33, pts: 340 },
    { name: "TooneToon",      exact: 29, pts: 311 },
    { name: "SpursTilIDie",   exact: 27, pts: 296 },
    { name: "StamfordSam",    exact: 24, pts: 270 },
    { name: "RedDevil_07",    exact: 22, pts: 255 },
  ];

  // Live demo mode: append ?demoLive=1 to the game URL to simulate matchday.
  const DEMO_LIVE = /[?&#]demo-?[Ll]ive/.test(location.search + location.hash);

  // ---- helpers ----
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const codeFor = (name) => NAME_TO_CODE[(name || "").trim().toLowerCase()] || null;
  const meta = (name) => {
    const c = codeFor(name);
    return c ? CLUBS[c] : { name: name || "TBC", bg: "#555", text: "#FFFFFF", border: "rgba(255,255,255,.25)" };
  };
  const abbr = (name) => {
    const c = codeFor(name);
    if (c) return c;
    return (name || "TBC").replace(/[^A-Za-z ]/g, "").split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  };

  const SHIELD_PATH = "M16,9 H84 Q90,9 90,15 V56 Q90,85 50,106 Q10,85 10,56 V15 Q10,9 16,9 Z";

  function loadSlip() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveSlip() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(slip)); } catch (e) {}
    showToast("Saved");
  }

  let slip = loadSlip();   // { [fixtureId]: { h, a, scorer } }
  let FIXTURES = [];

  // ============================================================
  //  Landing: club shields
  // ============================================================
  function shieldSVG(c) {
    return `<svg class="shield-svg" viewBox="0 0 100 112" aria-hidden="true">` +
      `<path d="${SHIELD_PATH}" fill="${c.bg}" stroke="${c.border}" stroke-width="5" stroke-linejoin="round"/></svg>`;
  }

  // Striped shield (Newcastle) as a self-contained SVG <img> so the clip/stripes
  // render reliably (injected inline SVG clip refs are unreliable across browsers).
  function stripedShieldImg(c) {
    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 112'>" +
      "<clipPath id='c'><path d='" + SHIELD_PATH + "'/></clipPath>" +
      "<g clip-path='url(#c)'>" +
      "<rect x='0' y='0' width='100' height='112' fill='#ffffff'/>" +
      "<rect x='0' y='0' width='12.5' height='112' fill='#000000'/>" +
      "<rect x='25' y='0' width='12.5' height='112' fill='#000000'/>" +
      "<rect x='50' y='0' width='12.5' height='112' fill='#000000'/>" +
      "<rect x='75' y='0' width='12.5' height='112' fill='#000000'/>" +
      "</g>" +
      "<path d='" + SHIELD_PATH + "' fill='none' stroke='" + c.border + "' stroke-width='5' stroke-linejoin='round'/>" +
      "</svg>";
    return `<img class="shield-svg" alt="" src="data:image/svg+xml,${encodeURIComponent(svg)}">`;
  }

  function renderClubRow() {
    const row = $("#clubRow");
    if (!row) return;
    row.innerHTML = Object.entries(CLUBS).map(([code, c]) => {
      const body = c.stripe ? stripedShieldImg(c) : shieldSVG(c);
      const nameInner = c.stripe
        ? `<span class="name-chip" style="border-color:${c.border}">${c.name}</span>`
        : c.name;
      const nameStyle = c.stripe ? "" : `color:${c.text}`;
      const formDots = (c.form || []).map((r) =>
        `<span class="form-dot form-dot-${r}" title="${r === "W" ? "Win" : r === "D" ? "Draw" : "Loss"}"></span>`
      ).join("");
      const formGuide = formDots ? `<div class="form-guide" aria-label="Recent form">${formDots}</div>` : "";
      return `<div class="shield" title="${c.name}">${body}` +
        `<span class="shield-name" style="${nameStyle}">${nameInner}</span>${formGuide}</div>`;
    }).join("");
  }

  // ============================================================
  //  Game: fixtures + predictions
  // ============================================================
  function renderSkeletons() {
    const wrap = $("#fixtures");
    if (!wrap) return;
    let html = "";
    for (let i = 0; i < 7; i++) {
      html += `<div class="fixture skeleton" aria-hidden="true">
        <div class="sk-line sk-sm"></div>
        <div class="sk-row"><div class="sk-dot"></div><div class="sk-line"></div><div class="sk-score"></div><div class="sk-line"></div><div class="sk-dot"></div></div>
        <div class="sk-line sk-chips"></div>
      </div>`;
    }
    wrap.innerHTML = html;
  }

  async function loadFixtures() {
    const wrap = $("#fixtures");
    if (!wrap) return; // not the game page
    renderSkeletons();
    try {
      const r = await fetch("/api/fixtures", { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error("status " + r.status);
      const data = await r.json();
      if (data && Array.isArray(data.fixtures) && data.fixtures.length) {
        FIXTURES = data.fixtures;
      } else {
        throw new Error("no fixtures");
      }
    } catch (e) {
      FIXTURES = DEMO_FIXTURES; // graceful fallback
    }
    renderFixtures();
    startCountdown();
    updateStatus();
    updateSubmittedBanner();
  }

  function badge(name) {
    const m = meta(name);
    const bg = m.stripe ? "#000000" : m.bg;
    return `<span class="team-badge" style="background:${bg};color:${m.text};border:1.5px solid ${m.border}">${abbr(name)}</span>`;
  }

  function fixtureDateLabel(f) {
    if (!f.date) return "";
    const ts = Date.parse(`${f.date}T${f.time || "15:00:00"}Z`);
    if (!isFinite(ts)) return "";
    try {
      return new Date(ts).toLocaleString(undefined, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    } catch (e) { return f.date; }
  }

  function formDotsHTML(form) {
    if (!Array.isArray(form)) return "";
    return form.map((r) => `<span class="fdot fdot-${r.toLowerCase()}"></span>`).join("");
  }

  // ---- First scorer: pick ONE player from EITHER team (or Own goal / No goal) ----
  const SIDE_CHOICE = {}; // fixtureId -> "home" | "away" (UI tab state)

  function squadFor(f, side) {
    const teamName = side === "home" ? f.home : f.away;
    // Prefer real squad data from the API.
    if (f.squads && Array.isArray(f.squads[side]) && f.squads[side].length) {
      return f.squads[side].slice(0, 10);
    }
    // Fall back to our curated lists (Super 7 clubs + demo opponents).
    const code = codeFor(teamName);
    if (code && SCORERS[code]) return SCORERS[code];
    const fb = FALLBACK_SQUADS[(teamName || "").trim().toLowerCase()];
    return fb || [];
  }

  function activeSide(f, pick) {
    if (SIDE_CHOICE[f.id]) return SIDE_CHOICE[f.id];
    // If the saved pick belongs to the away squad, open that tab.
    if (pick.scorer && squadFor(f, "away").indexOf(pick.scorer) !== -1) return "away";
    return "home";
  }

  function scorerArea(f, pick) {
    const side = activeSide(f, pick);
    const players = squadFor(f, side);
    const specials = [OWN_GOAL, NO_SCORER];
    const known = squadFor(f, "home").concat(squadFor(f, "away")).concat(specials);
    const isCustom = !!pick.scorer && known.indexOf(pick.scorer) === -1;
    let html = `<div class="side-tabs" role="tablist" aria-label="Pick a team">`;
    ["home", "away"].forEach((s) => {
      const team = s === "home" ? f.home : f.away;
      html += `<button type="button" class="side-tab${s === side ? " active" : ""}" data-tabside="${s}">${esc(abbr(team))} ${esc(team)}</button>`;
    });
    html += `</div>`;
    html += `<div class="scorer-chips" role="group" aria-label="First scorer">`;
    players.forEach((p) => {
      html += `<button type="button" class="chip${pick.scorer === p ? " sel" : ""}" data-val="${esc(p)}">${esc(p)}</button>`;
    });
    html += `</div>`;
    html += `<div class="scorer-chips scorer-specials">`;
    html += `<button type="button" class="chip chip-og${pick.scorer === OWN_GOAL ? " sel" : ""}" data-val="${esc(OWN_GOAL)}">Own goal</button>`;
    html += `<button type="button" class="chip${pick.scorer === NO_SCORER ? " sel" : ""}" data-val="${esc(NO_SCORER)}">No goal</button>`;
    html += `<button type="button" class="chip chip-other${isCustom ? " sel" : ""}" data-other="1">Other&hellip;</button>`;
    html += `</div>`;
    html += `<input class="scorer-input" data-id="${esc(f.id)}" placeholder="Type a player from either team"
             value="${isCustom ? esc(pick.scorer) : ""}"${isCustom ? "" : " hidden"} />`;
    return `<div class="scorer-area" data-id="${esc(f.id)}">${html}</div>`;
  }

  function renderFixtures() {
    const wrap = $("#fixtures");
    if (!wrap) return;
    wrap.innerHTML = FIXTURES.map((f, i) => {
      const s7code = codeFor(f.super7) || codeFor(f.home) || codeFor(f.away);
      const s7club = s7code ? CLUBS[s7code] : null;
      const s7name = (s7club && s7club.name) || f.super7 || f.home;
      const clubAccent = s7club ? s7club.bg : "transparent";
      const pick = slip[f.id] || {};
      const hv = Number.isInteger(pick.h) ? pick.h : 0;
      const av = Number.isInteger(pick.a) ? pick.a : 0;
      const when = fixtureDateLabel(f);
      const done = isComplete(pick);
      const homeCode = codeFor(f.home);
      const awayCode = codeFor(f.away);
      const homeMeta = homeCode ? FIXTURE_META[homeCode] : null;
      const awayMeta = awayCode ? FIXTURE_META[awayCode] : null;
      const h2hText = (homeMeta && homeMeta.h2h_vs && awayCode && homeMeta.h2h_vs[awayCode])
        ? homeMeta.h2h_vs[awayCode]
        : (awayMeta && awayMeta.h2h_vs && homeCode && awayMeta.h2h_vs[homeCode])
          ? awayMeta.h2h_vs[homeCode]
          : null;
      return `
      <div class="fixture${done ? " done" : ""}" data-id="${f.id}" style="--club-accent:${clubAccent};animation-delay:${i * 0.07}s">
        ${when ? `<div class="fixture-date">${when}</div>` : ""}
        <div class="fixture-main">
          <div class="team home">
            ${badge(f.home)}
            <span class="team-name">${f.home}</span>
          </div>
          <div class="score">
            <div class="score-control" data-side="h">
              <button class="score-btn" type="button" data-d="-1" aria-label="Decrease home score">&minus;</button>
              <span class="score-val" data-side="h">${hv}</span>
              <button class="score-btn" type="button" data-d="1" aria-label="Increase home score">+</button>
            </div>
            <span class="score-dash">&ndash;</span>
            <div class="score-control" data-side="a">
              <button class="score-btn" type="button" data-d="-1" aria-label="Decrease away score">&minus;</button>
              <span class="score-val" data-side="a">${av}</span>
              <button class="score-btn" type="button" data-d="1" aria-label="Increase away score">+</button>
            </div>
          </div>
          <div class="team away">
            ${badge(f.away)}
            <span class="team-name">${f.away}</span>
          </div>
        </div>
        <div class="fixture-live" data-id="${f.id}" hidden></div>
        <div class="fixture-scorer">
          <label>
            <span class="scorer-badge" style="background:${clubAccent};color:${s7club ? s7club.text : "#fff"}">${s7code || "?"}</span>
            First goalscorer of the match
          </label>
          ${scorerArea(f, pick)}
        </div>
        <div class="fixture-meta">
          <div class="fixture-forms">
            <div class="form-track">
              <span class="form-team-name">${homeCode || f.home.slice(0, 3).toUpperCase()}</span>
              ${formDotsHTML(homeMeta ? homeMeta.form : null)}
            </div>
            <div class="form-track">
              <span class="form-team-name">${awayCode || f.away.slice(0, 3).toUpperCase()}</span>
              ${formDotsHTML(awayMeta ? awayMeta.form : null)}
            </div>
          </div>
          ${h2hText ? `<div class="fixture-h2h">${h2hText}</div>` : ""}
        </div>
        <div class="fixture-done-badge"${done ? "" : ' hidden'}>&#10003; Complete</div>
      </div>`;
    }).join("");
  }

  function isComplete(p) {
    return p && Number.isInteger(p.h) && Number.isInteger(p.a) && !!p.scorer;
  }
  function markDone() {
    document.querySelectorAll(".fixture").forEach((el) => {
      const done = isComplete(slip[el.dataset.id]);
      el.classList.toggle("done", done);
      const badge = el.querySelector(".fixture-done-badge");
      if (badge) badge.hidden = !done;
    });
  }

  function pulseEl(el) {
    el.classList.remove("pulse");
    void el.offsetWidth;
    el.classList.add("pulse");
    el.addEventListener("animationend", () => el.classList.remove("pulse"), { once: true });
  }

  function step(id, side, delta) {
    if (isLocked()) return;
    const p = slip[id] || {};
    let v = Number.isInteger(p[side]) ? p[side] : 0;
    v = Math.max(0, Math.min(15, v + delta));
    p[side] = v;
    slip[id] = p;
    saveSlip();
    const el = document.querySelector(`.fixture[data-id="${id}"]`);
    if (el) {
      const valEl = el.querySelector(`.score-val[data-side="${side}"]`);
      valEl.textContent = v;
      pulseEl(valEl);
    }
    markDone();
    updateStatus();
  }

  function setScorerValue(id, value) {
    if (isLocked()) return;
    const p = slip[id] || {};
    if (value) p.scorer = value; else delete p.scorer;
    slip[id] = p;
    saveSlip();
    markDone();
    updateStatus();
  }

  function completeCount() {
    return FIXTURES.reduce((n, f) => n + (isComplete(slip[f.id]) ? 1 : 0), 0);
  }

  // ---- lock rules: submitted slips are FINAL; entries close 1h before KO ----
  function gwKey() {
    return FIXTURES.map((f) => f.id).join("|");
  }
  function getSubmitted() {
    let s = null;
    try { s = JSON.parse(localStorage.getItem(SUBMIT_KEY)); } catch (e) {}
    // A submission only counts for the gameweek it was made for.
    if (s && FIXTURES.length && s.gw !== gwKey()) return null;
    return s;
  }
  function entriesClosed() {
    if (DEMO_LIVE) return true;
    return deadlineTs != null && Date.now() >= deadlineTs;
  }
  function isLocked() {
    return !!getSubmitted() || entriesClosed();
  }

  function applyLockUI() {
    const locked = isLocked();
    const slipEl = $(".slip");
    if (slipEl) slipEl.classList.toggle("locked", locked);
    document.querySelectorAll("#fixtures .score-btn, #fixtures .chip, #fixtures .side-tab").forEach((b) => {
      b.disabled = locked;
    });
    document.querySelectorAll("#fixtures .scorer-input").forEach((i) => { i.disabled = locked; });
    const clearBtn = $("#clearBtn");
    if (clearBtn) clearBtn.hidden = locked;
    const submit = $("#submitBtn");
    if (submit) submit.hidden = locked;
  }

  function updateStatus() {
    const total = FIXTURES.length || 7;
    const n = completeCount();
    const status = $("#slipStatus");
    const submit = $("#submitBtn");
    const submitted = getSubmitted();
    if (status) {
      if (submitted) {
        status.textContent = "Slip submitted. Final — no amendments.";
        status.classList.add("ready");
      } else if (entriesClosed()) {
        status.textContent = "Entries are closed for this gameweek.";
        status.classList.remove("ready");
      } else {
        status.textContent = `${n} / ${total} predictions complete` +
          (n < total ? ", add scores and first scorers" : ", ready to submit");
        status.classList.toggle("ready", n === total && total > 0);
      }
    }
    if (submit) {
      const wasDisabled = submit.disabled;
      submit.disabled = isLocked() || !(n === total && total > 0);
      if (wasDisabled && !submit.disabled) pulseEl(submit);
    }
    renderProgress(n, total);
    applyLockUI();
  }

  function renderProgress(n, total) {
    const track = $("#progressTrack");
    if (!track) return;
    if (track.children.length !== total) {
      track.innerHTML = Array.from({ length: total }, () => `<span class="progress-seg"></span>`).join("");
    }
    Array.prototype.forEach.call(track.children, (seg, i) => {
      seg.classList.toggle("filled", i < n);
    });
  }

  // ---- submitted state ----
  function updateSubmittedBanner() {
    const banner = $("#submittedBanner");
    const submitted = getSubmitted();
    if (banner) {
      banner.hidden = !(submitted || entriesClosed());
      const p = banner.querySelector("p");
      if (p) {
        p.textContent = submitted
          ? "Your slip is in. Submitted score cards are final — no amendments."
          : "Entries are closed for this gameweek. Predictions lock one hour before the first kickoff.";
      }
    }
  }

  // ---- countdown: entries close 1 HOUR before the first kickoff ----
  let deadlineTs = null;
  function computeDeadline() {
    const times = FIXTURES
      .map((f) => Date.parse(`${f.date}T${f.time || "15:00:00"}Z`))
      .filter((t) => isFinite(t));
    if (times.length) { deadlineTs = Math.min.apply(null, times) - ENTRY_CUTOFF_MS; return; }
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
    d.setHours(15, 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 7);
    deadlineTs = d.getTime() - ENTRY_CUTOFF_MS;
  }
  let countdownTimer = null;
  let closedApplied = false;
  function startCountdown() {
    const el = $("#timer");
    if (!el) return;
    computeDeadline();
    const label = document.querySelector(".deadline-label");
    if (label) label.textContent = "Entries close";
    const tick = () => {
      if (entriesClosed()) {
        el.textContent = "CLOSED";
        el.classList.add("urgent");
        if (!closedApplied) {
          closedApplied = true;
          updateStatus();
          updateSubmittedBanner();
          startLiveUpdates();
        }
        return;
      }
      let diff = Math.max(0, deadlineTs - Date.now());
      const dd = Math.floor(diff / 86400000); diff -= dd * 86400000;
      const hh = Math.floor(diff / 3600000);  diff -= hh * 3600000;
      const mm = Math.floor(diff / 60000);    diff -= mm * 60000;
      const ss = Math.floor(diff / 1000);
      const pad = (n) => String(n).padStart(2, "0");
      el.textContent = (dd > 0 ? dd + "d " : "") + `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
      el.classList.toggle("urgent", diff > 0 && diff < 3600000);
    };
    tick();
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(tick, 1000);
  }

  // ============================================================
  //  Live matchday: pulls scores and paints them onto the slip
  // ============================================================
  let liveTimer = null;
  let liveState = null; // { [fixtureId]: { hs, as, status, minute } }
  let demoSim = null;

  function startLiveUpdates() {
    const onGamePage = !!$("#fixtures");
    if (!onGamePage || liveTimer) return;
    if (DEMO_LIVE) { startDemoSim(); return; }
    const realIds = FIXTURES.map((f) => f.id).filter((id) => /^\d+$/.test(String(id)));
    if (!realIds.length) return; // demo fixtures: nothing to poll
    const poll = async () => {
      try {
        const r = await fetch(`/api/live?ids=${realIds.join(",")}`, { headers: { Accept: "application/json" } });
        if (!r.ok) return;
        const data = await r.json();
        if (data && Array.isArray(data.scores)) {
          liveState = {};
          data.scores.forEach((s) => { liveState[s.id] = s; });
          renderLive();
        }
      } catch (e) { /* keep last state */ }
    };
    poll();
    liveTimer = setInterval(poll, 60000);
  }

  function startDemoSim() {
    liveState = {};
    FIXTURES.forEach((f, i) => {
      liveState[f.id] = { hs: 0, as: 0, status: "1H", minute: "1'", _m: 1 + i };
    });
    renderLive();
    demoSim = setInterval(() => {
      let allDone = true;
      FIXTURES.forEach((f) => {
        const s = liveState[f.id];
        if (s.status === "Match Finished") return;
        allDone = false;
        s._m += 4;
        if (Math.random() < 0.09) s.hs += 1;
        if (Math.random() < 0.08) s.as += 1;
        if (s._m >= 90) { s.status = "Match Finished"; s.minute = "FT"; }
        else if (s._m >= 45 && s._m < 49) { s.status = "HT"; s.minute = "HT"; }
        else { s.status = "1H"; s.minute = Math.min(90, s._m) + "'"; }
      });
      renderLive();
      if (allDone && demoSim) { clearInterval(demoSim); demoSim = null; }
    }, 2500);
  }

  function verdictFor(pick, s) {
    if (!pick || !Number.isInteger(pick.h) || !Number.isInteger(pick.a)) return "";
    if (s.hs == null || s.as == null) return "";
    if (pick.h === s.hs && pick.a === s.as) return "v-exact";
    const pr = Math.sign(pick.h - pick.a);
    const sr = Math.sign(s.hs - s.as);
    if (pr === sr) return "v-result";
    return s.status === "Match Finished" ? "v-miss" : "v-off";
  }

  function renderLive() {
    if (!liveState) return;
    let pts = 0;
    let anyLive = false;
    FIXTURES.forEach((f) => {
      const s = liveState[f.id];
      const strip = document.querySelector(`.fixture-live[data-id="${f.id}"]`);
      const card = document.querySelector(`.fixture[data-id="${f.id}"]`);
      if (!s || !strip || !card) return;
      const inPlay = s.status && s.status !== "Match Finished" && s.status !== "Not Started" && s.status !== "NS" && s.status !== "Unknown" && s.status !== "";
      const finished = s.status === "Match Finished";
      if (s.hs == null && s.as == null && !inPlay) { strip.hidden = true; return; }
      anyLive = anyLive || inPlay;
      strip.hidden = false;
      strip.innerHTML =
        `<span class="live-dot${finished ? " ft" : ""}"></span>` +
        `<span class="live-score">${s.hs == null ? "-" : s.hs}&ndash;${s.as == null ? "-" : s.as}</span>` +
        `<span class="live-min">${finished ? "FT" : esc(s.minute || s.status || "")}</span>`;
      card.classList.remove("v-exact", "v-result", "v-miss", "v-off");
      const v = verdictFor(slip[f.id], s);
      if (v) card.classList.add(v);
      if (v === "v-exact") pts += 5;
      else if (v === "v-result") pts += 2;
    });
    const status = $("#slipStatus");
    if (status && getSubmitted()) {
      status.innerHTML = `<strong>${anyLive ? "Live" : "Latest"}: ${pts} pts</strong> from your slip` +
        (anyLive ? " &middot; scores update automatically" : "");
      status.classList.add("ready");
    }
  }

  // ============================================================
  //  Leaderboard — interactive (tabs, search, sort, podium, count-up)
  // ============================================================
  function animateNum(el, target, prefix) {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pre = prefix || "";
    if (reduce) { el.textContent = pre + target.toLocaleString(); return; }
    const dur = 700;
    const start = performance.now();
    const from = 0;
    const frame = (t) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      el.textContent = pre + Math.round(from + (target - from) * eased).toLocaleString();
      if (k < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const lbState = { set: "gw", sortKey: "pts", sortDir: -1, q: "" };

  function lbData() {
    const rows = (lbState.set === "season" ? SEASON_LEADERBOARD : LEADERBOARD).slice();
    // Rank is always by points before search/sort so #1 stays #1 when filtering.
    const byPts = rows.slice().sort((a, b) => b.pts - a.pts);
    rows.forEach((r) => { r.rank = byPts.indexOf(r) + 1; });
    let out = rows;
    if (lbState.q) {
      const q = lbState.q.toLowerCase();
      out = out.filter((r) => r.name.toLowerCase().includes(q));
    }
    const k = lbState.sortKey;
    out.sort((a, b) => {
      const va = k === "name" ? a.name.toLowerCase() : a[k];
      const vb = k === "name" ? b.name.toLowerCase() : b[k];
      return (va < vb ? -1 : va > vb ? 1 : 0) * lbState.sortDir;
    });
    return out;
  }

  function renderPodium() {
    const podium = $("#podium");
    if (!podium) return;
    const top3 = (lbState.set === "season" ? SEASON_LEADERBOARD : LEADERBOARD)
      .slice().sort((a, b) => b.pts - a.pts).slice(0, 3);
    if (top3.length < 3) { podium.innerHTML = ""; return; }
    const order = [top3[1], top3[0], top3[2]]; // visual: 2nd, 1st, 3rd
    const places = [2, 1, 3];
    podium.innerHTML = order.map((r, i) => `
      <div class="podium-card place-${places[i]}">
        <span class="podium-rank">${places[i]}</span>
        <span class="podium-avatar">${esc(r.name.slice(0, 2).toUpperCase())}</span>
        <span class="podium-name">${esc(r.name)}</span>
        <span class="podium-pts" data-pts="${r.pts}">0</span>
        <span class="podium-sub">${r.exact} exact</span>
      </div>`).join("");
    podium.querySelectorAll(".podium-pts").forEach((el) => {
      animateNum(el, parseInt(el.dataset.pts, 10));
    });
  }

  function renderLeaderboard() {
    const body = $("#leaderboardBody");
    if (!body) return;
    const rows = lbData();
    body.innerHTML = rows.map((r, i) => {
      const podiumCls = r.rank <= 3 ? ` class="lb-podium lb-pos-${r.rank}"` : "";
      return `<tr${podiumCls} style="animation-delay:${0.03 + i * 0.05}s">` +
        `<td class="lb-rank">${r.rank}</td><td>${esc(r.name)}</td><td>${r.exact}</td>` +
        `<td class="num" data-pts="${r.pts}">${r.pts}</td></tr>`;
    }).join("") || `<tr><td colspan="4" class="lb-empty">No players match that search.</td></tr>`;
    // Sort indicators on headers.
    document.querySelectorAll(".leaderboard thead th[data-sort]").forEach((th) => {
      th.classList.toggle("sorted", th.dataset.sort === lbState.sortKey);
      th.classList.toggle("desc", th.dataset.sort === lbState.sortKey && lbState.sortDir === -1);
    });
  }

  function initLeaderboardControls() {
    const tabs = $("#lbTabs");
    if (tabs) {
      tabs.addEventListener("click", (e) => {
        const tab = e.target.closest(".lb-tab");
        if (!tab) return;
        tabs.querySelectorAll(".lb-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        lbState.set = tab.dataset.set;
        renderPodium();
        renderLeaderboard();
        const pts = document.querySelectorAll(".leaderboard td.num");
        pts.forEach((el) => animateNum(el, parseInt(el.dataset.pts, 10)));
      });
    }
    const search = $("#lbSearch");
    if (search) {
      search.addEventListener("input", () => {
        lbState.q = search.value.trim();
        renderLeaderboard();
      });
    }
    document.querySelectorAll(".leaderboard thead th[data-sort]").forEach((th) => {
      th.addEventListener("click", () => {
        const key = th.dataset.sort;
        if (lbState.sortKey === key) lbState.sortDir *= -1;
        else { lbState.sortKey = key; lbState.sortDir = key === "name" ? 1 : -1; }
        renderLeaderboard();
      });
    });
    renderPodium();
  }

  // ============================================================
  //  Modal
  // ============================================================
  function renderModalPicks() {
    const ul = $("#modalPicks");
    if (!ul) return;
    ul.innerHTML = FIXTURES.map((f) => {
      const p = slip[f.id] || {};
      const h = Number.isInteger(p.h) ? p.h : "-";
      const a = Number.isInteger(p.a) ? p.a : "-";
      return `<li><span>${esc(abbr(f.home))} <strong>${h}&ndash;${a}</strong> ${esc(abbr(f.away))}</span>` +
        `<span class="pick-scorer">${esc(p.scorer || "")}</span></li>`;
    }).join("");
  }

  function burstConfetti() {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const colors = ["#DCE140", "#E8ED5A", "#C7C8CA", "#FFFFFF"];
    const holder = document.createElement("div");
    holder.className = "confetti";
    for (let i = 0; i < 70; i++) {
      const s = document.createElement("span");
      s.style.left = Math.random() * 100 + "vw";
      s.style.background = colors[i % colors.length];
      s.style.animationDuration = 1.8 + Math.random() * 1.6 + "s";
      s.style.animationDelay = Math.random() * 0.4 + "s";
      s.style.width = s.style.height = 5 + Math.random() * 6 + "px";
      holder.appendChild(s);
    }
    document.body.appendChild(holder);
    setTimeout(() => holder.remove(), 4200);
  }

  let toastTimer = null;
  function showToast(msg) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 1400);
  }

  function openModal() {
    // Submitting is FINAL for the gameweek: no amendments once the card is in.
    try { localStorage.setItem(SUBMIT_KEY, JSON.stringify({ at: Date.now(), gw: gwKey() })); } catch (e) {}
    updateSubmittedBanner();
    updateStatus(); // locks the slip UI
    renderModalPicks();
    const m = $("#modal");
    const txt = $("#modalText");
    if (txt) txt.textContent = "Your score card is in — and it's final. No amendments. Good luck this gameweek.";
    if (m) { m.classList.add("open"); m.setAttribute("aria-hidden", "false"); }
    burstConfetti();
  }
  function closeModal() {
    const m = $("#modal");
    if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
  }

  // ============================================================
  //  Gameweek history
  // ============================================================
  function renderHistory() {
    const list = $("#gwList");
    if (!list) return;
    if (!HISTORY.length) { list.innerHTML = "<p class='demo-note'>No previous results yet.</p>"; return; }
    list.innerHTML = HISTORY.map((gw) => {
      const rows = gw.results.map((r) => {
        const s7code = codeFor(r.super7);
        const s7club = s7code ? CLUBS[s7code] : null;
        const accent = s7club ? s7club.bg : "transparent";
        const textCol = s7club ? s7club.text : "#fff";
        return `<div class="gw-row" style="--club-accent:${accent}">
        <div class="gw-match">
          <div class="gw-team">${badge(r.home)}<span>${r.home}</span></div>
          <div class="gw-score">${r.score}</div>
          <div class="gw-team away">${badge(r.away)}<span>${r.away}</span></div>
        </div>
        <div class="gw-scorer">
          <span class="scorer-badge" style="background:${accent};color:${textCol}">${s7code || "?"}</span>
          First scorer: <strong>${r.scorer}</strong>
        </div>
      </div>`;
      }).join("");
      return `<details class="gw-week">
      <summary><span class="gw-label">Gameweek ${gw.gw}</span><span class="gw-date">${gw.date}</span></summary>
      <div class="gw-results">${rows}</div>
    </details>`;
    }).join("");
  }

  // ============================================================
  //  Reveal on scroll
  // ============================================================
  function setupReveal() {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;

    // Add stagger delay within sibling groups
    [".step", ".prize", ".faq-item"].forEach((sel) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        el.style.transitionDelay = `${i * 0.09}s`;
      });
    });

    const els = document.querySelectorAll(
      ".step, .prize, .faq-item, .slip, .table-wrap, .section-title, .section-lead, .section-cta, .cta-inner, .legal-content, .gw-history, .clubs-strip, .stat-block, .pundit-layout, .stories-grid, .story-card, .origin-layout, .season-stats"
    );
    if (!els.length) return;
    els.forEach((el) => el.classList.add("reveal"));
    // Page-top elements use CSS animation — remove reveal to avoid opacity conflict
    document.querySelectorAll(
      ".page-top .section-title, .page-top .section-lead, .page-top .deadline, .page-top .slip, .page-top .table-wrap, .page-top .demo-note"
    ).forEach((el) => el.classList.remove("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
    els.forEach((el) => io.observe(el));
  }

  // ============================================================
  //  Init
  // ============================================================
  // ============================================================
  //  Popular picks
  // ============================================================
  function renderPopularPicks() {
    const grid = $("#popularGrid");
    if (!grid) return;
    grid.innerHTML = POPULAR.map((item) => {
      const rows = item.picks.map((p) => `
        <div class="pop-row">
          <span class="pop-score">${p.score}</span>
          <div class="pop-bar-wrap">
            <div class="pop-bar" style="width:${p.pct}%"></div>
          </div>
          <span class="pop-pct">${p.pct}%</span>
        </div>`).join("");
      return `
        <div class="pop-card">
          <div class="pop-fixture">${item.fixture}</div>
          ${rows}
        </div>`;
    }).join("");
  }

  // ============================================================
  //  Page life: count-ups, tilt, scroll progress, header state
  // ============================================================
  function setupPageLife() {
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Scroll progress bar (site-wide) + header shadow state.
    const bar = document.createElement("div");
    bar.id = "scrollProgress";
    document.body.appendChild(bar);
    const header = document.querySelector(".site-header");
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - window.innerHeight;
        bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
        if (header) header.classList.toggle("scrolled", window.scrollY > 8);
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    // Jackpot count-up when it scrolls into view (landing page).
    const jackpot = document.querySelector(".jackpot-amount");
    if (jackpot && "IntersectionObserver" in window) {
      const target = parseInt(jackpot.textContent.replace(/[^0-9]/g, ""), 10);
      if (target && !reduce) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((en) => {
            if (!en.isIntersecting) return;
            animateNum(jackpot, target, "£");
            io.disconnect();
          });
        }, { threshold: 0.4 });
        io.observe(jackpot);
      }
    }

    // Subtle 3D tilt on the hero shields (fine pointers only).
    const finePointer = window.matchMedia && window.matchMedia("(pointer: fine)").matches;
    if (finePointer && !reduce) {
      const row = document.querySelector(".club-row");
      if (row) {
        row.addEventListener("pointermove", (e) => {
          const shield = e.target.closest(".shield");
          if (!shield) return;
          const r = shield.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5;
          const y = (e.clientY - r.top) / r.height - 0.5;
          shield.style.transform = `translateY(-6px) scale(1.05) rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
        });
        row.addEventListener("pointerout", (e) => {
          const shield = e.target.closest(".shield");
          if (shield) shield.style.transform = "";
        });
      }
    }
  }

  function init() {
    renderClubRow();
    renderLeaderboard();
    initLeaderboardControls();
    renderHistory();
    renderPopularPicks();
    setupPageLife();

    const fixtures = $("#fixtures");
    if (fixtures) {
      fixtures.addEventListener("click", (e) => {
        if (isLocked()) return;
        const btn = e.target.closest(".score-btn");
        if (btn) {
          const el = e.target.closest(".fixture");
          const control = btn.closest(".score-control");
          step(el.dataset.id, control.dataset.side, parseInt(btn.dataset.d, 10));
          return;
        }
        const tab = e.target.closest(".side-tab");
        if (tab) {
          // Switch which team's squad is showing for this fixture.
          const el = e.target.closest(".fixture");
          const id = el.dataset.id;
          SIDE_CHOICE[id] = tab.dataset.tabside;
          const f = FIXTURES.find((x) => String(x.id) === String(id));
          const area = el.querySelector(".scorer-area");
          if (f && area) area.outerHTML = scorerArea(f, slip[id] || {});
          return;
        }
        const chip = e.target.closest(".chip");
        if (chip) {
          const el = e.target.closest(".fixture");
          const id = el.dataset.id;
          const input = el.querySelector(".scorer-input");
          el.querySelectorAll(".chip").forEach((c) => c.classList.remove("sel"));
          chip.classList.add("sel");
          if (chip.dataset.other) {
            // Reveal the free-text input for a custom player.
            if (input) {
              input.hidden = false;
              input.focus();
              setScorerValue(id, input.value.trim());
            }
          } else {
            if (input) input.hidden = true;
            setScorerValue(id, chip.dataset.val);
          }
        }
      });
      fixtures.addEventListener("input", (e) => {
        const inp = e.target.closest(".scorer-input");
        if (!inp) return;
        setScorerValue(inp.dataset.id, inp.value.trim());
      });
      loadFixtures();
    }

    const clearBtn = $("#clearBtn");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      if (isLocked()) return; // submitted cards are final
      FIXTURES.forEach((f) => { delete slip[f.id]; });
      saveSlip();
      renderFixtures();
      updateStatus();
      showToast("Slip cleared");
    });

    const submitBtn = $("#submitBtn");
    if (submitBtn) submitBtn.addEventListener("click", openModal);
    const modalClose = $("#modalClose");
    if (modalClose) modalClose.addEventListener("click", closeModal);
    const modal = $("#modal");
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    const shareBtn = $("#shareBtn");
    if (shareBtn) shareBtn.addEventListener("click", () => {
      const lines = ["My Super 7 predictions for GW34:"];
      FIXTURES.forEach((f) => {
        const p = slip[f.id] || {};
        const h = Number.isInteger(p.h) ? p.h : 0;
        const a = Number.isInteger(p.a) ? p.a : 0;
        lines.push(`${f.home} ${h}–${a} ${f.away}`);
      });
      const scorerLines = FIXTURES
        .map((f) => { const p = slip[f.id] || {}; return p.scorer ? `${f.super7 || f.home}: ${p.scorer}` : null; })
        .filter(Boolean);
      if (scorerLines.length) lines.push("First scorers: " + scorerLines.join(", "));
      lines.push("Can you beat me? thesuper7.com");
      const text = lines.join("\n");
      const originalText = shareBtn.textContent;
      const showCopied = () => {
        shareBtn.textContent = "✓ Copied to clipboard";
        setTimeout(() => { shareBtn.textContent = originalText; }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(showCopied).catch(() => { prompt("Copy your predictions:", text); });
      } else {
        prompt("Copy your predictions:", text);
      }
    });

    // FAQ open/close animation
    document.querySelectorAll(".faq-item").forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        const content = details.querySelector("p");
        if (!content) return;
        content.animate(
          [{ opacity: 0, transform: "translateY(-8px)" }, { opacity: 1, transform: "none" }],
          { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "forwards" }
        );
      });
    });

    // notify form (front-end only)
    const notifyForm = $("#notify");
    if (notifyForm) {
      notifyForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = $("#notifyEmail");
        if (!email || !email.value) return;
        try { localStorage.setItem(NOTIFY_KEY, email.value); } catch (err) {}
        notifyForm.hidden = true;
        const msg = $("#notifyMsg");
        if (msg) msg.hidden = false;
      });
    }

    // mobile nav
    const toggle = $("#menuToggle");
    const nav = $("#nav");
    if (toggle && nav) {
      toggle.addEventListener("click", () => nav.classList.toggle("open"));
      nav.addEventListener("click", (e) => { if (e.target.tagName === "A") nav.classList.remove("open"); });
    }

    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();

    setupReveal();
    updateStatus();
    initCookieBanner();
  }

  // ============================================================
  //  Cookie consent banner
  // ============================================================
  function initCookieBanner() {
    if (localStorage.getItem("s7.cookies")) return;
    const banner = $("#cookieBanner");
    if (!banner) return;
    setTimeout(() => banner.classList.add("visible"), 800);
    const dismiss = () => banner.classList.remove("visible");
    const accept = $("#cookieAccept");
    const essential = $("#cookieEssential");
    if (accept) accept.addEventListener("click", () => { localStorage.setItem("s7.cookies", "all"); dismiss(); });
    if (essential) essential.addEventListener("click", () => { localStorage.setItem("s7.cookies", "essential"); dismiss(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
