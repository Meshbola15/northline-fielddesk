import { NavLink, Outlet } from 'react-router-dom'
import { Briefcase, CalendarDays, UserRound } from 'lucide-react'
import clsx from 'clsx'
import { DemoBanner } from './DemoBanner'
import { RoleSwitcher } from './RoleSwitcher'
import { useStore } from '../../store/StoreContext'

const NAV = [
  { to: '/tech', label: 'Today', icon: CalendarDays, end: true },
  { to: '/tech/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/tech/profile', label: 'Profile', icon: UserRound },
]

export function TechShell() {
  const { state, getTechnician } = useStore()
  const tech = getTechnician(state.activeTechnicianId)

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col bg-app">
      <DemoBanner />
      <header className="sticky top-0 z-20 border-b border-border bg-surface px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[15px] font-medium text-ink">FieldDesk</div>
            <div className="text-[13px] text-muted">{tech?.name ?? 'Technician'}</div>
          </div>
          <div className="text-[12px] text-muted">Technician</div>
        </div>
        <div className="mt-3">
          <RoleSwitcher compact />
        </div>
      </header>
      <main className="flex-1 overflow-auto px-4 py-4 pb-24 page-enter">
        <Outlet />
      </main>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)]"
        aria-label="Technician"
      >
        <div className="mx-auto flex max-w-lg">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors duration-150',
                  isActive ? 'text-accent-ink' : 'text-muted',
                )
              }
            >
              <item.icon className="h-[18px] w-[18px] stroke-[1.5]" />
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
