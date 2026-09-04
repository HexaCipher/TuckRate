import { useNavigate, useLocation } from 'react-router-dom'
import { IconUser, IconLogin } from '@tabler/icons-react'
import { useAuth } from '../lib/auth-context'

interface HeaderProps {
  summary?: string
  tagline?: string
}

/**
 * Top header component per design-system.md and docs/3-App-Flow.md §2.
 * Renders WorthIt brand wordmark, hostel-native tagline, and profile/auth button.
 */
function Header({ summary, tagline = 'Hostel food. Honest opinions.' }: HeaderProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleProfileTap() {
    if (user) {
      navigate('/profile')
    } else {
      navigate('/login', { state: { from: location.pathname } })
    }
  }

  const displayText = summary || tagline

  return (
    <header
      className="w-full flex items-center justify-between px-4 sm:px-6 pt-5 pb-3"
      style={{ paddingTop: 'max(1.25rem, env(safe-area-inset-top, 1.25rem))' }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <img
            src="/wordmark.png"
            alt="WorthIt"
            className="h-7 sm:h-8 w-auto object-contain select-none"
            draggable={false}
          />
        </div>
        {displayText && (
          <p className="text-xs text-secondary mt-1 leading-tight font-medium tracking-normal truncate">
            {displayText}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={handleProfileTap}
        aria-label={user ? 'Open profile' : 'Log in to rate'}
        className={`w-10 h-10 aspect-square flex items-center justify-center rounded-full border shadow-warm transition-all shrink-0 ml-3 cursor-pointer active:scale-95 ${
          user
            ? 'bg-accent-light/50 border-accent/30 text-accent-dark hover:bg-accent-light'
            : 'bg-card border-border-subtle text-secondary hover:border-border-default hover:text-primary'
        }`}
      >
        {user ? (
          <IconUser size={20} stroke={2} />
        ) : (
          <IconLogin size={19} stroke={1.8} />
        )}
      </button>
    </header>
  )
}

export default Header
