// POST { email, rewardId } -> creates a PENDING claim (no points deducted yet).
// Indigo fulfills via the admin function, which deducts the points then.
import {
  REWARDS, withCors, json,
  memberStore, memberKey, isValidEmail, rateLimited, claimCode,
} from "./inner-circle-lib.js";

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
    const key = memberKey(email);
    const member = await store.get(key, { type: "json" });
    if (!member) {
      return json({ success: false, message: "No Inner Circle account found for that email yet." }, 404, req);
    }
    if (member.points < reward.cost) {
      return json({ success: false, message: `You need ${reward.cost} points for that — you have ${member.points}.` }, 400, req);
    }
    const alreadyPending = (member.claims || []).some(
      (c) => c.status === "pending" && c.rewardId === reward.id,
    );
    if (alreadyPending) {
      return json({ success: false, message: "You already have a pending claim for that reward — it's on its way!" }, 400, req);
    }

    const claim = {
      id: claimCode(),
      rewardId: reward.id,
      rewardName: reward.name,
      cost: reward.cost,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    member.claims = [...(member.claims || []), claim];
    await store.setJSON(key, member);

    const pending = await store.get("pending-claims", { type: "json" }).catch(() => null);
    const list = Array.isArray(pending) ? pending : [];
    list.push({ email, ...claim });
    await store.setJSON("pending-claims", list);

    return json({
      success: true,
      claimCode: claim.id,
      message: `You're in! Your ${reward.name} is on its way — Glam will send it within 24 hours. Your claim code is ${claim.id}.`,
    }, 200, req);
  });
