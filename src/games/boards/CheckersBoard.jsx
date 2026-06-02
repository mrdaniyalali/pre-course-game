import { useState } from 'react'
import { clsx } from '../../lib/helpers.js'
import { checkers } from '../../../convex/engines/checkers.js'

export default function CheckersBoard({ state, disabled, mySeat, onMove }) {
  const [sel, setSel] = useState(state.mustContinue || null)
  const board = state.board

  // when a multi-jump is forced, lock selection to that piece
  const active = state.mustContinue || sel
  const targets = active ? checkers.movesFrom(state, active[0], active[1]) : []
  const targetSet = new Set(targets.map((m) => `${m.to[0]},${m.to[1]}`))

  const onCell = (r, c) => {
    if (disabled) return
    if (active && targetSet.has(`${r},${c}`)) {
      onMove({ from: active, to: [r, c] })
      setSel(null)
      return
    }
    const p = board[r][c]
    if (p && p.c === mySeat && !state.mustContinue) setSel([r, c])
  }

  return (
    <div className="ck-board">
      {board.map((row, r) =>
        row.map((p, c) => {
          const dark = (r + c) % 2 === 1
          const isSel = active && active[0] === r && active[1] === c
          const isTarget = targetSet.has(`${r},${c}`)
          return (
            <button
              key={`${r}-${c}`}
              type="button"
              className={clsx('ck-cell', dark ? 'dark' : 'light', isSel && 'sel', isTarget && 'target')}
              onClick={() => onCell(r, c)}
              disabled={disabled && !isTarget}
            >
              {p && <span className={clsx('ck-piece', 'seat-' + p.c, p.k && 'king')}>{p.k ? '♛' : ''}</span>}
            </button>
          )
        })
      )}
    </div>
  )
}
