// POST { email } -> member balance, rewards, recent activity.
// Public (rate-limited). Never lists other members.
import {
  REWARDS, VIP_THRESHOLD, withCors, json,
  memberStore, loadState, getMember, isValidEmail, rateLimited,
} from "./inner-circle-lib.js";

export default async (req) =>
  withCors(req, async () => {
    if (rateLimited(req)) {
      return json({ success: false, message: "Too many tries — wait a minute and try again." }, 429, req);
    }
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      return json({ success: false, message: "Please enter a valid email address." }, 400, req);
    }

    const state = await loadState(memberStore());
    const member = getMember(state, email);
    if (!member) {
      return json({
        success: true,
        found: false,
        message: "No Inner Circle account found for that email yet — it appears automatically after your first Payhip purchase.",
      }, 200, req);
    }

    // member's pending claims live in their own blobs
    const store = memberStore();
    const pendingClaims = [];
    const listed = await store.list({ prefix: "claim:" }).catch(() => ({ blobs: [] }));
    for (const b of listed.blobs || []) {
      const c = await store.get(b.key, { type: "json" }).catch(() => null);
      if (c && c.email === email && c.status === "pending") {
        pendingClaims.push({ code: b.key.split(":")[1], rewardName: c.rewardName, createdAt: c.createdAt });
      }
    }

    return json({
      success: true,
      found: true,
      email,
      points: member.points,
      lifetime: member.lifetime,
      tier: member.tier,
      vipThreshold: VIP_THRESHOLD,
      vipProgress: Math.min(1, member.lifetime / VIP_THRESHOLD),
      rewards: REWARDS.map((r) => ({ ...r, canClaim: member.points >= r.cost })),
      activity: (member.activity || []).slice(-12).reverse(),
      pendingClaims,
    }, 200, req);
  });
