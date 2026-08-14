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
// TEXT 007 - FIT TEXT TO ACTUAL TEXT BOX
// ========================================================

const fitText =
  useCallback(() => {

    const text =
      textRef.current;

    if (!text) {
      return;
    }


    // Start large
    let fontSize = 160;

    const minimumFontSize = 14;


    text.style.fontSize =
      `${fontSize}px`;


    /*
     * IMPORTANT:
     * Check the text against ITS OWN dimensions.
     *
     * scrollWidth  = how much width the content needs
     * clientWidth  = how much width it actually has
     *
     * scrollHeight = how much height the content needs
     * clientHeight is NOT useful here because the element
     * grows with the text.
     *
     * So vertical fitting is checked against the parent.
     */

    const parent =
      text.parentElement;

    if (!parent) {
      return;
    }


    while (
      fontSize > minimumFontSize
    ) {

      const tooWide =
        text.scrollWidth >
        text.clientWidth;

      const tooTall =
        text.scrollHeight >
        parent.clientHeight;


      if (
        !tooWide &&
        !tooTall
      ) {
        break;
      }


      fontSize -= 2;

      text.style.fontSize =
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