import { useEffect, useRef, useState } from 'react'
import { GameShell, Btn } from '../components/GameShell.jsx'
import Confetti from '../components/Confetti.jsx'
import OnlineGame from './OnlineGame.jsx'
import { getEngine } from '../../convex/engines/index.js'
import { isConvexConfigured } from '../multiplayer/ConvexClient.jsx'
import { useToast } from '../context/Toast.jsx'
import { sfx } from '../lib/sound.js'

// Same-screen "pass and play" using the shared engine.
function LocalGame({ engineId, Board, seatNames }) {
  const engine = getEngine(engineId)
  const [state, setState] = useState(() => engine.init())
  const [burst, setBurst] = useState(0)
  const result = engine.result(state)
  const wasDone = useRef(false)
  const toast = useToast()

  useEffect(() => {
    if (result.done && !wasDone.current) {
      wasDone.current = true
      if (result.draw) sfx.miss(); else { setBurst((b) => b + 1); sfx.win() }
    }
    if (!result.done) wasDone.current = false
  }, [result.done, result.draw])

  const onMove = (move) => {
    try {
      setState((s) => engine.apply(s, move, s.turn))
      sfx.pick()
    } catch (e) { toast(e.message || 'Invalid move') }
  }

  const reset = () => { setState(engine.init()); wasDone.current = false }

  return (
    <>
      <Confetti burst={burst} />
      <div className="turn-banner" data-on={!result.done}>
        {result.done
          ? (result.draw ? 'Draw — nobody wins' : `${seatNames[result.winner]} wins!`)
          : `${seatNames[state.turn]}’s turn`}
      </div>
      <Board state={state} result={result} disabled={result.done} myTurn={!result.done} mySeat={state.turn} onMove={onMove} />
      <div className="online-actions">
        <Btn onClick={reset}>New game</Btn>
      </div>
    </>
  )
}

function ModeChooser({ modes, onPick }) {
  return (
    <div className="mode-choose">
      {modes.includes('online') && (
        <button className="mode-card" type="button" onClick={() => onPick('online')}>
          <span className="mode-glyph">◉</span>
          <span className="mode-name">Play online</span>
          <span className="mode-desc">Create a room, share the code, play live with a friend anywhere.</span>
        </button>
      )}
      {modes.includes('local') && (
        <button className="mode-card" type="button" onClick={() => onPick('local')}>
          <span className="mode-glyph">⧉</span>
          <span className="mode-name">Same screen</span>
          <span className="mode-desc">Pass-and-play on one device, taking turns.</span>
        </button>
      )}
    </div>
  )
}

export default function TurnGame({ engineId, Board, accent, glyph, title, tagline, seatNames, modes = ['online', 'local'] }) {
  const single = modes.length === 1
  const [mode, setMode] = useState(single ? modes[0] : null)

  return (
    <GameShell accent={accent} glyph={glyph} title={title} tagline={tagline}>
      {mode && !single && (
        <div className="controls" style={{ marginBottom: 'var(--s-4)' }}>
          <Btn variant="ghost" onClick={() => setMode(null)}>← Mode</Btn>
          <span className="field" style={{ marginLeft: 8 }}>{mode === 'online' ? 'Online room' : 'Same screen'}</span>
        </div>
      )}

      {!mode && <ModeChooser modes={modes} onPick={setMode} />}

      {mode === 'local' && <LocalGame engineId={engineId} Board={Board} seatNames={seatNames} />}

      {mode === 'online' && (isConvexConfigured
        ? <OnlineGame engineId={engineId} Board={Board} />
        : <SetupNotice />)}
    </GameShell>
  )
}

function SetupNotice() {
  return (
    <div className="setup-notice">
      <h3>Online play needs Convex</h3>
      <p>Online rooms, the live leaderboard and groups run on a free Convex backend. To switch it on:</p>
      <ol>
        <li>Run <code>npx convex dev</code> in the project and sign in.</li>
        <li>It writes <code>VITE_CONVEX_URL</code> into <code>.env.local</code>.</li>
        <li>Restart <code>npm run dev</code> — online play lights up automatically.</li>
      </ol>
      <p className="setup-foot">Until then, “Same screen” mode works perfectly.</p>
    </div>
  )
}
