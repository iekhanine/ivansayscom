import {
  useCallback,
  useEffect,
  useRef,
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


  const textRef =
    useRef<HTMLDivElement>(null);


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

      supabase.removeChannel(channel);

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

      window.clearInterval(interval);

    };

  }, [loadDisplayedMessage]);


  // ========================================================
  // TEXT 007 — AUTO FIT MESSAGE
  // Keep the entire message on one line
  // ========================================================

  const fitText =
    useCallback(() => {

      const element =
        textRef.current;


      if (!element) {
        return;
      }


      const parent =
        element.parentElement;


      if (!parent) {
        return;
      }


      // Start intentionally large.
      let fontSize = 200;


      element.style.fontSize =
        `${fontSize}px`;


      // Shrink until the entire message fits.
      while (
        element.scrollWidth >
          parent.clientWidth &&
        fontSize > 20
      ) {

        fontSize -= 2;

        element.style.fontSize =
          `${fontSize}px`;

      }

    }, []);


  // ========================================================
  // TEXT 008 — REFIT WHEN MESSAGE CHANGES
  // ========================================================

  useEffect(() => {

    fitText();


    const handleResize = () => {

      fitText();

    };


    window.addEventListener(
      "resize",
      handleResize
    );


    return () => {

      window.removeEventListener(
        "resize",
        handleResize
      );

    };

  }, [
    displayedMessage,
    fitText,
  ]);


  // ========================================================
  // TEXT 009 — VIEW
  // ========================================================

  return (

    <main className="obs-text-page">

      {displayedMessage && (

        <div
          ref={textRef}
          className="obs-text"
          key={displayedMessage.id}
        >
          {displayedMessage.message}
        </div>

      )}

    </main>

  );

}


export default Text;