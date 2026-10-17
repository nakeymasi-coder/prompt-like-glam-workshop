// POST { email } -> member balance, rewards, recent activity.
// Public (rate-limited). Never lists other members.
import {
  REWARDS, VIP_THRESHOLD, withCors, json,
  memberStore, getMemberEvents, summarize,
  isValidEmail, rateLimited,
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
    const events = await getMemberEvents(store, email);
    if (!events.length) {
      return json({
        success: true,
        found: false,
        message: "No Inner Circle account found for that email yet — it appears automatically after your first Payhip purchase.",
      }, 200, req);
    }
    const s = summarize(events);

    // member's pending claims
    const listed = await store.list({ prefix: "claim:" }).catch(() => ({ blobs: [] }));
    const pendingClaims = [];
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
      points: s.points,
      lifetime: s.lifetime,
      tier: s.tier,
      vipThreshold: VIP_THRESHOLD,
      vipProgress: Math.min(1, s.lifetime / VIP_THRESHOLD),
      rewards: REWARDS.map((r) => ({ ...r, canClaim: s.points >= r.cost })),
      activity: s.activity.slice(-12).reverse(),
      pendingClaims,
    }, 200, req);
  });
