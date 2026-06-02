import { useEffect, useRef, useState, useCallback } from 'react'
import { GameShell, Stats, Stat, Controls, Btn, Segmented, WinBanner } from '../components/GameShell.jsx'
import Confetti from '../components/Confetti.jsx'
import { useTimer } from '../lib/useTimer.js'
import { shuffle, fmtTime, clsx } from '../lib/helpers.js'
import { ls, useStored } from '../lib/storage.js'
import { sfx } from '../lib/sound.js'

const DIFFS = {
  easy:   { cols: 9,  rows: 9,  mines: 10 },
  medium: { cols: 12, rows: 12, mines: 22 },
  hard:   { cols: 16, rows: 14, mines: 42 },
}

export default function Minesweeper() {
  const timer = useTimer()
  const [diff, setDiff] = useStored('ms.diff', 'easy')
  const cfg = DIFFS[diff]

  const [revealed, setRevealed] = useState(new Set())
  const [flagged, setFlagged] = useState(new Set())
  const [nums, setNums] = useState(null)   // number grid, -1 = mine
  const [mines, setMines] = useState(new Set())
  const [over, setOver] = useState(false)
  const [hitIdx, setHitIdx] = useState(-1)
  const [won, setWon] = useState(false)
  const [burst, setBurst] = useState(0)

  const started = useRef(false)
  const longPress = useRef(null)
  const suppressClick = useRef(false)
  const { rows, cols, mines: mineCount } = cfg

  const idx = (r, c) => r * cols + c
  const inBounds = (r, c) => r >= 0 && r < rows && c >= 0 && c < cols
  const neighbors = (r, c) => {
    const out = []
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      if (inBounds(r + dr, c + dc)) out.push([r + dr, c + dc])
    }
    return out
  }

  const newGame = useCallback(() => {
    setRevealed(new Set()); setFlagged(new Set())
    setNums(null); setMines(new Set())
    setOver(false); setHitIdx(-1); setWon(false)
    started.current = false
    timer.reset()
  }, [timer])

  useEffect(() => { newGame() }, [diff]) // eslint-disable-line

  const best = ls.get(`ms.best.${diff}`, 0)

  function placeMines(safeR, safeC) {
    const safe = new Set([idx(safeR, safeC), ...neighbors(safeR, safeC).map(([r, c]) => idx(r, c))])
    const cells = []
    for (let i = 0; i < rows * cols; i++) if (!safe.has(i)) cells.push(i)
    shuffle(cells)
    const mineSet = new Set(cells.slice(0, mineCount))
    const n = Array(rows * cols).fill(0)
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (mineSet.has(idx(r, c))) { n[idx(r, c)] = -1; continue }
      let count = 0
      for (const [nr, nc] of neighbors(r, c)) if (mineSet.has(idx(nr, nc))) count++
      n[idx(r, c)] = count
    }
    return { mineSet, n }
  }

  const reveal = (r, c) => {
    if (over) return
    const i = idx(r, c)
    if (flagged.has(i) || revealed.has(i)) return

    let mineSet = mines, n = nums
    if (!started.current) {
      started.current = true
      const placed = placeMines(r, c)
      mineSet = placed.mineSet; n = placed.n
      setMines(mineSet); setNums(n)
      timer.start()
    }

    if (mineSet.has(i)) {
      // boom
      setOver(true); setHitIdx(i); timer.stop(); sfx.miss()
      const all = new Set(revealed)
      mineSet.forEach((m) => all.add(m))
      setRevealed(all)
      return
    }

    // flood fill
    const next = new Set(revealed)
    const stack = [[r, c]]
    while (stack.length) {
      const [cr, cc] = stack.pop()
      const ci = idx(cr, cc)
      if (next.has(ci) || flagged.has(ci)) continue
      next.add(ci)
      if (n[ci] === 0) {
        for (const [nr, nc] of neighbors(cr, cc)) if (!next.has(idx(nr, nc))) stack.push([nr, nc])
      }
    }
    setRevealed(next)
    sfx.pick()

    // win check
    if (next.size === rows * cols - mineCount) {
      setOver(true); timer.stop()
      const sec = timer.seconds
      const key = `ms.best.${diff}`
      const prev = ls.get(key, 0)
      const isBest = !prev || sec < prev
      if (isBest) ls.set(key, sec)
      setWon({ sec, isBest, prev })
      setBurst((b) => b + 1)
      sfx.win()
    }
  }

  const flag = (r, c) => {
    if (over) return
    const i = idx(r, c)
    if (revealed.has(i)) return
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i); else next.add(i)
      return next
    })
    sfx.flip()
  }

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key.toLowerCase() === 'n') newGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <GameShell accent="rose" glyph="✱" title="Minesweeper" tagline="Read the numbers. Dodge the boom.">
      <Confetti burst={burst} />
      <Stats>
        <Stat label="Mines" value={mineCount} />
        <Stat label="Flags" value={flagged.size} highlight={flagged.size === mineCount} />
        <Stat label="Time" value={fmtTime(timer.seconds)} />
        <Stat label="Best" value={best ? fmtTime(best) : '—'} />
      </Stats>

      <Controls>
        <Btn onClick={newGame}>New Game</Btn>
        <span className="spacer" />
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
      </Controls>
      <Controls tight>
        <span className="field">Tap reveals · Right-click or long-press flags</span>
      </Controls>

      <div className="ms-grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role="grid">
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((_, c) => {
            const i = idx(r, c)
            const isRevealed = revealed.has(i)
            const isMine = nums ? nums[i] === -1 : false
            const n = nums ? nums[i] : 0
            const cls = clsx(
              'ms-cell',
              isRevealed && 'revealed',
              flagged.has(i) && !isRevealed && 'flagged',
              isRevealed && isMine && (i === hitIdx ? 'mine-hit' : 'mine-revealed')
            )
            return (
              <div
                key={i}
                className={cls}
                data-n={isRevealed && !isMine && n > 0 ? n : undefined}
                role="gridcell"
                onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } reveal(r, c) }}
                onContextMenu={(e) => { e.preventDefault(); flag(r, c) }}
                onTouchStart={() => { longPress.current = setTimeout(() => { suppressClick.current = true; flag(r, c); longPress.current = null }, 380) }}
                onTouchEnd={() => { if (longPress.current) { clearTimeout(longPress.current); longPress.current = null } }}
                onTouchMove={() => { if (longPress.current) { clearTimeout(longPress.current); longPress.current = null } }}
              >
                {isRevealed && !isMine && n > 0 ? n : ''}
              </div>
            )
          })
        )}
      </div>

      <WinBanner
        show={over}
        onAgain={newGame}
        againLabel="New game"
      >
        {won
          ? (won.isBest
            ? <><strong>Cleared in {fmtTime(won.sec)}.</strong> New best!</>
            : <><strong>Cleared in {fmtTime(won.sec)}.</strong> Best: {fmtTime(won.prev)}.</>)
          : <><strong>Boom.</strong> You hit a mine.</>}
      </WinBanner>
    </GameShell>
  )
}
