// GET /api/auth/me — who am I? Returns the logged-in user or 401.

import { configured, getSession } from "../_auth.js";

export default async function handler(req, res) {
  if (!configured()) { res.status(401).json({ error: "Not logged in", unconfigured: true }); return; }
  try {
    const session = await getSession(req);
    if (!session) { res.status(401).json({ error: "Not logged in" }); return; }
    const { user } = session;
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ username: user.u, marketing: !!user.m, created: user.c });
  } catch (err) {
    res.status(500).json({ error: "Session check failed" });
  }
}
