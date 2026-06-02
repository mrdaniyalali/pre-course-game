import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { getPlayerId, getPlayerName } from './identity.js'

// Unified player identity. When signed in with Google, uses the real account
// (stable id + name + avatar). Otherwise falls back to an anonymous device id
// and a typed name — so same-screen / guest play keeps working without login.
export function usePlayer() {
  const { isAuthenticated } = useConvexAuth()
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip')
  if (isAuthenticated && me) {
    return { id: me.id, name: me.name || 'Player', image: me.image, authed: true }
  }
  return { id: getPlayerId(), name: getPlayerName(), image: null, authed: false }
}
