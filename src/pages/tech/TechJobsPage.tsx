import { Link } from 'react-router-dom'
import { parseISO } from 'date-fns'
import { useStore } from '../../store/StoreContext'
import { StatusBadge } from '../../components/ui/Badge'
import { fmtDateTime } from '../../lib/format'
import { EmptyState } from '../../components/ui/EmptyState'

export function TechJobsPage() {
  const { state, getCustomer } = useStore()
  const jobs = state.jobs
    .filter(
      (j) =>
        j.technicianId === state.activeTechnicianId &&
        j.status !== 'cancelled' &&
        j.status !== 'completed',
    )
    .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? ''))

  const completed = state.jobs
    .filter((j) => j.technicianId === state.activeTechnicianId && j.status === 'completed')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 5)

  if (jobs.length === 0 && completed.length === 0) {
    return <EmptyState title="No assigned jobs" description="Ask dispatch to assign work to you." />
  }

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-[14px] font-medium">Open jobs</h2>
        <ul className="space-y-2">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link
                to={`/tech/jobs/${job.id}`}
                className="block rounded-xl border border-border bg-surface px-4 py-3.5 transition-colors duration-150 hover:bg-raised"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="job-ref">{job.reference}</span>
                    <div className="mt-1 truncate text-[14px] font-medium">{job.title}</div>
                    <div className="text-xs text-muted">
                      {getCustomer(job.customerId)?.name}
                      {job.scheduledStart ? ` · ${fmtDateTime(job.scheduledStart)}` : ''}
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>
              </Link>
            </li>
          ))}
          {jobs.length === 0 ? <li className="text-sm text-muted">No open jobs.</li> : null}
        </ul>
      </section>

      {completed.length > 0 ? (
        <section>
          <h2 className="mb-2 text-[14px] font-medium">Recently completed</h2>
          <ul className="space-y-2">
            {completed.map((job) => (
              <li key={job.id}>
                <Link
                  to={`/tech/jobs/${job.id}`}
                  className="block rounded-md border border-border bg-surface px-3 py-3 opacity-80"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-sm font-medium">{job.title}</div>
                      <div className="text-xs text-muted">
                        {job.completedAt ? formatShort(job.completedAt) : ''}
                      </div>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function formatShort(iso: string) {
  try {
    return fmtDateTime(parseISO(iso).toISOString())
  } catch {
    return iso
  }
}
