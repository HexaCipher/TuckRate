import { Navigate, useNavigate } from 'react-router-dom'
import { IconBed, IconLogout } from '@tabler/icons-react'
import { useAuth } from '../lib/auth-context'
import { useProfile } from '../hooks/useProfile'

/**
 * Phase 2 profile shell (docs/6-Implementation-Plan.md): email + room number +
 * log out. The My Reviews list and review count arrive in Phase 4; the public
 * review history states (success/empty/loading/error for that list) are built then.
 */
function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const profile = useProfile()

  // Auth-gated screen: logged-out visitors go to Login first, then return here
  // (docs/3-App-Flow.md "Global navigation notes" — auth-gated actions redirect)
  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/profile' }} />
  }

  const email = user.email ?? 'Signed in'

  async function handleLogout() {
    // Navigate home before the session drops so the auth guard doesn't
    // intercept the redirect (docs/3-App-Flow.md §6: logout → Home, logged out)
    navigate('/', { replace: true })
    try {
      await signOut()
    } catch (err) {
      console.warn('[TuckRate] Logout failed:', err)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col px-6 py-10 w-full max-w-[430px] mx-auto">
      <h1 className="text-lg font-medium text-primary mb-8">Profile</h1>

      <div className="flex flex-col items-center text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-card border border-border-default flex items-center justify-center mb-4">
          <span className="text-xl font-medium text-accent uppercase">{email.charAt(0)}</span>
        </div>
        <p className="text-sm text-primary break-all">{email}</p>

        {/* Room number from public.users (auto-created by on_auth_user_created) */}
        {profile.isLoading && (
          <div className="h-8 w-28 rounded-full bg-card mt-3 animate-pulse" />
        )}

        {profile.isError && (
          <div className="mt-3 flex flex-col items-center gap-1">
            <p className="text-xs text-bad">Couldn&apos;t load your profile.</p>
            <button
              type="button"
              onClick={() => void profile.refetch()}
              className="text-xs text-accent underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        )}

        {profile.isSuccess &&
          (profile.data.room_number ? (
            <span className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-card border border-border-default text-xs text-secondary">
              <IconBed size={14} />
              Room {profile.data.room_number}
            </span>
          ) : (
            <span className="mt-3 text-xs text-muted">No room number set</span>
          ))}
      </div>

      {/* My Reviews list — Phase 4 (docs/6-Implementation-Plan.md) */}

      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto h-12 w-full rounded-full border border-border-default text-sm text-primary active:bg-card flex items-center justify-center gap-2"
      >
        <IconLogout size={18} className="text-secondary" />
        Log out
      </button>
    </div>
  )
}

export default ProfilePage
