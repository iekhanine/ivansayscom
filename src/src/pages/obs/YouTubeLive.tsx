import {
  useEffect,
} from "react";

import "./YouTubeLive.css";


/* ==========================================================
   YOUTUBE LIVE
   1920 x 1080 TRANSPARENT OBS UNDERLAY
   ========================================================== */


type Props = {

  source?: string;

};


const DEFAULT_SOURCE =
  "USER SUBMISSION";


export default function YouTubeLive({

  source = DEFAULT_SOURCE,

}: Props) {


  /* ========================================================
     TRANSPARENCY 001
     Isolate OBS transparency from the normal website styles.
     ======================================================== */

  useEffect(() => {

    document.documentElement.classList.add(
      "youtube-obs-page",
    );

    document.body.classList.add(
      "youtube-obs-page",
    );


    return () => {

      document.documentElement.classList.remove(
        "youtube-obs-page",
      );

      document.body.classList.remove(
        "youtube-obs-page",
      );

    };

  }, []);


  return (

    <main className="youtube-underlay">


      {/* =====================================================
          HEADER 002
          ===================================================== */}

      <header className="youtube-header">

        <div className="youtube-brand">

          <div className="youtube-brand-name">
            IVAN SAYS
          </div>

          <div className="youtube-brand-subtitle">
            INTERNET BROADCAST
          </div>

        </div>


        <div className="youtube-live-status">

          <span className="youtube-live-dot" />

          <span>
            LIVE
          </span>

        </div>

      </header>


      {/* =====================================================
          CAMERA FRAME 003
          The center is genuinely transparent.
          Put the camera source BEHIND this browser source.
          ===================================================== */}

      <section className="youtube-camera-frame">

        <div className="youtube-camera-corner youtube-camera-corner-tl" />
        <div className="youtube-camera-corner youtube-camera-corner-tr" />
        <div className="youtube-camera-corner youtube-camera-corner-bl" />
        <div className="youtube-camera-corner youtube-camera-corner-br" />

      </section>


      {/* =====================================================
          IVAN CALLOUT 004
          ===================================================== */}

      <div
        className="youtube-ivan-callout"
        aria-hidden="true"
      >

        <span className="youtube-ivan-text">
          IVAN
        </span>


        <svg
          className="youtube-ivan-arrow"
          viewBox="0 0 320 190"
          role="presentation"
        >

          <path
            className="youtube-ivan-arrow-path"
            d="M 35 165 C 95 145, 155 95, 245 30"
          />

          <path
            className="youtube-ivan-arrow-path"
            d="M 208 35 L 250 27 L 240 70"
          />

        </svg>

      </div>


      {/* =====================================================
          MESSAGE PANEL 005
          Transparent body. Only chrome is drawn here.
          Put the existing Message browser source over/inside it.
          ===================================================== */}

      <section className="youtube-message-panel">

        <div className="youtube-message-header">

          <span className="youtube-message-source">
            {source}
          </span>

          <span className="youtube-message-state">
            INCOMING
          </span>

        </div>


        <div className="youtube-message-rule" />


        <div className="youtube-message-spacer" />


        <footer className="youtube-message-footer">

          <span>
            SUBMITTED VIA
          </span>

          <strong>
            ivansays.COM
          </strong>

        </footer>

      </section>


      {/* =====================================================
          BOTTOM BRAND 006
          ===================================================== */}

      <div className="youtube-bottom-brand">

        <span>
          ivansays.COM
        </span>

        <span className="youtube-bottom-separator">
          /
        </span>

        <span>
          TYPE IT. SEND IT. I'LL SAY IT LIVE.
        </span>

      </div>


    </main>

  );

}
