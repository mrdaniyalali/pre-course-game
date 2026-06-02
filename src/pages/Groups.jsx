import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { isConvexConfigured } from '../multiplayer/ConvexClient.jsx'
import { getPlayerId, getPlayerName, setPlayerName } from '../multiplayer/identity.js'
import { ls } from '../lib/storage.js'
import { useToast } from '../context/Toast.jsx'
import { Btn } from '../components/GameShell.jsx'
import { GAMES } from '../games/registry.js'
import { errMsg } from '../lib/errMsg.js'

function Inner() {
  const toast = useToast()
  const playerId = getPlayerId()
  const [name, setName] = useState(getPlayerName())
  const [groupName, setGroupName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [code, setCode] = useState(() => ls.get('group.code', '') || '')

  const create = useMutation(api.groups.create)
  const join = useMutation(api.groups.join)
  const group = useQuery(api.groups.get, code ? { code } : 'skip')

  const saveName = (v) => { setName(v); setPlayerName(v) }
  const remember = (c) => { setCode(c); ls.set('group.code', c) }

  const onCreate = async () => {
    try {
      const { code: c } = await create({ name: groupName || 'My Crew', playerId, playerName: name || 'You' })
      remember(c)
      toast('Group created')
    } catch (e) { toast(errMsg(e, 'Could not create')) }
  }
  const onJoin = async () => {
    const c = joinCode.trim().toUpperCase()
    if (c.length < 4) { toast('Enter a group code'); return }
    try {
      await join({ code: c, playerId, playerName: name || 'Friend' })
      remember(c)
    } catch (e) { toast(errMsg(e, 'Could not join')) }
  }

  if (group) {
    return (
      <div className="group">
        <div className="group-head">
          <div>
            <div className="group-name">{group.name}</div>
            <div className="group-code">Invite code <b>{group.code}</b>
              <button className="copy-btn" type="button"
                onClick={() => { navigator.clipboard?.writeText(group.code); toast('Code copied') }}>⧉</button>
            </div>
          </div>
          <Btn variant="secondary" onClick={() => remember('')}>Leave view</Btn>
        </div>

        <h3 className="page-subhead">Members ({group.members.length})</h3>
        <ul className="member-list">
          {group.members.map((m, i) => (
            <li key={i} className="member"><span className="member-dot" />{m.name}{m.playerId === playerId ? ' (you)' : ''}</li>
          ))}
        </ul>

        <h3 className="page-subhead">Start a match</h3>
        <p className="group-hint">Pick a game, create a room, and drop the room code in your group chat.</p>
        <div className="group-games">
          {GAMES.filter((g) => g.multiplayer).map((g) => (
            <Link key={g.id} to={g.path} className="group-game" data-accent={g.accent}>
              <span>{g.glyph}</span>{g.name}
            </Link>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="group-setup">
      <label className="lobby-field">
        <span>Your name</span>
        <input value={name} onChange={(e) => saveName(e.target.value)} placeholder="e.g. Dani" maxLength={16} />
      </label>

      <div className="group-card">
        <h3>Create a group</h3>
        <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name (e.g. The Squad)" maxLength={24} />
        <Btn onClick={onCreate}>Create group →</Btn>
      </div>

      <div className="lobby-or"><span>or</span></div>

      <div className="group-card">
        <h3>Join a group</h3>
        <input value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="GROUP CODE" maxLength={5} className="code-input" />
        <Btn variant="secondary" onClick={onJoin}>Join</Btn>
      </div>
    </div>
  )
}

export default function Groups() {
  return (
    <section className="page" data-accent="rose">
      <div className="page-head">
        <Link to="/" className="back-link">←</Link>
        <div>
          <h1 className="page-title">Groups</h1>
          <p className="page-tagline">Make a crew. Play together.</p>
        </div>
      </div>
      {isConvexConfigured ? <Inner /> : (
        <div className="setup-notice">
          <h3>Groups need Convex</h3>
          <p>Turn on the free backend to create groups your friends can join:</p>
          <ol>
            <li>Run <code>npx convex dev</code> and sign in.</li>
            <li>Restart <code>npm run dev</code>.</li>
          </ol>
        </div>
      )}
    </section>
  )
}
