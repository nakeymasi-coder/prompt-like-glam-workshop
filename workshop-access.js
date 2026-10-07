(() => {
  const SUPABASE_URL = "https://zaylygsgbqtulnilcvrg.supabase.co";
  const SUPABASE_KEY = "sb_publishable_9OrEqYDv9NV8E29JakoepA_rIgYDsMk";

  if (!window.supabase) {
    console.error("Supabase library is not loaded.");
    return;
  }

  const client = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );

  async function getSession() {
    const { data, error } = await client.auth.getSession();

    if (error) throw error;

    return data.session;
  }

  async function signIn(email, password) {
    const { data, error } =
      await client.auth.signInWithPassword({
        email,
        password
      });

    if (error) throw error;

    return data;
  }

  async function signUp(email, password) {
    const { data, error } =
      await client.auth.signUp({
        email,
        password
      });

    if (error) throw error;

    return data;
  }

  async function signInWithGoogle() {
    const redirectTo = `${window.location.origin}/student-login.html`;

    const { data, error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo
      }
    });

    if (error) throw error;

    return data;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();

    if (error) throw error;
  }

  async function getEntitlements() {
    const session = await getSession();

    if (!session) return [];

    const { data, error } = await client
      .from("student_entitlements")
      .select(
        "workshop_id, active, granted_at, expires_at"
      )
      .eq("active", true);

    if (error) throw error;

    return data || [];
  }

  async function hasWorkshop(workshopId) {
    const entitlements = await getEntitlements();
    const now = Date.now();

    return entitlements.some((item) => {
      if (
        item.workshop_id !== workshopId ||
        !item.active
      ) {
        return false;
      }

      if (!item.expires_at) {
        return true;
      }

      return (
        new Date(item.expires_at).getTime() > now
      );
    });
  }

  async function getReplayResources() {
    const session = await getSession();

    if (!session) return [];

    const { data, error } = await client
      .from("workshop_resources")
      .select(
        "workshop_id, resource_type, title, description, resource_url, passcode, sort_order"
      )
      .eq("active", true)
      .eq("resource_type", "replay")
      .order("sort_order", {
        ascending: true
      });

    if (error) throw error;

    return data || [];
  }

  async function syncLegacyAccess() {
    const entitlements = await getEntitlements();

    const owned = new Set(
      entitlements.map(
        (item) => item.workshop_id
      )
    );

    localStorage.setItem(
      "glamWorkshopPortal:websiteWorkshopAccess",
      owned.has("website-workshop")
        ? "true"
        : "false"
    );

    localStorage.setItem(
      "glamWorkshopPortal:promptWorkshopAccess",
      owned.has("prompt-generator-workshop")
        ? "true"
        : "false"
    );

    return owned;
  }

  async function redeemWorkshopAccess(accessCode) {
    const code = String(accessCode || "").trim();

    if (!code) {
      throw new Error(
        "Enter your workshop access key or student code."
      );
    }

    const session = await getSession();

    if (!session) {
      throw new Error(
        "Please sign in before redeeming workshop access."
      );
    }

    const {
      data: promptResult,
      error: promptError
    } = await client.rpc(
      "redeem_prompt_generator_code",
      {
        access_code: code
      }
    );

    if (
      !promptError &&
      promptResult &&
      promptResult.success
    ) {
      await syncLegacyAccess();

      return promptResult;
    }

    let response;

    try {
      response = await fetch(
        "/.netlify/functions/redeem-workshop-access",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            "Authorization":
              `Bearer ${session.access_token}`
          },

          body: JSON.stringify({
            licenseKey: code
          })
        }
      );
    } catch (error) {
      throw new Error(
        "The Website Workshop key checker is not available in this local preview yet."
      );
    }

    let result;

    try {
      result = await response.json();
    } catch (error) {
      throw new Error(
        "The Website Workshop key checker is not available in this local preview yet."
      );
    }

    if (
      !response.ok ||
      !result ||
      !result.success
    ) {
      throw new Error(
        result?.message ||
        promptResult?.message ||
        "That workshop access key was not recognized."
      );
    }

    await syncLegacyAccess();

    return result;
  }

  window.GlamWorkshopAccess = {
    client,
    getSession,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    getEntitlements,
    hasWorkshop,
    getReplayResources,
    syncLegacyAccess,
    redeemWorkshopAccess
  };
})();