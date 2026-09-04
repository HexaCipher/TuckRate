import { useNavigate, useLocation } from 'react-router-dom'
import { IconHome, IconSearch, IconUser } from '@tabler/icons-react'

const NAV_ITEMS = [
  { path: '/', icon: IconHome, label: 'Home' },
  { path: '/search', icon: IconSearch, label: 'Search' },
  { path: '/profile', icon: IconUser, label: 'Profile' },
] as const

const HIDDEN_ROUTES = ['/login']

function isHidden(pathname: string): boolean {
  if (HIDDEN_ROUTES.includes(pathname)) return true
  if (/^\/item\/[^/]+\/rate$/.test(pathname)) return true
  return false
}

/**
 * Bottom navigation per design-system.md §Components:
 * cream background, exactly 3 items, active item pill highlight.
 */
function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  if (isHidden(pathname)) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border-subtle safe-bottom">
      <div className="flex items-center justify-around max-w-[430px] mx-auto h-14">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => {
          const active = path === '/' ? pathname === '/' : pathname.startsWith(path)
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center w-16 py-1 active:scale-95 transition-transform"
            >
              <span
                className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors ${
                  active ? 'bg-accent-light text-accent' : 'text-muted'
                }`}
              >
                <Icon size={19} stroke={active ? 2 : 1.75} />
              </span>
              <span
                className={`text-[10px] mt-0.5 leading-tight ${
                  active ? 'font-semibold text-accent' : 'font-normal text-muted'
                }`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav
