import TurnGame from './TurnGame.jsx'
import Connect4Board from './boards/Connect4Board.jsx'

export default function Connect4() {
  return (
    <TurnGame
      engineId="connect4"
      Board={Connect4Board}
      accent="amber"
      glyph="●"
      title="Connect 4"
      tagline="Drop, stack, four in a line."
      seatNames={['Red', 'Yellow']}
    />
  )
}
