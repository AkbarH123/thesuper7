// GET  /api/scorecards        — the logged-in user's past submitted score cards
// POST /api/scorecards {card} — save a submitted card (called once on submit;
//                               cards are final, so no update/delete endpoints)

import { configured, notConfigured, getSession, redis, cardsKey } from "./_auth.js";

const MAX_CARDS = 100;

function sanitizeCard(body) {
  const card = (body && body.card) || {};
  const fixtures = Array.isArray(card.fixtures) ? card.fixtures.slice(0, 7) : [];
  if (!fixtures.length) return null;
  const clean = fixtures.map((f) => ({
    home: String(f.home || "").slice(0, 40),
    away: String(f.away || "").slice(0, 40),
    h: Number.isInteger(f.h) ? Math.max(0, Math.min(15, f.h)) : null,
    a: Number.isInteger(f.a) ? Math.max(0, Math.min(15, f.a)) : null,
    scorer: String(f.scorer || "").slice(0, 60),
  }));
  return {
    gw: String(card.gw || "").slice(0, 300),
    submittedAt: Date.now(),
    fixtures: clean,
  };
}

export default async function handler(req, res) {
  if (!configured()) { notConfigured(res); return; }
  try {
    const session = await getSession(req);
    if (!session) { res.status(401).json({ error: "Not logged in" }); return; }
    const key = cardsKey(session.usernameLower);

    if (req.method === "POST") {
      const card = sanitizeCard(req.body);
      if (!card) { res.status(400).json({ error: "No predictions in the card." }); return; }
      await redis("RPUSH", key, JSON.stringify(card));
      await redis("LTRIM", key, String(-MAX_CARDS), "-1");
      res.status(200).json({ ok: true });
      return;
    }

    if (req.method === "GET") {
      const raw = (await redis("LRANGE", key, "0", "-1")) || [];
      const cards = raw
        .map((s) => { try { return JSON.parse(s); } catch (e) { return null; } })
        .filter(Boolean)
        .sort((a, b) => b.submittedAt - a.submittedAt);
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json({ count: cards.length, cards });
      return;
    }

    res.status(405).json({ error: "GET or POST only" });
  } catch (err) {
    res.status(500).json({ error: "Scorecards unavailable", detail: String((err && err.message) || err) });
  }
}
