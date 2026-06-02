// Single source of truth for game metadata — drives the landing page, nav,
// and routes. `multiplayer: true` games support online room codes + same-screen.

export const GAMES = [
  // ---- single player ----
  {
    id: 'memory', path: '/memory', name: 'Memory Match', glyph: '◆', accent: 'violet',
    blurb: 'Find every pair before the clock bites. Chain combos for big scores.',
    multiplayer: false,
  },
  {
    id: 'words', path: '/words', name: 'Word Search', glyph: 'W', accent: 'teal',
    blurb: 'Eight directions, five themes. Sweep the grid against the clock.',
    multiplayer: false,
  },
  {
    id: '2048', path: '/2048', name: '2048', glyph: '2⁰', accent: 'amber',
    blurb: 'Slide, merge twins, chase the 2048 tile — with undo when you slip.',
    multiplayer: false,
  },
  {
    id: 'mines', path: '/mines', name: 'Minesweeper', glyph: '✱', accent: 'rose',
    blurb: 'Read the numbers, flag the mines, clear the field, beat the timer.',
    multiplayer: false,
  },
  // ---- versus (online room codes + same screen) ----
  {
    id: 'tictactoe', path: '/tictactoe', name: 'Tic-Tac-Toe', glyph: '#', accent: 'violet',
    blurb: 'Three in a row. Play a friend online or on one screen.',
    multiplayer: true,
  },
  {
    id: 'connect4', path: '/connect4', name: 'Connect 4', glyph: '●', accent: 'amber',
    blurb: 'Drop discs, stack four in a line. Live versus a friend.',
    multiplayer: true,
  },
  {
    id: 'chess', path: '/chess', name: 'Chess', glyph: '♞', accent: 'violet',
    blurb: 'Full rules — castling, en passant, checkmate. Live versus a friend.',
    multiplayer: true,
  },
  {
    id: 'checkers', path: '/checkers', name: 'Checkers', glyph: '⛂', accent: 'rose',
    blurb: 'Forced jumps, multi-captures, crowned kings. Online or same screen.',
    multiplayer: true,
  },
  {
    id: 'battleship', path: '/battleship', name: 'Battleship', glyph: '⚓', accent: 'amber',
    blurb: 'Hide your fleet, fire across the net. Online only (hidden ships).',
    multiplayer: true,
  },
  {
    id: 'hangman', path: '/hangman', name: 'Hangman', glyph: '?', accent: 'teal',
    blurb: 'Race to guess letters and out-score your rival. Online or same screen.',
    multiplayer: true,
  },
]

export const getGame = (id) => GAMES.find((g) => g.id === id)
