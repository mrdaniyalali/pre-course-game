import { ConvexProvider, ConvexReactClient } from 'convex/react'

// Production Convex deployment (public client URL — safe to expose; the secret
// is the deploy key, which is never in the repo). Used as a fallback so online
// play works on any host without needing a build-time env var. Override locally
// with VITE_CONVEX_URL in .env.local if you point at a different deployment.
const DEFAULT_CONVEX_URL = 'https://vibrant-tiger-655.eu-west-1.convex.cloud'
const url = import.meta.env.VITE_CONVEX_URL || DEFAULT_CONVEX_URL
export const convex = url ? new ConvexReactClient(url) : null
export const isConvexConfigured = !!convex

export function ConvexRoot({ children }) {
  if (!convex) return children
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}
