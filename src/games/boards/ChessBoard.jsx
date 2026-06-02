import { useState } from 'react'
import { clsx } from '../../lib/helpers.js'
import { chess } from '../../../convex/engines/chess.js'

const GLYPH = {
  0: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  1: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' },
}

export default function ChessBoard({ state, disabled, mySeat, onMove }) {
  const [sel, setSel] = useState(null)
  const [promo, setPromo] = useState(null) // { from, to }
  const board = state.board
  const last = state.last

  const targets = sel ? chess.movesFrom(state, sel[0], sel[1]) : []
  const targetSet = new Set(targets.map((m) => `${m.to[0]},${m.to[1]}`))

  const onCell = (r, c) => {
    if (disabled || promo) return
    if (sel && targetSet.has(`${r},${c}`)) {
      const p = board[sel[0]][sel[1]]
      const lastRow = mySeat === 0 ? 0 : 7
      if (p.t === 'p' && r === lastRow) { setPromo({ from: sel, to: [r, c] }); return }
      onMove({ from: sel, to: [r, c] })
      setSel(null)
      return
    }
    const p = board[r][c]
    if (p && p.c === mySeat) setSel([r, c])
    else setSel(null)
  }

  const choosePromo = (t) => {
    onMove({ from: promo.from, to: promo.to, promo: t })
    setPromo(null)
    setSel(null)
  }

  const inCheckSeat = chess.inCheck(state, state.turn) ? state.turn : -1
  const kingPos = inCheckSeat >= 0 ? findKing(board, inCheckSeat) : null

  return (
    <div className="cs-wrap">
      <div className="cs-board">
        {board.map((row, r) =>
          row.map((p, c) => {
            const dark = (r + c) % 2 === 1
            const isSel = sel && sel[0] === r && sel[1] === c
            const isTarget = targetSet.has(`${r},${c}`)
            const isLast = last && ((last[0][0] === r && last[0][1] === c) || (last[1][0] === r && last[1][1] === c))
            const isCheck = kingPos && kingPos[0] === r && kingPos[1] === c
            return (
              <button
                key={`${r}-${c}`}
                type="button"
                className={clsx('cs-cell', dark ? 'dark' : 'light', isSel && 'sel', isLast && 'last', isCheck && 'check')}
                onClick={() => onCell(r, c)}
              >
                {isTarget && <span className={'cs-dot' + (p ? ' cap' : '')} />}
                {p && <span className={'cs-piece seat-' + p.c}>{GLYPH[p.c][p.t]}</span>}
              </button>
            )
          })
        )}
      </div>

      {promo && (
        <div className="promo-pick" role="dialog" aria-label="Choose promotion">
          <span>Promote to:</span>
          {['q', 'r', 'b', 'n'].map((t) => (
            <button key={t} type="button" className="promo-btn" onClick={() => choosePromo(t)}>
              {GLYPH[mySeat][t]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function findKing(board, col) {
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
    const p = board[r][c]
    if (p && p.t === 'k' && p.c === col) return [r, c]
  }
  return null
}
