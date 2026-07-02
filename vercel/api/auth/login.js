// POST /api/auth/login  { username, password }

import {
  configured, notConfigured, normUsername, getUser, verifyPassword,
  createSession, sessionCookie, SESSION_TTL,
} from "../_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return; }
  if (!configured()) { notConfigured(res); return; }
  try {
    const body = req.body || {};
    const username = normUsername(body.username);
    const password = String(body.password || "");
    if (!username || !password) {
      res.status(400).json({ error: "Enter your username and password." });
      return;
    }

    const user = await getUser(username.toLowerCase());
    if (!user || !verifyPassword(password, user.s, user.h)) {
      res.status(401).json({ error: "Wrong username or password." });
      return;
    }

    const token = await createSession(username.toLowerCase());
    res.setHeader("Set-Cookie", sessionCookie(token, SESSION_TTL));
    res.status(200).json({ username: user.u, marketing: !!user.m, created: user.c });
  } catch (err) {
    res.status(500).json({ error: "Log in failed", detail: String((err && err.message) || err) });
  }
}
