// Shared helpers for Glam's Inner Circle loyalty functions.
//
// Storage model: EVENT SOURCING. Every point change is its own immutable blob:
//   ev:<email>:<kind>:<unique-id>  -> { email, points, date, label, kind }
//   claim:<CODE>                  -> { email, rewardId, rewardName, cost, status, createdAt }
//
// Reads aggregate a member's events. Writes never read-modify-write shared
// state, so concurrent writes can't clobber each other.
import { getStore } from "@netlify/blobs";

export const VIP_THRESHOLD = 300;

export const REWARDS = [
  { id: "discount20", name: "20% off anything", cost: 50, blurb: "A personal 20%-off code for the shop." },
  { id: "free7", name: "Free $7 product — your pick", cost: 100, blurb: "Any $7 product, on the house." },
  { id: "free27", name: "Free $27 product — your pick", cost: 200, blurb: "Any $27 product, on the house." },
];

export const ALLOWED_ORIGINS = new Set([
  "https://nakeymasi-coder.github.io",
  "https://workshop-poratl.netlify.app",
  "https://deploy-preview-2--workshop-poratl.netlify.app",
]);

export function corsHeaders(req) {
  const origin = req.headers.get("Origin");
  return {
    "Content-Type": "application/json",
    Vary: "Origin",
    ...(origin && ALLOWED_ORIGINS.has(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
  };
}

export function json(data, status, req) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(req) });
}

export async function withCors(req, handler) {
  const origin = req.headers.get("Origin");
  const headers = corsHeaders(req);
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response(JSON.stringify({ success: false, message: "This origin is not allowed." }), { status: 403, headers });
  }
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: { ...headers, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" },
    });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, message: "Use POST." }), { status: 405, headers });
  }
  try {
    return await handler(req);
  } catch (error) {
    console.error("inner-circle error:", error);
    return new Response(JSON.stringify({ success: false, message: "Something went wrong. Please try again." }), { status: 500, headers });
  }
}

export function memberStore() {
  return getStore("inner-circle");
}

export function eventKey(email, kind, id) {
  return `ev:${email.trim().toLowerCase()}:${kind}:${id}`;
}

export function claimKey(code) {
  return `claim:${code}`;
}

export function newEventId() {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function tierFor(lifetime) {
  return lifetime >= VIP_THRESHOLD ? "vip" : "member";
}

// All of a member's point events, oldest first.
export async function getMemberEvents(store, email) {
  email = email.trim().toLowerCase();
  const listed = await store.list({ prefix: `ev:${email}:` }).catch(() => ({ blobs: [] }));
  const events = [];
  for (const b of listed.blobs || []) {
    const e = await store.get(b.key, { type: "json" }).catch(() => null);
    if (e && typeof e.points === "number") events.push(e);
  }
  events.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return events;
}

// Fold events into balance/lifetime/tier/activity.
export function summarize(events) {
  let points = 0;
  let lifetime = 0;
  const activity = [];
  for (const e of events) {
    const p = Math.floor(Number(e.points) || 0);
    points += p;
    if (p > 0) lifetime += p;
    activity.push({ date: e.date || "", label: e.label || "", points: p });
  }
  points = Math.max(0, points);
  return {
    points,
    lifetime,
    tier: tierFor(lifetime),
    joined: events.length ? events[0].date || "" : "",
    activity: activity.slice(-60),
  };
}

// All pending claim blobs.
export async function listPendingClaims(store) {
  const listed = await store.list({ prefix: "claim:" }).catch(() => ({ blobs: [] }));
  const claims = [];
  for (const b of listed.blobs || []) {
    const c = await store.get(b.key, { type: "json" }).catch(() => null);
    if (c && c.status === "pending") {
      claims.push({ code: b.key.split(":")[1], ...c });
    }
  }
  claims.sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  return claims;
}

// Very light per-IP rate limit (best effort, in-memory).
const hits = new Map();
export function rateLimited(req, maxPerMinute = 40) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < 60000);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > maxPerMinute;
}

export function claimCode() {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `GLAM-${s}`;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

// ---- Member profiles ----

export function profileKey(email) {
  return `profile:${email.trim().toLowerCase()}`;
}

// displayName + photo (data URL). Per-member blob; only the member writes it,
// so there's no shared read-modify-write contention.
export async function getProfile(store, email) {
  const p = await store.get(profileKey(email), { type: "json" }).catch(() => null);
  if (p && typeof p === "object") return p;
  return null;
}

export function defaultDisplayName(email) {
  const base = email.split("@")[0].replace(/[._-]+/g, " ").trim();
  return base ? base.replace(/\b\w/g, (c) => c.toUpperCase()) : "Member";
}

// ---- Admin hub auth ----
// Glam sets INNER_CIRCLE_ADMIN_PASSWORD in Netlify env. The auth function
// trades it for a 24h HMAC-signed token; admin read/write actions (except
// syncSales, which stays secret-only) accept secret OR token.

import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export function issueAdminToken(syncSecret) {
  const expiry = Date.now() + TOKEN_TTL_MS;
  const sig = createHmac("sha256", syncSecret).update(`admin:${expiry}`).digest("hex");
  return `${expiry}.${sig}`;
}

export function verifyAdminToken(syncSecret, token) {
  if (typeof token !== "string") return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const expiry = Number(parts[0]);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;
  const expected = createHmac("sha256", syncSecret).update(`admin:${expiry}`).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(parts[1], "utf8"), Buffer.from(expected, "utf8"));
  } catch {
    return false;
  }
}

export function isAuthorized(body) {
  const syncSecret = Netlify.env.get("INNER_CIRCLE_SYNC_SECRET");
  if (!syncSecret) return false;
  if (body.secret && body.secret === syncSecret) return true;
  if (body.token && verifyAdminToken(syncSecret, body.token)) return true;
  return false;
}

// Unique member emails from event keys alone (no blob reads).
export async function listMemberEmails(store) {
  const listed = await store.list({ prefix: "ev:" }).catch(() => ({ blobs: [] }));
  const emails = new Set();
  const counts = {};
  for (const b of listed.blobs || []) {
    const m = /^ev:([^:]+):/.exec(b.key);
    if (m) {
      emails.add(m[1]);
      counts[m[1]] = (counts[m[1]] || 0) + 1;
    }
  }
  return [...emails].sort().map((email) => ({ email, events: counts[email] }));
}

// Strip the "Purchase: " prefix the sync writes, for clean display.
export function productNameFromLabel(label) {
  return (label || "").replace(/^Purchase:\s*/i, "").trim() || "Purchase";
}

/**
 * VIP v2 is based only on verified eligible USD spending.
 * Existing events/claims are never rewritten. Unclassified sales require review.
 */
export function vipForPurchases(events, now = new Date()) {
  const addMonths = (date, months) => {
    const d = new Date(date), day = d.getUTCDate();
    d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + months);
    const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(day, last)); return d;
  };
  const sales = events.filter(e =>
    e.kind === "sale" && e.vipEligible === true && e.currency === "USD" &&
    Number.isFinite(e.amount) && e.amount > 0 &&
    Number.isFinite(Date.parse(e.date)) && new Date(e.date) <= now
  ).sort((a,b) => new Date(a.date) - new Date(b.date));
  let expires = null;
  for (const sale of sales) {
    const at = new Date(sale.date), start = addMonths(at, -12);
    const total = sales.filter(e => new Date(e.date) > start && new Date(e.date) <= at)
      .reduce((sum,e) => sum + Math.round(e.amount * 100), 0);
    if (total >= 30000 && (!expires || at >= expires)) expires = addMonths(at, 12);
  }
  const start = addMonths(now, -12);
  const spendCents = sales.filter(e => new Date(e.date) > start)
    .reduce((sum,e) => sum + Math.round(e.amount * 100), 0);
  return {
    vipPolicyVersion: 2, vipActive: !!expires && now < expires,
    vipExpiresAt: expires ? expires.toISOString().slice(0,10) : null,
    vipEligibleSpend: spendCents / 100,
    vipNeedsReview: events.some(e => e.kind === "sale" && e.vipEligible == null)
  };
}
