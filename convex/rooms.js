import { mutation, query } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getEngine } from './engines/index.js'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusing chars
function makeCode() {
  let s = ''
  for (let i = 0; i < 4; i++) s += ALPHABET[(Math.random() * ALPHABET.length) | 0]
  return s
}

async function findRoom(ctx, code) {
  return ctx.db
    .query('rooms')
    .withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
    .first()
}

export const create = mutation({
  args: { game: v.string(), playerId: v.string(), name: v.string() },
  handler: async (ctx, { game, playerId, name }) => {
    const engine = getEngine(game)
    // ensure a unique-ish code
    let code = makeCode()
    for (let i = 0; i < 5; i++) {
      const clash = await findRoom(ctx, code)
      if (!clash) break
      code = makeCode()
    }
    await ctx.db.insert('rooms', {
      code,
      game,
      status: 'waiting',
      state: engine.init(),
      seats: [{ playerId, name: name || 'Player 1' }],
      winnerSeat: null,
      draw: false,
      rematchVotes: [],
      updatedAt: Date.now(),
    })
    return { code, seat: 0 }
  },
})

export const join = mutation({
  args: { code: v.string(), playerId: v.string(), name: v.string() },
  handler: async (ctx, { code, playerId, name }) => {
    const room = await findRoom(ctx, code)
    if (!room) throw new ConvexError('Room not found')
    const engine = getEngine(room.game)
    const existing = room.seats.findIndex((s) => s.playerId === playerId)
    if (existing >= 0) return { seat: existing }
    if (room.seats.length >= engine.seats) throw new ConvexError('Room is full')
    const seats = [...room.seats, { playerId, name: name || `Player ${room.seats.length + 1}` }]
    await ctx.db.patch(room._id, {
      seats,
      status: seats.length >= engine.seats ? 'playing' : 'waiting',
      updatedAt: Date.now(),
    })
    return { seat: seats.length - 1 }
  },
})

export const get = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    if (!code) return null
    return await findRoom(ctx, code)
  },
})

// Like `get`, but runs the engine's optional `view()` to redact secret state
// (e.g. Hangman's word, Battleship's ships) for the requesting player.
export const getView = query({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, { code, playerId }) => {
    if (!code) return null
    const room = await findRoom(ctx, code)
    if (!room) return null
    const engine = getEngine(room.game)
    const seat = room.seats.findIndex((s) => s.playerId === playerId)
    const state = engine.view ? engine.view(room.state, seat < 0 ? 0 : seat) : room.state
    return {
      code: room.code,
      game: room.game,
      status: room.status,
      seats: room.seats,
      winnerSeat: room.winnerSeat,
      draw: room.draw,
      state,
    }
  },
})

export const move = mutation({
  args: { code: v.string(), playerId: v.string(), move: v.any() },
  handler: async (ctx, { code, playerId, move }) => {
    const room = await findRoom(ctx, code)
    if (!room) throw new ConvexError('Room not found')
    if (room.status === 'done') throw new ConvexError('Game is over')
    const seat = room.seats.findIndex((s) => s.playerId === playerId)
    if (seat < 0) throw new ConvexError('You are not in this room')
    const engine = getEngine(room.game)
    let nextState
    try {
      nextState = engine.apply(room.state, move, seat)
    } catch (e) {
      throw new ConvexError(e.message || 'Invalid move')
    }
    const result = engine.result(nextState)
    await ctx.db.patch(room._id, {
      state: nextState,
      status: result.done ? 'done' : 'playing',
      winnerSeat: result.draw ? null : result.done ? result.winner : null,
      draw: !!result.draw,
      updatedAt: Date.now(),
    })
    // record a win on the global leaderboard
    if (result.done && !result.draw) {
      const winner = room.seats[result.winner]
      if (winner) {
        await ctx.db.insert('scores', {
          game: room.game,
          name: winner.name,
          value: 1,
          metric: 'wins',
          detail: `beat ${room.seats.map((s) => s.name).join(' vs ')}`,
          createdAt: Date.now(),
        })
      }
    }
    return { ok: true }
  },
})

export const rematch = mutation({
  args: { code: v.string(), playerId: v.string() },
  handler: async (ctx, { code, playerId }) => {
    const room = await findRoom(ctx, code)
    if (!room) throw new ConvexError('Room not found')
    const votes = new Set(room.rematchVotes)
    votes.add(playerId)
    const everyone = room.seats.every((s) => votes.has(s.playerId))
    if (everyone) {
      const engine = getEngine(room.game)
      await ctx.db.patch(room._id, {
        state: engine.init(),
        status: room.seats.length >= engine.seats ? 'playing' : 'waiting',
        winnerSeat: null,
        draw: false,
        rematchVotes: [],
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.patch(room._id, { rematchVotes: [...votes], updatedAt: Date.now() })
    }
    return { ok: true }
  },
})
