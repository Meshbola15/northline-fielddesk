import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Printer, Phone } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { CATEGORY_LABEL, fmtDateTime, fmtDuration, fmtElapsed } from '../../lib/format'
import { isOverdue } from '../../lib/jobs'
import { FlagBadge, PriorityBadge, StatusBadge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog, Modal } from '../../components/ui/Modal'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import { EmptyState } from '../../components/ui/EmptyState'
import { getPhotoBlob } from '../../lib/photos'
import { findScheduleConflicts } from '../../lib/schedule'

export function JobDetailPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { state, actions, getCustomer, getTechnician, getJobActivities, getLiveLabourSeconds } =
    useStore()
  const job = state.jobs.find((j) => j.id === jobId)
  const [assignOpen, setAssignOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  if (!job) {
    return (
      <EmptyState
        title="Job not found"
        description="It may have been removed after a demo reset."
        action={
          <Button variant="outline" onClick={() => navigate('/jobs')}>
            Back to jobs
          </Button>
        }
      />
    )
  }

  const customer = getCustomer(job.customerId)
  const tech = job.technicianId ? getTechnician(job.technicianId) : undefined
  const address = customer?.addresses[job.addressIndex]
  const contact = customer?.contacts[0]
  const activities = getJobActivities(job.id)
  const photos = state.photoMeta.filter((p) => p.jobId === job.id)
  const labourSeconds = getLiveLabourSeconds(job)
  const completed = job.status === 'completed'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={job.status} />
            <PriorityBadge priority={job.priority} />
            {job.blocked ? <FlagBadge>Blocked</FlagBadge> : null}
            {isOverdue(job) ? <FlagBadge tone="danger">Overdue</FlagBadge> : null}
          </div>
          <h2 className="mt-2 text-[28px] font-medium leading-tight tracking-tight text-ink">
            {job.title}
          </h2>
          <p className="mt-1 text-[14px] text-muted">{CATEGORY_LABEL[job.category]}</p>
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          {completed ? (
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4 stroke-[1.5]" /> Print summary
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAssignOpen(true)}>
                Assign / reschedule
              </Button>
              <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
                Cancel job
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="panel grid gap-4 border-l-[3px] border-l-accent px-5 py-4 sm:grid-cols-4">
        <div>
          <div className="text-[12px] text-muted">Reference</div>
          <div className="mt-1">
            <span className="job-ref">{job.reference}</span>
          </div>
        </div>
        <div>
          <div className="text-[12px] text-muted">Site</div>
          <div className="mt-1 text-[13px] font-medium text-ink">
            {address ? `${address.line1}, ${address.city}` : '—'}
          </div>
        </div>
        <div>
          <div className="text-[12px] text-muted">Window</div>
          <div className="mt-1 mono-meta text-[13px] !text-ink">{fmtDateTime(job.scheduledStart)}</div>
        </div>
        <div>
          <div className="text-[12px] text-muted">Technician</div>
          <div className="mt-1 text-[13px] font-medium text-ink">{tech?.name ?? 'Unassigned'}</div>
        </div>
      </div>

      <div className={`grid gap-6 lg:grid-cols-[1.4fr_1fr] ${completed ? 'print-summary' : ''}`}>
        <div className="space-y-6">
          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Problem description</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{job.description}</p>
            {job.internalNotes ? (
              <p className="mt-3 rounded-md bg-app px-3 py-2 text-xs text-muted">
                Internal: {job.internalNotes}
              </p>
            ) : null}
          </section>

          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Checklist</h3>
            <ul className="mt-3 space-y-2">
              {job.checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={item.done} readOnly className="mt-0.5" aria-label={item.label} />
                  <span className={item.done ? 'text-muted line-through' : ''}>{item.label}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Field notes</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">
              {job.notes || 'No field notes yet.'}
            </p>
          </section>

          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Photos</h3>
            {photos.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No photos uploaded.</p>
            ) : (
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((p) => (
                  <PhotoThumb key={p.id} photoId={p.id} label={`${p.kind} · ${p.name}`} />
                ))}
              </div>
            )}
          </section>

          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Materials</h3>
            {job.materials.length === 0 ? (
              <p className="mt-2 text-sm text-muted">No materials recorded.</p>
            ) : (
              <ul className="mt-2 divide-y divide-border text-sm">
                {job.materials.map((m) => (
                  <li key={m.id} className="flex justify-between py-2">
                    <span>{m.name}</span>
                    <span className="text-muted">
                      {m.quantity} {m.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Appointment</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Start" value={fmtDateTime(job.scheduledStart)} />
              <Row label="End" value={fmtDateTime(job.scheduledEnd)} />
              <Row label="Duration" value={fmtDuration(job.estimatedMinutes)} />
              <Row label="Technician" value={tech?.name ?? 'Unassigned'} />
              <Row label="Labour timer" value={fmtElapsed(labourSeconds)} />
              {job.blocked ? <Row label="Blocked" value={job.blockedReason ?? 'Yes'} /> : null}
              {job.unavailableReason ? (
                <Row label="Unavailable" value={job.unavailableReason} />
              ) : null}
            </dl>
          </section>

          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Customer</h3>
            <div className="mt-2 text-sm font-medium">
              <Link className="text-accent hover:underline" to={`/customers/${customer?.id}`}>
                {customer?.name}
              </Link>
            </div>
            {address ? (
              <p className="mt-1 text-sm text-muted">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ''}
                <br />
                {address.city} {address.state} {address.postcode}
              </p>
            ) : null}
            {contact ? (
              <div className="mt-3 space-y-1 text-sm">
                <div>{contact.name}</div>
                <a className="inline-flex items-center gap-1 text-accent hover:underline" href={`tel:${contact.phone}`}>
                  <Phone className="h-3.5 w-3.5" /> {contact.phone}
                </a>
                <div className="text-muted">{contact.email}</div>
              </div>
            ) : null}
          </section>

          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Customer sign-off</h3>
            {job.signOff ? (
              <div className="mt-2 space-y-2 text-sm">
                <div>
                  {job.signOff.name} · {fmtDateTime(job.signOff.signedAt)}
                </div>
                <img
                  src={job.signOff.signatureDataUrl}
                  alt={`Signature of ${job.signOff.name}`}
                  className="max-h-24 rounded border border-border bg-white"
                />
                <p className="text-xs text-muted">{job.signOff.acknowledgement}</p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted">No sign-off yet.</p>
            )}
          </section>

          <section className="panel p-5">
            <h3 className="text-[14px] font-medium">Activity</h3>
            <ol className="mt-3 space-y-3">
              {activities.map((a) => (
                <li key={a.id} className="border-l-2 border-border pl-3 text-sm">
                  <div className="font-medium text-ink">{a.message}</div>
                  <div className="text-xs text-muted">
                    {a.actor} · {fmtDateTime(a.at)}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <AssignModal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        jobId={job.id}
        initialTech={job.technicianId ?? ''}
        initialStart={job.scheduledStart ? job.scheduledStart.slice(0, 16) : ''}
        initialMinutes={job.estimatedMinutes}
      />

      <EditJobModal open={editOpen} onClose={() => setEditOpen(false)} jobId={job.id} />

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel job?"
        message="This marks the job as cancelled. You can still view it in the jobs list."
        confirmLabel="Cancel job"
        danger
        onClose={() => setCancelOpen(false)}
        onConfirm={() => {
          const result = actions.cancelJob(job.id)
          if (!result.ok) toast.error(result.error)
          else toast.success('Job cancelled')
        }}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  )
}

function PhotoThumb({ photoId, label }: { photoId: string; label: string }) {
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false
    getPhotoBlob(photoId)
      .then((blob) => {
        if (cancelled) return
        if (!blob) {
          setError(true)
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [photoId])

  if (error) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-md border border-border bg-app text-xs text-danger">
        Storage error
      </div>
    )
  }

  return (
    <figure className="overflow-hidden rounded-md border border-border">
      {url ? (
        <img src={url} alt={label} className="aspect-video w-full object-cover" />
      ) : (
        <div className="aspect-video bg-app" />
      )}
      <figcaption className="truncate px-2 py-1 text-[11px] text-muted">{label}</figcaption>
    </figure>
  )
}

function AssignModal({
  open,
  onClose,
  jobId,
  initialTech,
  initialStart,
  initialMinutes,
}: {
  open: boolean
  onClose: () => void
  jobId: string
  initialTech: string
  initialStart: string
  initialMinutes: number
}) {
  const { state, actions } = useStore()
  const toast = useToast()
  const [technicianId, setTechnicianId] = useState(initialTech)
  const [start, setStart] = useState(toLocalInput(initialStart))
  const [minutes, setMinutes] = useState(initialMinutes)

  useEffect(() => {
    if (open) {
      setTechnicianId(initialTech)
      setStart(toLocalInput(initialStart))
      setMinutes(initialMinutes)
    }
  }, [open, initialTech, initialStart, initialMinutes])

  const conflict = useMemo(() => {
    if (!technicianId || !start) return ''
    const startIso = new Date(start).toISOString()
    const endIso = new Date(new Date(start).getTime() + minutes * 60_000).toISOString()
    return findScheduleConflicts(state.jobs, technicianId, startIso, endIso, jobId)
      .map((c) => c.message)
      .join(' ')
  }, [technicianId, start, minutes, state.jobs, jobId])

  return (
    <Modal
      open={open}
      title="Assign / reschedule"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              if (!technicianId || !start) {
                toast.error('Technician and start time are required.')
                return
              }
              const result = actions.assignJob(
                jobId,
                technicianId,
                new Date(start).toISOString(),
                minutes,
              )
              if (!result.ok) {
                toast.error(result.error)
                return
              }
              toast.success('Schedule updated')
              onClose()
            }}
          >
            Save assignment
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Technician">
          <Select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
            <option value="">Select technician</option>
            {state.technicians.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start">
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
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
          <p className="rounded-md bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
            Conflict: {conflict}
          </p>
        ) : (
          <p className="text-xs text-muted">Overlapping appointments for the same technician are blocked.</p>
        )}
      </div>
    </Modal>
  )
}

function EditJobModal({ open, onClose, jobId }: { open: boolean; onClose: () => void; jobId: string }) {
  const { state, actions } = useStore()
  const toast = useToast()
  const job = state.jobs.find((j) => j.id === jobId)
  const [title, setTitle] = useState(job?.title ?? '')
  const [description, setDescription] = useState(job?.description ?? '')
  const [priority, setPriority] = useState(job?.priority ?? 'normal')
  const [internalNotes, setInternalNotes] = useState(job?.internalNotes ?? '')
  const [blocked, setBlocked] = useState(job?.blocked ?? false)
  const [blockedReason, setBlockedReason] = useState(job?.blockedReason ?? '')

  useEffect(() => {
    if (open && job) {
      setTitle(job.title)
      setDescription(job.description)
      setPriority(job.priority)
      setInternalNotes(job.internalNotes)
      setBlocked(job.blocked)
      setBlockedReason(job.blockedReason ?? '')
    }
  }, [open, job])

  if (!job) return null

  return (
    <Modal
      open={open}
      title="Edit job"
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              if (!title.trim()) {
                toast.error('Title is required.')
                return
              }
              const result = actions.updateJob(jobId, {
                title: title.trim(),
                description: description.trim(),
                priority,
                internalNotes,
                blocked,
                blockedReason: blocked ? blockedReason : undefined,
              })
              if (!result.ok) toast.error(result.error)
              else {
                toast.success('Job updated')
                onClose()
              }
            }}
          >
            Save changes
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Title">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Description">
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as typeof priority)}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </Select>
        </Field>
        <Field label="Internal notes">
          <Input value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
        </Field>
        <div className="sm:col-span-2 flex items-center gap-2">
          <input
            id="blocked"
            type="checkbox"
            checked={blocked}
            onChange={(e) => setBlocked(e.target.checked)}
          />
          <label htmlFor="blocked" className="text-sm">
            Mark as blocked
          </label>
        </div>
        {blocked ? (
          <div className="sm:col-span-2">
            <Field label="Blocked reason">
              <Input value={blockedReason} onChange={(e) => setBlockedReason(e.target.value)} />
            </Field>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

function toLocalInput(isoOrLocal: string) {
  if (!isoOrLocal) return ''
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(isoOrLocal)) return isoOrLocal
  const d = new Date(isoOrLocal)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
