import { Outlet, NavLink, Link, useLocation } from 'react-router-dom'
import { useSettings } from '../context/Settings.jsx'
import AuthButton from './AuthButton.jsx'

const DOCK = [
  { to: '/', label: 'Home', glyph: '⌂', accent: 'violet', end: true },
  { to: '/leaderboard', label: 'Ranks', glyph: '★', accent: 'amber' },
  { to: '/friends', label: 'Friends', glyph: '◐', accent: 'teal' },
  { to: '/groups', label: 'Groups', glyph: '◈', accent: 'rose' },
]

export default function Layout() {
  const { theme, sound, toggleTheme, toggleSound } = useSettings()
  const { pathname } = useLocation()
  const onHome = pathname === '/'

  return (
    <div className="app-shell">
      <header className="masthead">
        <Link to="/" className="wordmark" aria-label="Pairs home">
          <span className="wordmark-text">Pairs</span>
          <span className="wordmark-dot" aria-hidden="true" />
        </Link>

        <div className="masthead-tools">
          <AuthButton />
          <button
            className="icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            title="Theme (T)"
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <button
            className={'icon-btn' + (sound ? '' : ' is-muted')}
            type="button"
            onClick={toggleSound}
            aria-label="Toggle sound"
            title="Sound (S)"
          >
            {sound ? '♪' : '⊘'}
          </button>
        </div>
      </header>

      <main className={'app-main' + (onHome ? ' is-home' : '')}>
        <Outlet />
      </main>

      <nav className="dock" aria-label="Primary">
        {DOCK.map((d) => (
          <NavLink
            key={d.to}
            to={d.to}
            end={d.end}
            className="dock-link"
            data-accent={d.accent}
            title={d.label}
          >
            <span className="dock-glyph" aria-hidden="true">{d.glyph}</span>
            <span className="dock-label">{d.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
