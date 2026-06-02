import TurnGame from './TurnGame.jsx'
import HangmanBoard from './boards/HangmanBoard.jsx'

export default function Hangman() {
  return (
    <TurnGame
      engineId="hangman"
      Board={HangmanBoard}
      accent="teal"
      glyph="?"
      title="Hangman"
      tagline="Guess letters. Out-score your rival."
      seatNames={['Player 1', 'Player 2']}
    />
  )
}
