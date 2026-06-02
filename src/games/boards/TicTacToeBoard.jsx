import { clsx } from '../../lib/helpers.js'

const MARK = ['✕', 'O']

// Presentational only. Calls onMove({ cell }) when a free cell is tapped.
export default function TicTacToeBoard({ state, result, onMove, disabled }) {
  const line = result?.line || []
  return (
    <div className="ttt-board" role="grid" aria-label="Tic-Tac-Toe board">
      {state.board.map((v, i) => (
        <button
          key={i}
          type="button"
          className={clsx('ttt-cell', v != null && `seat-${v}`, line.includes(i) && 'win')}
          onClick={() => v == null && !disabled && onMove({ cell: i })}
          disabled={v != null || disabled}
          aria-label={v == null ? `Empty cell ${i + 1}` : `Cell ${i + 1}: ${MARK[v]}`}
        >
          {v != null ? MARK[v] : ''}
        </button>
      ))}
    </div>
  )
}
