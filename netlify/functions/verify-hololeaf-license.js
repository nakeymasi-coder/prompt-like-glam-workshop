// Verifies HoloLeaf Studio license keys against Payhip.
// Mirrors netlify/functions/verify-beseen-license.js exactly — same CORS,
// same Payhip v2 verify call. Only the product + secret differ.
//
// The HoloLeaf product secret is read from the PAYHIP_HOLOLEAF_SECRET
// environment variable. Set it in Netlify: Site settings → Environment
// variables → New variable → key PAYHIP_HOLOLEAF_SECRET, value = the
// "product secret key" from the HoloLeaf Studio product's Payhip dashboard
// (Products → HoloLeaf Studio → License keys).
// Until the real secret is set, every key is rejected (fail closed).

export default async (req) => {
  const allowedOrigins = new Set([
    "https://nakeymasi-coder.github.io",
    "https://workshop-poratl.netlify.app",
    "https://deploy-preview-2--workshop-poratl.netlify.app",
  ]);
  const origin = req.headers.get("Origin");
  const headers = {
    "Content-Type": "application/json",
    Vary: "Origin",
    ...(allowedOrigins.has(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
  };

  if (origin && !allowedOrigins.has(origin)) {
    return new Response(
      JSON.stringify({ success: false, message: "This origin is not allowed." }),
      { status: 403, headers },
    );
  }

  if (req.method === "OPTIONS") {
    if (!origin || req.headers.get("Access-Control-Request-Method") !== "POST") {
      return new Response(null, {
        status: 405,
        headers: { ...headers, Allow: "POST, OPTIONS" },
      });
    }
    return new Response(null, {
      status: 204,
      headers: {
        ...headers,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, message: "Use POST to verify access." }),
      { status: 405, headers: { ...headers, Allow: "POST, OPTIONS" } },
    );
  }

  try {
    const body = await req.json();
    const licenseKey = body.licenseKey;

    if (!licenseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please enter your HoloLeaf Studio license key.",
        }),
        { status: 400, headers },
      );
    }

    const generatorProducts = [
      {
        name: "HoloLeaf Studio",
        secret:
          Netlify.env.get("PAYHIP_HOLOLEAF_SECRET") ||
          "PASTE_HOLOLEAF_PRODUCT_SECRET_HERE",
      },
    ];

    for (const product of generatorProducts) {
      if (!product.secret) continue;

      const response = await fetch(
        `https://payhip.com/api/v2/license/verify?license_key=${encodeURIComponent(
          licenseKey,
        )}`,
        {
          method: "GET",
          headers: {
            "product-secret-key": product.secret,
          },
        },
      );

      const result = await response.json();

      if (response.ok && result?.data?.enabled) {
        return new Response(
          JSON.stringify({
            success: true,
            product: "hololeaf-studio",
            message: "HoloLeaf Studio unlocked.",
          }),
          { status: 200, headers },
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "That HoloLeaf Studio license key is invalid or inactive.",
      }),
      { status: 401, headers },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "We could not verify your license key. Please try again.",
      }),
      { status: 500, headers },
    );
  }
};
