// POST { email } -> member balance, rewards, recent activity.
// Public (rate-limited). Never lists other members.
import {
  REWARDS, VIP_THRESHOLD, vipForPurchases, rewardMonth, validGiftCatalog, withCors, json,
  memberStore, getMemberEvents, summarize,
  isValidEmail, rateLimited,
  getProfile, defaultDisplayName, productNameFromLabel,
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
    const profile = (await getProfile(store, email)) || {};
    const purchases = events
      .filter((e) => e.kind === "sale")
      .map((e) => ({
        date: e.date,
        product: e.product || productNameFromLabel(e.label),
        points: Math.floor(Number(e.points) || 0),
      }))
      .reverse();

    // member's pending claims
    const listed = await store.list({ prefix: "claim:" }).catch(() => ({ blobs: [] }));
    const pendingClaims = [];
    for (const b of listed.blobs || []) {
      const c = await store.get(b.key, { type: "json" }).catch(() => null);
      if (c && c.email === email && c.status === "pending") {
        pendingClaims.push({ code: b.key.split(":")[1], rewardName: c.rewardName, createdAt: c.createdAt });
      }
    }

    const month = rewardMonth();
    const giftItems = await store.get("gift-catalog:" + month,{type:"json",consistency:"strong"});
    let monthlyGiftClaim = null;
    for (const b of listed.blobs || []) {
      const c = await store.get(b.key,{type:"json",consistency:"strong"});
      if(c && c.email===email && c.kind==="vip-monthly" && c.month===month) monthlyGiftClaim={name:c.rewardName,status:c.status};
    }
    return json({
      monthlyGift: {month,items:validGiftCatalog(giftItems)?giftItems:[],claim:monthlyGiftClaim},
      success: true,
      found: true,
      email,
      displayName: profile.displayName || defaultDisplayName(email),
      photo: profile.photo || "",
      points: s.points,
      lifetime: s.lifetime,
      tier: s.tier,
      ...vipForPurchases(events),
      vipThreshold: VIP_THRESHOLD,
      vipProgress: Math.min(1, s.lifetime / VIP_THRESHOLD),
      rewards: REWARDS.map((r) => ({ ...r, canClaim: s.points >= r.cost })),
      activity: s.activity.slice(-12).reverse(),
      purchases,
      pendingClaims,
    }, 200, req);
  });
