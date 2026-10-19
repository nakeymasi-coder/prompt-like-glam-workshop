// Trades Glam's admin password for a 24h signed token for the admin hub.
// POST { password } -> { success, token }
import { withCors, json, issueAdminToken, rateLimited } from "./inner-circle-lib.js";
import { timingSafeEqual } from "crypto";

export default async (req) =>
  withCors(req, async () => {
    if (rateLimited(req, 10)) {
      return json({ success: false, message: "Too many tries — wait a few minutes." }, 429, req);
    }
    const body = await req.json().catch(() => ({}));
    const password = body.password || "";
    const expected = (Netlify.env.get("INNER_CIRCLE_ADMIN_PASSWORD") || "").trim();
    const syncSecret = Netlify.env.get("INNER_CIRCLE_SYNC_SECRET");
    let ok = false;
    if (expected && syncSecret && typeof password === "string" && password.length > 0) {
      try {
        ok = timingSafeEqual(Buffer.from(password, "utf8"), Buffer.from(expected, "utf8"));
      } catch { ok = false; }
    }
    if (!ok) {
      return json({ success: false, message: "Wrong password." }, 401, req);
    }
    return json({ success: true, token: issueAdminToken(syncSecret) }, 200, req);
  });
