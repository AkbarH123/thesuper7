// Vercel serverless function: live/latest scores for a set of fixtures.
//
// GET /api/live?ids=<eventId,eventId,...>   (max 7)
// Returns { scores: [{ id, hs, as, status, minute }] } — best-effort from
// TheSportsDB event lookups, cached briefly so polling stays cheap.

const KEY = process.env.THESPORTSDB_KEY || "3";
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`;

function toInt(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : null;
}

export default async function handler(req, res) {
  try {
    const raw = String((req.query && req.query.ids) || "");
    const ids = raw.split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s)).slice(0, 7);
    if (!ids.length) {
      res.status(400).json({ error: "Pass ?ids=eventId,eventId" });
      return;
    }

    const scores = await Promise.all(ids.map(async (id) => {
      try {
        const r = await fetch(`${BASE}/lookupevent.php?id=${id}`);
        if (!r.ok) throw new Error("status " + r.status);
        const data = await r.json();
        const e = data && data.events && data.events[0];
        if (!e) return { id, hs: null, as: null, status: "Unknown", minute: null };
        return {
          id,
          hs: toInt(e.intHomeScore),
          as: toInt(e.intAwayScore),
          status: e.strPostponed === "yes" ? "Postponed" : (e.strStatus || ""),
          minute: e.strProgress || null,
        };
      } catch (err) {
        return { id, hs: null, as: null, status: "Unknown", minute: null };
      }
    }));

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=60");
    res.status(200).json({ scores });
  } catch (err) {
    res.status(502).json({ error: "Could not load live scores", detail: String((err && err.message) || err) });
  }
}
