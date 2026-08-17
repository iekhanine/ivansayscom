import "./Live.css";

type Props = {
  source?: string;
};

const DEFAULT_SOURCE =
  "USER SUBMISSION";

export default function Live({
  source = DEFAULT_SOURCE,
}: Props) {

  return (
    <main className="live-underlay">
      <div className="live-background-grid" />

      <header className="live-header">
        <div>
          <div className="live-brand-name">IVAN SAYS</div>
          <div className="live-brand-subtitle">INTERNET BROADCAST</div>
        </div>

        <div className="live-status">
          <span className="live-status-dot" />
          LIVE
        </div>
      </header>

      <section className="webcam-section">
        <div className="webcam-frame">
          <div className="webcam-opening">
            <span className="webcam-guide">WEBCAM</span>
          </div>
        </div>
      </section>

      {/* This is the ONLY callout.
          It sits ABOVE the quote panel, NOT on the webcam.
          The SVG arrow points UP toward the webcam. */}
      <div className="ivan-callout" aria-hidden="true">
        <span className="ivan-callout-text">IVAN</span>

        <svg
          className="ivan-callout-svg"
          viewBox="0 0 320 190"
          role="presentation"
        >
          <path
            className="ivan-arrow-path"
            d="M 35 165 C 95 145, 155 95, 245 30"
          />
          <path
            className="ivan-arrow-path"
            d="M 208 35 L 250 27 L 240 70"
          />
        </svg>
      </div>

      <section className="submission-section">
        <div className="submission-header">
          <span className="submission-label">{source}</span>
          <span className="submission-number">INCOMING</span>
        </div>

        <div className="submission-rule" />
        <div className="submission-footer">
          <span>SUBMITTED VIA</span>
          <strong>IVANSAYS.COM</strong>
        </div>
      </section>
    </main>
  );
}