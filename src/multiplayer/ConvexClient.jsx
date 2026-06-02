import { ConvexProvider, ConvexReactClient } from 'convex/react'

// If VITE_CONVEX_URL isn't set yet, the app still runs — online features show a
// friendly "set up Convex" notice and everything else works locally.
const url = import.meta.env.VITE_CONVEX_URL
export const convex = url ? new ConvexReactClient(url) : null
export const isConvexConfigured = !!convex

export function ConvexRoot({ children }) {
  if (!convex) return children
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
