import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/directory', label: 'the creators' },
  { to: '/journal', label: 'the journal' },
  { to: '/review-panel', label: 'the panelists' },
  { to: '/philosophy', label: 'the process' },
  { to: '/about', label: 'the story' },
]

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="publication-strip">
        <div className="shell publication-strip-inner">
          <span>ivansays</span>
          <span>focus on independent artists</span>
          <span>est. 2026</span>
        </div>
      </div>
      <div className="shell header-inner">
        <Link className="wordmark" to="/">
          <span>ivansays</span>
          <small>focus on indie</small>
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
