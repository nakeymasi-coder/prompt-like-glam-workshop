// Admin ops for Glam's Inner Circle. POST { secret, action, ... }.
// Actions:
//   syncSales { sales: [{ messageId, email, points, date, label }] } -> idempotent merge
//   addPoints { email, points, label }                              -> community/manual points
//   pendingClaims {}                                                -> list pending claims
//   fulfillClaim { email, claimId }                                 -> deduct + mark fulfilled
//   cancelClaim { email, claimId }
//   getMember { email }
import {
  withCors, json, memberStore, memberKey, isValidEmail, tierFor,
} from "./inner-circle-lib.js";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function getOrCreate(store, email) {
  const key = memberKey(email);
  let member = await store.get(key, { type: "json" });
  if (!member) {
    member = { email, points: 0, lifetime: 0, tier: "member", activity: [], claims: [], joined: todayISO() };
  }
  return [key, member];
}

function addActivity(member, label, points) {
  member.activity = [...(member.activity || []), { date: todayISO(), label, points }];
  if (member.activity.length > 60) member.activity = member.activity.slice(-60);
}

export default async (req) =>
  withCors(req, async () => {
    const body = await req.json().catch(() => ({}));
    const secret = Netlify.env.get("INNER_CIRCLE_SYNC_SECRET");
    if (!secret || body.secret !== secret) {
      return json({ success: false, message: "Not authorized." }, 403, req);
    }

    const store = memberStore();
    const action = body.action;

    if (action === "syncSales") {
      const sales = Array.isArray(body.sales) ? body.sales : [];
      const processed = new Set((await store.get("processed-sales", { type: "json" }).catch(() => null)) || []);
      let added = 0;
      const touched = new Set();
      const newVips = [];
      for (const s of sales) {
        if (!s.messageId || processed.has(s.messageId)) continue;
        const email = (s.email || "").trim().toLowerCase();
        const pts = Math.max(0, Math.floor(Number(s.points) || 0));
        if (!isValidEmail(email)) continue;
        const [key, member] = await getOrCreate(store, email);
        const wasVip = member.tier === "vip";
        if (pts > 0) {
          member.points += pts;
          member.lifetime += pts;
          addActivity(member, s.label || `Purchase (${s.date || "Payhip"})`, pts);
        } else {
          addActivity(member, s.label || "Joined the Inner Circle", 0);
        }
        member.tier = tierFor(member.lifetime);
        if (!wasVip && member.tier === "vip") newVips.push(email);
        await store.setJSON(key, member);
        processed.add(s.messageId);
        touched.add(email);
        added++;
      }
      await store.setJSON("processed-sales", [...processed]);
      return json({ success: true, added, membersTouched: touched.size, newVips }, 200, req);
    }

    if (action === "addPoints") {
      const email = (body.email || "").trim().toLowerCase();
      const pts = Math.max(0, Math.floor(Number(body.points) || 0));
      if (!isValidEmail(email) || pts <= 0 || !body.label) {
        return json({ success: false, message: "Need email, points, and label." }, 400, req);
      }
      const [key, member] = await getOrCreate(store, email);
      const wasVip = member.tier === "vip";
      member.points += pts;
      member.lifetime += pts;
      addActivity(member, body.label, pts);
      member.tier = tierFor(member.lifetime);
      await store.setJSON(key, member);
      return json({ success: true, email, points: member.points, lifetime: member.lifetime, newVip: !wasVip && member.tier === "vip" }, 200, req);
    }

    if (action === "pendingClaims") {
      const list = (await store.get("pending-claims", { type: "json" }).catch(() => null)) || [];
      return json({ success: true, claims: list }, 200, req);
    }

    if (action === "fulfillClaim" || action === "cancelClaim") {
      const email = (body.email || "").trim().toLowerCase();
      const key = memberKey(email);
      const member = await store.get(key, { type: "json" });
      if (!member) return json({ success: false, message: "Member not found." }, 404, req);
      const claim = (member.claims || []).find((c) => c.id === body.claimId && c.status === "pending");
      if (!claim) return json({ success: false, message: "Pending claim not found." }, 404, req);
      if (action === "fulfillClaim") {
        if (member.points < claim.cost) {
          return json({ success: false, message: `Insufficient points (${member.points} < ${claim.cost}).` }, 400, req);
        }
        member.points -= claim.cost;
        claim.status = "fulfilled";
        claim.fulfilledAt = new Date().toISOString();
        addActivity(member, `Redeemed: ${claim.rewardName}`, -claim.cost);
      } else {
        claim.status = "cancelled";
      }
      await store.setJSON(key, member);
      const list = ((await store.get("pending-claims", { type: "json" }).catch(() => null)) || [])
        .filter((c) => !(c.email === email && c.id === claim.id));
      await store.setJSON("pending-claims", list);
      return json({ success: true, email, points: member.points }, 200, req);
    }

    if (action === "getMember") {
      const email = (body.email || "").trim().toLowerCase();
      const member = await store.get(memberKey(email), { type: "json" });
      if (!member) return json({ success: false, message: "Member not found." }, 404, req);
      return json({ success: true, member }, 200, req);
    }

    return json({ success: false, message: "Unknown action." }, 400, req);
  });
