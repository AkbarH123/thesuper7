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

  function renderClubRow() {
    const row = $("#clubRow");
    if (!row) return;
    row.innerHTML = Object.entries(CLUBS).map(([code, c]) => {
      const nameStyle = c.stripe
        ? `background:#fff;color:#000;padding:3px 8px;border-radius:4px;border:1px solid ${c.border}`
        : `color:${c.text}`;
      const body = c.stripe
        ? `<div class="shield-striped" style="background:${c.border}"><span class="shield-stripes"></span></div>`
        : shieldSVG(c);
      return `<div class="shield" title="${c.name}">${body}` +
        `<span class="shield-name" style="${nameStyle}">${c.name}</span></div>`;
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
      const s7name = (s7code && CLUBS[s7code].name) || f.super7 || f.home;
      const pick = slip[f.id] || {};
      const hv = Number.isInteger(pick.h) ? pick.h : "-";
      const av = Number.isInteger(pick.a) ? pick.a : "-";
      const dl = (SCORERS[s7code] || []).concat("No goalscorer")
        .map((p) => `<option value="${p}"></option>`).join("");
      const when = fixtureDateLabel(f);
      return `
      <div class="fixture" data-id="${f.id}">
        ${when ? `<div class="fixture-date">${when}</div>` : ""}
        <div class="fixture-main">
          <div class="team home">
            ${badge(f.home)}
            <span class="team-name">${f.home}</span>
          </div>
          <div class="score">
            <div class="stepper" data-side="h">
              <button type="button" data-d="1" aria-label="Home up">▲</button>
              <button type="button" data-d="-1" aria-label="Home down">▼</button>
            </div>
            <span class="score-val" data-side="h">${hv}</span>
            <span class="score-dash">-</span>
            <span class="score-val" data-side="a">${av}</span>
            <div class="stepper" data-side="a">
              <button type="button" data-d="1" aria-label="Away up">▲</button>
              <button type="button" data-d="-1" aria-label="Away down">▼</button>
            </div>
          </div>
          <div class="team away">
            ${badge(f.away)}
            <span class="team-name">${f.away}</span>
          </div>
        </div>
        <div class="fixture-scorer">
          <label for="scorer-${f.id}">${s7name} first scorer</label>
          <input class="scorer-input" id="scorer-${f.id}" data-id="${f.id}" list="dl-${f.id}"
                 placeholder="First scorer" value="${pick.scorer ? String(pick.scorer).replace(/"/g, "&quot;") : ""}" />
          <datalist id="dl-${f.id}">${dl}</datalist>
        </div>
      </div>`;
    }).join("");
    markDone();
  }

  function isComplete(p) {
    return p && Number.isInteger(p.h) && Number.isInteger(p.a) && !!p.scorer;
  }
  function markDone() {
    document.querySelectorAll(".fixture").forEach((el) => {
      el.classList.toggle("done", isComplete(slip[el.dataset.id]));
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
    body.innerHTML = LEADERBOARD.map((r, i) =>
      `<tr><td class="lb-rank">${i + 1}</td><td>${r.name}</td><td>${r.exact}</td><td class="num">${r.pts}</td></tr>`
    ).join("");
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
  //  Reveal on scroll
  // ============================================================
  function setupReveal() {
    const els = document.querySelectorAll(
      ".step, .prize, .faq-item, .slip, .table-wrap, .section-title, .section-lead, .cta-inner, .legal-content"
    );
    if (!els.length) return;
    const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !("IntersectionObserver" in window)) return;
    els.forEach((el) => el.classList.add("reveal"));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    els.forEach((el) => io.observe(el));
  }

  // ============================================================
  //  Init
  // ============================================================
  function init() {
    renderClubRow();
    renderLeaderboard();

    const fixtures = $("#fixtures");
    if (fixtures) {
      fixtures.addEventListener("click", (e) => {
        const btn = e.target.closest(".stepper button");
        if (!btn) return;
        const el = e.target.closest(".fixture");
        step(el.dataset.id, btn.parentElement.dataset.side, parseInt(btn.dataset.d, 10));
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
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
