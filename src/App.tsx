import { useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

const MAX_LENGTH = 280;

function App() {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const remaining = MAX_LENGTH - message.length;

  // ========================================================
  // SUBMISSION 001 — SEND MESSAGE TO SUPABASE
  // ========================================================

  const handleSubmit = async () => {
    const cleanMessage = message.trim();

    if (!cleanMessage || isSending) {
      return;
    }

    setIsSending(true);
    setError("");
    setSuccess(false);

    const { error: submitError } = await supabase
      .from("submissions")
      .insert({
        message: cleanMessage,
      });

    if (submitError) {
      console.error("Submission error:", submitError);

      setError("Something broke. Try sending it again.");
      setIsSending(false);

      return;
    }

    setMessage("");
    setSuccess(true);
    setIsSending(false);
  };

  return (
    <main className="site">

      {/* =====================================================
          HEADER 002 — BRAND
          ===================================================== */}

      <header className="header">
        <a href="/" className="brand">
          IVAN SAYS
        </a>

        <div className="live-state">
          <span className="live-dot" />
          BUILDING
        </div>
      </header>

      {/* =====================================================
          MAIN 003 — SUBMISSION EXPERIENCE
          ===================================================== */}

      <section className="main">
        <div className="intro">
          <div className="eyebrow">
            IVANSAYS.COM
          </div>

          <h1>
            You type it.
            <span>Ivan says it.</span>
          </h1>

          <p>
            Send me something to say...
          </p>

          <p>
            Good judgment is encouraged, but optional.
          </p>
        </div>

        {/* ===================================================
            FORM 004 — MESSAGE
            =================================================== */}

        <div className="composer">
          <div className="composer-label">
            <span>
              TELL IVAN WHAT TO SAY
            </span>

            <span
              className={
                remaining < 30
                  ? "counter warning"
                  : "counter"
              }
            >
              {remaining}
            </span>
          </div>

          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);

              if (success) {
                setSuccess(false);
              }

              if (error) {
                setError("");
              }
            }}
            maxLength={MAX_LENGTH}
            placeholder="Type something..."
            aria-label="Message for Ivan"
            disabled={isSending}
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              message.trim().length === 0 ||
              isSending
            }
          >
            {isSending
              ? "SENDING..."
              : "SEND TO IVAN"}
          </button>
        </div>

        {/* ===================================================
            STATUS 005 — FEEDBACK
            =================================================== */}

        {success && (
          <p className="submission-success">
            SENT. Ivan has been warned.
          </p>
        )}

        {error && (
          <p className="submission-error">
            {error}
          </p>
        )}

        {/* ===================================================
            NOTICE 006 — MODERATION
            =================================================== */}

        <p className="moderation">
          Messages are reviewed before appearing on the live stream.
        </p>
      </section>

      {/* =====================================================
          FOOTER 007
          ===================================================== */}

      <footer className="footer">
        <span>IVAN SAYS</span>
        <span>THE INTERNET WAS A MISTAKE.</span>
      </footer>

    </main>
  );
}

export default App;