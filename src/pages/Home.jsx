import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { GAMES } from '../games/registry.js'
import { ls } from '../lib/storage.js'
import { fmtTime } from '../lib/helpers.js'
import { useInstallPrompt } from '../lib/useInstallPrompt.js'

function soloHint(game) {
  if (game.id === '2048') { const v = ls.get('tw.best', 0); return v ? <>Best <b>{v}</b></> : 'New' }
  if (game.id === 'mines') { const v = ls.get('ms.best.easy', 0); return v ? <>Best <b>{fmtTime(v)}</b></> : 'New' }
  if (game.id === 'words') { const v = ls.get('w.best.space', 0); return v ? <>Best <b>{fmtTime(v)}</b></> : 'New' }
  const v = ls.get('m.best.medium.symbols', 0); return v ? <>Best <b>{v}</b></> : 'New'
}

function Card({ g }) {
  return (
    <Link to={g.path} className="card" data-accent={g.accent}>
      <span className="card-glyph" aria-hidden="true">{g.glyph}</span>
      <span className="card-name">{g.name}</span>
      <span className="card-blurb">{g.blurb}</span>
      <span className="card-foot">
        <span className="card-best">
          {g.multiplayer ? <span className="tag-2p">2P · online</span> : soloHint(g)}
        </span>
        <span className="card-play">Play <span className="arrow">→</span></span>
      </span>
    </Link>
  )
}

export default function Home() {
  const { canInstall, promptInstall } = useInstallPrompt()
  useEffect(() => { document.title = 'Pairs — Mini Arcade' }, [])

  const solo = GAMES.filter((g) => !g.multiplayer)
  const versus = GAMES.filter((g) => g.multiplayer)

  return (
    <>
      <section className="hero">
        <span className="hero-eyebrow"><span className="pulse" />Free · Offline · Play with friends</span>
        <h1>Tiny games.<br /><span className="grad">Big rivalries.</span></h1>
        <p>Beautiful brain games you can install and play solo — or challenge a friend live with a room code.</p>
        <div className="hero-cta">
          <Link to="/tictactoe" className="btn btn-primary">Challenge a friend →</Link>
          <Link to="/leaderboard" className="btn btn-ghost">★ Leaderboard</Link>
          {canInstall && <button className="btn btn-ghost" type="button" onClick={promptInstall}>↓ Install</button>}
        </div>
      </section>

      <h2 className="section-head"><span>Versus</span><small>online room codes · same screen</small></h2>
      <div className="cards">{versus.map((g) => <Card key={g.id} g={g} />)}</div>

      <h2 className="section-head"><span>Solo</span><small>beat your own best</small></h2>
      <div className="cards">{solo.map((g) => <Card key={g.id} g={g} />)}</div>

      <footer className="home-foot">
        <div>Built with React + Convex · Plays offline · Add to your home screen</div>
        <div style={{ marginTop: 8 }}>
          <kbd>T</kbd> theme · <kbd>S</kbd> sound · <kbd>N</kbd> new · <kbd>↑↓←→</kbd> 2048
        </div>
      </footer>
    </>
  )
}
