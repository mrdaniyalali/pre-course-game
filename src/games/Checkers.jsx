import TurnGame from './TurnGame.jsx'
import CheckersBoard from './boards/CheckersBoard.jsx'

export default function Checkers() {
  return (
    <TurnGame
      engineId="checkers"
      Board={CheckersBoard}
      accent="rose"
      glyph="⛂"
      title="Checkers"
      tagline="Jump, chain, crown your kings."
      seatNames={['Light', 'Dark']}
    />
  )
}
