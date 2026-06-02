import { useEffect, useRef, useState, useCallback } from 'react'
import { GameShell, Stats, Stat, Controls, Btn, Segmented, WinBanner } from '../components/GameShell.jsx'
import Confetti from '../components/Confetti.jsx'
import { useToast } from '../context/Toast.jsx'
import { useTimer } from '../lib/useTimer.js'
import { shuffle, fmtTime, clsx } from '../lib/helpers.js'
import { ls, useStored } from '../lib/storage.js'
import { sfx } from '../lib/sound.js'

const DECKS = {
  symbols: ['✦', '◆', '●', '▲', '■', '✚', '❋', '◐', '♠', '♥', '♣', '♦'],
  letters: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'],
  emoji:   ['🦊', '🐙', '🦋', '🌵', '🍉', '🪐', '🔥', '🎯', '🍕', '🚀', '🎨', '🪁'],
}
const DIFFS = {
  easy:   { cols: 4, pairs: 6,  hints: 3, target: 60 },
  medium: { cols: 4, pairs: 8,  hints: 2, target: 110 },
  hard:   { cols: 6, pairs: 12, hints: 2, target: 220 },
}

function buildDeck(diff, deck) {
  const { pairs } = DIFFS[diff]
  const syms = shuffle(DECKS[deck]).slice(0, pairs)
  return shuffle([...syms, ...syms]).map((sym, i) => ({ id: i, sym }))
}

export default function Memory() {
  const toast = useToast()
  const timer = useTimer()
  const [diff, setDiff] = useStored('m.diff', 'medium')
  const [deck, setDeck] = useStored('m.deck', 'symbols')

  const [cards, setCards] = useState(() => buildDeck(diff, deck))
  const [flipped, setFlipped] = useState([])      // indices currently face up (max 2)
  const [matched, setMatched] = useState(new Set())
  const [hintIds, setHintIds] = useState(new Set())
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [moves, setMoves] = useState(0)
  const [hintsLeft, setHintsLeft] = useState(DIFFS[diff].hints)
  const [paused, setPaused] = useState(false)
  const [won, setWon] = useState(false)
  const [burst, setBurst] = useState(0)

  const started = useRef(false)
  const lock = useRef(false)
  const { cols } = DIFFS[diff]

  const newGame = useCallback(() => {
    setCards(buildDeck(diff, deck))
    setFlipped([]); setMatched(new Set()); setHintIds(new Set())
    setScore(0); setCombo(0); setMoves(0)
    setHintsLeft(DIFFS[diff].hints)
    setPaused(false); setWon(false)
    started.current = false; lock.current = false
    timer.reset()
  }, [diff, deck, timer])

  // rebuild when difficulty/deck changes
  useEffect(() => { newGame() }, [diff, deck]) // eslint-disable-line

  const best = ls.get(`m.best.${diff}.${deck}`, 0)

  const finish = useCallback((finalScore) => {
    timer.stop()
    const sec = timer.seconds
    const bonus = Math.max(0, (DIFFS[diff].target - sec) * 4)
    const total = finalScore + bonus
    const key = `m.best.${diff}.${deck}`
    const prev = ls.get(key, 0)
    const isBest = total > prev
    if (isBest) ls.set(key, total)
    setScore(total)
    setWon({ total, isBest, prev, sec, moves })
    setBurst((b) => b + 1)
    sfx.win()
  }, [diff, deck, timer, moves])

  const flip = (idx) => {
    if (lock.current || paused || won) return
    if (matched.has(idx) || flipped.includes(idx)) return
    if (!started.current) { started.current = true; timer.start() }

    const nextFlipped = [...flipped, idx]
    setFlipped(nextFlipped)
    sfx.flip()

    if (nextFlipped.length === 2) {
      const nextMoves = moves + 1
      setMoves(nextMoves)
      const [a, b] = nextFlipped
      if (cards[a].sym === cards[b].sym) {
        const nextCombo = combo + 1
        const pts = 100 * nextCombo
        const nextMatched = new Set(matched).add(a).add(b)
        const nextScore = score + pts
        setMatched(nextMatched)
        setCombo(nextCombo)
        setScore(nextScore)
        setFlipped([])
        sfx.match()
        if (nextCombo >= 2) toast(`Combo ×${nextCombo} · +${pts}`)
        if (nextMatched.size === cards.length) finish(nextScore)
      } else {
        lock.current = true
        setCombo(0)
        sfx.miss()
        setTimeout(() => {
          setFlipped([])
          lock.current = false
        }, 720)
      }
    }
  }

  const hint = () => {
    if (lock.current || paused || won || hintsLeft <= 0) return
    const remaining = cards.map((c, i) => ({ ...c, i })).filter((c) => !matched.has(c.i))
    const groups = {}
    remaining.forEach((c) => { (groups[c.sym] ||= []).push(c.i) })
    const pair = Object.values(groups).find((g) => g.length === 2)
    if (!pair) return
    setHintsLeft((h) => h - 1)
    setCombo(0)
    setHintIds(new Set(pair))
    setTimeout(() => setHintIds(new Set()), 1700)
    toast('Hint used — combo reset')
  }

  const revealAll = () => {
    if (lock.current || paused || won) return
    const hidden = cards.map((_, i) => i).filter((i) => !matched.has(i) && !flipped.includes(i))
    if (!hidden.length) return
    if (!started.current) { started.current = true; timer.start() }
    lock.current = true
    setCombo(0)
    setMoves((m) => m + 1)
    setFlipped(hidden)
    toast('All revealed — combo reset')
    setTimeout(() => { setFlipped([]); lock.current = false }, 2000)
  }

  const togglePause = () => {
    if (!started.current || won) return
    setPaused((p) => {
      const next = !p
      if (next) timer.pause(); else timer.resume()
      return next
    })
  }

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      const k = e.key.toLowerCase()
      if (k === 'n') newGame()
      if (k === 'h') hint()
      if (k === 'p') togglePause()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <GameShell accent="violet" glyph="◆" title="Memory Match" tagline="Flip, remember, chain combos.">
      <Confetti burst={burst} />
      <Stats>
        <Stat label="Score" value={score} />
        <Stat label="Combo" value={`×${Math.max(1, combo)}`} highlight={combo >= 2} />
        <Stat label="Moves" value={moves} />
        <Stat label="Time" value={fmtTime(timer.seconds)} />
      </Stats>

      <Controls>
        <Btn onClick={newGame}>New Game</Btn>
        <Btn variant="secondary" onClick={hint} disabled={hintsLeft <= 0}>
          Hint <span style={{ opacity: 0.6 }}>({hintsLeft})</span>
        </Btn>
        <Btn variant="secondary" onClick={revealAll}>Reveal</Btn>
        <Btn variant="secondary" onClick={togglePause}>{paused ? 'Resume' : 'Pause'}</Btn>
      </Controls>

      <Controls>
        <Segmented
          label="Difficulty"
          value={diff}
          onChange={setDiff}
          options={[
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' },
          ]}
        />
        <span className="spacer" />
        <Segmented
          label="Deck"
          value={deck}
          onChange={setDeck}
          options={[
            { value: 'symbols', label: 'Symbols' },
            { value: 'letters', label: 'Letters' },
            { value: 'emoji', label: 'Emoji' },
          ]}
        />
      </Controls>

      <div className="field" style={{ marginBottom: 'var(--s-3)' }}>
        Best <b>{best ? `${best} pts` : '—'}</b>
      </div>

      {paused ? (
        <div className="pause-overlay show">Paused</div>
      ) : (
        <div className="mem-board" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="grid">
          {cards.map((c, i) => {
            const isUp = flipped.includes(i) || matched.has(i)
            return (
              <button
                key={c.id}
                type="button"
                className={clsx('mem-card', isUp && 'flipped', matched.has(i) && 'matched', hintIds.has(i) && 'hint')}
                onClick={() => flip(i)}
                aria-label={isUp ? `Card ${c.sym}` : 'Hidden card'}
              >
                <span className="mem-face mem-back" aria-hidden="true" />
                <span className="mem-face mem-front" aria-hidden="true">{c.sym}</span>
              </button>
            )
          })}
        </div>
      )}

      <WinBanner show={!!won} onAgain={newGame}>
        {won && (won.isBest
          ? <><strong>New best — {won.total} pts.</strong> {won.moves} moves · {fmtTime(won.sec)}.</>
          : <><strong>{won.total} pts.</strong> {won.moves} moves · {fmtTime(won.sec)}. Best: {won.prev}.</>)}
      </WinBanner>
    </GameShell>
  )
}
