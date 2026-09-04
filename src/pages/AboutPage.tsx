import { Link } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'

export default function AboutPage() {
  return (
    <main>
      <SiteHeader />
      <div className="shell page-wrap">
        <header className="page-heading compact-heading">
          <span className="kicker">ABOUT</span>
          <h1>A small directory with human judgment.</h1>
          <p>ivansays collects developers, creators, and artists whose work is worth a closer look.</p>
        </header>

        <section className="content-grid">
          <article className="content-card content-card-wide">
            <h2>What it is</h2>
            <p>
              A selective public index. People can submit their own work or be nominated by somebody else.
              Working practitioners review the work before a profile is published. The active review panel is public so visitors can see who participates in that process.
            </p>
          </article>
          <article className="content-card">
            <h2>No pay-to-play</h2>
            <p>Standard inclusion cannot be purchased, boosted, or forced through a subscription.</p>
          </article>
          <article className="content-card">
            <h2>No follower contest</h2>
            <p>Audience size is not a quality score. Interesting work can come from people almost nobody knows yet.</p>
          </article>
          <article className="content-card">
            <h2>No algorithmic ranking</h2>
            <p>Profiles are organized for usefulness, not engagement farming.</p>
          </article>
          <article className="content-card">
            <h2>Features are editorial</h2>
            <p>Homepage features highlight work the review team believes deserves extra attention. They are not advertisements.</p>
          </article>
        </section>

        <section className="page-cta-row">
          <div><strong>Know somebody who belongs here?</strong><span>A good nomination can be one link and a specific reason.</span></div>
          <div><Link className="button button-quiet" to="/review-panel">Review panel</Link><Link className="button button-quiet" to="/nominate">Nominate someone</Link><Link className="button button-dark" to="/directory">Browse directory</Link></div>
        </section>
      </div>
      <SiteFooter />
    </main>
  )
}
