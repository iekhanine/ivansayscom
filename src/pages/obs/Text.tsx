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
  // TEXT 007 — FIT TEXT TO WINDOW
  //
  // Finds the largest font size that fits inside the
  // actual visible OBS browser window.
  // ========================================================

  const fitText =
    useCallback(() => {

      const container =
        containerRef.current;

      const text =
        textRef.current;


      if (
        !container ||
        !text
      ) {
        return;
      }


      // ----------------------------------------------------
      // AVAILABLE SPACE
      // ----------------------------------------------------

      const horizontalSafety = 24;
      const verticalSafety = 10;


      const availableWidth =
        container.clientWidth -
        horizontalSafety;

      const availableHeight =
        container.clientHeight -
        verticalSafety;


      if (
        availableWidth <= 0 ||
        availableHeight <= 0
      ) {
        return;
      }


      // ----------------------------------------------------
      // PREPARE TEXT BOX
      // ----------------------------------------------------

      text.style.width =
        `${availableWidth}px`;

      text.style.maxWidth =
        `${availableWidth}px`;


      // ----------------------------------------------------
      // BINARY SEARCH FONT SIZE
      // ----------------------------------------------------

      let low = 10;
      let high = 160;
      let best = 10;


      while (
        low <= high
      ) {

        const size =
          Math.floor(
            (low + high) / 2
          );


        text.style.fontSize =
          `${size}px`;


        const actualWidth =
          text.scrollWidth;

        const actualHeight =
          text.scrollHeight;


        const fits =
          actualWidth <=
            availableWidth &&
          actualHeight <=
            availableHeight;


        if (fits) {

          best = size;

          low =
            size + 1;

        } else {

          high =
            size - 1;

        }

      }


      // ----------------------------------------------------
      // FINAL SIZE
      // Give OBS a tiny extra safety reduction.
      // ----------------------------------------------------

      const finalSize =
        Math.max(
          10,
          best - 2
        );


      text.style.fontSize =
        `${finalSize}px`;

    }, []);


  // ========================================================
  // TEXT 008 — FIT WHEN MESSAGE CHANGES
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
  // TEXT 009 — FIT WHEN WINDOW CHANGES
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
  // TEXT 010 — VIEW
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