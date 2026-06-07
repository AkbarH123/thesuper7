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
    ARS: { name: "Arsenal",    bg: "#EF0107", text: "#FFFFFF", border: "#DAA520" },
    CHE: { name: "Chelsea",    bg: "#034694", text: "#FFFFFF", border: "#FFFFFF" },
    LIV: { name: "Liverpool",  bg: "#C8102E", text: "#F6EB61", border: "#F6EB61" },
    MCI: { name: "Man City",   bg: "#6CABDD", text: "#1C2C5B", border: "#1C2C5B" },
    MUN: { name: "Man United", bg: "#DA291C", text: "#FFFFFF", border: "#000000" },
    NEW: { name: "Newcastle",  bg: "#000000", text: "#FFFFFF", border: "#41B6E6", stripe: true },
    TOT: { name: "Tottenham",  bg: "#FFFFFF", text: "#132257", border: "#132257" },
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
  const NOTIFY_KEY = "super7.notify";

  // ---- helpers ----
  const $ = (sel, root = document) => root.querySelector(sel);
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
      return `<div class="shield" title="${c.name}">${body}` +
        `<span class="shield-name" style="${nameStyle}">${nameInner}</span></div>`;
    }).join("");
  }

  // ============================================================
  //  Game: fixtures + predictions
  // ============================================================
  async function loadFixtures() {
    const wrap = $("#fixtures");
    if (!wrap) return; // not the game page
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

  function renderFixtures() {
    const wrap = $("#fixtures");
    if (!wrap) return;
    wrap.innerHTML = FIXTURES.map((f) => {
      const s7code = codeFor(f.super7) || codeFor(f.home) || codeFor(f.away);
      const s7club = s7code ? CLUBS[s7code] : null;
      const s7name = (s7club && s7club.name) || f.super7 || f.home;
      const clubAccent = s7club ? s7club.bg : "transparent";
      const pick = slip[f.id] || {};
      const hv = Number.isInteger(pick.h) ? pick.h : 0;
      const av = Number.isInteger(pick.a) ? pick.a : 0;
      const dl = (SCORERS[s7code] || []).concat("No goalscorer")
        .map((p) => `<option value="${p}"></option>`).join("");
      const when = fixtureDateLabel(f);
      const done = isComplete(pick);
      return `
      <div class="fixture${done ? " done" : ""}" data-id="${f.id}" style="--club-accent:${clubAccent}">
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
        <div class="fixture-scorer">
          <label for="scorer-${f.id}">
            <span class="scorer-badge" style="background:${clubAccent};color:${s7club ? s7club.text : "#fff"}">${s7code || "?"}</span>
            ${s7name} first scorer
          </label>
          <input class="scorer-input" id="scorer-${f.id}" data-id="${f.id}" list="dl-${f.id}"
                 placeholder="Type or select player&hellip;" value="${pick.scorer ? String(pick.scorer).replace(/"/g, "&quot;") : ""}" />
          <datalist id="dl-${f.id}">${dl}</datalist>
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

  function step(id, side, delta) {
    const p = slip[id] || {};
    let v = Number.isInteger(p[side]) ? p[side] : 0;
    v = Math.max(0, Math.min(15, v + delta));
    p[side] = v;
    slip[id] = p;
    saveSlip();
    const el = document.querySelector(`.fixture[data-id="${id}"]`);
    if (el) el.querySelector(`.score-val[data-side="${side}"]`).textContent = v;
    markDone();
    updateStatus();
  }

  function completeCount() {
    return FIXTURES.reduce((n, f) => n + (isComplete(slip[f.id]) ? 1 : 0), 0);
  }

  function updateStatus() {
    const total = FIXTURES.length || 7;
    const n = completeCount();
    const status = $("#slipStatus");
    const submit = $("#submitBtn");
    if (status) {
      status.textContent = `${n} / ${total} predictions complete` +
        (n < total ? ", add scores and first scorers" : ", ready to submit");
      status.classList.toggle("ready", n === total && total > 0);
    }
    if (submit) submit.disabled = !(n === total && total > 0);
  }

  // ---- countdown to the first fixture (or next Saturday 3pm) ----
  let deadlineTs = null;
  function computeDeadline() {
    const times = FIXTURES
      .map((f) => Date.parse(`${f.date}T${f.time || "15:00:00"}Z`))
      .filter((t) => isFinite(t));
    if (times.length) { deadlineTs = Math.min.apply(null, times); return; }
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
    d.setHours(15, 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 7);
    deadlineTs = d.getTime();
  }
  let countdownTimer = null;
  function startCountdown() {
    const el = $("#timer");
    if (!el) return;
    computeDeadline();
    const tick = () => {
      let diff = Math.max(0, deadlineTs - Date.now());
      const dd = Math.floor(diff / 86400000); diff -= dd * 86400000;
      const hh = Math.floor(diff / 3600000);  diff -= hh * 3600000;
      const mm = Math.floor(diff / 60000);    diff -= mm * 60000;
      const ss = Math.floor(diff / 1000);
      const pad = (n) => String(n).padStart(2, "0");
      el.textContent = (dd > 0 ? dd + "d " : "") + `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
    };
    tick();
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(tick, 1000);
  }

  // ============================================================
  //  Leaderboard
  // ============================================================
  function renderLeaderboard() {
    const body = $("#leaderboardBody");
    if (!body) return;
    body.innerHTML = LEADERBOARD.map((r, i) => {
      const rank = i + 1;
      const podiumCls = rank <= 3 ? ` class="lb-podium lb-pos-${rank}"` : "";
      return `<tr${podiumCls} style="animation-delay:${0.04 + i * 0.06}s"><td class="lb-rank">${rank}</td><td>${r.name}</td><td>${r.exact}</td><td class="num">${r.pts}</td></tr>`;
    }).join("");
  }

  // ============================================================
  //  Modal
  // ============================================================
  function openModal() {
    const m = $("#modal");
    const txt = $("#modalText");
    if (txt) txt.textContent = "Your Super 7 slip is locked in. Good luck this gameweek.";
    if (m) { m.classList.add("open"); m.setAttribute("aria-hidden", "false"); }
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
      ".step, .prize, .faq-item, .slip, .table-wrap, .section-title, .section-lead, .cta-inner, .legal-content, .gw-history, .clubs-strip"
    );
    if (!els.length) return;
    els.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.1, rootMargin: "0px 0px -30px 0px" });
    els.forEach((el) => io.observe(el));
  }

  // ============================================================
  //  Init
  // ============================================================
  function init() {
    renderClubRow();
    renderLeaderboard();
    renderHistory();

    const fixtures = $("#fixtures");
    if (fixtures) {
      fixtures.addEventListener("click", (e) => {
        const btn = e.target.closest(".score-btn");
        if (!btn) return;
        const el = e.target.closest(".fixture");
        const control = btn.closest(".score-control");
        step(el.dataset.id, control.dataset.side, parseInt(btn.dataset.d, 10));
      });
      fixtures.addEventListener("input", (e) => {
        const inp = e.target.closest(".scorer-input");
        if (!inp) return;
        const id = inp.dataset.id;
        const p = slip[id] || {};
        if (inp.value.trim()) p.scorer = inp.value.trim(); else delete p.scorer;
        slip[id] = p;
        saveSlip();
        markDone();
        updateStatus();
      });
      fixtures.addEventListener("focusin", (e) => {
        const inp = e.target.closest(".scorer-input");
        if (!inp) return;
        inp.dataset.prev = inp.value;
        inp.value = "";
      });
      fixtures.addEventListener("focusout", (e) => {
        const inp = e.target.closest(".scorer-input");
        if (!inp) return;
        if (!inp.value.trim()) inp.value = inp.dataset.prev || "";
        delete inp.dataset.prev;
      });
      loadFixtures();
    }

    const clearBtn = $("#clearBtn");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      FIXTURES.forEach((f) => { delete slip[f.id]; });
      saveSlip();
      renderFixtures();
      updateStatus();
    });

    const submitBtn = $("#submitBtn");
    if (submitBtn) submitBtn.addEventListener("click", openModal);
    const modalClose = $("#modalClose");
    if (modalClose) modalClose.addEventListener("click", closeModal);
    const modal = $("#modal");
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

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
