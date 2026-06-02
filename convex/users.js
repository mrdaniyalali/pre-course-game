// Current signed-in user (from Google), for the client to show name/avatar
// and to attribute rooms + leaderboard entries to a real identity.
import { query } from './_generated/server'
import { getAuthUserId } from '@convex-dev/auth/server'

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null
    const user = await ctx.db.get(userId)
    if (!user) return null
    return {
      id: userId,
      name: user.name ?? 'Player',
      image: user.image ?? null,
      email: user.email ?? null,
    }
  },
})
