import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  supabase,
} from "../../lib/supabase";

import "./Text.css";


/* ==========================================================
   IVAN SAYS
   OBS TEXT OVERLAY
   ========================================================== */


/* ==========================================================
   TEXT 001 - TYPES
   ========================================================== */

type DisplayedMessage = {
  id: string;
  message: string;
  displayed_at: string | null;
};


/* ==========================================================
   TEXT 002 - COMPONENT
   ========================================================== */

export default function Text() {

  const [
    displayedMessage,
    setDisplayedMessage,
  ] = useState<DisplayedMessage | null>(null);


  /* ========================================================
     TEXT 003 - LOAD CURRENT DISPLAYED MESSAGE
     ======================================================== */

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
          "OBS text error:",
          error
        );

        return;
      }


      const message =
        Array.isArray(data)
          ? data[0]
          : data;


      if (!message) {

        setDisplayedMessage(null);

        return;
      }


      setDisplayedMessage({
        id: message.id,
        message: message.message,
        displayed_at:
          message.displayed_at ?? null,
      });

    }, []);


  /* ========================================================
     TEXT 004 - INITIAL LOAD
     ======================================================== */

  useEffect(() => {

    loadDisplayedMessage();

  }, [
    loadDisplayedMessage,
  ]);


  /* ========================================================
     TEXT 005 - REALTIME REFRESH
     ======================================================== */

  useEffect(() => {

    const channel =
      supabase
        .channel(
          "obs-text-overlay"
        )
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

      supabase
        .removeChannel(
          channel
        );

    };

  }, [
    loadDisplayedMessage,
  ]);


  /* ========================================================
     TEXT 006 - RENDER
     ======================================================== */

  return (

    <main className="obs-text-page">

      {
        displayedMessage && (

          <div className="obs-quote">

            <span
              className="
                obs-quote-mark
                obs-quote-mark-open
              "
              aria-hidden="true"
            >
              “
            </span>


            <div className="obs-text">
              {displayedMessage.message}
            </div>


            <span
              className="
                obs-quote-mark
                obs-quote-mark-close
              "
              aria-hidden="true"
            >
              ”
            </span>

          </div>

        )
      }

    </main>

  );

}