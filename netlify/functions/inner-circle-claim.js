// POST { email, rewardId } -> creates a PENDING claim as its own blob.
// The write is independent (no shared read-modify-write), so concurrent
// claims can't clobber each other. Indigo fulfills via the admin function.
import {
  REWARDS, withCors, json,
  memberStore, getMemberEvents, summarize,
  isValidEmail, rateLimited, claimCode, claimKey, todayISO,
} from "./inner-circle-lib.js";

async function summarizeWithRetry(store, email) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const events = await getMemberEvents(store, email);
    if (events.length) return summarize(events);
    await new Promise((r) => setTimeout(r, 5000));
  }
  return null;
}

export default async (req) =>
  withCors(req, async () => {
    if (rateLimited(req, 20)) {
      return json({ success: false, message: "Too many tries — wait a minute and try again." }, 429, req);
    }
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    const reward = REWARDS.find((r) => r.id === body.rewardId);
    if (!isValidEmail(email)) {
      return json({ success: false, message: "Please enter a valid email address." }, 400, req);
    }
    if (!reward) {
      return json({ success: false, message: "That reward doesn't exist." }, 400, req);
    }

    const store = memberStore();
    const s = await summarizeWithRetry(store, email);
    if (!s) {
      return json({ success: false, message: "No Inner Circle account found for that email yet." }, 404, req);
    }
    if (s.points < reward.cost) {
      return json({ success: false, message: `You need ${reward.cost} points for that — you have ${s.points}.` }, 400, req);
    }

    // one pending claim per reward at a time (best-effort check)
    const listed = await store.list({ prefix: "claim:" }).catch(() => ({ blobs: [] }));
    for (const b of listed.blobs || []) {
      const c = await store.get(b.key, { type: "json" }).catch(() => null);
      if (c && c.email === email && c.rewardId === reward.id && c.status === "pending") {
        return json({ success: false, message: "You already have a pending claim for that reward — it's on its way!" }, 400, req);
      }
    }

    const code = claimCode();
    await store.setJSON(claimKey(code), {
      email, rewardId: reward.id, rewardName: reward.name, cost: reward.cost,
      status: "pending", createdAt: new Date().toISOString(),
    });

    return json({
      success: true,
      claimCode: code,
      message: `You're in! Your ${reward.name} is on its way — Glam will send it within 24 hours. Your claim code is ${code}.`,
    }, 200, req);
  });
