// Battleship with proper hidden information. Each player's ship layout lives in
// the authoritative state but is NEVER sent to the opponent — `view()` redacts
// it server-side, exposing only the shots each side has actually fired.
//
// Flow: 'placing' (both auto-get a random fleet they can Shuffle, then Ready) →
// 'firing' (alternate shots until one fleet is fully sunk).

const SIZE = 10
const SHIPS = [5, 4, 3, 3, 2]
const other = (c) => (c === 0 ? 1 : 0)

function randomFleet() {
  const occupied = new Set()
  const fleet = []
  for (const len of SHIPS) {
    let placed = false
    while (!placed) {
      const horiz = Math.random() < 0.5
      const r = (Math.random() * (horiz ? SIZE : SIZE - len + 1)) | 0
      const c = (Math.random() * (horiz ? SIZE - len + 1 : SIZE)) | 0
      const cells = []
      let ok = true
      for (let i = 0; i < len; i++) {
        const rr = horiz ? r : r + i
        const cc = horiz ? c + i : c
        if (occupied.has(rr + ',' + cc)) { ok = false; break }
        cells.push([rr, cc])
      }
      if (!ok) continue
      cells.forEach(([rr, cc]) => occupied.add(rr + ',' + cc))
      fleet.push({ cells, hits: cells.map(() => false) })
      placed = true
    }
  }
  return fleet
}

function fleetSunk(fleet) {
  return fleet.every((s) => s.hits.every(Boolean))
}

export const battleship = {
  id: 'battleship',
  name: 'Battleship',
  seats: 2,
  size: SIZE,
  onlineOnly: true,

  init() {
    return {
      phase: 'placing',
      turn: 0,
      size: SIZE,
      fleets: [randomFleet(), randomFleet()],
      ready: [false, false],
      shots: [[], []], // shots[seat] = [{r,c,hit}] fired onto the opponent
    }
  },

  // move = { type:'shuffle' | 'ready' | 'fire', r?, c? }
  apply(state, move, seat) {
    const s = JSON.parse(JSON.stringify(state))
    if (s.phase === 'placing') {
      if (move.type === 'shuffle') {
        if (s.ready[seat]) throw new Error('Already ready')
        s.fleets[seat] = randomFleet()
        return s
      }
      if (move.type === 'ready') {
        s.ready[seat] = true
        if (s.ready[0] && s.ready[1]) { s.phase = 'firing'; s.turn = 0 }
        return s
      }
      throw new Error('Place your fleet first')
    }
    // firing
    if (move.type !== 'fire') throw new Error('Fire a shot')
    if (s.turn !== seat) throw new Error('Not your turn')
    const { r, c } = move
    if (r == null || c == null || r < 0 || r >= SIZE || c < 0 || c >= SIZE) throw new Error('Off the grid')
    if (s.shots[seat].some((x) => x.r === r && x.c === c)) throw new Error('Already fired there')
    const opp = other(seat)
    let hit = false
    for (const ship of s.fleets[opp]) {
      const i = ship.cells.findIndex(([sr, sc]) => sr === r && sc === c)
      if (i >= 0) { ship.hits[i] = true; hit = true; break }
    }
    s.shots[seat].push({ r, c, hit })
    s.turn = other(seat) // alternate every shot
    return s
  },

  result(state) {
    if (state.phase !== 'firing') return { done: false, winner: null, draw: false }
    if (fleetSunk(state.fleets[0])) return { done: true, winner: 1, draw: false }
    if (fleetSunk(state.fleets[1])) return { done: true, winner: 0, draw: false }
    return { done: false, winner: null, draw: false }
  },

  view(state, seat) {
    const opp = other(seat)
    return {
      phase: state.phase,
      turn: state.turn,
      size: state.size,
      ready: state.ready,
      myFleet: state.fleets[seat],         // own ships (visible to you)
      incoming: state.shots[opp],          // opponent's shots on your waters
      outgoing: state.shots[seat],         // your shots on their waters
      oppSunk: state.fleets[opp].filter((s) => s.hits.every(Boolean)).length,
      oppShips: state.fleets[opp].length,
    }
  },
}
