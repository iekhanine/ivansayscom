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
  // Text only. Visual container is provided by OBS overlay.
  // ========================================================

  return (

    <main className="obs-message-page">

      {displayedMessage && (

        <div
          className={
            `obs-message-text ${
              getMessageSize(
                displayedMessage.message
              )
            }`
          }
          key={displayedMessage.id}
        >
          {displayedMessage.message}
        </div>

      )}

    </main>

  );

}


export default Message;