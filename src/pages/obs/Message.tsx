import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import "./Message.css";


// ==========================================================
// MESSAGE 001 — TYPES
// ==========================================================

type DisplayedMessage = {
  id: string;
  message: string;
  displayed_at: string | null;
};


// ==========================================================
// MESSAGE 002 — COMPONENT
// ==========================================================

function Message() {

  const [
    displayedMessage,
    setDisplayedMessage,
  ] = useState<DisplayedMessage | null>(null);


  // ========================================================
  // MESSAGE 003 — LOAD CURRENT DISPLAYED MESSAGE
  // ========================================================

  const loadDisplayedMessage =
    useCallback(async () => {

      const {
        data,
        error,
      } = await supabase.rpc(
        "get_displayed_message"
      );


      if (error) {
        console.error(
          "OBS message error:",
          error
        );

        return;
      }


      if (
        !data ||
        data.length === 0
      ) {
        setDisplayedMessage(null);
        return;
      }


      setDisplayedMessage(
        data[0] as DisplayedMessage
      );

    }, []);


  // ========================================================
  // MESSAGE 004 — INITIAL LOAD
  // ========================================================

  useEffect(() => {

    loadDisplayedMessage();

  }, [loadDisplayedMessage]);


  // ========================================================
  // MESSAGE 005 — SUPABASE REALTIME
  // ========================================================

  useEffect(() => {

    const channel = supabase
      .channel("ivansays-obs-message")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "submissions",
        },
        () => {
          loadDisplayedMessage();
        }
      )
      .subscribe();


    return () => {
      supabase.removeChannel(channel);
    };

  }, [loadDisplayedMessage]);


  // ========================================================
  // MESSAGE 006 — FALLBACK REFRESH
  // ========================================================

  useEffect(() => {

    const interval =
      window.setInterval(
        loadDisplayedMessage,
        3000
      );


    return () => {
      window.clearInterval(interval);
    };

  }, [loadDisplayedMessage]);


  // ========================================================
  // MESSAGE 007 — DYNAMIC MESSAGE SIZE
  // ========================================================

  const getMessageSize = (
    message: string
  ) => {

    const length =
      message.length;


    if (length <= 40) {
      return "short";
    }


    if (length <= 80) {
      return "medium";
    }


    return "long";

  };


  // ========================================================
  // MESSAGE 008 — VIEW
  // ========================================================

  return (

    <main className="obs-message-page">


      {/* ====================================================
          INSTRUCTIONS 009 — ALWAYS VISIBLE
          ==================================================== */}

      <section className="obs-overlay-stack">


        <article className="obs-instructions-card">

          <div className="obs-instructions-content">

            <div className="obs-instructions-url">
              IVANSAYS.COM
            </div>


            <div className="obs-instructions-copy">
              Type it. Send it. I'll say it live.
            </div>

          </div>

        </article>


        {/* ==================================================
            DISPLAY MESSAGE 010 — DYNAMIC
            ================================================== */}

        {displayedMessage && (

          <article
            className="obs-message-card"
            key={displayedMessage.id}
          >


            {/* ==============================================
                MESSAGE HEADER 011
                ============================================== */}

            <div className="obs-message-header">

              <span className="obs-prompt">
                SOMEONE ON THE INTERNET SAID
              </span>

              <span className="obs-brand">
                IVANSAYS.COM
              </span>

            </div>


            {/* ==============================================
                MESSAGE BODY 012
                ============================================== */}

            <div
              className={
                `obs-message-text ${
                  getMessageSize(
                    displayedMessage.message
                  )
                }`
              }
            >
              “{displayedMessage.message}”
            </div>


            {/* ==============================================
                MESSAGE FOOTER 013
                ============================================== */}

            <div className="obs-message-footer">

              <span>
                YOU TYPE IT.
              </span>

              <strong>
                IVAN SAYS IT.
              </strong>

            </div>

          </article>

        )}

      </section>

    </main>

  );

}


export default Message;