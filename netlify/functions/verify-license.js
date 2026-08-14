export default async (req) => {
  try {
    const body = await req.json();
    const licenseKey = body.licenseKey;

    if (!licenseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please enter your Website Workshop access key.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const websiteProducts = [
      {
        date: "August 22",
        secret: Netlify.env.get("PAYHIP_WEBSITE_AUG22_SECRET"),
      },
      {
        date: "August 23",
        secret: Netlify.env.get("PAYHIP_WEBSITE_AUG23_SECRET"),
      },
      {
        date: "August 29",
        secret: Netlify.env.get("PAYHIP_WEBSITE_AUG29_SECRET"),
      },
      {
        date: "August 30",
        secret: Netlify.env.get("PAYHIP_WEBSITE_AUG30_SECRET"),
      },
    ];

    for (const product of websiteProducts) {
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
            workshop: "website-workshop",
            workshopDate: product.date,
            message: `Website Workshop unlocked for ${product.date}.`,
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
        message: "That Website Workshop access key is invalid or inactive.",
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
