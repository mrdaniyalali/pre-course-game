import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Memory from './games/Memory.jsx'
import WordSearch from './games/WordSearch.jsx'
import Game2048 from './games/Game2048.jsx'
import Minesweeper from './games/Minesweeper.jsx'
import TicTacToe from './games/TicTacToe.jsx'
import Connect4 from './games/Connect4.jsx'
import Chess from './games/Chess.jsx'
import Checkers from './games/Checkers.jsx'
import Battleship from './games/Battleship.jsx'
import Hangman from './games/Hangman.jsx'
import Leaderboard from './pages/Leaderboard.jsx'
import Groups from './pages/Groups.jsx'
import Friends from './pages/Friends.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/memory" element={<Memory />} />
        <Route path="/words" element={<WordSearch />} />
        <Route path="/2048" element={<Game2048 />} />
        <Route path="/mines" element={<Minesweeper />} />
        <Route path="/tictactoe" element={<TicTacToe />} />
        <Route path="/connect4" element={<Connect4 />} />
        <Route path="/chess" element={<Chess />} />
        <Route path="/checkers" element={<Checkers />} />
        <Route path="/battleship" element={<Battleship />} />
        <Route path="/hangman" element={<Hangman />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
