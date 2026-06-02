import { useEffect, useRef, useState, useCallback } from 'react'
import { GameShell, Stats, Stat, Controls, Btn, Segmented, WinBanner } from '../components/GameShell.jsx'
import Confetti from '../components/Confetti.jsx'
import { useTimer } from '../lib/useTimer.js'
import { shuffle, fmtTime, clsx } from '../lib/helpers.js'
import { ls, useStored } from '../lib/storage.js'
import { sfx } from '../lib/sound.js'

const CATEGORIES = {
  space:   ['NEBULA', 'COMET', 'ORBIT', 'QUASAR', 'GALAXY', 'PULSAR', 'ECLIPSE', 'METEOR'],
  ocean:   ['CORAL', 'WHALE', 'TIDE', 'KELP', 'SHARK', 'REEF', 'ABYSS', 'SQUID'],
  coding:  ['ARRAY', 'LOOP', 'STACK', 'QUEUE', 'HEAP', 'NODE', 'ASYNC', 'CACHE'],
  animals: ['TIGER', 'PANDA', 'EAGLE', 'OTTER', 'KOALA', 'RABBIT', 'FOX', 'WOLF', 'ZEBRA'],
  food:    ['APPLE', 'MANGO', 'PIZZA', 'BREAD', 'CHEESE', 'GRAPE', 'LEMON', 'PEACH', 'SUSHI'],
}
const SIZE = 10
const DIRS = [[0,1],[1,0],[1,1],[-1,1],[0,-1],[-1,0],[-1,-1],[1,-1]]
const FILLER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

function generate(cat) {
  const words = shuffle(CATEGORIES[cat]).slice(0, 7)
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
  const placements = {}
  for (const word of words) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const [dr, dc] = DIRS[(Math.random() * DIRS.length) | 0]
      const r0 = (Math.random() * SIZE) | 0
      const c0 = (Math.random() * SIZE) | 0
      const r1 = r0 + dr * (word.length - 1)
      const c1 = c0 + dc * (word.length - 1)
      if (r1 < 0 || r1 >= SIZE || c1 < 0 || c1 >= SIZE) continue
      let ok = true
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i, c = c0 + dc * i
        if (grid[r][c] && grid[r][c] !== word[i]) { ok = false; break }
      }
      if (!ok) continue
      for (let i = 0; i < word.length; i++) grid[r0 + dr * i][c0 + dc * i] = word[i]
      placements[word] = true
      break
    }
  }
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (!grid[r][c]) grid[r][c] = FILLER[(Math.random() * 26) | 0]
  return { grid, words: Object.keys(placements) }
}

function lineCells(a, b) {
  const [r0, c0] = a, [r1, c1] = b
  if (Math.abs(r1 - r0) !== 0 && Math.abs(c1 - c0) !== 0 && Math.abs(r1 - r0) !== Math.abs(c1 - c0)) return null
  const dr = Math.sign(r1 - r0), dc = Math.sign(c1 - c0)
  const len = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0))
  const cells = []
  for (let i = 0; i <= len; i++) cells.push([r0 + dr * i, c0 + dc * i])
  return cells
}

export default function WordSearch() {
  const timer = useTimer()
  const [cat, setCat] = useStored('w.cat', 'space')
  const [puzzle, setPuzzle] = useState(() => generate(cat))
  const [found, setFound] = useState(new Set())
  const [foundCells, setFoundCells] = useState(new Set()) // "r,c"
  const [sel, setSel] = useState([])                      // current drag cells [[r,c]]
  const [won, setWon] = useState(false)
  const [burst, setBurst] = useState(0)

  const gridRef = useRef(null)
  const startCell = useRef(null)
  const dragging = useRef(false)
  const started = useRef(false)

  const newGame = useCallback(() => {
    setPuzzle(generate(cat))
    setFound(new Set()); setFoundCells(new Set()); setSel([]); setWon(false)
    started.current = false
    timer.reset()
  }, [cat, timer])

  useEffect(() => { newGame() }, [cat]) // eslint-disable-line

  const best = ls.get(`w.best.${cat}`, 0)

  const cellFromPoint = (x, y) => {
    const el = document.elementFromPoint(x, y)
    if (el && el.classList.contains('ws-cell')) return [Number(el.dataset.r), Number(el.dataset.c)]
    return null
  }

  const begin = (cell) => {
    if (!cell) return
    if (!started.current) { started.current = true; timer.start() }
    dragging.current = true
    startCell.current = cell
    setSel([cell])
    sfx.pick()
  }
  const extend = (cell) => {
    if (!dragging.current || !cell) return
    const cells = lineCells(startCell.current, cell)
    if (cells) setSel(cells)
  }
  const end = () => {
    if (!dragging.current) return
    dragging.current = false
    const cells = sel
    setSel([])
    if (cells.length < 2) return
    const text = cells.map(([r, c]) => puzzle.grid[r][c]).join('')
    const rev = [...text].reverse().join('')
    const match = puzzle.words.find((w) => (w === text || w === rev) && !found.has(w))
    if (!match) return
    const nextFound = new Set(found).add(match)
    const nextCells = new Set(foundCells)
    cells.forEach(([r, c]) => nextCells.add(`${r},${c}`))
    setFound(nextFound)
    setFoundCells(nextCells)
    sfx.match()
    if (nextFound.size === puzzle.words.length) {
      timer.stop()
      const sec = timer.seconds
      const key = `w.best.${cat}`
      const prev = ls.get(key, 0)
      const isBest = !prev || sec < prev
      if (isBest) ls.set(key, sec)
      setWon({ sec, isBest, prev })
      setBurst((b) => b + 1)
      sfx.win()
    }
  }

  // pointer + touch handlers on the grid
  useEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const onDown = (e) => { e.preventDefault(); begin(cellFromPoint(e.clientX, e.clientY)) }
    const onMove = (e) => { if (dragging.current) extend(cellFromPoint(e.clientX, e.clientY)) }
    const onUp = () => end()
    const onTStart = (e) => { e.preventDefault(); begin(cellFromPoint(e.touches[0].clientX, e.touches[0].clientY)) }
    const onTMove = (e) => { e.preventDefault(); extend(cellFromPoint(e.touches[0].clientX, e.touches[0].clientY)) }

    grid.addEventListener('mousedown', onDown)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    grid.addEventListener('touchstart', onTStart, { passive: false })
    grid.addEventListener('touchmove', onTMove, { passive: false })
    window.addEventListener('touchend', onUp)
    return () => {
      grid.removeEventListener('mousedown', onDown)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      grid.removeEventListener('touchstart', onTStart)
      grid.removeEventListener('touchmove', onTMove)
      window.removeEventListener('touchend', onUp)
    }
  }) // re-bind each render so closures see fresh state

  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key.toLowerCase() === 'n') newGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const selSet = new Set(sel.map(([r, c]) => `${r},${c}`))

  return (
    <GameShell accent="teal" glyph="W" title="Word Search" tagline="Drag to hunt hidden words.">
      <Confetti burst={burst} />
      <Stats>
        <Stat label="Found" value={`${found.size} / ${puzzle.words.length}`} highlight={found.size === puzzle.words.length} />
        <Stat label="Words" value={puzzle.words.length} />
        <Stat label="Time" value={fmtTime(timer.seconds)} />
        <Stat label="Best" value={best ? fmtTime(best) : '—'} />
      </Stats>

      <Controls>
        <Btn onClick={newGame}>New Puzzle</Btn>
        <span className="spacer" />
        <Segmented
          label="Category"
          value={cat}
          onChange={setCat}
          options={[
            { value: 'space', label: 'Space' },
            { value: 'ocean', label: 'Ocean' },
            { value: 'coding', label: 'Coding' },
            { value: 'animals', label: 'Animals' },
            { value: 'food', label: 'Food' },
          ]}
        />
      </Controls>

      <div className="ws-layout">
        <div ref={gridRef} className="ws-grid" style={{ gridTemplateColumns: `repeat(${SIZE}, 1fr)` }}>
          {puzzle.grid.map((row, r) =>
            row.map((ch, c) => {
              const key = `${r},${c}`
              return (
                <div
                  key={key}
                  className={clsx('ws-cell', foundCells.has(key) && 'found', selSet.has(key) && 'selecting')}
                  data-r={r}
                  data-c={c}
                >
                  {ch}
                </div>
              )
            })
          )}
        </div>
        <div className="ws-words">
          <h3>Find these</h3>
          <ul className="ws-word-list">
            {puzzle.words.map((w) => (
              <li key={w} className={found.has(w) ? 'found' : ''}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      <WinBanner show={!!won} onAgain={newGame} againLabel="New puzzle">
        {won && (won.isBest
          ? <><strong>New best — {fmtTime(won.sec)}.</strong> All {puzzle.words.length} words.</>
          : <><strong>Complete in {fmtTime(won.sec)}.</strong> Best: {fmtTime(won.prev)}.</>)}
      </WinBanner>
    </GameShell>
  )
}
