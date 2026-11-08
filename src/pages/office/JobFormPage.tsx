import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { useToast } from '../../components/ui/Toast'
import type { JobPriority, ServiceCategory } from '../../types'
import { findScheduleConflicts } from '../../lib/schedule'

export function JobFormPage() {
  const { state, actions } = useStore()
  const toast = useToast()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const presetCustomer = params.get('customerId') ?? ''

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<ServiceCategory>('general_maintenance')
  const [priority, setPriority] = useState<JobPriority>('normal')
  const [customerId, setCustomerId] = useState(presetCustomer || state.customers[0]?.id || '')
  const [addressIndex, setAddressIndex] = useState(0)
  const [technicianId, setTechnicianId] = useState('')
  const [scheduledStart, setScheduledStart] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(60)
  const [internalNotes, setInternalNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [conflictMsg, setConflictMsg] = useState('')

  const customer = state.customers.find((c) => c.id === customerId)

  const previewConflict = useMemo(() => {
    if (!technicianId || !scheduledStart) return ''
    const end = new Date(new Date(scheduledStart).getTime() + estimatedMinutes * 60_000).toISOString()
    const conflicts = findScheduleConflicts(state.jobs, technicianId, scheduledStart, end)
    return conflicts.map((c) => c.message).join(' ')
  }, [technicianId, scheduledStart, estimatedMinutes, state.jobs])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Title is required.'
    if (!customerId) next.customerId = 'Customer is required.'
    if (!description.trim()) next.description = 'Description is required.'
    if (!estimatedMinutes || estimatedMinutes < 15) next.estimatedMinutes = 'Minimum 15 minutes.'
    if (technicianId && !scheduledStart) next.scheduledStart = 'Appointment required when assigning a technician.'
    setErrors(next)
    if (Object.keys(next).length) return

    const result = actions.createJob({
      title,
      description,
      category,
      priority,
      customerId,
      addressIndex,
      technicianId: technicianId || null,
      scheduledStart: scheduledStart ? new Date(scheduledStart).toISOString() : null,
      estimatedMinutes,
      internalNotes,
    })

    if (!result.ok) {
      setConflictMsg(result.error)
      toast.error(result.error)
      return
    }
    toast.success(`Created ${result.job.reference}`)
    navigate(`/jobs/${result.job.id}`)
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="panel p-5">
        <h2 className="text-[14px] font-medium text-ink">Job details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Title" htmlFor="title" error={errors.title}>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Category" htmlFor="category">
            <Select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as ServiceCategory)}
            >
              <option value="air_conditioning">Air conditioning</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="general_maintenance">General maintenance</option>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Description" htmlFor="description" error={errors.description}>
              <Textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Priority" htmlFor="priority">
            <Select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as JobPriority)}
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </Select>
          </Field>
          <Field label="Estimated duration (minutes)" htmlFor="duration" error={errors.estimatedMinutes}>
            <Input
              id="duration"
              type="number"
              min={15}
              step={15}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
            />
          </Field>
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="text-[14px] font-medium text-ink">Customer & location</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Customer" htmlFor="customer" error={errors.customerId}>
            <Select
              id="customer"
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value)
                setAddressIndex(0)
              }}
            >
              {state.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Site address" htmlFor="address">
            <Select
              id="address"
              value={addressIndex}
              onChange={(e) => setAddressIndex(Number(e.target.value))}
            >
              {(customer?.addresses ?? []).map((a, i) => (
                <option key={i} value={i}>
                  {a.line1}, {a.city}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="panel p-5">
        <h2 className="text-[14px] font-medium text-ink">Assignment</h2>
        <p className="mt-1 text-xs text-muted">
          Leave technician blank to save as unassigned. Assigning a technician and appointment schedules the job.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Technician" htmlFor="tech">
            <Select id="tech" value={technicianId} onChange={(e) => setTechnicianId(e.target.value)}>
              <option value="">Unassigned</option>
              {state.technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {!t.available ? ' (unavailable)' : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Scheduled start" htmlFor="start" error={errors.scheduledStart}>
            <Input
              id="start"
              type="datetime-local"
              value={scheduledStart}
              onChange={(e) => setScheduledStart(e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Internal notes" htmlFor="notes">
              <Textarea id="notes" rows={3} value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
            </Field>
          </div>
        </div>
        {previewConflict || conflictMsg ? (
          <p className="mt-3 rounded-md bg-danger-bg px-3 py-2 text-sm text-danger" role="alert">
            {conflictMsg || previewConflict}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate('/jobs')}>
          Cancel
        </Button>
        <Button type="submit">Save job</Button>
      </div>
    </form>
  )
}
