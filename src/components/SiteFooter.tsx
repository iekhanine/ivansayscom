import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-band" aria-hidden="true">
        <span /> <span /> <span /> <span />
      </div>
      <div className="shell footer-inner">
        <div className="footer-brand-block">
          <Link className="footer-wordmark" to="/">ivansays</Link>
          <p>A human-curated index of developers, creators, and artists doing work worth finding.</p>
          <span className="footer-issue">CURATED ON PURPOSE · EST. 2026</span>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/directory">Directory</Link>
          <Link to="/journal">Journal</Link>
          <Link to="/review-panel">Review Panel</Link>
          <Link to="/philosophy">Selection</Link>
          <Link to="/nominate">Nominate someone</Link>
          <Link to="/apply">Submit your work</Link>
          <a href="mailto:hello@ivansays.com">Contact</a>
        </nav>
      </div>
    </footer>
  )
}
