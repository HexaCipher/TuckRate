import { useNavigate } from 'react-router-dom'
import { IconUser, IconLogin } from '@tabler/icons-react'
import { useAuth } from '../lib/auth-context'

interface HeaderProps {
  summary?: string
}

/**
 * Top header component per design-system.md and docs/3-App-Flow.md §2.
 * Explicitly excludes notification bell, cart icon, delivery address.
 */
function Header({ summary }: HeaderProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  function handleProfileTap() {
    if (user) {
      navigate('/profile')
    } else {
      navigate('/login')
    }
  }

  return (
    <header
      className="flex items-center justify-between px-4 pt-6 pb-2.5"
      style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top, 1.5rem))' }}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-xl font-bold tracking-tight text-primary leading-tight">
          TuckRate
        </h1>
        {summary && (
          <p className="text-xs text-secondary mt-0.5 leading-tight truncate">
            {summary}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleProfileTap}
        aria-label={user ? 'Profile' : 'Log in'}
        className="w-10 h-10 aspect-square flex items-center justify-center rounded-full bg-card border border-border-subtle shadow-warm text-primary hover:border-border-default active:scale-95 transition-all shrink-0 ml-3 cursor-pointer"
      >
        {user ? (
          <IconUser size={19} stroke={1.75} />
        ) : (
          <IconLogin size={19} stroke={1.75} className="text-secondary" />
        )}
      </button>
    </header>
  )
}

export default Header
