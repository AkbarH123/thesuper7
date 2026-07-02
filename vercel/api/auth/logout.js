// POST /api/auth/logout — ends the session and clears the cookie.

import { configured, parseCookies, destroySession, sessionCookie, SESSION_COOKIE } from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  try {
    if (configured()) {
      const token = parseCookies(req)[SESSION_COOKIE];
      await destroySession(token);
    }
  } catch (e) { /* clearing the cookie is what matters */ }
  res.setHeader("Set-Cookie", sessionCookie("", 0));
  res.status(200).json({ ok: true });
}
