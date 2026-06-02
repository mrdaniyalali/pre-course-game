// 8x8 Checkers / Draughts (American rules): men move/capture diagonally forward,
// kings in all four diagonals, captures are mandatory, multi-jumps chain, and a
// man reaching the far row is crowned (which ends the turn).
//
// seat 0 = light pieces, start at the bottom (rows 5-7), move UP (row -1).
// seat 1 = dark pieces, start at the top (rows 0-2), move DOWN (row +1).

const N = 8

function init() {
  const board = Array.from({ length: N }, () => Array(N).fill(null))
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if ((r + c) % 2 !== 1) continue
      if (r < 3) board[r][c] = { c: 1, k: false }
      else if (r > 4) board[r][c] = { c: 0, k: false }
    }
  }
  return { board, turn: 0, mustContinue: null }
}

const inB = (r, c) => r >= 0 && r < N && c >= 0 && c < N

function dirsFor(piece) {
  if (piece.k) return [[-1, -1], [-1, 1], [1, -1], [1, 1]]
  return piece.c === 0 ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]]
}

function pieceJumps(board, r, c) {
  const p = board[r][c]
  if (!p) return []
  const out = []
  for (const [dr, dc] of dirsFor(p)) {
    const mr = r + dr, mc = c + dc       // square jumped over
    const lr = r + 2 * dr, lc = c + 2 * dc // landing
    if (!inB(lr, lc)) continue
    const mid = board[mr][mc]
    if (mid && mid.c !== p.c && board[lr][lc] == null) {
      out.push({ from: [r, c], to: [lr, lc], captured: [mr, mc] })
    }
  }
  return out
}

function pieceSteps(board, r, c) {
  const p = board[r][c]
  if (!p) return []
  const out = []
  for (const [dr, dc] of dirsFor(p)) {
    const nr = r + dr, nc = c + dc
    if (inB(nr, nc) && board[nr][nc] == null) out.push({ from: [r, c], to: [nr, nc] })
  }
  return out
}

function allMoves(state, seat) {
  const { board, mustContinue } = state
  if (mustContinue) return pieceJumps(board, mustContinue[0], mustContinue[1])
  const jumps = []
  const steps = []
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const p = board[r][c]
      if (!p || p.c !== seat) continue
      jumps.push(...pieceJumps(board, r, c))
      steps.push(...pieceSteps(board, r, c))
    }
  }
  return jumps.length ? jumps : steps // captures are mandatory
}

function isCrownRow(seat, r) {
  return seat === 0 ? r === 0 : r === N - 1
}

export const checkers = {
  id: 'checkers',
  name: 'Checkers',
  seats: 2,

  init,

  // move = { from:[r,c], to:[r,c] }
  apply(state, move, seat) {
    if (state.turn !== seat) throw new Error('Not your turn')
    const legal = allMoves(state, seat)
    const m = legal.find(
      (x) => x.from[0] === move.from[0] && x.from[1] === move.from[1] && x.to[0] === move.to[0] && x.to[1] === move.to[1]
    )
    if (!m) throw new Error('Illegal move')

    const board = state.board.map((row) => row.map((cell) => (cell ? { ...cell } : null)))
    const piece = board[m.from[0]][m.from[1]]
    board[m.from[0]][m.from[1]] = null
    if (m.captured) board[m.captured[0]][m.captured[1]] = null

    let crowned = false
    if (!piece.k && isCrownRow(seat, m.to[0])) { piece.k = true; crowned = true }
    board[m.to[0]][m.to[1]] = piece

    // chain multi-jumps for the same piece unless it was just crowned
    if (m.captured && !crowned) {
      const more = pieceJumps(board, m.to[0], m.to[1])
      if (more.length) return { board, turn: seat, mustContinue: [m.to[0], m.to[1]] }
    }
    return { board, turn: seat === 0 ? 1 : 0, mustContinue: null }
  },

  result(state) {
    const seat = state.turn
    let has = false
    for (let r = 0; r < N && !has; r++) for (let c = 0; c < N && !has; c++) {
      if (state.board[r][c]?.c === seat) has = true
    }
    if (!has) return { done: true, winner: seat === 0 ? 1 : 0, draw: false }
    if (allMoves(state, seat).length === 0) return { done: true, winner: seat === 0 ? 1 : 0, draw: false }
    return { done: false, winner: null, draw: false }
  },

  // expose legal destinations for the UI (not secret)
  movesFrom(state, r, c) {
    if (state.turn == null) return []
    const all = allMoves(state, state.turn)
    return all.filter((m) => m.from[0] === r && m.from[1] === c)
  },
}
