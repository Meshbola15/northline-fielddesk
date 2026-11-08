import { Link, useNavigate } from 'react-router-dom'
import {
  format,
  isSameDay,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Clock3, UserX } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { bookedHoursForTechnician, isJobToday, isOverdue } from '../../lib/jobs'
import { CATEGORY_SHORT, fmtTime } from '../../lib/format'
import { StatusBadge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'

export function OverviewPage() {
  const { state, getCustomer, getTechnician } = useStore()
  const navigate = useNavigate()
  const today = startOfDay(new Date())

  const todayJobs = state.jobs.filter((j) => isJobToday(j, today) && j.status !== 'cancelled')
  const inProgress = state.jobs.filter((j) => j.status === 'in_progress' || j.status === 'en_route')
  const completedToday = state.jobs.filter(
    (j) => j.completedAt && isSameDay(parseISO(j.completedAt), today),
  )
  const overdue = state.jobs.filter((j) => isOverdue(j))
  const unassigned = state.jobs.filter((j) => j.status === 'unassigned')
  const blocked = state.jobs.filter((j) => j.blocked && j.status !== 'completed' && j.status !== 'cancelled')

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const day = subDays(today, 6 - i)
    const count = state.jobs.filter(
      (j) => j.completedAt && isSameDay(parseISO(j.completedAt), day),
    ).length
    const isToday = isSameDay(day, today)
    return { day: format(day, 'EEE'), count, isToday }
  })

  const metrics = [
    { label: 'Scheduled today', value: todayJobs.length, to: '/jobs?status=scheduled', lead: false },
    { label: 'In progress', value: inProgress.length, to: '/jobs?status=in_progress', lead: false },
    { label: 'Completed today', value: completedToday.length, to: '/jobs?status=completed', lead: false },
    { label: 'Overdue', value: overdue.length, to: '/jobs?status=overdue', lead: true },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-[28px] font-medium leading-tight tracking-tight text-ink">
          {format(today, 'EEEE d MMMM')}
        </h2>
        <p className="mt-1 text-[14px] text-secondary">What needs attention today</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <button
            key={m.label}
            type="button"
            onClick={() => navigate(m.to)}
            className="rounded-xl border border-border bg-surface p-5 text-left transition-colors duration-150 hover:bg-raised"
          >
            <div
              className={`text-[32px] font-medium tabular-nums leading-none ${
                m.lead && m.value > 0 ? 'text-accent-ink' : 'text-ink'
              }`}
            >
              {m.value}
            </div>
            <div className="mt-2 text-[13px] text-muted">{m.label}</div>
          </button>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h3 className="text-[14px] font-medium text-ink">Today’s jobs</h3>
            <Link to="/schedule" className="text-[13px] font-medium text-accent-ink hover:underline">
              Open schedule
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[14px]">
              <thead className="bg-raised text-[12px] text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Time</th>
                  <th className="px-5 py-2.5 font-medium">Customer</th>
                  <th className="px-5 py-2.5 font-medium">Service</th>
                  <th className="px-5 py-2.5 font-medium">Technician</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayJobs
                  .slice()
                  .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? ''))
                  .map((job) => (
                    <tr
                      key={job.id}
                      className="cursor-pointer border-t border-border hover:bg-raised/70"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <td className="whitespace-nowrap px-5 py-3 mono-meta">{fmtTime(job.scheduledStart)}</td>
                      <td className="px-5 py-3">{getCustomer(job.customerId)?.name}</td>
                      <td className="px-5 py-3 text-secondary">{CATEGORY_SHORT[job.category]}</td>
                      <td className="px-5 py-3 text-secondary">
                        {job.technicianId ? getTechnician(job.technicianId)?.name : '—'}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={job.status} />
                      </td>
                    </tr>
                  ))}
                {todayJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-[14px] text-muted">
                      No jobs scheduled today
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <div className="space-y-6">
          <section className="panel">
            <div className="border-b border-border px-5 py-3.5">
              <h3 className="text-[14px] font-medium text-ink">Attention</h3>
            </div>
            <ul className="divide-y divide-border">
              <AttentionRow
                icon={<UserX className="h-4 w-4 stroke-[1.5]" />}
                label="Unassigned"
                count={unassigned.length}
                onClick={() => navigate('/jobs?status=unassigned')}
              />
              <AttentionRow
                icon={<Clock3 className="h-4 w-4 stroke-[1.5]" />}
                label="Overdue"
                count={overdue.length}
                lead={overdue.length > 0}
                onClick={() => navigate('/jobs?status=overdue')}
              />
              <AttentionRow
                icon={<AlertTriangle className="h-4 w-4 stroke-[1.5]" />}
                label="Blocked"
                count={blocked.length}
                onClick={() => navigate('/jobs?status=blocked')}
              />
            </ul>
          </section>

          <section className="panel">
            <div className="border-b border-border px-5 py-3.5">
              <h3 className="text-[14px] font-medium text-ink">Technician workload</h3>
            </div>
            <ul className="divide-y divide-border">
              {state.technicians.map((t) => {
                const assigned = state.jobs.filter(
                  (j) =>
                    j.technicianId === t.id &&
                    isJobToday(j, today) &&
                    j.status !== 'cancelled' &&
                    j.status !== 'completed',
                ).length
                const hours = bookedHoursForTechnician(state.jobs, t.id, today)
                return (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <Avatar initials={t.initials} dimmed={!t.available} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium">{t.name}</div>
                      <div className="mono-meta">
                        {assigned} jobs · {hours.toFixed(1)}h booked
                        {!t.available ? ' · unavailable' : ''}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </div>

      {/* Craft moment: completions chart with today accented */}
      <section className="panel p-5">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h3 className="text-[14px] font-medium text-ink">Completions · last 7 days</h3>
            <p className="mt-1 text-[13px] text-muted">Today marked in teal</p>
          </div>
          <span className="mono-meta">Through {format(today, 'dd MMM')}</span>
        </div>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barCategoryGap="28%">
              <XAxis
                dataKey="day"
                tick={{ fontSize: 12, fill: '#737373', fontFamily: 'IBM Plex Mono, monospace' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#737373', fontFamily: 'IBM Plex Mono, monospace' }}
                axisLine={false}
                tickLine={false}
                width={28}
              />
              <Tooltip
                cursor={{ fill: '#f4f4f5' }}
                contentStyle={{
                  borderRadius: 8,
                  borderColor: 'rgb(23 23 23 / 0.08)',
                  fontSize: 12,
                  fontFamily: 'IBM Plex Sans, sans-serif',
                }}
                formatter={(value) => [String(value ?? 0), 'Completed']}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.day}
                    fill={entry.isToday ? '#087f8c' : '#d4d4d8'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}

function AttentionRow({
  icon,
  label,
  count,
  lead,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  count: number
  lead?: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors duration-150 hover:bg-raised/70"
      >
        <span className="text-muted">{icon}</span>
        <span className="flex-1 text-[14px] font-medium">{label}</span>
        <span className={`mono-meta text-[14px] ${lead ? 'font-medium text-accent-ink' : ''}`}>
          {count}
        </span>
      </button>
    </li>
  )
}
