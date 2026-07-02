// POST /api/auth/signup  { username, password, marketing }
// Creates a user (username/password) with a marketing/newsletter opt-in flag,
// then starts a session.

import {
  configured, notConfigured, normUsername, hashPassword,
  putUser, createSession, sessionCookie, SESSION_TTL,
} from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  if (!configured()) { notConfigured(res); return; }
  try {
    const body = req.body || {};
    const username = normUsername(body.username);
    const password = String(body.password || "");
    const marketing = !!body.marketing;

    if (!username) {
      res.status(400).json({ error: "Username must be 3-20 characters (letters, numbers, underscores)." });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "Password must be at least 8 characters." });
      return;
    }

    const { salt, hash } = hashPassword(password);
    const user = {
      u: username,             // display casing
      s: salt,
      h: hash,
      m: marketing,            // marketing emails + newsletter opt-in
      c: Date.now(),           // created at
    };

    const created = await putUser(username.toLowerCase(), user, true);
    if (created !== "OK") {
      res.status(409).json({ error: "That username is taken." });
      return;
    }

    const token = await createSession(username.toLowerCase());
    res.setHeader("Set-Cookie", sessionCookie(token, SESSION_TTL));
    res.status(200).json({ username, marketing, created: user.c });
  } catch (err) {
    res.status(500).json({ error: "Sign up failed", detail: String((err && err.message) || err) });
  }
}
