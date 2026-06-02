import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { getEngine } from '../../convex/engines/index.js'
import { getPlayerId, getPlayerName, setPlayerName } from '../multiplayer/identity.js'
import { useToast } from '../context/Toast.jsx'
import { Btn } from '../components/GameShell.jsx'
import Confetti from '../components/Confetti.jsx'
import { sfx } from '../lib/sound.js'
import { errMsg } from '../lib/errMsg.js'

// Live, synced board once both players are seated. Game-over is server-authoritative
// (room.status / winnerSeat) so it works even with redacted (fog-of-war) state.
function OnlineBoard({ room, engine, Board, mySeat, playerId, sendMove, rematch, onLeave, toast }) {
  const serverDone = room.status === 'done'
  let line = []
  try { line = engine.result(room.state).line || [] } catch { line = [] }
  const result = { done: serverDone, winner: room.winnerSeat, draw: room.draw, line }
  const myTurn = room.status === 'playing' && room.state.turn === mySeat && !serverDone

  const [burst, setBurst] = useState(0)
  const wasDone = useRef(false)
  useEffect(() => {
    if (serverDone && !wasDone.current) {
      wasDone.current = true
      if (!result.draw && result.winner === mySeat) { setBurst((b) => b + 1); sfx.win() }
      else sfx.miss()
    }
    if (!serverDone) wasDone.current = false
  }, [serverDone, result.draw, result.winner, mySeat])

  return (
    <>
      <Confetti burst={burst} />
      <div className="turn-banner" data-on={myTurn}>
        {serverDone
          ? (result.draw ? 'Draw — nobody wins' : `${room.seats[result.winner]?.name || 'Winner'} wins!`)
          : (myTurn ? 'Your move' : `Waiting for ${room.seats[room.state.turn]?.name || 'opponent'}…`)}
      </div>
      <Board
        state={room.state}
        result={result}
        disabled={!myTurn}
        myTurn={myTurn}
        mySeat={mySeat}
        onMove={async (move) => {
          try { await sendMove({ code: room.code, playerId, move }) }
          catch (e) { toast(errMsg(e, 'Invalid move')) }
        }}
      />
      {serverDone && (
        <div className="online-actions">
          <Btn onClick={() => rematch({ code: room.code, playerId })}>Rematch</Btn>
          <Btn variant="secondary" onClick={onLeave}>Leave</Btn>
        </div>
      )}
    </>
  )
}

export default function OnlineGame({ engineId, Board }) {
  const toast = useToast()
  const engine = getEngine(engineId)
  const playerId = getPlayerId()

  const [name, setName] = useState(getPlayerName())
  const [code, setCode] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [busy, setBusy] = useState(false)

  const createRoom = useMutation(api.rooms.create)
  const joinRoom = useMutation(api.rooms.join)
  const sendMove = useMutation(api.rooms.move)
  const rematch = useMutation(api.rooms.rematch)

  const room = useQuery(api.rooms.getView, code ? { code, playerId } : 'skip')

  const saveName = (v) => { setName(v); setPlayerName(v) }

  const onCreate = async () => {
    setBusy(true)
    try {
      const { code: c } = await createRoom({ game: engineId, playerId, name: name || 'Player 1' })
      setCode(c)
    } catch (e) { toast(errMsg(e, 'Could not create room')) }
    finally { setBusy(false) }
  }

  const onJoin = async () => {
    const c = joinCode.trim().toUpperCase()
    if (c.length < 4) { toast('Enter a 4-letter code'); return }
    setBusy(true)
    try {
      await joinRoom({ code: c, playerId, name: name || 'Player 2' })
      setCode(c)
    } catch (e) { toast(errMsg(e, 'Could not join')) }
    finally { setBusy(false) }
  }

  if (!code) {
    return (
      <div className="lobby">
        <label className="lobby-field">
          <span>Your name</span>
          <input value={name} onChange={(e) => saveName(e.target.value)} placeholder="e.g. Dani" maxLength={16} />
        </label>
        <div className="lobby-actions">
          <Btn onClick={onCreate} disabled={busy}>Create room →</Btn>
        </div>
        <div className="lobby-or"><span>or join a friend</span></div>
        <div className="lobby-join">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="CODE"
            maxLength={4}
            className="code-input"
            aria-label="Room code"
          />
          <Btn variant="secondary" onClick={onJoin} disabled={busy}>Join</Btn>
        </div>
      </div>
    )
  }

  if (room === undefined) return <div className="lobby-loading">Connecting…</div>
  if (room === null) {
    return (
      <div className="lobby">
        <p className="lobby-note">Room <b>{code}</b> wasn’t found.</p>
        <Btn variant="secondary" onClick={() => setCode('')}>Back</Btn>
      </div>
    )
  }

  const mySeat = room.seats.findIndex((s) => s.playerId === playerId)
  const waiting = room.seats.length < engine.seats

  return (
    <div className="online">
      <div className="room-bar">
        <div className="room-code">
          <span className="room-code-label">ROOM</span>
          <b>{room.code}</b>
          <button
            className="copy-btn"
            type="button"
            onClick={() => { navigator.clipboard?.writeText(room.code); toast('Code copied') }}
          >
            ⧉
          </button>
        </div>
        <div className="room-seats">
          {room.seats.map((s, i) => (
            <span key={i} className={'seat-chip seat-' + i + (room.state.turn === i && room.status === 'playing' ? ' active' : '')}>
              {s.name}{i === mySeat ? ' (you)' : ''}
            </span>
          ))}
          {waiting && <span className="seat-chip ghost">waiting…</span>}
        </div>
      </div>

      {waiting ? (
        <div className="waiting-card">
          <div className="waiting-pulse" />
          <p>Share code <b>{room.code}</b> with your friend.</p>
          <span>They tap “Join”, enter the code, and you’re in.</span>
        </div>
      ) : (
        <OnlineBoard
          room={room}
          engine={engine}
          Board={Board}
          mySeat={mySeat}
          playerId={playerId}
          sendMove={sendMove}
          rematch={rematch}
          onLeave={() => setCode('')}
          toast={toast}
        />
      )}
    </div>
  )
}
