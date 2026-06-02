// Co-op-ish Hangman: players alternate guessing letters of a shared secret word.
// Each correct letter scores for whoever guessed it; when the word is solved the
// higher score wins (tie = draw). Run out of guesses and you both lose.
//
// The word is hidden over the network via `view()` so the guesser's client never
// receives unrevealed letters.

const WORDS = [
  'GALAXY', 'PYTHON', 'GUITAR', 'VOLCANO', 'PENGUIN', 'DIAMOND', 'JOURNEY',
  'CAPTAIN', 'MAGNET', 'ORBIT', 'PUZZLE', 'ROCKET', 'WIZARD', 'JUNGLE',
  'CACTUS', 'FALCON', 'HARBOR', 'LANTERN', 'MARBLE', 'NOMAD', 'QUARTZ',
  'RHYTHM', 'SAPPHIRE', 'TORNADO', 'VELVET', 'WALRUS', 'ZEPHYR',
]
const MAX_WRONG = 7

function pickWord() {
  return WORDS[(Math.random() * WORDS.length) | 0]
}

function maskWord(word, guessed) {
  const set = new Set(guessed)
  return [...word].map((ch) => (set.has(ch) ? ch : '*')).join('')
}

export const hangman = {
  id: 'hangman',
  name: 'Hangman',
  seats: 2,
  maxWrong: MAX_WRONG,

  init() {
    return { word: pickWord(), guessed: [], wrong: 0, scores: [0, 0], turn: 0 }
  },

  // move = { letter: 'A'..'Z' }
  apply(state, move, seat) {
    if (state.turn !== seat) throw new Error('Not your turn')
    const letter = String(move.letter || '').toUpperCase()
    if (!/^[A-Z]$/.test(letter)) throw new Error('Pick a letter')
    if (state.guessed.includes(letter)) throw new Error('Already guessed')
    const guessed = [...state.guessed, letter]
    const scores = state.scores.slice()
    let wrong = state.wrong
    if (state.word.includes(letter)) {
      // score one point per occurrence revealed
      scores[seat] += [...state.word].filter((c) => c === letter).length
    } else {
      wrong += 1
    }
    return { ...state, guessed, scores, wrong, turn: seat === 0 ? 1 : 0 }
  },

  result(state) {
    const solved = [...state.word].every((c) => state.guessed.includes(c))
    if (solved) {
      const [a, b] = state.scores
      if (a === b) return { done: true, winner: null, draw: true }
      return { done: true, winner: a > b ? 0 : 1, draw: false }
    }
    if (state.wrong >= MAX_WRONG) return { done: true, winner: null, draw: true }
    return { done: false, winner: null, draw: false }
  },

  // Hide unrevealed letters from the network until the game is over.
  view(state) {
    const r = this.result(state)
    if (r.done) return state // reveal the word at the end
    return { ...state, word: maskWord(state.word, state.guessed) }
  },
}
