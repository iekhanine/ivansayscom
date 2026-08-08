import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { supabase } from "../../lib/supabase";

import "./Message.css";


// ==========================================================
// TYPES 001
// ==========================================================

type DisplayedMessage = {
  id: string;
  message: string;
  displayed_at: string | null;
};


// ==========================================================
// COMPONENT 002
// ==========================================================

function Message() {

  const [
    displayedMessage,
    setDisplayedMessage,
  ] = useState<DisplayedMessage | null>(null);


  // ========================================================
  // LOAD MESSAGE 003
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
  // INITIAL LOAD 004
  // ========================================================

  useEffect(() => {
    loadDisplayedMessage();
  }, [loadDisplayedMessage]);


  // ========================================================
  // REALTIME 005
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
  // FALLBACK REFRESH 006
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
  // VIEW 007
  // ========================================================

  return (
    <main className="obs-message-page">

      {displayedMessage && (

        <article
          className="obs-message-card"
          key={displayedMessage.id}
        >

          <div className="obs-message-header">

            <span className="obs-prompt">
              SOMEONE ON THE INTERNET SAID
            </span>

            <span className="obs-brand">
              IVANSAYS.COM
            </span>

          </div>


          <div className="obs-message-text">
            “{displayedMessage.message}”
          </div>


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

    </main>
  );
}


export default Message;