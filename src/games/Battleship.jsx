import TurnGame from './TurnGame.jsx'
import BattleshipBoard from './boards/BattleshipBoard.jsx'

export default function Battleship() {
  return (
    <TurnGame
      engineId="battleship"
      Board={BattleshipBoard}
      accent="amber"
      glyph="⚓"
      title="Battleship"
      tagline="Hide your fleet. Sink theirs."
      seatNames={['Player 1', 'Player 2']}
      modes={['online']}
    />
  )
}
