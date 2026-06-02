import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthActions } from '@convex-dev/auth/react'
import { api } from '../../convex/_generated/api'

// Header control: "Sign in" (Google) when logged out; avatar + name + sign-out
// when logged in. Silent while auth state is loading.
export default function AuthButton() {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const { signIn, signOut } = useAuthActions()
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip')

  if (isLoading) return null

  if (isAuthenticated) {
    return (
      <div className="auth-chip" title={me?.email || ''}>
        {me?.image
          ? <img src={me.image} alt="" className="auth-avatar" referrerPolicy="no-referrer" />
          : <span className="auth-avatar fallback">{(me?.name || 'P')[0]}</span>}
        <span className="auth-name">{(me?.name || 'You').split(' ')[0]}</span>
        <button type="button" className="auth-out" onClick={() => signOut()} title="Sign out">⎋</button>
      </div>
    )
  }

  return (
    <button type="button" className="auth-signin" onClick={() => signIn('google')}>
      <span className="g">G</span> Sign in
    </button>
  )
}
