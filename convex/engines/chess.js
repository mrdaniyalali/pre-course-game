// Full-rules chess. seat 0 = White (bottom, rows 6-7), seat 1 = Black (rows 0-1).
// Supports all piece moves, check, checkmate, stalemate, castling, en passant,
// and promotion. The same engine validates moves on the Convex server.

const N = 8
const inB = (r, c) => r >= 0 && r < N && c >= 0 && c < N
const isP = (p, t, c) => p && p.t === t && p.c === c
const other = (c) => (c === 0 ? 1 : 0)

const KN = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]
const KING = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
const DIAG = [[-1, -1], [-1, 1], [1, -1], [1, 1]]
const ORTH = [[-1, 0], [1, 0], [0, -1], [0, 1]]

function init() {
  const back = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r']
  const board = Array.from({ length: N }, () => Array(N).fill(null))
  for (let c = 0; c < N; c++) {
    board[0][c] = { t: back[c], c: 1 }
    board[1][c] = { t: 'p', c: 1 }
    board[6][c] = { t: 'p', c: 0 }
    board[7][c] = { t: back[c], c: 0 }
  }
  return {
    board,
    turn: 0,
    castle: [{ k: true, q: true }, { k: true, q: true }],
    ep: null,
    last: null,
  }
}

function cloneBoard(b) { return b.map((row) => row.map((p) => (p ? { ...p } : null))) }

function findKing(board, col) {
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (isP(board[r][c], 'k', col)) return [r, c]
  return null
}

function isAttacked(board, r, c, by) {
  if (by === 0) {
    if (inB(r + 1, c - 1) && isP(board[r + 1][c - 1], 'p', 0)) return true
    if (inB(r + 1, c + 1) && isP(board[r + 1][c + 1], 'p', 0)) return true
  } else {
    if (inB(r - 1, c - 1) && isP(board[r - 1][c - 1], 'p', 1)) return true
    if (inB(r - 1, c + 1) && isP(board[r - 1][c + 1], 'p', 1)) return true
  }
  for (const [dr, dc] of KN) { const nr = r + dr, nc = c + dc; if (inB(nr, nc) && isP(board[nr][nc], 'n', by)) return true }
  for (const [dr, dc] of KING) { const nr = r + dr, nc = c + dc; if (inB(nr, nc) && isP(board[nr][nc], 'k', by)) return true }
  for (const [dr, dc] of DIAG) {
    let nr = r + dr, nc = c + dc
    while (inB(nr, nc)) { const p = board[nr][nc]; if (p) { if (p.c === by && (p.t === 'b' || p.t === 'q')) return true; break } nr += dr; nc += dc }
  }
  for (const [dr, dc] of ORTH) {
    let nr = r + dr, nc = c + dc
    while (inB(nr, nc)) { const p = board[nr][nc]; if (p) { if (p.c === by && (p.t === 'r' || p.t === 'q')) return true; break } nr += dr; nc += dc }
  }
  return false
}

function promos(from, to) {
  return ['q', 'r', 'b', 'n'].map((promo) => ({ from, to, promo }))
}

function pseudoMoves(state, seat) {
  const { board, ep, castle } = state
  const moves = []
  const col = seat
  const promoRow = col === 0 ? 0 : 7
  const startRow = col === 0 ? 6 : 1
  const dir = col === 0 ? -1 : 1

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const p = board[r][c]
      if (!p || p.c !== col) continue
      const from = [r, c]
      if (p.t === 'p') {
        const fr = r + dir
        if (inB(fr, c) && board[fr][c] == null) {
          if (fr === promoRow) moves.push(...promos(from, [fr, c]))
          else moves.push({ from, to: [fr, c] })
          if (r === startRow && board[r + 2 * dir][c] == null) moves.push({ from, to: [r + 2 * dir, c], flag: 'double' })
        }
        for (const dc of [-1, 1]) {
          const nr = r + dir, nc = c + dc
          if (!inB(nr, nc)) continue
          const tp = board[nr][nc]
          if (tp && tp.c !== col) {
            if (nr === promoRow) moves.push(...promos(from, [nr, nc]))
            else moves.push({ from, to: [nr, nc] })
          } else if (ep && nr === ep[0] && nc === ep[1]) {
            moves.push({ from, to: [nr, nc], flag: 'ep' })
          }
        }
      } else if (p.t === 'n') {
        for (const [dr, dc] of KN) {
          const nr = r + dr, nc = c + dc
          if (inB(nr, nc) && (!board[nr][nc] || board[nr][nc].c !== col)) moves.push({ from, to: [nr, nc] })
        }
      } else if (p.t === 'k') {
        for (const [dr, dc] of KING) {
          const nr = r + dr, nc = c + dc
          if (inB(nr, nc) && (!board[nr][nc] || board[nr][nc].c !== col)) moves.push({ from, to: [nr, nc] })
        }
        // castling
        const home = col === 0 ? 7 : 0
        if (r === home && c === 4 && !isAttacked(board, home, 4, other(col))) {
          if (castle[col].k && !board[home][5] && !board[home][6] && isP(board[home][7], 'r', col) &&
              !isAttacked(board, home, 5, other(col)) && !isAttacked(board, home, 6, other(col))) {
            moves.push({ from, to: [home, 6], flag: 'castleK' })
          }
          if (castle[col].q && !board[home][1] && !board[home][2] && !board[home][3] && isP(board[home][0], 'r', col) &&
              !isAttacked(board, home, 3, other(col)) && !isAttacked(board, home, 2, other(col))) {
            moves.push({ from, to: [home, 2], flag: 'castleQ' })
          }
        }
      } else {
        const rays = p.t === 'b' ? DIAG : p.t === 'r' ? ORTH : [...DIAG, ...ORTH]
        for (const [dr, dc] of rays) {
          let nr = r + dr, nc = c + dc
          while (inB(nr, nc)) {
            const tp = board[nr][nc]
            if (!tp) moves.push({ from, to: [nr, nc] })
            else { if (tp.c !== col) moves.push({ from, to: [nr, nc] }); break }
            nr += dr; nc += dc
          }
        }
      }
    }
  }
  return moves
}

function applyRaw(state, m) {
  const board = cloneBoard(state.board)
  const [fr, fc] = m.from
  const [tr, tc] = m.to
  const piece = board[fr][fc]
  const col = piece.c
  const castle = [{ ...state.castle[0] }, { ...state.castle[1] }]
  board[fr][fc] = null

  if (m.flag === 'ep') board[fr][tc] = null // captured pawn is beside the mover
  const moved = { ...piece }
  if (m.promo) moved.t = m.promo
  board[tr][tc] = moved

  if (m.flag === 'castleK') { board[tr][5] = board[tr][7]; board[tr][7] = null }
  if (m.flag === 'castleQ') { board[tr][3] = board[tr][0]; board[tr][0] = null }

  if (piece.t === 'k') { castle[col].k = false; castle[col].q = false }
  const clearRight = (r, c) => {
    if (r === 7 && c === 0) castle[0].q = false
    if (r === 7 && c === 7) castle[0].k = false
    if (r === 0 && c === 0) castle[1].q = false
    if (r === 0 && c === 7) castle[1].k = false
  }
  if (piece.t === 'r') clearRight(fr, fc)
  clearRight(tr, tc) // a rook captured on its home square loses that right

  const ep = m.flag === 'double' ? [(fr + tr) / 2, fc] : null
  return { board, turn: other(col), castle, ep, last: [m.from, m.to] }
}

function legalMoves(state, seat) {
  const out = []
  for (const m of pseudoMoves(state, seat)) {
    const next = applyRaw(state, m)
    const k = findKing(next.board, seat)
    if (k && !isAttacked(next.board, k[0], k[1], other(seat))) out.push(m)
  }
  return out
}

export const chess = {
  id: 'chess',
  name: 'Chess',
  seats: 2,
  init,

  // move = { from:[r,c], to:[r,c], promo? }
  apply(state, move, seat) {
    if (state.turn !== seat) throw new Error('Not your turn')
    const legal = legalMoves(state, seat)
    const cands = legal.filter(
      (m) => m.from[0] === move.from[0] && m.from[1] === move.from[1] && m.to[0] === move.to[0] && m.to[1] === move.to[1]
    )
    if (!cands.length) throw new Error('Illegal move')
    const chosen = cands.length === 1 ? cands[0] : (cands.find((m) => m.promo === (move.promo || 'q')) || cands[0])
    return applyRaw(state, chosen)
  },

  result(state) {
    const seat = state.turn
    const legal = legalMoves(state, seat)
    if (legal.length) return { done: false, winner: null, draw: false }
    const k = findKing(state.board, seat)
    const inCheck = k && isAttacked(state.board, k[0], k[1], other(seat))
    if (inCheck) return { done: true, winner: other(seat), draw: false }
    return { done: true, winner: null, draw: true } // stalemate
  },

  // UI helper: legal destination squares for a given piece (not secret).
  movesFrom(state, r, c) {
    if (state.board[r][c]?.c !== state.turn) return []
    return legalMoves(state, state.turn).filter((m) => m.from[0] === r && m.from[1] === c)
  },

  inCheck(state, seat) {
    const k = findKing(state.board, seat)
    return k ? isAttacked(state.board, k[0], k[1], other(seat)) : false
  },
}
