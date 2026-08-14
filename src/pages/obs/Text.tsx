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
  //
  // Start with very large text.
  // Allow normal wrapping.
  // Reduce font size until the entire message fits
  // inside BOTH the width and height of the OBS browser.
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


      // Start huge.
      let fontSize = 220;


      // Minimum readable size.
      const minimumFontSize = 24;


      element.style.fontSize =
        `${fontSize}px`;


      // Shrink until everything fits.
      while (
        (
          element.scrollWidth >
            parent.clientWidth ||
          element.scrollHeight >
            parent.clientHeight
        ) &&
        fontSize >
          minimumFontSize
      ) {

        fontSize -= 2;


        element.style.fontSize =
          `${fontSize}px`;

      }

    }, []);


  // ========================================================
  // TEXT 008 — FIT WHEN MESSAGE CHANGES
  // ========================================================

  useEffect(() => {

    // Wait until browser has rendered the new text.
    const frame =
      window.requestAnimationFrame(
        () => {

          fitText();

        }
      );


    return () => {

      window.cancelAnimationFrame(
        frame
      );

    };

  }, [
    displayedMessage,
    fitText,
  ]);


  // ========================================================
  // TEXT 009 — FIT WHEN BROWSER SOURCE RESIZES
  // ========================================================

  useEffect(() => {

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

  }, [fitText]);


  // ========================================================
  // TEXT 010 — VIEW
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