import { Link } from 'react-router-dom'
import { format, isSameDay, parseISO, startOfDay } from 'date-fns'
import { ChevronRight, MapPin } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { StatusBadge } from '../../components/ui/Badge'
import { fmtTime } from '../../lib/format'
import { EmptyState } from '../../components/ui/EmptyState'

export function TechTodayPage() {
  const { state, getCustomer } = useStore()
  const today = startOfDay(new Date())

  const jobs = state.jobs
    .filter(
      (j) =>
        j.technicianId === state.activeTechnicianId &&
        j.scheduledStart &&
        isSameDay(parseISO(j.scheduledStart), today) &&
        j.status !== 'cancelled',
    )
    .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? ''))

  const active = jobs.find((j) => j.status === 'in_progress' || j.status === 'en_route')
  const next =
    active ??
    jobs.find((j) => j.status === 'scheduled') ??
    jobs.find((j) => j.status !== 'completed') ??
    jobs[0]
  const remaining = jobs.filter((j) => j.id !== next?.id)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[28px] font-medium leading-tight tracking-tight text-ink">
          {format(today, 'EEEE d MMMM')}
        </h2>
        <p className="mt-1 text-[14px] text-secondary">
          {jobs.length} job{jobs.length === 1 ? '' : 's'} today
        </p>
      </div>

      {!next ? (
        <EmptyState
          title="No jobs today"
          description="Check Jobs for upcoming work"
        />
      ) : (
        <section className="panel border-l-[3px] border-l-accent p-5">
          <div className="text-[12px] font-medium text-accent-ink">
            {active ? 'Current job' : 'Next job'}
          </div>
          <div className="mt-2 flex items-start justify-between gap-2">
            <div>
              <span className="job-ref">{next.reference}</span>
              <h3 className="mt-2 text-[18px] font-medium tracking-tight text-ink">{next.title}</h3>
            </div>
            <StatusBadge status={next.status} />
          </div>
          <div className="mt-3 text-[14px] text-secondary">
            <span className="mono-meta mr-2">{fmtTime(next.scheduledStart)}</span>
            {getCustomer(next.customerId)?.name}
          </div>
          <div className="mt-2 flex items-start gap-1.5 text-[14px] text-muted">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 stroke-[1.5]" />
            <span>
              {(() => {
                const a = getCustomer(next.customerId)?.addresses[next.addressIndex]
                return a ? `${a.line1}, ${a.city}` : 'Address unavailable'
              })()}
            </span>
          </div>
          <Link
            to={`/tech/jobs/${next.id}`}
            className="mt-5 inline-flex h-11 w-full items-center justify-center gap-1 rounded-md bg-accent text-[14px] font-medium text-white transition-colors duration-150 hover:bg-accent-ink active:scale-[0.98]"
          >
            Open job <ChevronRight className="h-4 w-4 stroke-[1.5]" />
          </Link>
        </section>
      )}

      {remaining.length > 0 ? (
        <section>
          <h3 className="mb-3 text-[14px] font-medium text-ink">Rest of today</h3>
          <ul className="space-y-2">
            {remaining.map((job) => (
              <li key={job.id}>
                <Link
                  to={`/tech/jobs/${job.id}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors duration-150 hover:bg-raised"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mono-meta">{fmtTime(job.scheduledStart)}</div>
                    <div className="truncate text-[14px] font-medium">{job.title}</div>
                    <div className="truncate text-[12px] text-muted">
                      {getCustomer(job.customerId)?.name}
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
