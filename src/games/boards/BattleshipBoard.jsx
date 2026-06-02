import { clsx } from '../../lib/helpers.js'
import { Btn } from '../../components/GameShell.jsx'

// Receives the redacted view: { phase, turn, size, ready, myFleet, incoming,
// outgoing, oppSunk, oppShips }. Online-only, so state is always this shape.
export default function BattleshipBoard({ state, myTurn, mySeat, onMove }) {
  const { phase, size, ready, myFleet, incoming, outgoing, oppSunk, oppShips } = state

  const myShipCells = new Set(myFleet.flatMap((s) => s.cells.map(([r, c]) => `${r},${c}`)))
  const incomingMap = new Map(incoming.map((s) => [`${s.r},${s.c}`, s.hit]))
  const outgoingMap = new Map(outgoing.map((s) => [`${s.r},${s.c}`, s.hit]))

  const grid = (render) =>
    Array.from({ length: size }).map((_, r) => (
      <div className="bs-row" key={r}>
        {Array.from({ length: size }).map((_, c) => render(r, c))}
      </div>
    ))

  if (phase === 'placing') {
    const iAmReady = ready[mySeat]
    return (
      <div className="bs">
        <h3 className="bs-head">Your fleet</h3>
        <div className="bs-grid">
          {grid((r, c) => (
            <span key={c} className={clsx('bs-cell', myShipCells.has(`${r},${c}`) && 'ship')} />
          ))}
        </div>
        {iAmReady ? (
          <p className="bs-note">Locked in — waiting for your opponent…</p>
        ) : (
          <div className="online-actions">
            <Btn variant="secondary" onClick={() => onMove({ type: 'shuffle' })}>⟳ Shuffle</Btn>
            <Btn onClick={() => onMove({ type: 'ready' })}>Ready →</Btn>
          </div>
        )}
      </div>
    )
  }

  // firing
  return (
    <div className="bs">
      <h3 className="bs-head">Enemy waters {oppSunk > 0 && <small>· {oppSunk}/{oppShips} sunk</small>}</h3>
      <div className={clsx('bs-grid', 'enemy', myTurn && 'live')}>
        {grid((r, c) => {
          const key = `${r},${c}`
          const fired = outgoingMap.has(key)
          const hit = outgoingMap.get(key)
          return (
            <button
              key={c}
              type="button"
              className={clsx('bs-cell', fired && (hit ? 'hit' : 'miss'))}
              disabled={!myTurn || fired}
              onClick={() => onMove({ type: 'fire', r, c })}
              aria-label={`Fire at ${r + 1},${c + 1}`}
            />
          )
        })}
      </div>

      <h3 className="bs-head">Your waters</h3>
      <div className="bs-grid">
        {grid((r, c) => {
          const key = `${r},${c}`
          const ship = myShipCells.has(key)
          const incomingHit = incomingMap.get(key)
          return (
            <span
              key={c}
              className={clsx('bs-cell', ship && 'ship', incomingMap.has(key) && (incomingHit ? 'hit' : 'miss'))}
            />
          )
        })}
      </div>
    </div>
  )
}
