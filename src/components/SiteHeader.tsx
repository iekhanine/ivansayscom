import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { to: '/directory', label: 'Directory' },
  { to: '/about', label: 'About' },
  { to: '/philosophy', label: 'Selection' },
  { to: '/review-panel', label: 'Review Panel' },
  { to: '/journal', label: 'Journal' },
]

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link className="wordmark" to="/">ivansays</Link>
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
