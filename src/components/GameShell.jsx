import { Link } from 'react-router-dom'

// Consistent frame for every game: a title row with the game's accent,
// a stat strip, a controls row, and the board slot.
export function GameShell({ accent, glyph, title, tagline, children }) {
  return (
    <section className="game" data-accent={accent} aria-label={title}>
      <div className="game-head">
        <Link to="/" className="back-link" aria-label="Back to all games">←</Link>
        <span className="game-glyph" aria-hidden="true">{glyph}</span>
        <div className="game-titles">
          <h1 className="game-title">{title}</h1>
          <p className="game-tagline">{tagline}</p>
        </div>
      </div>
      {children}
    </section>
  )
}

export function Stats({ children }) {
  return <div className="stats" aria-live="polite">{children}</div>
}

export function Stat({ label, value, highlight }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={'stat-value' + (highlight ? ' is-hot' : '')}>{value}</div>
    </div>
  )
}

export function Controls({ children, tight }) {
  return <div className={'controls' + (tight ? ' is-tight' : '')}>{children}</div>
}

export function Btn({ children, variant = 'primary', ...rest }) {
  return (
    <button type="button" className={'btn btn-' + variant} {...rest}>
      {children}
    </button>
  )
}

export function Segmented({ label, options, value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function WinBanner({ show, children, onAgain, againLabel = 'Play again' }) {
  return (
    <div className={'banner' + (show ? ' show' : '')} role="status">
      <span className="banner-icon" aria-hidden="true">✦</span>
      <span className="banner-text">{children}</span>
      <button type="button" className="btn btn-ghost" onClick={onAgain}>
        {againLabel}
      </button>
    </div>
  )
}
