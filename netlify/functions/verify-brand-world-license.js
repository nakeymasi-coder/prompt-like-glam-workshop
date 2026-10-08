export default async (req) => {
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
          headers: { "Content-Type": "application/json" },
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
            headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
