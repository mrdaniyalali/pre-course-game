import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { isConvexConfigured } from '../multiplayer/ConvexClient.jsx'
import { fmtTime } from '../lib/helpers.js'

const BOARDS = [
  { game: 'tictactoe', label: 'Tic-Tac-Toe', metric: 'wins' },
  { game: 'connect4', label: 'Connect 4', metric: 'wins' },
  { game: 'chess', label: 'Chess', metric: 'wins' },
  { game: 'checkers', label: 'Checkers', metric: 'wins' },
  { game: 'battleship', label: 'Battleship', metric: 'wins' },
  { game: 'hangman', label: 'Hangman', metric: 'wins' },
]

function Row({ rank, name, value, metric }) {
  return (
    <li className="lb-row">
      <span className={'lb-rank r' + rank}>{rank}</span>
      <span className="lb-name">{name}</span>
      <span className="lb-value">
        {metric === 'time' ? fmtTime(value) : value}{metric === 'wins' ? ' wins' : ''}
      </span>
    </li>
  )
}

function Inner() {
  const [board, setBoard] = useState(BOARDS[0])
  const rows = useQuery(api.leaderboard.top, { game: board.game, metric: board.metric, limit: 10 })
  const recent = useQuery(api.leaderboard.recent, { limit: 10 })

  return (
    <>
      <div className="seg-tabs">
        {BOARDS.map((b) => (
          <button
            key={b.game}
            className={'seg-tab' + (board.game === b.game ? ' active' : '')}
            onClick={() => setBoard(b)}
            type="button"
          >
            {b.label}
          </button>
        ))}
      </div>

      <ol className="lb-list">
        {rows === undefined && <li className="lb-empty">Loading…</li>}
        {rows && rows.length === 0 && <li className="lb-empty">No games yet — be the first to win one!</li>}
        {rows && rows.map((r, i) => <Row key={i} rank={i + 1} {...r} />)}
      </ol>

      <h3 className="page-subhead">Recent wins</h3>
      <ul className="feed">
        {recent === undefined && <li className="lb-empty">Loading…</li>}
        {recent && recent.length === 0 && <li className="lb-empty">Nothing yet.</li>}
        {recent && recent.map((r, i) => (
          <li key={i} className="feed-row">
            <b>{r.name}</b> won at <span className="feed-game">{r.game}</span>
          </li>
        ))}
      </ul>
    </>
  )
}

export default function Leaderboard() {
  return (
    <section className="page" data-accent="teal">
      <div className="page-head">
        <Link to="/" className="back-link">←</Link>
        <div>
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-tagline">Who’s on top across the arcade.</p>
        </div>
      </div>
      {isConvexConfigured ? <Inner /> : (
        <div className="setup-notice">
          <h3>Leaderboard needs Convex</h3>
          <p>Turn on the free backend to share scores with friends:</p>
          <ol>
            <li>Run <code>npx convex dev</code> and sign in.</li>
            <li>Restart <code>npm run dev</code>.</li>
          </ol>
        </div>
      )}
    </section>
  )
}
