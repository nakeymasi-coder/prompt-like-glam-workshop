export default async (req) => {
  try {
    const body = await req.json();
    const licenseKey = body.licenseKey;

    if (!licenseKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Please enter your access key.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const productSecretKey = Netlify.env.get("PAYHIP_WEBSITE_WORKSHOP_SECRET");

    if (!productSecretKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Workshop verification is not configured yet.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const response = await fetch(
      `https://payhip.com/api/v2/license/verify?license_key=${encodeURIComponent(
        licenseKey,
      )}`,
      {
        method: "GET",
        headers: {
          "product-secret-key": productSecretKey,
        },
      },
    );

    const result = await response.json();

    if (!response.ok || !result?.data?.enabled) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "That access key is invalid or inactive.",
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        workshop: "website-workshop",
        message: "Website Workshop unlocked.",
      }),
      {
        status: 200,
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
