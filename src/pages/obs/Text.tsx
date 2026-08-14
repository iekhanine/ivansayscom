import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import "./Text.css";


// ==========================================================
// TEXT 001 — TYPES
// ==========================================================

type DisplayedMessage = {
  id: string;
  message: string;
  displayed_at: string | null;
};


// ==========================================================
// TEXT 002 — COMPONENT
// ==========================================================

function Text() {

  const [
    displayedMessage,
    setDisplayedMessage,
  ] = useState<DisplayedMessage | null>(null);


  // ========================================================
  // TEXT 003 — LOAD CURRENT DISPLAYED MESSAGE
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
          "OBS text error:",
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
  // TEXT 004 — INITIAL LOAD
  // ========================================================

  useEffect(() => {

    loadDisplayedMessage();

  }, [loadDisplayedMessage]);


  // ========================================================
  // TEXT 005 — SUPABASE REALTIME
  // ========================================================

  useEffect(() => {

    const channel = supabase
      .channel("ivansays-obs-text")
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

      supabase.removeChannel(
        channel
      );

    };

  }, [loadDisplayedMessage]);


  // ========================================================
  // TEXT 006 — FALLBACK REFRESH
  // ========================================================

  useEffect(() => {

    const interval =
      window.setInterval(
        loadDisplayedMessage,
        3000
      );


    return () => {

      window.clearInterval(
        interval
      );

    };

  }, [loadDisplayedMessage]);


  // ========================================================
  // TEXT 007 — FONT SIZE
  //
  // More text = smaller font.
  // Nothing else controls the size.
  // ========================================================

  const getFontSize = (
    message: string
  ) => {

    const length =
      message.trim().length;


    if (length <= 20) {
      return 110;
    }

    if (length <= 40) {
      return 90;
    }

    if (length <= 60) {
      return 76;
    }

    if (length <= 80) {
      return 66;
    }

    if (length <= 100) {
      return 58;
    }

    if (length <= 130) {
      return 50;
    }

    if (length <= 160) {
      return 44;
    }

    if (length <= 200) {
      return 38;
    }

    if (length <= 250) {
      return 34;
    }

    return 30;

  };


  // ========================================================
  // TEXT 008 — VIEW
  // ========================================================

  return (

    <main className="obs-text-page">

      {displayedMessage && (

        <div
          className="obs-text"
          key={displayedMessage.id}
          style={{
            fontSize:
              `${getFontSize(
                displayedMessage.message
              )}px`,
          }}
        >
          {displayedMessage.message}
        </div>

      )}

    </main>

  );

}


export default Text;