// Convex Auth with Google OAuth. Requires AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET
// env vars in the Convex deployment (set from the Google Cloud OAuth client),
// plus the JWT signing keys generated during setup.
import Google from '@auth/core/providers/google'
import { convexAuth } from '@convex-dev/auth/server'

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
})
