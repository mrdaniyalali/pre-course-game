# Mini Game Suite

My pre-course assignment. It's a single HTML file with four small games inside.

## What it does

You open `index.html` in a browser and you get four tabs:

- **Memory** — flip cards, match the pairs
- **Words** — word search puzzle, click and drag to find words
- **2048** — slide tiles with arrow keys, merge same numbers
- **Mines** — minesweeper, click to reveal, right-click to flag

There is a dark mode button at the top and a sound toggle. Score and best times get saved in the browser.

## AI tool used

Claude (by Anthropic). I used it through Claude Code.

## Prompts I used

I didn't write one big prompt. I built it step by step:

1. Read the assignment PDF and tell me what's needed.
2. Make a simple memory card game in one HTML file.
3. Make it look nicer, but not too fancy.
4. Add a word search game as a second tab.
5. Add 2048 and minesweeper too.
6. Add a button to reveal all cards in the memory game.
7. Add Animals and Food categories to the word search.

After each step I checked the result and asked for fixes.

## Problems I faced

- The first design was too plain. The second one was too much (gradients, glow, confetti). It took a few tries to land somewhere in between.
- I tried adding sudoku but the generator was making invalid puzzles, so I removed it.
- Getting the card flip animation to work needed `transform-style: preserve-3d` and `backface-visibility: hidden` — easy to forget.
- The word search needed straight-line detection in 8 directions. The diagonal check was tricky.

## What I learned

- One HTML file can hold a lot. CSS variables make theming (light/dark) easy.
- LocalStorage is good enough for saving best scores.
- Designing is about removing stuff, not just adding. Simple looks better than busy.
- Working with AI is faster when I ask for small steps and review each one.

## Files

- `index.html` — the games
- `README.md` — this file
