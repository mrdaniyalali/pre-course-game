import TurnGame from './TurnGame.jsx'
import TicTacToeBoard from './boards/TicTacToeBoard.jsx'

export default function TicTacToe() {
  return (
    <TurnGame
      engineId="tictactoe"
      Board={TicTacToeBoard}
      accent="violet"
      glyph="#"
      title="Tic-Tac-Toe"
      tagline="Three in a row. First blood."
      seatNames={['✕ Player', 'O Player']}
    />
  )
}
