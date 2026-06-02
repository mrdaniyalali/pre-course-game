import { useEffect, useRef, useState, useCallback } from 'react'
import { GameShell, Stats, Stat, Controls, Btn, WinBanner } from '../components/GameShell.jsx'
import Confetti from '../components/Confetti.jsx'
import { clsx } from '../lib/helpers.js'
import { ls } from '../lib/storage.js'
import { sfx } from '../lib/sound.js'

const emptyGrid = () => Array.from({ length: 4 }, () => Array(4).fill(0))
const rotateCW = (g) => { const r = emptyGrid(); for (let i=0;i<4;i++) for (let j=0;j<4;j++) r[j][3-i]=g[i][j]; return r }
const rotateCCW = (g) => { const r = emptyGrid(); for (let i=0;i<4;i++) for (let j=0;j<4;j++) r[3-j][i]=g[i][j]; return r }

function addTile(grid) {
  const empty = []
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) if (!grid[r][c]) empty.push([r,c])
  if (!empty.length) return null
  const [r,c] = empty[(Math.random()*empty.length)|0]
  grid[r][c] = Math.random() < 0.9 ? 2 : 4
  return [r,c]
}

function slideRow(row) {
  const filtered = row.filter((v) => v)
  const merges = []
  let gained = 0
  for (let i=0;i<filtered.length-1;i++) {
    if (filtered[i] === filtered[i+1]) {
      filtered[i] *= 2
      gained += filtered[i]
      filtered.splice(i+1,1)
      merges.push(i)
    }
  }
  while (filtered.length < 4) filtered.push(0)
  return { row: filtered, gained, merges }
}

function hasMoves(grid) {
  for (let r=0;r<4;r++) for (let c=0;c<4;c++) {
    if (!grid[r][c]) return true
    if (c<3 && grid[r][c] === grid[r][c+1]) return true
    if (r<3 && grid[r][c] === grid[r+1][c]) return true
  }
  return false
}

function freshStart() {
  const grid = emptyGrid()
  const a = addTile(grid)
  const b = addTile(grid)
  return { grid, newest: b || a, merged: [] }
}

export default function Game2048() {
  const [grid, setGrid] = useState(() => freshStart().grid)
  const [newest, setNewest] = useState(null)
  const [merged, setMerged] = useState([])
  const [score, setScore] = useState(0)
  const [moves, setMoves] = useState(0)
  const [best, setBest] = useState(() => ls.get('tw.best', 0))
  const [over, setOver] = useState(false)
  const [won, setWon] = useState(false)        // hit-2048 banner
  const [gameOver, setGameOver] = useState(false)
  const [burst, setBurst] = useState(0)

  const history = useRef([])
  const wonOnce = useRef(false)
  const boardRef = useRef(null)
  const touch = useRef(null)

  const newGame = useCallback(() => {
    const f = freshStart()
    setGrid(f.grid); setNewest(f.newest); setMerged([])
    setScore(0); setMoves(0); setOver(false); setWon(false); setGameOver(false)
    history.current = []; wonOnce.current = false
  }, [])

  const maxTile = Math.max(...grid.flat())

  const move = useCallback((dir) => {
    if (over) return
    setGrid((cur) => {
      let g = cur.map((r) => [...r])
      const before = JSON.stringify(g)
      if (dir === 'up') g = rotateCCW(g)
      if (dir === 'down') g = rotateCW(g)
      if (dir === 'right') g = g.map((r) => r.reverse())

      let gained = 0
      const mergedCoords = []
      for (let i=0;i<4;i++) {
        const { row, gained: gg, merges } = slideRow(g[i])
        g[i] = row; gained += gg
        merges.forEach((idx) => mergedCoords.push([i, idx]))
      }

      if (dir === 'right') g = g.map((r) => r.reverse())
      if (dir === 'up') g = rotateCW(g)
      if (dir === 'down') g = rotateCCW(g)

      const mappedMerged = mergedCoords.map(([i, idx]) => {
        if (dir === 'left') return [i, idx]
        if (dir === 'right') return [i, 3 - idx]
        if (dir === 'up') return [idx, i]
        return [3 - idx, i]
      })

      if (JSON.stringify(g) === before) return cur // no change

      history.current.push({ grid: cur.map((r) => [...r]), score, moves })
      if (history.current.length > 20) history.current.shift()

      const nt = addTile(g)
      setNewest(nt)
      setMerged(mappedMerged)
      setScore((s) => {
        const ns = s + gained
        if (ns > best) { setBest(ns); ls.set('tw.best', ns) }
        return ns
      })
      setMoves((m) => m + 1)
      if (gained > 0) sfx.pick()

      if (!wonOnce.current && g.flat().some((v) => v >= 2048)) {
        wonOnce.current = true
        setWon(true)
        setBurst((b) => b + 1)
        sfx.win()
      }
      if (!hasMoves(g)) {
        setOver(true)
        setGameOver(true)
        sfx.miss()
      }
      return g
    })
  }, [over, score, moves, best])

  const undo = () => {
    const snap = history.current.pop()
    if (!snap) return
    setGrid(snap.grid); setScore(snap.score); setMoves(snap.moves)
    setOver(false); setGameOver(false); setNewest(null); setMerged([])
  }

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (e.key.startsWith('Arrow')) { e.preventDefault(); move(e.key.replace('Arrow', '').toLowerCase()) }
      else if (e.key.toLowerCase() === 'n') newGame()
      else if (e.key.toLowerCase() === 'u') undo()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // swipe
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const onStart = (e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const onEnd = (e) => {
      if (!touch.current) return
      const dx = e.changedTouches[0].clientX - touch.current.x
      const dy = e.changedTouches[0].clientY - touch.current.y
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? 'right' : 'left')
      else move(dy > 0 ? 'down' : 'up')
      touch.current = null
    }
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchend', onEnd)
    return () => { el.removeEventListener('touchstart', onStart); el.removeEventListener('touchend', onEnd) }
  })

  const isMerged = (r, c) => merged.some(([mr, mc]) => mr === r && mc === c)

  return (
    <GameShell accent="amber" glyph="2⁰" title="2048" tagline="Swipe. Merge. Chase the tile.">
      <Confetti burst={burst} />
      <Stats>
        <Stat label="Score" value={score} highlight={score > 0 && score === best} />
        <Stat label="Best" value={best} />
        <Stat label="Max Tile" value={maxTile} />
        <Stat label="Moves" value={moves} />
      </Stats>

      <Controls>
        <Btn onClick={newGame}>New Game</Btn>
        <Btn variant="secondary" onClick={undo} disabled={!history.current.length}>Undo</Btn>
        <span className="spacer" />
        <span className="field">Arrows or swipe</span>
      </Controls>

      <div className="tw-board" ref={boardRef}>
        <div className="tw-grid">{Array.from({ length: 16 }).map((_, i) => <div key={i} className="tw-cell" />)}</div>
        <div className="tw-tiles">
          {grid.map((row, r) =>
            row.map((v, c) =>
              v ? (
                <div
                  key={`${r}-${c}`}
                  className={clsx('tw-tile', newest && newest[0] === r && newest[1] === c && 'new', isMerged(r, c) && 'merged')}
                  data-v={v}
                  style={{ gridColumn: c + 1, gridRow: r + 1 }}
                >
                  {v}
                </div>
              ) : null
            )
          )}
        </div>
      </div>

      <WinBanner
        show={gameOver || won}
        onAgain={gameOver ? newGame : () => setWon(false)}
        againLabel={gameOver ? 'Play again' : 'Keep going'}
      >
        {gameOver
          ? <><strong>Game over.</strong> Score {score} · {moves} moves. Best: {best}.</>
          : <><strong>You hit 2048!</strong> Keep going for a higher tile.</>}
      </WinBanner>
    </GameShell>
  )
}
