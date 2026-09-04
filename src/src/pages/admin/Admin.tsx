import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import Users from "./components/Users";
import { supabase } from "../../lib/supabase";

import "./Admin.css";

type Submission = {
  id: string;
  message: string;
  status: "pending" | "displayed" | "dismissed";
  created_at: string;
  displayed_at: string | null;
};

function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  const [loginError, setLoginError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [queueError, setQueueError] = useState("");


type AdminView =
  | "queue"
  | "users";

type UserRole =
  | "owner"
  | "moderator";


const [role, setRole] =
  useState<UserRole | null>(null);

const [adminView, setAdminView] =
  useState<AdminView>("queue");


// ========================================================
// PROFILE — LOAD CURRENT ROLE
// ========================================================

useEffect(() => {

  if (!isAuthenticated) {
    setRole(null);
    return;
  }


  const loadRole = async () => {

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser();


    if (!user) {
      setRole(null);
      return;
    }


    const {
      data,
      error,
    } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();


    if (error) {

      console.error(
        "Role load error:",
        error
      );

      setRole(null);

      return;

    }


    setRole(
      data.role as UserRole
    );

  };


  loadRole();

}, [isAuthenticated]);

  // ========================================================
  // AUTH 001 — CHECK CURRENT SESSION
  // ========================================================

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsAuthenticated(Boolean(session));
      setIsLoading(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // ========================================================
  // DATA 002 — LOAD SUBMISSIONS
  // ========================================================

  const loadSubmissions = async () => {
    setQueueError("");

    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .in("status", ["pending", "displayed"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Queue error:", error);
      setQueueError("Unable to load the message queue.");
      return;
    }

    setSubmissions((data ?? []) as Submission[]);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setSubmissions([]);
      return;
    }

    loadSubmissions();
  }, [isAuthenticated]);

  // ========================================================
  // REALTIME 003 — WATCH SUBMISSIONS
  // ========================================================

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const channel = supabase
      .channel("ivan-says-admin")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
        },
        () => {
          loadSubmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated]);

  // ========================================================
  // AUTH 004 — LOGIN
  // ========================================================

const handleLogin = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();

  const cleanLogin =
    login.trim().toLowerCase();

  if (!cleanLogin || !password) {
    return;
  }

  setIsLoggingIn(true);
  setLoginError("");

  // Owner can use a real email address.
  // Moderators use a username, which maps internally
  // to a synthetic Supabase Auth email.
  const authEmail =
    cleanLogin.includes("@")
      ? cleanLogin
      : `${cleanLogin}@auth.ivansays.com`;

  const { error } =
    await supabase.auth.signInWithPassword({
      email: authEmail,
      password,
    });

  if (error) {
    console.error("Login error:", error);

    setLoginError(
      "Invalid username/email or password."
    );

    setIsLoggingIn(false);

    return;
  }

  setPassword("");
  setIsLoggingIn(false);
};


  // ========================================================
  // AUTH 005 — LOGOUT
  // ========================================================

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // ========================================================
  // MODERATION 006 — DISPLAY
  // ========================================================

  const displaySubmission = async (id: string) => {
    setQueueError("");

    // Clear anything currently displayed.
    const { error: clearError } = await supabase
      .from("submissions")
      .update({
        status: "dismissed",
      })
      .eq("status", "displayed");

    if (clearError) {
      console.error("Clear current message error:", clearError);
      setQueueError("Unable to change the displayed message.");
      return;
    }

    // Display selected message.
    const { error } = await supabase
      .from("submissions")
      .update({
        status: "displayed",
        displayed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      console.error("Display error:", error);
      setQueueError("Unable to display that message.");
      return;
    }

    await loadSubmissions();
  };

  // ========================================================
  // MODERATION 007 — DISMISS
  // ========================================================

  const dismissSubmission = async (id: string) => {
    setQueueError("");

    const { error } = await supabase
      .from("submissions")
      .update({
        status: "dismissed",
      })
      .eq("id", id);

    if (error) {
      console.error("Dismiss error:", error);
      setQueueError("Unable to dismiss that message.");
      return;
    }

    await loadSubmissions();
  };

  // ========================================================
  // MODERATION 008 — CLEAR SCREEN
  // ========================================================

  const clearDisplayed = async () => {
    setQueueError("");

    const { error } = await supabase
      .from("submissions")
      .update({
        status: "dismissed",
      })
      .eq("status", "displayed");

    if (error) {
      console.error("Clear error:", error);
      setQueueError("Unable to clear the displayed message.");
      return;
    }

    await loadSubmissions();
  };

  // ========================================================
  // VIEW 009 — LOADING
  // ========================================================

  if (isLoading) {
    return (
      <main className="admin-page admin-centered">
        <div className="admin-loading">
          IVAN SAYS // LOADING
        </div>
      </main>
    );
  }

  // ========================================================
  // VIEW 010 — LOGIN
  // ========================================================

  if (!isAuthenticated) {
    return (
      <main className="admin-page admin-centered">
        <section className="admin-login">
          <div className="admin-kicker">
            ivansays.COM
          </div>

          <h1>CONTROL</h1>

          <p>
            Authorized opinions only.
          </p>

          <form onSubmit={handleLogin}>
<label>
  USERNAME / EMAIL

  <input
    type="text"
    value={login}
    onChange={(event) =>
      setLogin(event.target.value)
    }
    autoComplete="username"
    autoCapitalize="none"
    spellCheck={false}
    required
  />
</label>

            <label>
              PASSWORD
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
            </label>

            <button
              type="submit"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "AUTHENTICATING..." : "LOGIN"}
            </button>

            {loginError && (
              <div className="admin-error">
                {loginError}
              </div>
            )}
          </form>
        </section>
      </main>
    );
  }

  // ========================================================
  // VIEW 011 — QUEUE
  // ========================================================

  const pending = submissions.filter(
    (submission) => submission.status === "pending"
  );

  const displayed = submissions.find(
    (submission) => submission.status === "displayed"
  );

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <strong>IVAN SAYS</strong>
          <span>/ CONTROL</span>
        </div>

        <button
          type="button"
          className="admin-logout"
          onClick={handleLogout}
        >
          LOGOUT
        </button>
      </header>

      <section className="admin-content">

  {/* =================================================
      NAVIGATION 012
      ================================================= */}

  <nav className="admin-nav">

    <button
      type="button"
      className={
        adminView === "queue"
          ? "active"
          : ""
      }
      onClick={() => setAdminView("queue")}
    >
      QUEUE
    </button>

    {role === "owner" && (
      <button
        type="button"
        className={
          adminView === "users"
            ? "active"
            : ""
        }
        onClick={() => setAdminView("users")}
      >
        USERS
      </button>
    )}

  </nav>


  {/* =================================================
      QUEUE VIEW 013
      ================================================= */}

  {adminView === "queue" && (
    <>

      {/* ===============================================
          ACTIVE MESSAGE 014
          =============================================== */}

      <section className="admin-section">

        <div className="admin-section-header">

          <span>
            ON SCREEN NOW
          </span>

          <span>
            {displayed ? "ACTIVE" : "EMPTY"}
          </span>

        </div>

        {displayed ? (

          <div className="active-message">

            <blockquote>
              “{displayed.message}”
            </blockquote>

            <button
              type="button"
              onClick={clearDisplayed}
            >
              CLEAR
            </button>

          </div>

        ) : (

          <div className="admin-empty">
            Nothing is currently being displayed.
          </div>

        )}

      </section>


      {/* ===============================================
          MESSAGE QUEUE 015
          =============================================== */}

      <section className="admin-section">

        <div className="admin-section-header">

          <span>
            MESSAGE QUEUE
          </span>

          <span>
            {pending.length} PENDING
          </span>

        </div>

        {queueError && (

          <div className="admin-error queue-error">
            {queueError}
          </div>

        )}

        {pending.length === 0 ? (

          <div className="admin-empty">
            No pending messages.
          </div>

        ) : (

          <div className="message-list">

            {pending.map((submission) => (

              <article
                className="message-card"
                key={submission.id}
              >

                <blockquote>
                  “{submission.message}”
                </blockquote>

                <div className="message-meta">

                  {new Date(
                    submission.created_at
                  ).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}

                </div>

                <div className="message-actions">

                  <button
                    type="button"
                    className="display-button"
                    onClick={() =>
                      displaySubmission(
                        submission.id
                      )
                    }
                  >
                    DISPLAY
                  </button>

                  <button
                    type="button"
                    className="dismiss-button"
                    onClick={() =>
                      dismissSubmission(
                        submission.id
                      )
                    }
                  >
                    DISMISS
                  </button>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </>
  )}


  {/* =================================================
      USERS VIEW 016 — OWNER ONLY
      ================================================= */}

  {adminView === "users" && role === "owner" && (
    <Users />
  )}

</section>
    </main>
  );
}

export default Admin;