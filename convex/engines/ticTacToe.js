// Pure Tic-Tac-Toe rules. Framework-agnostic so the same code validates moves
// on the Convex server and runs local (same-screen) games on the client.

export const ticTacToe = {
  id: 'tictactoe',
  name: 'Tic-Tac-Toe',
  seats: 2,
  marks: ['X', 'O'],

  init() {
    return { board: Array(9).fill(null), turn: 0 }
  },

  // move = { cell: 0..8 }
  apply(state, move, seat) {
    if (state.turn !== seat) throw new Error('Not your turn')
    const { cell } = move
    if (typeof cell !== 'number' || cell < 0 || cell > 8) throw new Error('Bad cell')
    if (state.board[cell] != null) throw new Error('Cell taken')
    const board = state.board.slice()
    board[cell] = seat
    return { board, turn: seat === 0 ? 1 : 0 }
  },

  result(state) {
    const L = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ]
    for (const [a, b, c] of L) {
      const v = state.board[a]
      if (v != null && v === state.board[b] && v === state.board[c]) {
        return { done: true, winner: v, draw: false, line: [a, b, c] }
      }
    }
    if (state.board.every((x) => x != null)) return { done: true, winner: null, draw: true }
    return { done: false, winner: null, draw: false }
  },
}
