// Engine registry. Add a new turn-based game here and it becomes available to
// both the client (local play) and the Convex server (online validation).
import { ticTacToe } from './ticTacToe.js'
import { connect4 } from './connect4.js'
import { hangman } from './hangman.js'
import { checkers } from './checkers.js'
import { chess } from './chess.js'
import { battleship } from './battleship.js'

export const ENGINES = {
  [ticTacToe.id]: ticTacToe,
  [connect4.id]: connect4,
  [hangman.id]: hangman,
  [checkers.id]: checkers,
  [chess.id]: chess,
  [battleship.id]: battleship,
}

export function getEngine(id) {
  const e = ENGINES[id]
  if (!e) throw new Error(`Unknown game engine: ${id}`)
  return e
}
