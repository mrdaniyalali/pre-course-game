import { clsx } from '../../lib/helpers.js'

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
const MAX_WRONG = 7

// `word` is the real word locally, or masked ('*' for unrevealed) when online.
// On game-over the engine reveals the full word, so we show every letter.
export default function HangmanBoard({ state, result, disabled, onMove }) {
  const { word, guessed, wrong, scores } = state
  const done = result?.done
  const reveal = (ch) => {
    if (ch === '*') return '' // still hidden online
    if (done || guessed.includes(ch)) return ch
    return ''
  }
  const wrongLetters = guessed.filter((l) => !word.includes(l))
  const lives = MAX_WRONG - wrong

  return (
    <div className="hm">
      <div className="hm-lives" aria-label={`${lives} guesses left`}>
        {Array.from({ length: MAX_WRONG }).map((_, i) => (
          <span key={i} className={'hm-heart' + (i < lives ? '' : ' gone')}>{i < lives ? '◆' : '◇'}</span>
        ))}
      </div>

      <div className="hm-word">
        {[...word].map((ch, i) => (
          <span key={i} className="hm-slot">{reveal(ch)}</span>
        ))}
      </div>

      <div className="hm-scores">
        <span className="seat-chip seat-0">P1 · {scores[0]}</span>
        <span className="seat-chip seat-1">P2 · {scores[1]}</span>
        {wrongLetters.length > 0 && <span className="hm-missed">missed: {wrongLetters.join(' ')}</span>}
      </div>

      <div className="hm-keys">
        {ALPHA.map((L) => {
          const used = guessed.includes(L)
          const hit = used && word.includes(L)
          return (
            <button
              key={L}
              type="button"
              className={clsx('hm-key', used && (hit ? 'hit' : 'miss'))}
              disabled={used || disabled}
              onClick={() => onMove({ letter: L })}
            >
              {L}
            </button>
          )
        })}
      </div>
    </div>
  )
}
