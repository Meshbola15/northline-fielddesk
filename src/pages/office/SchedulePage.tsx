import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  addDays,
  format,
  isSameDay,
  parseISO,
  setHours,
  setMinutes as setMinutesOnDate,
  startOfDay,
  differenceInMinutes,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import clsx from 'clsx'
import { useStore } from '../../store/StoreContext'
import { Button } from '../../components/ui/Button'
import { Input, Select, Field } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { Avatar } from '../../components/ui/Avatar'
import { STATUS_LABEL } from '../../lib/format'
import { findScheduleConflicts } from '../../lib/schedule'
import type { Job, JobStatus } from '../../types'

const DAY_START = 7
const DAY_END = 18
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)

/** Status-led block color — craft moment on the board, not rainbow tech IDs */
function blockTone(status: JobStatus): { bg: string; border: string; text: string } {
  switch (status) {
    case 'en_route':
      return { bg: '#eef6f7', border: '#087f8c', text: '#066870' }
    case 'in_progress':
      return { bg: '#fffbeb', border: '#b45309', text: '#92400e' }
    case 'completed':
      return { bg: '#f0fdf4', border: '#16a34a', text: '#166534' }
    case 'cancelled':
      return { bg: '#fafafa', border: '#d4d4d8', text: '#737373' }
    default:
      return { bg: '#f4f4f5', border: '#171717', text: '#171717' }
  }
}

export function SchedulePage() {
  const { state, getCustomer, getTechnician } = useStore()
  const [day, setDay] = useState(() => startOfDay(new Date()))
  const [selected, setSelected] = useState<Job | null>(null)
  const [assignJob, setAssignJob] = useState<Job | null>(null)
  const navigate = useNavigate()
  const toast = useToast()

  const unassigned = state.jobs.filter(
    (j) =>
      (j.status === 'unassigned' || !j.technicianId) &&
      j.status !== 'cancelled' &&
      j.status !== 'completed',
  )

  const jobsForDay = state.jobs.filter(
    (j) =>
      j.scheduledStart &&
      isSameDay(parseISO(j.scheduledStart), day) &&
      j.status !== 'cancelled' &&
      j.technicianId,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" aria-label="Previous day" onClick={() => setDay((d) => addDays(d, -1))}>
          <ChevronLeft className="h-4 w-4 stroke-[1.5]" />
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDay(startOfDay(new Date()))}>
          Today
        </Button>
        <Button variant="outline" size="sm" aria-label="Next day" onClick={() => setDay((d) => addDays(d, 1))}>
          <ChevronRight className="h-4 w-4 stroke-[1.5]" />
        </Button>
        <Input
          type="date"
          className="w-40"
          value={format(day, 'yyyy-MM-dd')}
          onChange={(e) => {
            if (e.target.value) setDay(startOfDay(parseISO(e.target.value)))
          }}
          aria-label="Pick date"
        />
        <h2 className="ml-2 text-[18px] font-medium tracking-tight text-ink">
          {format(day, 'EEEE d MMMM yyyy')}
        </h2>
      </div>

      {/* Craft moment: day board */}
      <div className="panel hidden overflow-hidden lg:block">
        <div className="overflow-x-auto scrollbar-thin">
          <div className="min-w-[980px]">
            <div
              className="grid border-b border-border bg-raised text-[12px] text-muted"
              style={{ gridTemplateColumns: `12rem repeat(${HOURS.length}, minmax(4.5rem, 1fr))` }}
            >
              <div className="px-4 py-2.5 font-medium">Technician</div>
              {HOURS.map((h) => (
                <div key={h} className="border-l border-border px-2 py-2.5 font-mono">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>
            {state.technicians.map((tech) => {
              const techJobs = jobsForDay.filter((j) => j.technicianId === tech.id)
              return (
                <div
                  key={tech.id}
                  className="grid border-b border-border last:border-b-0"
                  style={{ gridTemplateColumns: `12rem minmax(0, 1fr)` }}
                >
                  <div className="flex items-center gap-2.5 px-4 py-3">
                    <Avatar initials={tech.initials} dimmed={!tech.available} />
                    <div className="min-w-0">
                      <div className="truncate text-[14px] font-medium">{tech.name}</div>
                      <div className="mono-meta">
                        {tech.workingHours.start}–{tech.workingHours.end}
                      </div>
                    </div>
                  </div>
                  <div className="relative min-h-[72px] border-l border-border bg-[linear-gradient(to_right,transparent_calc(100%/11-1px),rgb(23_23_23/0.04)_calc(100%/11-1px))] bg-[length:calc(100%/11)_100%]">
                    <div
                      className="absolute inset-0 grid"
                      style={{ gridTemplateColumns: `repeat(${HOURS.length}, minmax(4.5rem, 1fr))` }}
                    >
                      {HOURS.map((h) => (
                        <div key={h} className="border-l border-border/60" />
                      ))}
                    </div>
                    {techJobs.map((job) => {
                      const start = parseISO(job.scheduledStart!)
                      const end = parseISO(job.scheduledEnd!)
                      const dayStart = setMinutesOnDate(setHours(startOfDay(day), DAY_START), 0)
                      const dayEnd = setMinutesOnDate(setHours(startOfDay(day), DAY_END), 0)
                      const clampedStart = start < dayStart ? dayStart : start
                      const clampedEnd = end > dayEnd ? dayEnd : end
                      const totalMins = (DAY_END - DAY_START) * 60
                      const left = (differenceInMinutes(clampedStart, dayStart) / totalMins) * 100
                      const width = Math.max(
                        5,
                        (differenceInMinutes(clampedEnd, clampedStart) / totalMins) * 100,
                      )
                      const customer = getCustomer(job.customerId)
                      const tone = blockTone(job.status)
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => setSelected(job)}
                          className="absolute top-2.5 overflow-hidden rounded-md border-l-[3px] px-2.5 py-2 text-left transition-opacity duration-150 hover:opacity-95"
                          style={{
                            left: `${left}%`,
                            width: `${width}%`,
                            background: tone.bg,
                            borderLeftColor: tone.border,
                            color: tone.text,
                            minHeight: '52px',
                          }}
                          title={`${job.reference} · ${customer?.name}`}
                        >
                          <div className="truncate text-[12px] font-medium">{customer?.name}</div>
                          <div className="truncate text-[11px] opacity-80">{job.title}</div>
                          <div className="mt-0.5 font-mono text-[10px] opacity-70">
                            {format(start, 'HH:mm')}–{format(end, 'HH:mm')} · {STATUS_LABEL[job.status]}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {state.technicians.map((tech) => {
          const techJobs = jobsForDay
            .filter((j) => j.technicianId === tech.id)
            .sort((a, b) => (a.scheduledStart ?? '').localeCompare(b.scheduledStart ?? ''))
          return (
            <section key={tech.id} className="panel">
              <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
                <Avatar initials={tech.initials} />
                <span className="text-[14px] font-medium">{tech.name}</span>
              </div>
              {techJobs.length === 0 ? (
                <p className="px-4 py-5 text-[14px] text-muted">No jobs</p>
              ) : (
                <ul className="divide-y divide-border">
                  {techJobs.map((job) => {
                    const tone = blockTone(job.status)
                    return (
                      <li key={job.id}>
                        <button
                          type="button"
                          className="w-full border-l-[3px] px-4 py-3 text-left"
                          style={{ borderLeftColor: tone.border }}
                          onClick={() => setSelected(job)}
                        >
                          <div className="mono-meta">
                            {format(parseISO(job.scheduledStart!), 'HH:mm')}–
                            {format(parseISO(job.scheduledEnd!), 'HH:mm')}
                          </div>
                          <div className="text-[14px] font-medium">{getCustomer(job.customerId)?.name}</div>
                          <div className="text-[13px] text-secondary">{job.title}</div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>
          )
        })}
      </div>

      <section className="panel">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h3 className="text-[14px] font-medium">Unassigned</h3>
          <span className="mono-meta">{unassigned.length}</span>
        </div>
        {unassigned.length === 0 ? (
          <p className="px-5 py-8 text-[14px] text-muted">No unassigned jobs</p>
        ) : (
          <ul className="divide-y divide-border">
            {unassigned.map((job) => (
              <li key={job.id} className="flex flex-wrap items-center gap-2 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="job-ref">{job.reference}</span>
                    <span className="truncate text-[14px] font-medium">{job.title}</span>
                  </div>
                  <div className="mt-0.5 text-[13px] text-muted">{getCustomer(job.customerId)?.name}</div>
                </div>
                <Button size="sm" variant="outline" onClick={() => setAssignJob(job)}>
                  Assign
                </Button>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/jobs/${job.id}`)}>
                  Details
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        open={Boolean(selected)}
        title={selected ? selected.reference : ''}
        onClose={() => setSelected(null)}
        footer={
          selected ? (
            <>
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAssignJob(selected)
                  setSelected(null)
                }}
              >
                Reschedule
              </Button>
              <Button onClick={() => navigate(`/jobs/${selected.id}`)}>Open job</Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-2 text-[14px]">
            <div className="font-medium">{selected.title}</div>
            <div className="text-secondary">{getCustomer(selected.customerId)?.name}</div>
            <div className="mono-meta">
              {selected.scheduledStart
                ? `${format(parseISO(selected.scheduledStart), 'HH:mm')}–${format(parseISO(selected.scheduledEnd!), 'HH:mm')}`
                : '—'}
            </div>
            <div>{STATUS_LABEL[selected.status]}</div>
            <div>{getTechnician(selected.technicianId ?? '')?.name}</div>
          </div>
        ) : null}
      </Modal>

      <QuickAssignModal
        job={assignJob}
        day={day}
        onClose={() => setAssignJob(null)}
        onSaved={() => toast.success('Assignment saved')}
      />
    </div>
  )
}

function QuickAssignModal({
  job,
  day,
  onClose,
  onSaved,
}: {
  job: Job | null
  day: Date
  onClose: () => void
  onSaved: () => void
}) {
  const { state, actions } = useStore()
  const toast = useToast()
  const [technicianId, setTechnicianId] = useState(state.technicians[0]?.id ?? '')
  const [time, setTime] = useState('09:00')
  const [minutes, setMinutes] = useState(60)

  const startIso = useMemo(() => {
    const [h, m] = time.split(':').map(Number)
    return setMinutesOnDate(setHours(startOfDay(day), h), m).toISOString()
  }, [time, day])

  const conflict = useMemo(() => {
    if (!job || !technicianId) return ''
    const end = new Date(new Date(startIso).getTime() + minutes * 60_000).toISOString()
    return findScheduleConflicts(state.jobs, technicianId, startIso, end, job.id)
      .map((c) => c.message)
      .join(' ')
  }, [job, technicianId, startIso, minutes, state.jobs])

  return (
    <Modal
      open={Boolean(job)}
      title={job ? `Assign ${job.reference}` : 'Assign'}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className={clsx(conflict && 'opacity-90')}
            onClick={() => {
              if (!job) return
              const result = actions.assignJob(job.id, technicianId, startIso, minutes)
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              onSaved()
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Technician">
          <Select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
            {state.technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={`Start time on ${format(day, 'dd MMM')}`}>
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </Field>
        <Field label="Duration (minutes)">
          <Input
            type="number"
            min={15}
            step={15}
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </Field>
        {conflict ? (
          <p className="rounded-md bg-danger-bg px-3 py-2 text-[13px] text-danger" role="alert">
            Conflict: {conflict}
          </p>
        ) : null}
      </div>
    </Modal>
  )
}
