import "@supabase/functions-js/edge-runtime.d.ts";

import {
  createClient,
} from "npm:@supabase/supabase-js@2";

import {
  corsHeaders,
} from "npm:@supabase/supabase-js@2/cors";


// ==========================================================
// IVAN SAYS
// CREATE MODERATOR
// ==========================================================

Deno.serve(async (req) => {

  // ========================================================
  // CORS 001
  // ========================================================

  if (req.method === "OPTIONS") {
    return new Response(
      "ok",
      {
        headers: corsHeaders,
      }
    );
  }


  const json = (
    body: unknown,
    status = 200
  ) =>
    new Response(
      JSON.stringify(body),
      {
        status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );


  try {

    // ======================================================
    // METHOD 002
    // ======================================================

    if (req.method !== "POST") {
      return json(
        {
          error: "Method not allowed.",
        },
        405
      );
    }


    // ======================================================
    // AUTH HEADER 003
    // ======================================================

    const authorization =
      req.headers.get("Authorization");


    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return json(
        {
          error:
            "Missing authorization token.",
        },
        401
      );
    }


    const accessToken =
      authorization.substring(7);


    // ======================================================
    // ENVIRONMENT 004
    // ======================================================

    const supabaseUrl =
      Deno.env.get("SUPABASE_URL");

    const publishableKey =
      Deno.env.get("SUPABASE_ANON_KEY");


    if (
      !supabaseUrl ||
      !publishableKey
    ) {
      console.error(
        "Missing Supabase environment configuration."
      );

      return json(
        {
          error:
            "Server configuration error.",
        },
        500
      );
    }


    // ======================================================
    // USER CLIENT 005
    //
    // Validate the JWT against Supabase Auth.
    // ======================================================

    const userClient = createClient(
      supabaseUrl,
      publishableKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );


    const {
      data: userData,
      error: userError,
    } =
      await userClient.auth.getUser(
        accessToken
      );


    if (
      userError ||
      !userData.user
    ) {
      console.error(
        "JWT validation failed:",
        userError
      );

      return json(
        {
          error:
            "Invalid authentication session.",
        },
        401
      );
    }


    const user =
      userData.user;


    // ======================================================
    // ADMIN CLIENT 006
    // ======================================================

    const serviceRoleKey =
      Deno.env.get(
        "SUPABASE_SERVICE_ROLE_KEY"
      );


    if (!serviceRoleKey) {
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY unavailable."
      );

      return json(
        {
          error:
            "Server configuration error.",
        },
        500
      );
    }


    const adminClient = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );


    // ======================================================
    // OWNER CHECK 007
    // ======================================================

    const {
      data: profile,
      error: profileError,
    } = await adminClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();


    if (profileError) {
      console.error(
        "Profile lookup failed:",
        profileError
      );

      return json(
        {
          error:
            "Unable to verify account permissions.",
        },
        500
      );
    }


    if (profile?.role !== "owner") {
      return json(
        {
          error:
            "Owner access required.",
        },
        403
      );
    }


    // ======================================================
    // INPUT 008
    // ======================================================

    const body =
      await req.json();


    const username =
      String(body.username ?? "")
        .trim()
        .toLowerCase();


    const password =
      String(body.password ?? "");


    const usernameRegex =
      /^[a-z0-9_-]{3,24}$/;


    if (
      !usernameRegex.test(username)
    ) {
      return json(
        {
          error:
            "Username must be 3-24 characters and contain only letters, numbers, underscores, or hyphens.",
        },
        400
      );
    }


    if (password.length < 8) {
      return json(
        {
          error:
            "Password must be at least 8 characters.",
        },
        400
      );
    }


    // ======================================================
    // SYNTHETIC EMAIL 009
    // ======================================================

    const authEmail =
      `${username}@auth.ivansays.com`;


    // ======================================================
    // CREATE AUTH USER 010
    // ======================================================

    const {
      data: createdUser,
      error: createError,
    } =
      await adminClient.auth.admin.createUser({
        email: authEmail,
        password,
        email_confirm: true,
      });


    if (
      createError ||
      !createdUser.user
    ) {
      console.error(
        "Auth user creation failed:",
        createError
      );

      return json(
        {
          error:
            createError?.message ??
            "Unable to create moderator.",
        },
        400
      );
    }


    // ======================================================
    // CREATE PROFILE 011
    // ======================================================

    const {
      error: profileInsertError,
    } = await adminClient
      .from("profiles")
      .insert({
        id: createdUser.user.id,
        email: authEmail,
        username,
        role: "moderator",
      });


    // ======================================================
    // ROLLBACK 012
    // ======================================================

    if (profileInsertError) {
      console.error(
        "Profile creation failed:",
        profileInsertError
      );

      await adminClient
        .auth
        .admin
        .deleteUser(
          createdUser.user.id
        );


      return json(
        {
          error:
            "Unable to create moderator profile.",
        },
        500
      );
    }


    // ======================================================
    // SUCCESS 013
    // ======================================================

    return json({
      success: true,

      user: {
        id: createdUser.user.id,
        username,
        role: "moderator",
      },
    });

  } catch (error) {

    console.error(
      "create-moderator failure:",
      error
    );


    return json(
      {
        error:
          "Unexpected server error.",
      },
      500
    );

  }

});