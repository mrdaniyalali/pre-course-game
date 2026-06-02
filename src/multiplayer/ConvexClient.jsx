import { ConvexReactClient } from 'convex/react'
import { ConvexAuthProvider } from '@convex-dev/auth/react'

// Production Convex deployment (public client URL — safe to expose; the secret
// is the deploy key, which is never in the repo). Used as a fallback so online
// play works on any host without needing a build-time env var. Override locally
// with VITE_CONVEX_URL in .env.local if you point at a different deployment.
const DEFAULT_CONVEX_URL = 'https://vibrant-tiger-655.eu-west-1.convex.cloud'
const url = import.meta.env.VITE_CONVEX_URL || DEFAULT_CONVEX_URL
// Visible in the browser console so you can confirm which backend is live.
if (typeof window !== 'undefined') console.info('[Pairs] Convex backend:', url)
export const convex = url ? new ConvexReactClient(url) : null
export const isConvexConfigured = !!convex

// ConvexAuthProvider includes the Convex client provider AND Google auth. If
// auth can't initialise, the app still works as a guest (isAuthenticated=false).
export function ConvexRoot({ children }) {
  if (!convex) return children
  return <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
}
