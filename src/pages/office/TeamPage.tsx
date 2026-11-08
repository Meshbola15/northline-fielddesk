import { Link } from 'react-router-dom'
import { isSameDay, parseISO, startOfDay } from 'date-fns'
import { useStore } from '../../store/StoreContext'
import { bookedHoursForTechnician } from '../../lib/jobs'
import { CATEGORY_LABEL, fmtDateTime } from '../../lib/format'
import { StatusBadge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'

export function TeamPage() {
  const { state, getCustomer } = useStore()
  const today = startOfDay(new Date())

  return (
    <div className="space-y-6">
      <p className="text-[14px] text-muted">
        Demo availability only — not live tracking. Workload is from today’s scheduled jobs
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {state.technicians.map((tech) => {
          const assigned = state.jobs.filter(
            (j) =>
              j.technicianId === tech.id &&
              j.scheduledStart &&
              isSameDay(parseISO(j.scheduledStart), today) &&
              j.status !== 'cancelled',
          )
          const upcoming = state.jobs
            .filter(
              (j) =>
                j.technicianId === tech.id &&
                j.scheduledStart &&
                parseISO(j.scheduledStart) >= today &&
                j.status !== 'cancelled' &&
                j.status !== 'completed',
            )
            .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? ''))
            .slice(0, 4)
          const hours = bookedHoursForTechnician(state.jobs, tech.id, today)

          return (
            <section key={tech.id} className="panel p-5">
              <div className="flex items-start gap-3">
                <Avatar initials={tech.initials} size="lg" dimmed={!tech.available} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[15px] font-medium">{tech.name}</h3>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[12px] font-medium ${
                        tech.available ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger'
                      }`}
                    >
                      {tech.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="mt-1 text-[13px] text-muted">
                    {tech.email} · {tech.phone}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tech.skills.map((s) => (
                      <span key={s} className="rounded-md bg-raised px-2 py-0.5 text-[12px] text-muted">
                        {CATEGORY_LABEL[s]}
                      </span>
                    ))}
                  </div>
                  <div className="mt-3 mono-meta">
                    Hours {tech.workingHours.start}–{tech.workingHours.end} · today {assigned.length}{' '}
                    jobs · {hours.toFixed(1)}h booked
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-border pt-4">
                <h4 className="text-[13px] font-medium text-muted">Upcoming</h4>
                <ul className="mt-2 space-y-2">
                  {upcoming.map((job) => (
                    <li key={job.id}>
                      <Link
                        to={`/jobs/${job.id}`}
                        className="flex items-center gap-2 text-[14px] hover:text-accent-ink"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          <span className="job-ref mr-2">{job.reference}</span>
                          {fmtDateTime(job.scheduledStart)} · {getCustomer(job.customerId)?.name}
                        </span>
                        <StatusBadge status={job.status} />
                      </Link>
                    </li>
                  ))}
                  {upcoming.length === 0 ? (
                    <li className="text-[14px] text-muted">No upcoming assignments</li>
                  ) : null}
                </ul>
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
