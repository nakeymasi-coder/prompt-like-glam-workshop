const SUPABASE_URL =
  "https://zaylygsgbqtulnilcvrg.supabase.co";

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data),
    {
      status,

      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    }
  );
}

async function getSignedInUser(
  req,
  serviceRoleKey
) {
  const authorization =
    req.headers.get("authorization") || "";

  if (
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  const response = await fetch(
    `${SUPABASE_URL}/auth/v1/user`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: authorization
      }
    }
  );

  if (!response.ok) {
    return null;
  }

  return response.json();
}

async function grantEntitlement(
  userId,
  workshopId,
  serviceRoleKey
) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/student_entitlements?on_conflict=user_id,workshop_id`,
    {
      method: "POST",

      headers: {
        apikey: serviceRoleKey,

        Authorization:
          `Bearer ${serviceRoleKey}`,

        "Content-Type":
          "application/json",

        Prefer:
          "resolution=merge-duplicates,return=minimal"
      },

      body: JSON.stringify({
        user_id: userId,
        workshop_id: workshopId,
        active: true,
        granted_at:
          new Date().toISOString(),
        expires_at: null
      })
    }
  );

  if (!response.ok) {
    const detail =
      await response.text();

    console.error(
      "Entitlement grant failed:",
      detail
    );

    return false;
  }

  return true;
}

export default async (req) => {
  if (req.method !== "POST") {
    return json(
      {
        success: false,
        message:
          "Method not allowed."
      },
      405
    );
  }

  try {
    const serviceRoleKey =
      Netlify.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );

    if (!serviceRoleKey) {
      return json(
        {
          success: false,
          message:
            "Student account connection is not configured yet."
        },
        500
      );
    }

    const user =
      await getSignedInUser(
        req,
        serviceRoleKey
      );

    if (!user || !user.id) {
      return json(
        {
          success: false,
          message:
            "Please sign in to your student account first."
        },
        401
      );
    }

    const body = await req.json();

    const licenseKey =
      String(
        body?.licenseKey || ""
      ).trim();

    if (!licenseKey) {
      return json(
        {
          success: false,
          message:
            "Please enter your Website Workshop access key."
        },
        400
      );
    }

    const websiteProducts = [
      {
        date: "August 22",

        secret:
          Netlify.env.get(
            "PAYHIP_WEBSITE_AUG22_SECRET"
          )
      },

      {
        date: "August 23",

        secret:
          Netlify.env.get(
            "PAYHIP_WEBSITE_AUG23_SECRET"
          )
      },

      {
        date: "August 29",

        secret:
          Netlify.env.get(
            "PAYHIP_WEBSITE_AUG29_SECRET"
          )
      },

      {
        date: "August 30",

        secret:
          Netlify.env.get(
            "PAYHIP_WEBSITE_AUG30_SECRET"
          )
      }
    ];

    for (
      const product of websiteProducts
    ) {
      if (!product.secret) {
        continue;
      }

      const verifyResponse =
        await fetch(
          `https://payhip.com/api/v2/license/verify?license_key=${encodeURIComponent(
            licenseKey
          )}`,
          {
            method: "GET",

            headers: {
              "product-secret-key":
                product.secret
            }
          }
        );

      const verifyResult =
        await verifyResponse.json();

      if (
        verifyResponse.ok &&
        verifyResult?.data?.enabled
      ) {
        const granted =
          await grantEntitlement(
            user.id,
            "website-workshop",
            serviceRoleKey
          );

        if (!granted) {
          return json(
            {
              success: false,

              message:
                "Your purchase was verified, but we could not attach it to your student account."
            },
            500
          );
        }

        return json({
          success: true,

          workshop:
            "website-workshop",

          workshopDate:
            product.date,

          message:
            `Website Workshop added to your account for ${product.date}.`
        });
      }
    }

    return json(
      {
        success: false,

        message:
          "That access key was not recognized for an available workshop."
      },
      401
    );
  } catch (error) {
    console.error(error);

    return json(
      {
        success: false,

        message:
          "We could not verify your workshop access right now."
      },
      500
    );
  }
};