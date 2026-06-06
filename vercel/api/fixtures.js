// Vercel serverless function: upcoming Super 7 fixtures via TheSportsDB.
//
// Calls TheSportsDB server-side so the key isn't exposed and there are no CORS
// issues. Returns the next upcoming fixture for each of the seven clubs.
//
// Env vars (set in Vercel → Settings → Environment Variables, all optional):
//   THESPORTSDB_KEY  - your API key (defaults to the free test key "3")
//   S7_SEASON        - season string, e.g. "2025-2026"

const LEAGUE_ID = "4328"; // English Premier League on TheSportsDB
const KEY = process.env.THESPORTSDB_KEY || "3";
const SEASON = process.env.S7_SEASON || "2025-2026";

// TheSportsDB team IDs for the Super 7. Verify these if results look wrong.
const SUPER7 = {
  "133604": "Arsenal",
  "133610": "Chelsea",
  "133602": "Liverpool",
  "133613": "Man City",
  "133612": "Man United",
  "134777": "Newcastle",
  "133616": "Tottenham",
};

export default async function handler(req, res) {
  try {
    const url = `https://www.thesportsdb.com/api/v1/json/${KEY}/eventsseason.php?id=${LEAGUE_ID}&s=${SEASON}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error("upstream status " + r.status);
    const data = await r.json();
    const events = (data && data.events) || [];
    const now = Date.now();

    const upcoming = events
      .filter((e) => SUPER7[e.idHomeTeam] || SUPER7[e.idAwayTeam])
      .filter((e) => {
        const ts = Date.parse(`${e.dateEvent}T${e.strTime || "15:00:00"}Z`);
        return isFinite(ts) ? ts > now : e.strStatus !== "Match Finished";
      })
      .sort((a, b) =>
        (a.dateEvent + (a.strTime || "")).localeCompare(b.dateEvent + (b.strTime || ""))
      );

    // Next upcoming fixture per Super 7 club (so we end up with up to 7).
    const seen = new Set();
    const fixtures = [];
    for (const e of upcoming) {
      const club = SUPER7[e.idHomeTeam] || SUPER7[e.idAwayTeam];
      if (seen.has(club)) continue;
      seen.add(club);
      fixtures.push({
        id: e.idEvent,
        date: e.dateEvent,
        time: e.strTime || "",
        home: e.strHomeTeam,
        away: e.strAwayTeam,
        super7: club,
      });
      if (seen.size >= 7) break;
    }

    res.setHeader("Cache-Control", "s-maxage=3600, stale-while-revalidate=86400");
    res.status(200).json({ season: SEASON, count: fixtures.length, fixtures });
  } catch (err) {
    res.status(502).json({ error: "Could not load fixtures", detail: String((err && err.message) || err) });
  }
}
