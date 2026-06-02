import TurnGame from './TurnGame.jsx'
import ChessBoard from './boards/ChessBoard.jsx'

export default function Chess() {
  return (
    <TurnGame
      engineId="chess"
      Board={ChessBoard}
      accent="violet"
      glyph="♞"
      title="Chess"
      tagline="Full rules. Checkmate the king."
      seatNames={['White', 'Black']}
    />
  )
}
