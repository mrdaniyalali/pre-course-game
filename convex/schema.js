import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

// Data model for auth (users/sessions), multiplayer rooms, the global
// leaderboard, and friend groups.
export default defineSchema({
  ...authTables,
  rooms: defineTable({
    code: v.string(),            // short join code, e.g. "K3P9"
    game: v.string(),            // engine id: 'tictactoe' | 'connect4' | ...
    status: v.string(),          // 'waiting' | 'playing' | 'done'
    state: v.any(),              // authoritative game state (engine-specific)
    seats: v.array(v.object({ playerId: v.string(), name: v.string() })),
    winnerSeat: v.union(v.number(), v.null()),
    draw: v.boolean(),
    rematchVotes: v.array(v.string()),
    updatedAt: v.number(),
  }).index('by_code', ['code']),

  scores: defineTable({
    game: v.string(),
    name: v.string(),
    value: v.number(),           // raw score or seconds
    metric: v.string(),          // 'score' (higher better) | 'time' (lower better)
    detail: v.optional(v.string()),
    createdAt: v.number(),
  }).index('by_game', ['game']),

  groups: defineTable({
    code: v.string(),
    name: v.string(),
    members: v.array(v.object({ playerId: v.string(), name: v.string() })),
    createdAt: v.number(),
  }).index('by_code', ['code']),

  // Friendships between signed-in users. One row per pair (ids stored sorted).
  friendships: defineTable({
    user1: v.id('users'),
    user2: v.id('users'),
    status: v.string(),            // 'pending' | 'accepted'
    requestedBy: v.id('users'),
    createdAt: v.number(),
  })
    .index('by_user1', ['user1'])
    .index('by_user2', ['user2']),
})
