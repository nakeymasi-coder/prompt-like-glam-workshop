// Admin ops for Glam's Inner Circle. POST { secret, action, ... }.
// Every point change is an independent event blob — no shared read-modify-write.
// Actions:
//   syncSales { sales: [{ messageId, email, points, date, label }] }  (idempotent by key)
//   addPoints { email, points, label }                                (negative ok)
//   pendingClaims {}
//   fulfillClaim { email, claimId }    -> writes a negative-point redeem event
//   cancelClaim { email, claimId }
//   getMember { email }                -> aggregated summary
//   wipeAll {}                         -> delete every ev:* and claim:* blob (fresh start)
import {
  withCors, json, memberStore,
  getMemberEvents, summarize, listPendingClaims,
  isValidEmail, eventKey, claimKey, newEventId, todayISO,
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

    if (action === "syncSales") {
      const sales = Array.isArray(body.sales) ? body.sales : [];
      let added = 0;
      const touched = new Set();
      for (const s of sales) {
        if (!s.messageId) continue;
        const email = (s.email || "").trim().toLowerCase();
        const pts = Math.floor(Number(s.points) || 0);
        if (!isValidEmail(email)) continue;
        await store.setJSON(eventKey(email, "sale", s.messageId), {
          email, points: pts, date: s.date || todayISO(),
          label: s.label || "Purchase", kind: "sale",
        });
        touched.add(email);
        added++;
      }
      return json({ success: true, added, membersTouched: touched.size }, 200, req);
    }

    if (action === "addPoints") {
      const email = (body.email || "").trim().toLowerCase();
      const pts = Math.floor(Number(body.points) || 0);
      if (!isValidEmail(email) || pts === 0 || !body.label) {
        return json({ success: false, message: "Need email, points, and label." }, 400, req);
      }
      await store.setJSON(eventKey(email, "bonus", newEventId()), {
        email, points: pts, date: todayISO(), label: body.label, kind: "bonus",
      });
      return json({ success: true, email, pointsAdded: pts }, 200, req);
    }

    if (action === "pendingClaims") {
      const claims = await listPendingClaims(store);
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
        const events = await getMemberEvents(store, email);
        const s = summarize(events);
        if (s.points < claim.cost) {
          return json({ success: false, message: `Insufficient points (${s.points} < ${claim.cost}).` }, 400, req);
        }
        await store.setJSON(eventKey(email, "redeem", body.claimId), {
          email, points: -claim.cost, date: todayISO(),
          label: `Redeemed: ${claim.rewardName}`, kind: "redeem",
        });
      }
      await store.delete(key).catch(() => {});
      return json({ success: true, email }, 200, req);
    }

    if (action === "getMember") {
      const email = (body.email || "").trim().toLowerCase();
      if (!isValidEmail(email)) {
        return json({ success: false, message: "Invalid email." }, 400, req);
      }
      const events = await getMemberEvents(store, email);
      if (!events.length) return json({ success: false, message: "Member not found." }, 404, req);
      const s = summarize(events);
      return json({ success: true, member: { email, ...s } }, 200, req);
    }

    if (action === "wipeAll") {
      let deleted = 0;
      for (const prefix of ["ev:", "claim:"]) {
        const listed = await store.list({ prefix }).catch(() => ({ blobs: [] }));
        for (const b of listed.blobs || []) {
          await store.delete(b.key).catch(() => {});
          deleted++;
        }
      }
      // also clear the legacy single-blob state from the earlier design
      await store.delete("state").catch(() => {});
      return json({ success: true, deleted }, 200, req);
    }

    return json({ success: false, message: "Unknown action." }, 400, req);
  });
