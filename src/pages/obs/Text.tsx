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

  const containerRef =
    useRef<HTMLElement>(null);

  const textRef =
    useRef<HTMLDivElement>(null);


  // ========================================================
  // TEXT 003 — LOAD CURRENT MESSAGE
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
  // TEXT 007 — GET STARTING FONT SIZE
  //
  // More characters = smaller starting font.
  // ========================================================

  const getStartingFontSize =
    useCallback((
      message: string
    ) => {

      const length =
        message.trim().length;


      if (length <= 20) {
        return 100;
      }

      if (length <= 40) {
        return 80;
      }

      if (length <= 70) {
        return 64;
      }

      if (length <= 100) {
        return 52;
      }

      if (length <= 140) {
        return 44;
      }

      if (length <= 180) {
        return 38;
      }

      if (length <= 240) {
        return 32;
      }

      return 28;

    }, []);


  // ========================================================
  // TEXT 008 — FIT TEXT TO BOX
  // ========================================================

  const fitText =
    useCallback(() => {

      const container =
        containerRef.current;

      const text =
        textRef.current;

      if (
        !container ||
        !text ||
        !displayedMessage
      ) {
        return;
      }


      // ----------------------------------------------------
      // AVAILABLE SPACE
      // ----------------------------------------------------

      const availableWidth =
        container.clientWidth - 8;

      const availableHeight =
        container.clientHeight - 12;


      // ----------------------------------------------------
      // START SIZE BASED ON MESSAGE LENGTH
      // ----------------------------------------------------

      let fontSize =
        getStartingFontSize(
          displayedMessage.message
        );


      const minimumFontSize =
        12;


      text.style.width =
        `${availableWidth}px`;

      text.style.maxWidth =
        `${availableWidth}px`;

      text.style.fontSize =
        `${fontSize}px`;


      // ----------------------------------------------------
      // SHRINK UNTIL EVERYTHING FITS
      // ----------------------------------------------------

      while (
        fontSize >
          minimumFontSize &&
        (
          text.scrollWidth >
            availableWidth ||
          text.scrollHeight >
            availableHeight
        )
      ) {

        fontSize -= 1;

        text.style.fontSize =
          `${fontSize}px`;

      }


      // ----------------------------------------------------
      // SMALL SAFETY BUFFER
      // ----------------------------------------------------

      fontSize =
        Math.max(
          minimumFontSize,
          fontSize - 1
        );


      text.style.fontSize =
        `${fontSize}px`;

    }, [
      displayedMessage,
      getStartingFontSize,
    ]);


  // ========================================================
  // TEXT 009 — FIT WHEN MESSAGE CHANGES
  // ========================================================

  useEffect(() => {

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
  // TEXT 010 — FIT WHEN WINDOW CHANGES
  // ========================================================

  useEffect(() => {

    const container =
      containerRef.current;

    if (!container) {
      return;
    }

    const observer =
      new ResizeObserver(
        () => {

          fitText();

        }
      );

    observer.observe(
      container
    );

    return () => {

      observer.disconnect();

    };

  }, [fitText]);


  // ========================================================
  // TEXT 011 — VIEW
  // ========================================================

  return (

    <main
      ref={containerRef}
      className="obs-text-page"
    >

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