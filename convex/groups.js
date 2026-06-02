import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function makeCode() {
  let s = ''
  for (let i = 0; i < 5; i++) s += ALPHABET[(Math.random() * ALPHABET.length) | 0]
  return s
}

async function findGroup(ctx, code) {
  return ctx.db
    .query('groups')
    .withIndex('by_code', (q) => q.eq('code', code.toUpperCase()))
    .first()
}

export const create = mutation({
  args: { name: v.string(), playerId: v.string(), playerName: v.string() },
  handler: async (ctx, { name, playerId, playerName }) => {
    let code = makeCode()
    for (let i = 0; i < 5; i++) {
      if (!(await findGroup(ctx, code))) break
      code = makeCode()
    }
    await ctx.db.insert('groups', {
      code,
      name: name || 'My Crew',
      members: [{ playerId, name: playerName || 'You' }],
      createdAt: Date.now(),
    })
    return { code }
  },
})

export const join = mutation({
  args: { code: v.string(), playerId: v.string(), playerName: v.string() },
  handler: async (ctx, { code, playerId, playerName }) => {
    const group = await findGroup(ctx, code)
    if (!group) throw new Error('Group not found')
    if (group.members.some((m) => m.playerId === playerId)) return { code: group.code }
    await ctx.db.patch(group._id, {
      members: [...group.members, { playerId, name: playerName || 'Friend' }],
    })
    return { code: group.code }
  },
})

export const get = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    if (!code) return null
    return await findGroup(ctx, code)
  },
})
