// Pure Connect 4 rules. 6 rows x 7 cols, drop a disc into a column.

const ROWS = 6
const COLS = 7

export const connect4 = {
  id: 'connect4',
  name: 'Connect 4',
  seats: 2,
  rows: ROWS,
  cols: COLS,

  init() {
    // board[r][c], row 0 = top. null = empty, 0/1 = seat
    return { board: Array.from({ length: ROWS }, () => Array(COLS).fill(null)), turn: 0, last: null }
  },

  // move = { col: 0..6 }
  apply(state, move, seat) {
    if (state.turn !== seat) throw new Error('Not your turn')
    const { col } = move
    if (typeof col !== 'number' || col < 0 || col >= COLS) throw new Error('Bad column')
    let row = -1
    for (let r = ROWS - 1; r >= 0; r--) {
      if (state.board[r][col] == null) { row = r; break }
    }
    if (row === -1) throw new Error('Column full')
    const board = state.board.map((r) => r.slice())
    board[row][col] = seat
    return { board, turn: seat === 0 ? 1 : 0, last: [row, col] }
  },

  result(state) {
    const b = state.board
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const v = b[r][c]
        if (v == null) continue
        for (const [dr, dc] of dirs) {
          const cells = [[r, c]]
          for (let k = 1; k < 4; k++) {
            const nr = r + dr * k, nc = c + dc * k
            if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || b[nr][nc] !== v) break
            cells.push([nr, nc])
          }
          if (cells.length === 4) return { done: true, winner: v, draw: false, line: cells }
        }
      }
    }
    if (b.every((row) => row.every((x) => x != null))) return { done: true, winner: null, draw: true }
    return { done: false, winner: null, draw: false }
  },
}
