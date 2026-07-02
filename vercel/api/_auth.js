// Shared auth utilities for The Super 7 serverless functions.
// Storage: Upstash Redis over REST (works with Vercel Marketplace "Upstash"
// or legacy Vercel KV env names). No npm dependencies — plain fetch + node:crypto.
//
// Files in /api starting with "_" are not deployed as routes.

import crypto from "node:crypto";

const REDIS_URL =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || "";
const REDIS_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || "";

export const SESSION_COOKIE = "s7session";
export const SESSION_TTL = 60 * 60 * 24 * 30; // 30 days

export function configured() {
  return !!(REDIS_URL && REDIS_TOKEN);
}

// Run a single Redis command, e.g. redis("SET", key, value, "NX").
export async function redis(...cmd) {
  const r = await fetch(REDIS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REDIS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("redis status " + r.status);
  const data = await r.json();
  if (data && typeof data === "object" && "error" in data) {
    throw new Error("redis: " + data.error);
  }
  return data.result;
}

// ---- password hashing (scrypt, constant-time compare) ----
export function hashPassword(password, salt) {
  const s = salt || crypto.randomBytes(16).toString("hex");
  const h = crypto.scryptSync(String(password), s, 64).toString("hex");
  return { salt: s, hash: h };
}

export function verifyPassword(password, salt, expectedHash) {
  const h = crypto.scryptSync(String(password), salt, 64);
  const e = Buffer.from(expectedHash, "hex");
  return h.length === e.length && crypto.timingSafeEqual(h, e);
}

// ---- cookies ----
export function parseCookies(req) {
  const out = {};
  const raw = (req.headers && req.headers.cookie) || "";
  raw.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

export function sessionCookie(token, maxAge) {
  const base = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Secure`;
  return typeof maxAge === "number" ? `${base}; Max-Age=${maxAge}` : base;
}

// ---- users & sessions ----
const userKey = (u) => "s7:user:" + u;
const sessKey = (t) => "s7:sess:" + t;
export const cardsKey = (u) => "s7:cards:" + u;

export function normUsername(username) {
  const u = String(username || "").trim();
  return /^[A-Za-z0-9_]{3,20}$/.test(u) ? u : null;
}

export async function getUser(usernameLower) {
  const raw = await redis("GET", userKey(usernameLower));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { return null; }
}

export async function putUser(usernameLower, user, onlyIfNew) {
  const args = ["SET", userKey(usernameLower), JSON.stringify(user)];
  if (onlyIfNew) args.push("NX");
  return redis(...args); // "OK" or null when NX fails
}

export async function createSession(usernameLower) {
  const token = crypto.randomBytes(32).toString("hex");
  await redis("SET", sessKey(token), usernameLower, "EX", String(SESSION_TTL));
  return token;
}

export async function destroySession(token) {
  if (token) await redis("DEL", sessKey(token));
}

// Resolve the logged-in user from the request cookie. Returns
// { token, usernameLower, user } or null.
export async function getSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const usernameLower = await redis("GET", sessKey(token));
  if (!usernameLower) return null;
  const user = await getUser(usernameLower);
  if (!user) return null;
  return { token, usernameLower, user };
}

// Standard "accounts not set up yet" response.
export function notConfigured(res) {
  res.status(503).json({
    error: "Accounts are not configured yet",
    detail: "Connect an Upstash Redis database in Vercel (Storage tab) to enable accounts.",
  });
}
