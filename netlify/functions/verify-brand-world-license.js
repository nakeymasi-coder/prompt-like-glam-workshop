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
          message: "Please enter your Build Your Brand World access key.",
        }),
        {
          status: 400,
          headers,
        },
      );
    }

    const brandWorldProducts = [
      {
        date: "October 30 - November 1, 2026",
        secret:
          Netlify.env.get("PAYHIP_BRAND_WORLD_SECRET") ||
          "prod_sk_yp4q2_2cb45a8fa52a50aee47e68735d239eb04c207878",
      },
    ];

    for (const product of brandWorldProducts) {
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
            workshop: "brand-world-workshop",
            workshopDate: product.date,
            message: `Build Your Brand World unlocked for ${product.date}.`,
          }),
          {
            status: 200,
            headers,
          },
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: "That Build Your Brand World access key is invalid or inactive.",
      }),
      {
        status: 401,
        headers,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "We could not verify your access key. Please try again.",
      }),
      {
        status: 500,
        headers,
      },
    );
  }
};
