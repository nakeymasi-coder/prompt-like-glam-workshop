// POST { email } -> member balance, rewards, recent activity.
// Public (rate-limited). Never lists other members.
import {
  REWARDS, VIP_THRESHOLD, withCors, json,
  memberStore, memberKey, isValidEmail, rateLimited,
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

    const store = memberStore();
    const member = await store.get(memberKey(email), { type: "json" });
    if (!member) {
      return json({
        success: true,
        found: false,
        message: "No Inner Circle account found for that email yet — it appears automatically after your first Payhip purchase.",
      }, 200, req);
    }

    const pendingClaims = (member.claims || []).filter((c) => c.status === "pending");
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
      pendingClaims: pendingClaims.map((c) => ({ code: c.id, rewardName: c.rewardName, createdAt: c.createdAt })),
    }, 200, req);
  });
