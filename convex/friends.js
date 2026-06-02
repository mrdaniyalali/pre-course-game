// Friends — only for signed-in (Google) users. Add by email, accept/decline
// requests, list friends.
import { mutation, query } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { getAuthUserId } from '@convex-dev/auth/server'

const pair = (a, b) => (a < b ? [a, b] : [b, a])

async function findFriendship(ctx, me, other) {
  const [u1, u2] = pair(me, other)
  return ctx.db
    .query('friendships')
    .withIndex('by_user1', (q) => q.eq('user1', u1))
    .filter((q) => q.eq(q.field('user2'), u2))
    .first()
}

async function userByEmail(ctx, email) {
  const e = email.trim()
  let u = await ctx.db.query('users').withIndex('email', (q) => q.eq('email', e)).first()
  if (!u) {
    const all = await ctx.db.query('users').collect()
    u = all.find((x) => (x.email || '').toLowerCase() === e.toLowerCase()) || null
  }
  return u
}

async function myFriendships(ctx, me) {
  const a = await ctx.db.query('friendships').withIndex('by_user1', (q) => q.eq('user1', me)).collect()
  const b = await ctx.db.query('friendships').withIndex('by_user2', (q) => q.eq('user2', me)).collect()
  return [...a, ...b]
}

const shape = async (ctx, id) => {
  const u = await ctx.db.get(id)
  return u ? { id, name: u.name ?? 'Player', image: u.image ?? null, email: u.email ?? null } : null
}

export const request = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const me = await getAuthUserId(ctx)
    if (!me) throw new ConvexError('Sign in first')
    if (!email.trim()) throw new ConvexError('Enter an email')
    const target = await userByEmail(ctx, email)
    if (!target) throw new ConvexError('No signed-in player with that email yet')
    if (target._id === me) throw new ConvexError("That's your own email")
    const existing = await findFriendship(ctx, me, target._id)
    if (existing) {
      if (existing.status === 'accepted') throw new ConvexError('Already friends')
      if (existing.requestedBy === me) throw new ConvexError('Request already sent')
      // they already requested you → accept it
      await ctx.db.patch(existing._id, { status: 'accepted' })
      return { ok: true, accepted: true }
    }
    const [u1, u2] = pair(me, target._id)
    await ctx.db.insert('friendships', {
      user1: u1, user2: u2, status: 'pending', requestedBy: me, createdAt: Date.now(),
    })
    return { ok: true }
  },
})

export const respond = mutation({
  args: { otherId: v.id('users'), accept: v.boolean() },
  handler: async (ctx, { otherId, accept }) => {
    const me = await getAuthUserId(ctx)
    if (!me) throw new ConvexError('Sign in first')
    const f = await findFriendship(ctx, me, otherId)
    if (!f || f.status !== 'pending') throw new ConvexError('No pending request')
    if (accept) await ctx.db.patch(f._id, { status: 'accepted' })
    else await ctx.db.delete(f._id)
    return { ok: true }
  },
})

export const remove = mutation({
  args: { otherId: v.id('users') },
  handler: async (ctx, { otherId }) => {
    const me = await getAuthUserId(ctx)
    if (!me) throw new ConvexError('Sign in first')
    const f = await findFriendship(ctx, me, otherId)
    if (f) await ctx.db.delete(f._id)
    return { ok: true }
  },
})

export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await getAuthUserId(ctx)
    if (!me) return { friends: [], incoming: [], outgoing: [] }
    const all = await myFriendships(ctx, me)
    const friends = []
    const incoming = []
    const outgoing = []
    for (const f of all) {
      const otherId = f.user1 === me ? f.user2 : f.user1
      const other = await shape(ctx, otherId)
      if (!other) continue
      if (f.status === 'accepted') friends.push(other)
      else if (f.requestedBy === me) outgoing.push(other)
      else incoming.push(other)
    }
    return { friends, incoming, outgoing }
  },
})
