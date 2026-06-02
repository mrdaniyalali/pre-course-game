import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

// Submit a single-player best (score or time) to the global board.
export const submit = mutation({
  args: {
    game: v.string(),
    name: v.string(),
    value: v.number(),
    metric: v.string(), // 'score' (higher better) | 'time' (lower better)
    detail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('scores', { ...args, name: args.name || 'Anon', createdAt: Date.now() })
    return { ok: true }
  },
})

// Top entries for a game. For 'time' lower is better; otherwise higher.
export const top = query({
  args: { game: v.string(), metric: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, { game, metric, limit }) => {
    const rows = await ctx.db
      .query('scores')
      .withIndex('by_game', (q) => q.eq('game', game))
      .collect()
    const filtered = rows.filter((r) => r.metric === metric)
    if (metric === 'wins') {
      // aggregate wins by name
      const tally = new Map()
      for (const r of filtered) tally.set(r.name, (tally.get(r.name) || 0) + r.value)
      return [...tally.entries()]
        .map(([name, value]) => ({ name, value, metric }))
        .sort((a, b) => b.value - a.value)
        .slice(0, limit || 10)
    }
    filtered.sort((a, b) => (metric === 'time' ? a.value - b.value : b.value - a.value))
    return filtered.slice(0, limit || 10).map((r) => ({ name: r.name, value: r.value, metric, detail: r.detail }))
  },
})

// Recent activity feed across all games.
export const recent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const rows = await ctx.db.query('scores').order('desc').take(limit || 12)
    return rows.map((r) => ({ game: r.game, name: r.name, value: r.value, metric: r.metric, createdAt: r.createdAt }))
  },
})
