// POST { email, rewardId } -> creates a PENDING claim as its own blob.
// Claims never read-modify-write shared state, so concurrent claims can't
// clobber each other. Indigo fulfills via the admin function.
import {
  REWARDS, withCors, json,
  memberStore, loadState, getMember,
  isValidEmail, rateLimited, claimCode, claimKey,
} from "./inner-circle-lib.js";

async function findMemberWithRetry(store, email) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const state = await loadState(store);
    const member = getMember(state, email);
    if (member) return member;
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
    const member = await findMemberWithRetry(store, email);
    if (!member) {
      return json({ success: false, message: "No Inner Circle account found for that email yet." }, 404, req);
    }
    if (member.points < reward.cost) {
      return json({ success: false, message: `You need ${reward.cost} points for that — you have ${member.points}.` }, 400, req);
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
    const claim = {
      email, rewardId: reward.id, rewardName: reward.name, cost: reward.cost,
      status: "pending", createdAt: new Date().toISOString(),
    };
    await store.setJSON(claimKey(code), claim);

    return json({
      success: true,
      claimCode: code,
      message: `You're in! Your ${reward.name} is on its way — Glam will send it within 24 hours. Your claim code is ${code}.`,
    }, 200, req);
  });
