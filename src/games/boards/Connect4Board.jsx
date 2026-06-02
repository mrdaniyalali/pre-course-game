import { clsx } from '../../lib/helpers.js'

// Presentational. Tapping anywhere in a column drops a disc -> onMove({ col }).
export default function Connect4Board({ state, result, onMove, disabled }) {
  const cols = state.board[0].length
  const winSet = new Set((result?.line || []).map(([r, c]) => `${r},${c}`))
  const colFull = (c) => state.board[0][c] != null

  return (
    <div className="c4-board" style={{ '--cols': cols }}>
      {Array.from({ length: cols }).map((_, c) => (
        <button
          key={c}
          type="button"
          className="c4-col"
          onClick={() => !disabled && !colFull(c) && onMove({ col: c })}
          disabled={disabled || colFull(c)}
          aria-label={`Drop in column ${c + 1}`}
        >
          {state.board.map((row, r) => (
            <span
              key={r}
              className={clsx('c4-cell', row[c] != null && `seat-${row[c]}`, winSet.has(`${r},${c}`) && 'win')}
            />
          ))}
        </button>
      ))}
    </div>
  )
}
