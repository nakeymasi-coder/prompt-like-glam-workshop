// Admin ops for Glam's Inner Circle. POST { secret, action, ... }.
// Actions:
//   syncSales { sales: [{ messageId, email, points, date, label }] } -> idempotent merge
//   addPoints { email, points, label }                              -> community/manual points (negative ok)
//   pendingClaims {}                                                -> list pending claims
//   fulfillClaim { email, claimId }                                 -> deduct + mark fulfilled
//   cancelClaim { email, claimId }
//   getMember { email }
//   resetState {}                                                   -> wipe everything (fresh start)
import {
  withCors, json, memberStore, loadState, saveState,
  getMember, getOrCreateMember, isValidEmail, tierFor, addActivity, claimKey,
} from "./inner-circle-lib.js";

export default async (req) =>
  withCors(req, async () => {
    const body = await req.json().catch(() => ({}));
    const secret = Netlify.env.get("INNER_CIRCLE_SYNC_SECRET");
    if (!secret || body.secret !== secret) {
      return json({ success: false, message: "Not authorized." }, 403, req);
    }

    const store = memberStore();
    const action = body.action;
    const state = await loadState(store);

    if (action === "resetState") {
      await saveState(store, { members: {}, processedSales: [], pendingClaims: [], updatedAt: null });
      // also remove legacy per-member blobs from the earlier design
      return json({ success: true, message: "State reset." }, 200, req);
    }

    if (action === "syncSales") {
      const sales = Array.isArray(body.sales) ? body.sales : [];
      const processed = new Set(state.processedSales || []);
      let added = 0;
      const touched = new Set();
      const newVips = [];
      for (const s of sales) {
        if (!s.messageId || processed.has(s.messageId)) continue;
        const email = (s.email || "").trim().toLowerCase();
        const pts = Math.floor(Number(s.points) || 0); // negative = refund/correction
        if (!isValidEmail(email)) continue;
        const member = getOrCreateMember(state, email);
        const wasVip = member.tier === "vip";
        if (pts !== 0) {
          member.points = Math.max(0, member.points + pts);
          if (pts > 0) member.lifetime += pts; // refunds don't erase lifetime (VIP is sticky)
          addActivity(member, s.label || `Purchase (${s.date || "Payhip"})`, pts);
        } else {
          addActivity(member, s.label || "Joined the Inner Circle", 0);
        }
        member.tier = tierFor(member.lifetime);
        if (!wasVip && member.tier === "vip") newVips.push(email);
        processed.add(s.messageId);
        touched.add(email);
        added++;
      }
      state.processedSales = [...processed];
      await saveState(store, state);
      return json({ success: true, added, membersTouched: touched.size, newVips }, 200, req);
    }

    if (action === "addPoints") {
      const email = (body.email || "").trim().toLowerCase();
      const pts = Math.floor(Number(body.points) || 0);
      if (!isValidEmail(email) || pts === 0 || !body.label) {
        return json({ success: false, message: "Need email, points, and label." }, 400, req);
      }
      const member = getOrCreateMember(state, email);
      const wasVip = member.tier === "vip";
      member.points = Math.max(0, member.points + pts);
      if (pts > 0) member.lifetime += pts;
      addActivity(member, body.label, pts);
      member.tier = tierFor(member.lifetime);
      await saveState(store, state);
      return json({ success: true, email, points: member.points, lifetime: member.lifetime, newVip: !wasVip && member.tier === "vip" }, 200, req);
    }

    if (action === "pendingClaims") {
      const listed = await store.list({ prefix: "claim:" }).catch(() => ({ blobs: [] }));
      const claims = [];
      for (const b of listed.blobs || []) {
        const c = await store.get(b.key, { type: "json" }).catch(() => null);
        if (c && c.status === "pending") {
          claims.push({ code: b.key.split(":")[1], ...c });
        }
      }
      claims.sort((a, b2) => (a.createdAt < b2.createdAt ? -1 : 1));
      return json({ success: true, claims }, 200, req);
    }

    if (action === "fulfillClaim" || action === "cancelClaim") {
      const email = (body.email || "").trim().toLowerCase();
      const key = claimKey(body.claimId);
      const claim = await store.get(key, { type: "json" }).catch(() => null);
      if (!claim || claim.status !== "pending" || claim.email !== email) {
        return json({ success: false, message: "Pending claim not found." }, 404, req);
      }
      if (action === "fulfillClaim") {
        const member = getMember(state, email);
        if (!member) return json({ success: false, message: "Member not found." }, 404, req);
        if (member.points < claim.cost) {
          return json({ success: false, message: `Insufficient points (${member.points} < ${claim.cost}).` }, 400, req);
        }
        member.points -= claim.cost;
        addActivity(member, `Redeemed: ${claim.rewardName}`, -claim.cost);
        await saveState(store, state);
      }
      await store.delete(key).catch(() => {});
      return json({ success: true, email }, 200, req);
    }

    if (action === "getMember") {
      const email = (body.email || "").trim().toLowerCase();
      const member = getMember(state, email);
      if (!member) return json({ success: false, message: "Member not found." }, 404, req);
      return json({ success: true, member }, 200, req);
    }

    return json({ success: false, message: "Unknown action." }, 400, req);
  });
