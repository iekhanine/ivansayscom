import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/directory', label: 'Directory' },
  { to: '/journal', label: 'Journal' },
  { to: '/review-panel', label: 'Review Panel' },
  { to: '/philosophy', label: 'Selection' },
  { to: '/about', label: 'About' },
]

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="publication-strip">
        <div className="shell publication-strip-inner">
          <span>IVANSAYS / CURATED DIRECTORY</span>
          <span>INDEPENDENT PEOPLE · REAL WORK · HUMAN REVIEW</span>
          <span>EST. 2026</span>
        </div>
      </div>
      <div className="shell header-inner">
        <Link className="wordmark" to="/">
          <span>ivansays</span>
          <small>people worth finding</small>
        </Link>
        <nav className="primary-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to}>{item.label}</NavLink>
          ))}
        </nav>
        <div className="header-actions">
          <Link className="button button-quiet" to="/nominate">Nominate</Link>
          <Link className="button button-dark" to="/apply">Submit work</Link>
        </div>
      </div>
    </header>
  )
}
