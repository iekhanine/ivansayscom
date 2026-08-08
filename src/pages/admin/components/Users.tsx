import { useEffect, useState } from "react";

import { supabase } from "../../../lib/supabase";


type Profile = {
  id: string;
  email: string;
  username: string | null;
  role: "owner" | "moderator";
  created_at: string;
};


function Users() {

  // ========================================================
  // STATE 001
  // ========================================================

  const [profiles, setProfiles] = useState<Profile[]>([]);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // ========================================================
  // DATA 002 — LOAD USERS
  // ========================================================

  const loadProfiles = async () => {

    setError("");

    const {
      data,
      error: loadError,
    } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", {
        ascending: true,
      });


    if (loadError) {

      console.error(
        "Profile load error:",
        loadError
      );

      setError(
        "Unable to load users."
      );

      setIsLoading(false);

      return;

    }


    setProfiles(
      (data ?? []) as Profile[]
    );

    setIsLoading(false);

  };


  // ========================================================
  // INITIAL LOAD 003
  // ========================================================

  useEffect(() => {

    loadProfiles();

  }, []);


  // ========================================================
  // CREATE MODERATOR 004
  // ========================================================

  const createModerator = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {

    event.preventDefault();


const cleanUsername =
  username.trim().toLowerCase();

const usernameRegex =
  /^[a-z0-9_-]{3,24}$/;

if (
  !usernameRegex.test(cleanUsername) ||
  password.length < 8 ||
  isCreating
) {
  return;
}


    setIsCreating(true);
    setError("");
    setSuccess("");


const {
  data: sessionData,
} = await supabase.auth.getSession();

const accessToken =
  sessionData.session?.access_token;

console.log(
  "SESSION EXISTS:",
  Boolean(sessionData.session)
);

console.log(
  "USER:",
  sessionData.session?.user?.email
);

console.log(
  "TOKEN EXISTS:",
  Boolean(accessToken)
);

console.log(
  "TOKEN PREFIX:",
  accessToken?.substring(0, 20)
);

if (!accessToken) {
  setError(
    "Your admin session has expired. Please log in again."
  );

  setIsCreating(false);
  return;
}

const {
  data,
  error: functionError,
} = await supabase.functions.invoke(
  "create-moderator",
  {
    body: {
      username: cleanUsername,
      password,
    },

    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  }
);


if (functionError) {
  console.error(
    "Create moderator error:",
    functionError
  );

  let errorMessage =
    "Unable to create moderator.";

  try {
    const response =
      (functionError as any).context;

    if (response) {
      const body =
        await response.json();

      console.error(
        "Edge Function response:",
        body
      );

      if (body?.error) {
        errorMessage = body.error;
      }
    }
  } catch (responseError) {
    console.error(
      "Unable to read Edge Function error:",
      responseError
    );
  }

  setError(errorMessage);
  setIsCreating(false);

  return;
}


    if (data?.error) {

      setError(data.error);

      setIsCreating(false);

      return;

    }


setUsername("");
setPassword("");

    setSuccess(
      "Moderator created."
    );

    await loadProfiles();

    setIsCreating(false);

  };


  // ========================================================
  // VIEW 005
  // ========================================================

  return (

    <section className="users-panel">

      {/* ===================================================
          USERS HEADER 006
          =================================================== */}

      <div className="admin-section-header">

        <span>
          USERS
        </span>

        <span>
          {profiles.length} ACCOUNTS
        </span>

      </div>


      {/* ===================================================
          CREATE MODERATOR 007
          =================================================== */}

      <div className="create-moderator">

        <div className="create-moderator-heading">

          <h2>
            Add moderator
          </h2>

          <p>
            Moderators can review and control
            messages shown on stream.
          </p>

        </div>


        <form
          onSubmit={createModerator}
          className="moderator-form"
        >

<label>
  USERNAME

  <input
    type="text"
    value={username}
    onChange={(event) =>
      setUsername(event.target.value)
    }
    placeholder="moderator"
    autoComplete="off"
    autoCapitalize="none"
    spellCheck={false}
    minLength={3}
    maxLength={24}
    required
  />
</label>


          <label>

            TEMPORARY PASSWORD

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />

          </label>


          <button
            type="submit"
disabled={
  isCreating ||
  username.trim().length < 3 ||
  password.length < 8
}
          >

            {isCreating
              ? "CREATING..."
              : "CREATE MODERATOR"}

          </button>

        </form>


        {success && (

          <div className="user-success">
            {success}
          </div>

        )}


        {error && (

          <div className="admin-error user-error">
            {error}
          </div>

        )}

      </div>


      {/* ===================================================
          USER LIST 008
          =================================================== */}

      <div className="user-list">

        {isLoading ? (

          <div className="admin-empty">
            Loading users...
          </div>

        ) : profiles.length === 0 ? (

          <div className="admin-empty">
            No users found.
          </div>

        ) : (

          profiles.map((profile) => (

            <article
              className="user-row"
              key={profile.id}
            >

              <div className="user-info">

<strong>
  {profile.role === "owner"
    ? profile.email
    : profile.username}
</strong>

                <span>
                  CREATED{" "}
                  {new Date(
                    profile.created_at
                  ).toLocaleDateString()}
                </span>

              </div>


              <div
                className={
                  profile.role === "owner"
                    ? "role-badge owner"
                    : "role-badge"
                }
              >

                {profile.role.toUpperCase()}

              </div>

            </article>

          ))

        )}

      </div>

    </section>

  );

}


export default Users;