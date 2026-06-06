/* The Super 7 — interactive demo
   Client-side only. Predictions persist in localStorage.
   Mechanic: for each of the 7 Super 7 clubs' games, predict the score AND the
   club's first goalscorer. */

(function () {
  "use strict";

  // ---- The Super 7 clubs (home colour schemes) ----
  // bg = background, text = label colour, border = shield/badge border.
  // stripe = render black/white stripes (Newcastle).
  const CLUBS = {
    ARS: { name: "Arsenal",    bg: "#EF0107", text: "#FFFFFF", border: "#DAA520" },
    CHE: { name: "Chelsea",    bg: "#034694", text: "#FFFFFF", border: "#FFFFFF" },
    LIV: { name: "Liverpool",  bg: "#C8102E", text: "#F6EB61", border: "#F6EB61" },
    MCI: { name: "Man City",   bg: "#6CABDD", text: "#1C2C5B", border: "#1C2C5B" },
    MUN: { name: "Man United", bg: "#DA291C", text: "#FFFFFF", border: "#000000" },
    NEW: { name: "Newcastle",  bg: "#000000", text: "#FFFFFF", border: "#41B6E6", stripe: true },
    TOT: { name: "Tottenham",  bg: "#FFFFFF", text: "#132257", border: "#132257" },
  };

  // Candidate first scorers per Super 7 club (demo squad lists).
  const SCORERS = {
    ARS: ["Saka", "Havertz", "Martinelli", "Ødegaard", "Jesus", "Trossard"],
    CHE: ["Palmer", "Jackson", "Nkunku", "Madueke", "Neto", "Sterling"],
    LIV: ["Salah", "Núñez", "Gakpo", "Díaz", "Jota", "Szoboszlai"],
    MCI: ["Haaland", "Foden", "Doku", "Savinho", "B. Silva", "Marmoush"],
    MUN: ["Højlund", "Rashford", "Garnacho", "Fernandes", "Mount", "Zirkzee"],
    NEW: ["Isak", "Gordon", "Wilson", "Barnes", "Murphy", "Joelinton"],
    TOT: ["Son", "Solanke", "Richarlison", "Kulusevski", "Maddison", "Johnson"],
  };

  // GW34 fixtures — each features exactly one Super 7 club.
  const FIXTURES = [
    { home: "ARS", away: "AVL", awayName: "Aston Villa",    awayColor: "#670E36" },
    { home: "CHE", away: "BHA", awayName: "Brighton",       awayColor: "#0057B8" },
    { home: "EVE", away: "LIV", homeName: "Everton",        homeColor: "#003399" },
    { home: "MCI", away: "WOL", awayName: "Wolves",         awayColor: "#FDB913" },
    { home: "FUL", away: "MUN", homeName: "Fulham",         homeColor: "#000000" },
    { home: "NEW", away: "BRE", awayName: "Brentford",      awayColor: "#E30613" },
    { home: "TOT", away: "CRY", awayName: "Crystal Palace", awayColor: "#1B458F" },
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

  const STORE_KEY = "super7.slip.gw34.v2";
  const NOTIFY_KEY = "super7.notify";

  // ---- helpers ----
  const $ = (sel, root = document) => root.querySelector(sel);
  const clubMeta = (code, fallbackName, fallbackColor) =>
    CLUBS[code] || { name: fallbackName || code, bg: fallbackColor || "#555", text: "#FFFFFF", border: "rgba(255,255,255,.25)" };
  const STRIPES = "repeating-linear-gradient(90deg,#000,#000 14px,#fff 14px,#fff 28px)";
  const super7Code = (f) => (CLUBS[f.home] ? f.home : f.away);

  function loadSlip() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveSlip(slip) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(slip)); } catch (e) {}
  }

  let slip = loadSlip(); // { "0": { h, a, scorer }, ... }

  // ---- render: hero club row ----
  function renderClubRow() {
    const row = $("#clubRow");
    if (!row) return;
    row.innerHTML = Object.entries(CLUBS).map(([code, c]) => {
      const innerBg = c.stripe ? STRIPES : c.bg;
      const nameStyle = c.stripe
        ? `background:#fff;color:#000;padding:3px 8px;border-radius:4px;border:1px solid ${c.border}`
        : `color:${c.text}`;
      return `<div class="shield" style="background:${c.border}" title="${c.name}">
        <div class="shield-inner" style="background:${innerBg}">
          <span class="shield-name" style="${nameStyle}">${c.name}</span>
        </div>
      </div>`;
    }).join("");
  }

  // ---- render: fixtures ----
  function renderFixtures() {
    const wrap = $("#fixtures");
    if (!wrap) return;
    wrap.innerHTML = FIXTURES.map((f, i) => {
      const h = clubMeta(f.home, f.homeName, f.homeColor);
      const a = clubMeta(f.away, f.awayName, f.awayColor);
      const s7 = super7Code(f);
      const pick = slip[i] || {};
      const hv = Number.isInteger(pick.h) ? pick.h : "-";
      const av = Number.isInteger(pick.a) ? pick.a : "-";
      const opts = ['<option value="">First scorer…</option>']
        .concat(SCORERS[s7].map((p) =>
          `<option value="${p}"${pick.scorer === p ? " selected" : ""}>${p}</option>`))
        .concat(`<option value="No goalscorer"${pick.scorer === "No goalscorer" ? " selected" : ""}>No goalscorer (0 for ${CLUBS[s7].name})</option>`)
        .join("");
      return `
      <div class="fixture" data-i="${i}">
        <div class="fixture-main">
          <div class="team home">
            <span class="team-badge" style="background:${h.bg};color:${h.text};border:1.5px solid ${h.border}">${f.home}</span>
            <span class="team-name">${h.name}</span>
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
            <span class="team-badge" style="background:${a.bg};color:${a.text};border:1.5px solid ${a.border}">${f.away}</span>
            <span class="team-name">${a.name}</span>
          </div>
        </div>
        <div class="fixture-scorer">
          <label for="scorer-${i}">
            <span class="scorer-badge" style="background:${CLUBS[s7].bg};color:${CLUBS[s7].text};border-color:${CLUBS[s7].border}">${s7}</span>
            ${CLUBS[s7].name} first scorer
          </label>
          <select class="scorer-select" id="scorer-${i}" data-i="${i}">${opts}</select>
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
      el.classList.toggle("done", isComplete(slip[el.dataset.i]));
    });
  }

  // ---- score stepping ----
  function step(i, side, delta) {
    const p = slip[i] || {};
    let v = Number.isInteger(p[side]) ? p[side] : 0;
    v = Math.max(0, Math.min(15, v + delta));
    p[side] = v;
    slip[i] = p;
    saveSlip(slip);
    const fixtureEl = document.querySelector(`.fixture[data-i="${i}"]`);
    if (fixtureEl) fixtureEl.querySelector(`.score-val[data-side="${side}"]`).textContent = v;
    markDone();
    updateStatus();
  }

  // ---- status + submit gating ----
  function completeCount() {
    let n = 0;
    for (let i = 0; i < FIXTURES.length; i++) if (isComplete(slip[i])) n++;
    return n;
  }

  function updateStatus() {
    const n = completeCount();
    const status = $("#slipStatus");
    const submit = $("#submitBtn");
    if (status) {
      status.textContent = `${n} / 7 predictions complete` +
        (n < 7 ? ", add scores and first scorers" : ", ready to submit");
      status.classList.toggle("ready", n === 7);
    }
    if (submit) submit.disabled = n !== 7;
  }

  // ---- countdown to next Saturday 15:00 local ----
  function nextDeadline() {
    const now = new Date();
    const d = new Date(now);
    d.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
    d.setHours(15, 0, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 7);
    return d;
  }
  const DEADLINE = nextDeadline();

  function tick() {
    const el = $("#timer");
    if (!el) return;
    let diff = Math.max(0, DEADLINE - new Date());
    const dd = Math.floor(diff / 86400000); diff -= dd * 86400000;
    const hh = Math.floor(diff / 3600000);  diff -= hh * 3600000;
    const mm = Math.floor(diff / 60000);    diff -= mm * 60000;
    const ss = Math.floor(diff / 1000);
    const pad = (n) => String(n).padStart(2, "0");
    el.textContent = (dd > 0 ? dd + "d " : "") + `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  }

  // ---- leaderboard ----
  function renderLeaderboard() {
    const body = $("#leaderboardBody");
    if (!body) return;
    body.innerHTML = LEADERBOARD.map((r, i) =>
      `<tr>
        <td class="lb-rank">${i + 1}</td>
        <td>${r.name}</td>
        <td>${r.exact}</td>
        <td class="num">${r.pts}</td>
      </tr>`
    ).join("");
  }

  // ---- modal ----
  function openModal() {
    const m = $("#modal");
    const txt = $("#modalText");
    if (txt) {
      txt.textContent =
        `You're in for Gameweek 34 with all 7 scores and first scorers locked in. ` +
        `Good luck this week.`;
    }
    if (m) { m.classList.add("open"); m.setAttribute("aria-hidden", "false"); }
  }
  function closeModal() {
    const m = $("#modal");
    if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
  }

  // ---- wire up events ----
  function init() {
    renderClubRow();
    renderFixtures();
    renderLeaderboard();

    // delegated stepper clicks
    const fixtures = $("#fixtures");
    if (fixtures) {
      fixtures.addEventListener("click", (e) => {
        const btn = e.target.closest(".stepper button");
        if (!btn) return;
        const fixtureEl = e.target.closest(".fixture");
        step(fixtureEl.dataset.i, btn.parentElement.dataset.side, parseInt(btn.dataset.d, 10));
      });
      // first-scorer selects
      fixtures.addEventListener("change", (e) => {
        const sel = e.target.closest(".scorer-select");
        if (!sel) return;
        const i = sel.dataset.i;
        const p = slip[i] || {};
        if (sel.value) p.scorer = sel.value; else delete p.scorer;
        slip[i] = p;
        saveSlip(slip);
        markDone();
        updateStatus();
      });
    }

    const clearBtn = $("#clearBtn");
    if (clearBtn) clearBtn.addEventListener("click", () => {
      slip = {};
      saveSlip(slip);
      renderFixtures();
      updateStatus();
    });

    const submitBtn = $("#submitBtn");
    if (submitBtn) submitBtn.addEventListener("click", openModal);

    const modalClose = $("#modalClose");
    if (modalClose) modalClose.addEventListener("click", closeModal);
    const modal = $("#modal");
    if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });

    // notify form (front-end only — stores locally, no backend yet)
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

    updateStatus();
    tick();
    setInterval(tick, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
