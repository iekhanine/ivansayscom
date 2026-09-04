import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-inner">
        <div>
          <Link className="footer-wordmark" to="/">ivansays</Link>
          <p>A selective index of independent people doing good work.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/directory">Directory</Link>
          <Link to="/review-panel">Review Panel</Link>
          <Link to="/journal">Journal</Link>
          <Link to="/nominate">Nominate someone</Link>
          <Link to="/apply">Submit your work</Link>
          <a href="mailto:hello@ivansays.com">Contact</a>
        </nav>
      </div>
    </footer>
  )
}
