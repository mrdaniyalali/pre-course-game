import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useConvexAuth, useQuery, useMutation } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'
import { isConvexConfigured } from '../multiplayer/ConvexClient.jsx'
import { useToast } from '../context/Toast.jsx'
import { errMsg } from '../lib/errMsg.js'
import { Btn } from '../components/GameShell.jsx'

function Avatar({ image, name }) {
  return image
    ? <img className="fr-avatar" src={image} alt="" referrerPolicy="no-referrer" />
    : <span className="fr-avatar fallback">{(name || 'P')[0]}</span>
}

function Inner() {
  const toast = useToast()
  const me = useQuery(api.users.me, {})
  const data = useQuery(api.friends.list, {})
  const request = useMutation(api.friends.request)
  const respond = useMutation(api.friends.respond)
  const remove = useMutation(api.friends.remove)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!email.trim()) { toast('Enter an email'); return }
    setBusy(true)
    try {
      const r = await request({ email: email.trim() })
      toast(r.accepted ? 'Friend added!' : 'Request sent')
      setEmail('')
    } catch (e) { toast(errMsg(e, 'Could not send request')) }
    finally { setBusy(false) }
  }

  const friends = data?.friends ?? []
  const incoming = data?.incoming ?? []
  const outgoing = data?.outgoing ?? []

  return (
    <>
      <div className="fr-you">
        Signed in as <b>{me?.name || '…'}</b>
        {me?.email && <span className="fr-email">friends add you with <b>{me.email}</b></span>}
      </div>

      <div className="group-card">
        <h3>Add a friend</h3>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="their Google email"
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <Btn onClick={add} disabled={busy}>Send request →</Btn>
      </div>

      {incoming.length > 0 && (
        <>
          <h3 className="page-subhead">Requests ({incoming.length})</h3>
          <ul className="fr-list">
            {incoming.map((f) => (
              <li key={f.id} className="fr-row">
                <Avatar {...f} />
                <span className="fr-name">{f.name}</span>
                <span className="fr-actions">
                  <button className="fr-yes" onClick={() => respond({ otherId: f.id, accept: true })}>Accept</button>
                  <button className="fr-no" onClick={() => respond({ otherId: f.id, accept: false })}>✕</button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className="page-subhead">Friends ({friends.length})</h3>
      <ul className="fr-list">
        {data === undefined && <li className="lb-empty">Loading…</li>}
        {data && friends.length === 0 && <li className="lb-empty">No friends yet — add one by email above.</li>}
        {friends.map((f) => (
          <li key={f.id} className="fr-row">
            <Avatar {...f} />
            <span className="fr-name">{f.name}</span>
            <button className="fr-remove" title="Remove" onClick={() => remove({ otherId: f.id })}>Remove</button>
          </li>
        ))}
      </ul>

      {outgoing.length > 0 && (
        <>
          <h3 className="page-subhead">Pending ({outgoing.length})</h3>
          <ul className="fr-list">
            {outgoing.map((f) => (
              <li key={f.id} className="fr-row muted">
                <Avatar {...f} />
                <span className="fr-name">{f.name}</span>
                <span className="fr-pending">awaiting…</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  )
}

function SignedOut() {
  const { signIn } = useAuthActions()
  return (
    <div className="setup-notice">
      <h3>Friends are for signed-in players</h3>
      <p>Sign in with Google to add friends by email and see who’s in your crew.</p>
      <Btn onClick={() => signIn('google')}>Sign in with Google</Btn>
    </div>
  )
}

export default function Friends() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  return (
    <section className="page" data-accent="teal">
      <div className="page-head">
        <Link to="/" className="back-link">←</Link>
        <div>
          <h1 className="page-title">Friends</h1>
          <p className="page-tagline">Add your crew. Play together.</p>
        </div>
      </div>
      {!isConvexConfigured ? (
        <div className="setup-notice"><h3>Needs Convex</h3><p>Backend not configured.</p></div>
      ) : isLoading ? (
        <div className="lobby-loading">Loading…</div>
      ) : isAuthenticated ? <Inner /> : <SignedOut />}
    </section>
  )
}
