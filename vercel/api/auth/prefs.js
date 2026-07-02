// POST /api/auth/prefs  { marketing } — update the marketing/newsletter opt-in.

import { configured, notConfigured, getSession, putUser } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  if (!configured()) { notConfigured(res); return; }
  try {
    const session = await getSession(req);
    if (!session) { res.status(401).json({ error: "Not logged in" }); return; }
    const marketing = !!(req.body && req.body.marketing);
    const user = { ...session.user, m: marketing };
    await putUser(session.usernameLower, user, false);
    res.status(200).json({ username: user.u, marketing });
  } catch (err) {
    res.status(500).json({ error: "Could not update preferences" });
  }
}
