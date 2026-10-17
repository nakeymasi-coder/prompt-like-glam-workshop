// Shared helpers for Glam's Inner Circle loyalty functions.
//
// Storage: ONE blob ("state") holding all members. This avoids read-after-write
// lag issues with many rapid per-member read/modify/write cycles.
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

function blankState() {
  return { members: {}, processedSales: [], pendingClaims: [], updatedAt: null };
}

export async function loadState(store) {
  const state = await store.get("state", { type: "json" }).catch(() => null);
  if (!state || typeof state !== "object") return blankState();
  state.members = state.members || {};
  state.processedSales = state.processedSales || [];
  state.pendingClaims = state.pendingClaims || [];
  return state;
}

export async function saveState(store, state) {
  state.updatedAt = new Date().toISOString();
  await store.setJSON("state", state);
}

export function getMember(state, email) {
  return state.members[email.trim().toLowerCase()] || null;
}

export function getOrCreateMember(state, email) {
  email = email.trim().toLowerCase();
  let member = state.members[email];
  if (!member) {
    member = {
      email, points: 0, lifetime: 0, tier: "member",
      activity: [], claims: [],
      joined: new Date().toISOString().slice(0, 10),
    };
    state.members[email] = member;
  }
  return member;
}

export function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function tierFor(lifetime) {
  return lifetime >= VIP_THRESHOLD ? "vip" : "member";
}

export function addActivity(member, label, points) {
  member.activity = [...(member.activity || []), {
    date: new Date().toISOString().slice(0, 10), label, points,
  }];
  if (member.activity.length > 60) member.activity = member.activity.slice(-60);
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
