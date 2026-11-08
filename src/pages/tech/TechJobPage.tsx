import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Navigation, Phone, Timer } from 'lucide-react'
import { useStore } from '../../store/StoreContext'
import { Button } from '../../components/ui/Button'
import { Field, Input, Textarea } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import { SignaturePad } from '../../components/tech/SignaturePad'
import { checkCompletionRules, canStartTravel, canStartWork } from '../../lib/completion'
import { fmtElapsed, fmtTime } from '../../lib/format'
import { getPhotoBlob } from '../../lib/photos'

export function TechJobPage() {
  const { jobId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const { state, actions, getCustomer, getLiveLabourSeconds } = useStore()
  const job = state.jobs.find((j) => j.id === jobId)
  const [notes, setNotes] = useState(job?.notes ?? '')
  const [signOpen, setSignOpen] = useState(false)
  const [unavailableOpen, setUnavailableOpen] = useState(false)
  const [completeHints, setCompleteHints] = useState<string[]>([])
  const [signName, setSignName] = useState('')
  const [signature, setSignature] = useState<string | null>(null)
  const [unavailableReason, setUnavailableReason] = useState('')
  const [materialName, setMaterialName] = useState('')
  const [materialQty, setMaterialQty] = useState(1)

  useEffect(() => {
    setNotes(job?.notes ?? '')
  }, [job?.id, job?.notes])

  if (!job) {
    return (
      <EmptyState
        title="Job not found"
        action={
          <Button variant="outline" onClick={() => navigate('/tech/jobs')}>
            Back to jobs
          </Button>
        }
      />
    )
  }

  const customer = getCustomer(job.customerId)
  const address = customer?.addresses[job.addressIndex]
  const contact = customer?.contacts[0]
  const mapsQuery = address
    ? encodeURIComponent(`${address.line1}, ${address.city} ${address.state} ${address.postcode}`)
    : ''
  const labour = getLiveLabourSeconds(job)
  const photos = state.photoMeta.filter((p) => p.jobId === job.id)
  const completion = checkCompletionRules(job)
  const done = job.status === 'completed'

  const primaryAction = () => {
    if (canStartTravel(job)) {
      const r = actions.startTravel(job.id)
      if (!r.ok) toast.error(r.error)
      else toast.success('En route')
      return
    }
    if (canStartWork(job)) {
      const r = actions.startWork(job.id)
      if (!r.ok) toast.error(r.error)
      else toast.success('Work started — timer running')
      return
    }
    if (job.status === 'in_progress') {
      const check = checkCompletionRules(job)
      if (!check.canComplete) {
        setCompleteHints(check.reasons)
        toast.error(check.reasons[0] ?? 'Cannot complete yet')
        return
      }
      const r = actions.completeJob(job.id)
      if (!r.ok) toast.error(r.error)
      else {
        toast.success('Job completed')
        navigate('/tech')
      }
    }
  }

  const primaryLabel =
    job.status === 'scheduled'
      ? 'Start travel'
      : job.status === 'en_route'
        ? 'Start work'
        : job.status === 'in_progress'
          ? 'Complete job'
          : null

  return (
    <div className="space-y-4 pb-8">
      <div>
        <Link to="/tech/jobs" className="text-xs font-medium text-accent hover:underline">
          ← Jobs
        </Link>
        <div className="mt-2 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-[12px] text-muted">
              <span className="job-ref">{job.reference}</span>
              <span className="mono-meta">{fmtTime(job.scheduledStart)}</span>
            </div>
            <h2 className="mt-2 text-[22px] font-medium tracking-tight text-ink">{job.title}</h2>
          </div>
          <StatusBadge status={job.status} />
        </div>
      </div>

      <section className="panel p-5">
        <div className="text-[14px] font-medium">{customer?.name}</div>
        {address ? (
          <p className="mt-1 text-sm text-muted">
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ''}
            <br />
            {address.city} {address.state} {address.postcode}
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a
            href={contact ? `tel:${contact.phone}` : undefined}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-raised text-[14px] font-medium transition-colors duration-150 hover:bg-surface"
          >
            <Phone className="h-4 w-4 stroke-[1.5]" /> Call
          </a>
          <a
            href={mapsQuery ? `https://www.google.com/maps/dir/?api=1&destination=${mapsQuery}` : undefined}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-raised text-[14px] font-medium transition-colors duration-150 hover:bg-surface"
          >
            <Navigation className="h-4 w-4 stroke-[1.5]" /> Directions
          </a>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="text-[14px] font-medium">Instructions</h3>
        <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{job.description}</p>
        {job.internalNotes ? (
          <p className="mt-3 rounded-md bg-accent-soft px-3 py-2 text-xs text-accent">{job.internalNotes}</p>
        ) : null}
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-medium">Labour timer</h3>
          <div className="inline-flex items-center gap-1.5 text-[14px] font-medium tabular-nums">
            <Timer className="h-4 w-4 text-accent" />
            {fmtElapsed(labour)}
            {job.labour.running ? <span className="text-[11px] font-medium text-accent">Running</span> : null}
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="text-[14px] font-medium">Checklist</h3>
        <ul className="mt-3 space-y-2">
          {job.checklist.map((item) => (
            <li key={item.id}>
              <label className="flex min-h-11 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="h-5 w-5"
                  checked={item.done}
                  disabled={done}
                  onChange={() => actions.toggleChecklist(job.id, item.id)}
                />
                <span className={item.done ? 'text-muted line-through' : ''}>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel p-5">
        <h3 className="text-[14px] font-medium">Notes</h3>
        <Textarea
          className="mt-2"
          rows={4}
          value={notes}
          disabled={done}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => actions.updateNotes(job.id, notes)}
          placeholder="Work notes for the office…"
        />
      </section>

      <section className="panel p-5">
        <h3 className="text-[14px] font-medium">Photos</h3>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {photos.map((p) => (
            <TechPhoto key={p.id} photoId={p.id} name={p.name} onRemove={() => void actions.removePhoto(p.id)} disabled={done} />
          ))}
        </div>
        {!done ? (
          <label className="mt-3 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-md border border-dashed border-border text-sm font-medium">
            Add photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0]
                e.target.value = ''
                if (!file) return
                const result = await actions.addPhoto(job.id, file, job.status === 'completed' ? 'after' : 'before')
                if (!result.ok) toast.error(result.error)
                else toast.success('Photo saved')
              }}
            />
          </label>
        ) : null}
      </section>

      <section className="panel p-5">
        <h3 className="text-[14px] font-medium">Materials</h3>
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
        {!done ? (
          <div className="mt-3 flex gap-2">
            <Input
              placeholder="Material"
              value={materialName}
              onChange={(e) => setMaterialName(e.target.value)}
            />
            <Input
              type="number"
              className="w-20"
              min={1}
              value={materialQty}
              onChange={(e) => setMaterialQty(Number(e.target.value))}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (!materialName.trim()) return
                actions.setMaterials(job.id, [
                  ...job.materials,
                  {
                    id: `mat-${Math.random().toString(36).slice(2, 7)}`,
                    name: materialName.trim(),
                    quantity: materialQty || 1,
                    unit: 'ea',
                  },
                ])
                setMaterialName('')
                setMaterialQty(1)
              }}
            >
              Add
            </Button>
          </div>
        ) : null}
      </section>

      <section className="panel p-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[14px] font-medium">Customer sign-off</h3>
          {!done ? (
            <Button size="sm" variant="outline" onClick={() => setUnavailableOpen(true)}>
              Customer unavailable
            </Button>
          ) : null}
        </div>
        {job.signOff ? (
          <div className="mt-2 text-sm">
            Signed by {job.signOff.name}
            <img
              src={job.signOff.signatureDataUrl}
              alt="Signature"
              className="mt-2 max-h-20 rounded border border-border bg-white"
            />
          </div>
        ) : job.unavailableReason ? (
          <p className="mt-2 text-sm text-warning">Unavailable: {job.unavailableReason}</p>
        ) : !done ? (
          <Button className="mt-3 w-full" variant="outline" size="lg" onClick={() => setSignOpen(true)}>
            Capture sign-off
          </Button>
        ) : (
          <p className="mt-2 text-sm text-muted">No sign-off.</p>
        )}
      </section>

      {completeHints.length > 0 ? (
        <div className="rounded-md bg-warning-bg px-3 py-2 text-sm text-warning" role="status">
          {completeHints.map((r) => (
            <div key={r}>{r}</div>
          ))}
        </div>
      ) : null}

      {!done && primaryLabel ? (
        <Button className="w-full" size="lg" onClick={primaryAction}>
          {primaryLabel}
        </Button>
      ) : null}

      {!completion.canComplete && job.status === 'in_progress' ? (
        <p className="text-center text-xs text-muted">
          Complete checklist and sign-off (or mark unavailable) before finishing.
        </p>
      ) : null}

      <Modal
        open={signOpen}
        title="Customer sign-off"
        onClose={() => setSignOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setSignOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!signName.trim() || !signature) {
                  toast.error('Name and signature are required.')
                  return
                }
                actions.setSignOff(job.id, {
                  name: signName.trim(),
                  signedAt: new Date().toISOString(),
                  signatureDataUrl: signature,
                  acknowledgement: 'Demo acknowledgement — not a legal verification.',
                })
                toast.success('Sign-off saved')
                setSignOpen(false)
              }}
            >
              Save sign-off
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Customer name">
            <Input value={signName} onChange={(e) => setSignName(e.target.value)} />
          </Field>
          <Field label="Signature">
            <SignaturePad onChange={setSignature} />
          </Field>
        </div>
      </Modal>

      <Modal
        open={unavailableOpen}
        title="Customer unavailable"
        onClose={() => setUnavailableOpen(false)}
        footer={
          <>
            <Button variant="outline" onClick={() => setUnavailableOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!unavailableReason.trim()) {
                  toast.error('Please provide a reason.')
                  return
                }
                actions.setUnavailable(job.id, unavailableReason.trim())
                toast.success('Marked customer unavailable')
                setUnavailableOpen(false)
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <Field label="Reason">
          <Textarea
            rows={3}
            value={unavailableReason}
            onChange={(e) => setUnavailableReason(e.target.value)}
            placeholder="No answer / site closed / …"
          />
        </Field>
      </Modal>
    </div>
  )
}

function TechPhoto({
  photoId,
  name,
  onRemove,
  disabled,
}: {
  photoId: string
  name: string
  onRemove: () => void
  disabled?: boolean
}) {
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

  return (
    <div className="overflow-hidden rounded-md border border-border">
      {error ? (
        <div className="flex aspect-video items-center justify-center bg-danger-bg text-xs text-danger">
          Storage error
        </div>
      ) : url ? (
        <img src={url} alt={name} className="aspect-video w-full object-cover" />
      ) : (
        <div className="aspect-video bg-app" />
      )}
      {!disabled ? (
        <button type="button" className="w-full py-1.5 text-xs text-danger" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </div>
  )
}
