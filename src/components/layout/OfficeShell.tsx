import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  LayoutDashboard,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  UserRound,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { DemoBanner } from './DemoBanner'
import { RoleSwitcher } from './RoleSwitcher'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { useStore } from '../../store/StoreContext'

const NAV = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/schedule', label: 'Schedule', icon: CalendarDays },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/team', label: 'Team', icon: UserRound },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

const TITLES: Record<string, string> = {
  '/': 'Overview',
  '/jobs': 'Jobs',
  '/schedule': 'Schedule',
  '/customers': 'Customers',
  '/team': 'Team',
  '/reports': 'Reports',
  '/settings': 'Settings',
}

function titleFor(pathname: string) {
  if (pathname.startsWith('/jobs/new')) return 'Create job'
  if (pathname.startsWith('/jobs/')) return 'Job detail'
  if (pathname.startsWith('/customers/')) return 'Customer'
  return TITLES[pathname] ?? 'FieldDesk'
}

function SidebarNav({
  companyName,
  onNavigate,
}: {
  companyName: string
  onNavigate?: () => void
}) {
  return (
    <>
      <div className="border-b border-white/10 px-4 py-5">
        <div className="text-[15px] font-medium tracking-tight text-white">FieldDesk</div>
        <div className="mt-1 text-[12px] text-white/50">{companyName}</div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2 py-4" aria-label="Office">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              clsx(
                'flex h-9 items-center gap-2.5 rounded-md px-2.5 text-[14px] transition-colors duration-150',
                isActive
                  ? 'bg-sidebar-raised text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  : 'text-white/65 hover:bg-white/5 hover:text-white',
              )
            }
          >
            <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        <div className="text-[14px] font-medium text-white">Jordan Hale</div>
        <div className="text-[12px] text-white/45">Operations manager</div>
      </div>
    </>
  )
}

export function OfficeShell() {
  const { state } = useStore()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = q.trim()
    if (!term) return
    navigate(`/jobs?q=${encodeURIComponent(term)}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-app">
      <DemoBanner />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden h-[calc(100vh-29px)] w-60 shrink-0 flex-col bg-sidebar text-white md:flex sticky top-[29px]">
          <SidebarNav companyName={state.settings.name} />
        </aside>
        {open ? (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-ink/40"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            />
            <aside className="relative z-10 flex h-full w-60 flex-col bg-sidebar text-white">
              <SidebarNav companyName={state.settings.name} onNavigate={() => setOpen(false)} />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
            >
              {open ? <X className="h-4 w-4 stroke-[1.5]" /> : <Menu className="h-4 w-4 stroke-[1.5]" />}
            </Button>
            <h1 className="min-w-0 truncate text-[15px] font-medium text-ink">
              {titleFor(location.pathname)}
            </h1>
            <form
              onSubmit={onSearch}
              className="ml-auto hidden max-w-xs flex-1 items-center gap-2 sm:flex lg:max-w-sm"
            >
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 stroke-[1.5] text-muted" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search"
                  className="pl-9"
                  aria-label="Search jobs and customers"
                />
              </div>
            </form>
            <Button size="sm" onClick={() => navigate('/jobs/new')} className="shrink-0">
              <Plus className="h-4 w-4 stroke-[1.5]" />
              <span className="hidden sm:inline">Create job</span>
            </Button>
            <div className="hidden lg:block">
              <RoleSwitcher />
            </div>
          </header>
          <div className="border-b border-border bg-surface px-4 py-2 lg:hidden">
            <RoleSwitcher compact />
          </div>
          <main className="mx-auto w-full max-w-[1600px] flex-1 overflow-auto p-6 page-enter">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
