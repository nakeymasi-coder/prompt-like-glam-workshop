// Admin ops for Glam's Inner Circle. POST { secret|token, action, ... }.
// Auth: full sync secret, or the 24h hub token (issued by inner-circle-admin-auth).
// syncSales stays secret-only. Every point change is an independent event blob.
// Actions:
//   syncSales { sales: [{ messageId, email, points, date, label, product?, amount? }] }
//   addPoints { email, points, label }
//   pendingClaims {}
//   fulfillClaim { email, claimId } | cancelClaim { email, claimId }
//   getMember { email }            -> full detail incl. profile + purchases
//   listMembers {}                 -> [{ email, events }]
//   wipeAll {}
import {
  isolationCredential, withCors, json, memberStore, isAuthorized,
  getMemberEvents, summarize, listPendingClaims, vipForPurchases, rewardMonth, validGiftCatalog, validBirthday, profileKey, newMemberAccessCode, accessCodeHash,
  isValidEmail, eventKey, claimKey, newEventId, todayISO,
  getProfile, defaultDisplayName, listMemberEmails, productNameFromLabel,
} from "./inner-circle-lib.js";

export default async (req) =>
  withCors(req, async () => {
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "syncSales") {
      const syncSecret = isolationCredential("SYNC_SECRET");
      if (!syncSecret || body.secret !== syncSecret) {
        return json({ success: false, message: "Not authorized." }, 403, req);
      }
      const store = memberStore();
      const sales = Array.isArray(body.sales) ? body.sales : [];
      let added = 0;
      const touched = new Set();
      for (const s of sales) {
        if (!s.messageId) continue;
        const email = (s.email || "").trim().toLowerCase();
        const pts = Math.floor(Number(s.points) || 0);
        if (!isValidEmail(email)) continue;
        const saleKey = eventKey(email, "sale", s.messageId);
        const previous = await store.get(saleKey, { type: "json" }).catch(() => null);
        await store.setJSON(saleKey, {
          email, points: pts, date: s.date || todayISO(),
          label: s.label || "Purchase", kind: "sale",
          product: s.product || productNameFromLabel(s.label),
          amount: s.amount != null && Number.isFinite(Number(s.amount)) ? Number(s.amount) : (previous?.amount ?? null),
          currency: typeof s.currency === "string" ? s.currency.toUpperCase() : (previous?.currency ?? null),
          vipEligible: typeof s.vipEligible === "boolean" ? s.vipEligible : (previous?.vipEligible ?? null),
        });
        touched.add(email);
        added++;
      }
      return json({ success: true, added, membersTouched: touched.size }, 200, req);
    }

    if (!isAuthorized(body)) {
      return json({ success: false, message: "Not authorized." }, 403, req);
    }
    const store = memberStore();

    if (action === "issueMemberAccess") {
      const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
      if(!isValidEmail(email)||!(await getMemberEvents(store,email)).length) return json({success:false,message:"Member not found."},404,req);
      const code=newMemberAccessCode();
      const expiresAt=Date.now()+7*24*60*60*1000;
      await store.setJSON("member-access:"+accessCodeHash(code),{email,expiresAt,used:false});
      return json({success:true,code,expiresAt,message:"Deliver this one-use access code only to the verified Payhip purchase email. It expires in seven days."},200,req);
    }
    if (action === "setBirthday") {
      const email=typeof body.email==="string"?body.email.trim().toLowerCase():"";
      if(!isValidEmail(email)||!validBirthday(body.birthday)) return json({success:false,message:"Use a valid birthday month and day (MM-DD)."},400,req);
      if(!(await getMemberEvents(store,email)).length) return json({success:false,message:"Member not found."},404,req);
      const previous=await getProfile(store,email)||{};
      await store.setJSON(profileKey(email),{...previous,birthday:body.birthday,birthdayVerifiedAt:new Date().toISOString()});
      return json({success:true},200,req);
    }
    if (action === "getGiftCatalog") {
      const month = rewardMonth();
      const items = await store.get("gift-catalog:" + month, {type:"json",consistency:"strong"}) || [];
      return json({success:true,month,items},200,req);
    }
    if (action === "saveGiftCatalog") {
      if (body.month !== rewardMonth() || !validGiftCatalog(body.items)) {
        return json({success:false,message:"Provide five unique Payhip products, including at least one generator, for the current month."},400,req);
      }
      await store.setJSON("gift-catalog:" + body.month,body.items);
      return json({success:true},200,req);
    }
    if (action === "classifySale") {
      const email = (body.email || "").trim().toLowerCase();
      if (!isValidEmail(email) || typeof body.key !== "string" ||
          !body.key.startsWith(`ev:${email}:sale:`) ||
          typeof body.vipEligible !== "boolean" || !/^[A-Z]{3}$/.test(body.currency || "")) {
        return json({ success: false, message: "Choose an order, eligibility, and verified currency." }, 400, req);
      }
      const sale = await store.get(body.key, { type: "json" });
      if (!sale || sale.kind !== "sale" || sale.email !== email) {
        return json({ success: false, message: "Sale not found." }, 404, req);
      }
      if (body.vipEligible && (!Number.isFinite(sale.amount) || sale.amount <= 0)) {
        return json({ success: false, message: "Verify the amount paid in the purchase sync before including this order." }, 400, req);
      }
      await store.setJSON(body.key, { ...sale, vipEligible: body.vipEligible,
        currency: body.currency, eligibilityReviewedAt: new Date().toISOString() });
      return json({ success: true }, 200, req);
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
      if (action === "fulfillClaim" && !["vip-monthly","vip-birthday","vip-discount"].includes(claim.kind)) {
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
      if (["vip-monthly","vip-birthday","vip-discount"].includes(claim.kind) && action === "fulfillClaim") {
        await store.setJSON(key,{...claim,status:"fulfilled",fulfilledAt:new Date().toISOString()});
      } else {
        await store.delete(key).catch(() => {});
      }
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
      const profile = (await getProfile(store, email)) || {};
      const purchases = events
        .filter((e) => e.kind === "sale")
        .map((e) => ({
          date: e.date, product: e.product || productNameFromLabel(e.label),
          key: e._key, vipEligible: e.vipEligible, currency: e.currency,
          amount: e.amount, points: Math.floor(Number(e.points) || 0),
        }))
        .reverse();
      return json({
        success: true,
        member: {
          email,
          displayName: profile.displayName || defaultDisplayName(email),
          photo: profile.photo || "",
          birthday: profile.birthday || "",
          ...s,
          ...vipForPurchases(events),
          legacyVip: s.tier === "vip",
          purchases,
        },
      }, 200, req);
    }

    if (action === "listMembers") {
      const members = await listMemberEmails(store);
      return json({ success: true, count: members.length, members }, 200, req);
    }

    if (action === "wipeAll") {
      let deleted = 0;
      for (const prefix of ["ev:", "claim:", "profile:", "photo:"]) {
        const listed = await store.list({ prefix }).catch(() => ({ blobs: [] }));
        for (const b of listed.blobs || []) {
          await store.delete(b.key).catch(() => {});
          deleted++;
        }
      }
      await store.delete("state").catch(() => {});
      return json({ success: true, deleted }, 200, req);
    }

    return json({ success: false, message: "Unknown action." }, 400, req);
  });

