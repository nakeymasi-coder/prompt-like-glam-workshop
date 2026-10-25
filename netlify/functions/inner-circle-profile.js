// Member profile: display name + photo. POST { email, displayName?, photo? }.
// Photo is a data URL (client resizes to ~256px JPEG first). Stored as one
// per-member blob — only the member writes their own, so no contention.
import { verifyMemberToken,
  withCors, json, memberStore, getMemberEvents,
  getProfile, profileKey, safePhoto, isValidEmail, rateLimited,
} from "./inner-circle-lib.js";

const MAX_PHOTO_CHARS = 220000; // ~160KB data URL cap

export default async (req) =>
  withCors(req, async () => {
    if (rateLimited(req, 15)) {
      return json({ success: false, message: "Too many tries — wait a minute and try again." }, 429, req);
    }
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      return json({ success: false, message: "Please enter a valid email address." }, 400, req);
    }

    if (!verifyMemberToken(email, body.memberToken)) return json({success:false,message:"Verify your purchase email with your personal access code."},401,req);
    const store = memberStore();
    const events = await getMemberEvents(store, email);
    if (!events.length) {
      return json({ success: false, message: "No Inner Circle account found for that email yet." }, 404, req);
    }

    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 40) : null;
    const photo = typeof body.photo === "string" ? body.photo : null;
    if (body.photo !== undefined && body.photo !== null && (typeof body.photo !== "string" || (photo && !safePhoto(photo)))) {
      return json({ success: false, message: "That photo didn't upload right — try a smaller one." }, 400, req);
    }

    const prev = (await getProfile(store, email)) || {};
    const profile = {
      ...prev,
      displayName: displayName || prev.displayName || "",
      photo: photo !== null ? photo : (prev.photo || ""),
      updatedAt: new Date().toISOString(),
    };
    await store.setJSON(profileKey(email), profile);
    return json({ success: true, profile: { displayName: profile.displayName, photo: safePhoto(profile.photo) } }, 200, req);
  });

