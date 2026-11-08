import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { filterJobs, isOverdue, sortJobs } from '../../lib/jobs'
import { CATEGORY_SHORT, fmtDateTime } from '../../lib/format'
import { FlagBadge, PriorityBadge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Input, Select } from '../../components/ui/Input'
import { EmptyState } from '../../components/ui/EmptyState'
import type { JobPriority, JobStatus } from '../../types'

const PAGE_SIZE = 10

export function JobsPage() {
  const { state, getCustomer, getTechnician } = useStore()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const q = params.get('q') ?? ''
  const status = (params.get('status') as JobStatus | 'all' | 'blocked' | 'overdue' | null) ?? 'all'
  const priority = (params.get('priority') as JobPriority | 'all' | null) ?? 'all'
  const technicianId = params.get('technicianId') ?? 'all'
  const [sortKey, setSortKey] = useState('scheduledStart')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)

  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next)
    setPage(0)
  }

  const filtered = useMemo(() => {
    let list = filterJobs(state.jobs, {
      q,
      status,
      priority,
      technicianId,
    })
    // enrich search with customer names
    if (q) {
      const qq = q.toLowerCase()
      list = state.jobs.filter((job) => {
        const customer = getCustomer(job.customerId)?.name.toLowerCase() ?? ''
        const hay = `${job.reference} ${job.title} ${job.description} ${customer}`.toLowerCase()
        if (!hay.includes(qq)) return false
        return filterJobs([job], { status, priority, technicianId }).length > 0
      })
    }
    return sortJobs(list, sortKey, sortDir)
  }, [state.jobs, q, status, priority, technicianId, sortKey, sortDir, getCustomer])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageItems = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1">
          <Input
            value={q}
            onChange={(e) => setFilter('q', e.target.value)}
            placeholder="Search"
            aria-label="Search jobs"
          />
        </div>
        <Select
          aria-label="Filter status"
          value={status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="w-40"
        >
          <option value="all">All statuses</option>
          <option value="unassigned">Unassigned</option>
          <option value="scheduled">Scheduled</option>
          <option value="en_route">En route</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="blocked">Blocked</option>
          <option value="overdue">Overdue</option>
        </Select>
        <Select
          aria-label="Filter priority"
          value={priority}
          onChange={(e) => setFilter('priority', e.target.value)}
          className="w-36"
        >
          <option value="all">All priorities</option>
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </Select>
        <Select
          aria-label="Filter technician"
          value={technicianId}
          onChange={(e) => setFilter('technicianId', e.target.value)}
          className="w-44"
        >
          <option value="all">All technicians</option>
          <option value="unassigned">Unassigned</option>
          {state.technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
        <Button onClick={() => navigate('/jobs/new')}>Create job</Button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No jobs match these filters"
          description="Try clearing search or status filters."
          action={
            <Button variant="outline" onClick={() => setParams({})}>
              Clear filters
            </Button>
          }
        />
      ) : (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-[14px]">
              <thead className="bg-raised text-[12px] text-muted">
                <tr>
                  <Th onClick={() => toggleSort('reference')}>Reference</Th>
                  <Th onClick={() => toggleSort('title')}>Job</Th>
                  <th className="px-4 py-2.5 font-medium">Customer / site</th>
                  <th className="px-4 py-2.5 font-medium">Technician</th>
                  <Th onClick={() => toggleSort('scheduledStart')}>Appointment</Th>
                  <Th onClick={() => toggleSort('priority')}>Priority</Th>
                  <Th onClick={() => toggleSort('status')}>Status</Th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((job) => {
                  const customer = getCustomer(job.customerId)
                  const address = customer?.addresses[job.addressIndex]
                  return (
                    <tr
                      key={job.id}
                      className="cursor-pointer border-t border-border hover:bg-app/60"
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          to={`/jobs/${job.id}`}
                          className="job-ref"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ink">{job.title}</div>
                        <div className="text-[12px] text-muted">{CATEGORY_SHORT[job.category]}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div>{customer?.name}</div>
                        <div className="text-xs text-muted">
                          {address ? `${address.line1}, ${address.city}` : '—'}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {job.technicianId ? getTechnician(job.technicianId)?.name : '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-muted">
                        {fmtDateTime(job.scheduledStart)}
                      </td>
                      <td className="px-3 py-2.5">
                        <PriorityBadge priority={job.priority} />
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center gap-1">
                          <StatusBadge status={job.status} />
                          {job.blocked ? <FlagBadge>Blocked</FlagBadge> : null}
                          {isOverdue(job) ? <FlagBadge tone="danger">Overdue</FlagBadge> : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted">
            <span>
              {filtered.length} job{filtered.length === 1 ? '' : 's'} · page {page + 1} of {pageCount}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Th({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <th className="px-3 py-2 font-medium">
      <button type="button" onClick={onClick} className="hover:text-ink">
        {children}
      </button>
    </th>
  )
}
