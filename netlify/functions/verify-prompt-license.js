// Configure PAYHIP_PROMPT_WORKSHOP_SECRET in Netlify before publishing.
// Use the product secret for Payhip product kJPIl (Prompt Generator Workshop).
const reply = (status, data) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json" },
});

export default async (req) => {
  if (req.method !== "POST") {
    return reply(405, { success: false, message: "Please submit your access key using the workshop form." });
  }

  let body;
  try { body = await req.json(); }
  catch { return reply(400, { success: false, message: "Please enter your Prompt Generator Workshop access key." }); }
  const licenseKey = typeof body?.licenseKey === "string" ? body.licenseKey.trim() : "";
  if (!licenseKey || licenseKey.length > 200) {
    return reply(400, { success: false, message: "Please enter your Prompt Generator Workshop access key." });
  }

  const productSecret = Netlify.env.get("PAYHIP_PROMPT_WORKSHOP_SECRET");
  if (!productSecret) {
    return reply(503, { success: false, message: "Prompt Generator Workshop verification is temporarily unavailable. Please contact support." });
  }

  try {
    const response = await fetch(`https://payhip.com/api/v2/license/verify?license_key=${encodeURIComponent(licenseKey)}`, {
      method: "GET",
      headers: { "product-secret-key": productSecret },
    });
    const result = await response.json();
    if (response.ok && result?.data?.enabled === true) {
      return reply(200, { success: true, workshop: "prompt-generator-workshop", message: "Prompt Generator Workshop unlocked." });
    }
    if (!response.ok && response.status !== 401 && response.status !== 403 && response.status !== 404) {
      return reply(502, { success: false, message: "We could not verify your access key. Please try again." });
    }
    return reply(401, { success: false, message: "That Prompt Generator Workshop access key is invalid or inactive." });
  } catch {
    return reply(502, { success: false, message: "We could not verify your access key. Please try again." });
  }
};

