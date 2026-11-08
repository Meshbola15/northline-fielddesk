import { createSeedState } from '../data/seed'
import { checkCompletionRules } from '../lib/completion'
import { canAssignSchedule } from '../lib/schedule'
import {
  clearAllPhotoBlobs,
  deletePhotoBlob,
  savePhotoBlob,
  validatePhotoFile,
  canAddPhoto,
} from '../lib/photos'
import type {
  ActivityEntry,
  AppState,
  ChecklistItem,
  Customer,
  DemoRole,
  Job,
  JobPhoto,
  JobPriority,
  JobStatus,
  MaterialItem,
  ServiceCategory,
  SignOff,
} from '../types'

const STORAGE_KEY = 'fielddesk-state-v1'
const LISTENERS = new Set<() => void>()

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createSeedState()
    const parsed = JSON.parse(raw) as AppState
    if (!parsed?.version || !parsed.jobs?.length) return createSeedState()
    return parsed
  } catch {
    return createSeedState()
  }
}

let state: AppState = typeof window !== 'undefined' ? loadState() : createSeedState()

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  LISTENERS.forEach((l) => l())
}

function setState(partial: Partial<AppState> | ((prev: AppState) => AppState)) {
  state = typeof partial === 'function' ? partial(state) : { ...state, ...partial }
  persist()
}

function pushActivity(
  jobId: string,
  type: ActivityEntry['type'],
  message: string,
  actor: string,
): ActivityEntry {
  return {
    id: uid('act'),
    jobId,
    type,
    message,
    actor,
    at: new Date().toISOString(),
  }
}

function actorName(): string {
  if (state.demoRole === 'office') return 'Dispatch'
  return state.technicians.find((t) => t.id === state.activeTechnicianId)?.name ?? 'Technician'
}

function nextReference(): string {
  const nums = state.jobs
    .map((j) => Number(j.reference.replace(/\D/g, '')))
    .filter((n) => !Number.isNaN(n))
  const max = nums.length ? Math.max(...nums) : 1040
  return `FD-${max + 1}`
}

export function getState() {
  return state
}

export function subscribe(listener: () => void) {
  LISTENERS.add(listener)
  return () => LISTENERS.delete(listener)
}

export const actions = {
  setDemoRole(role: DemoRole) {
    setState({ demoRole: role })
  },

  setActiveTechnician(id: string) {
    setState({ activeTechnicianId: id })
  },

  updateSettings(settings: AppState['settings']) {
    setState({ settings })
  },

  async resetDemo() {
    try {
      await clearAllPhotoBlobs()
    } catch {
      // IndexedDB may be unavailable (private mode / non-browser) — still reset app state
    }
    state = createSeedState(new Date())
    persist()
  },

  createCustomer(input: Omit<Customer, 'id' | 'createdAt'>): Customer {
    const customer: Customer = {
      ...input,
      id: uid('cus'),
      createdAt: new Date().toISOString(),
    }
    setState({ customers: [...state.customers, customer] })
    return customer
  },

  updateCustomer(id: string, patch: Partial<Customer>) {
    setState({
      customers: state.customers.map((c) => (c.id === id ? { ...c, ...patch, id } : c)),
    })
  },

  createJob(input: {
    title: string
    description: string
    category: ServiceCategory
    priority: JobPriority
    customerId: string
    addressIndex: number
    technicianId: string | null
    scheduledStart: string | null
    estimatedMinutes: number
    internalNotes: string
  }): { ok: true; job: Job } | { ok: false; error: string } {
    if (!input.title.trim()) return { ok: false, error: 'Title is required.' }
    if (!input.customerId) return { ok: false, error: 'Customer is required.' }
    if (!input.estimatedMinutes || input.estimatedMinutes < 15) {
      return { ok: false, error: 'Estimated duration must be at least 15 minutes.' }
    }

    let status: JobStatus = 'unassigned'
    let scheduledEnd: string | null = null

    if (input.technicianId && input.scheduledStart) {
      scheduledEnd = new Date(
        new Date(input.scheduledStart).getTime() + input.estimatedMinutes * 60_000,
      ).toISOString()
      const check = canAssignSchedule(
        state.jobs,
        input.technicianId,
        input.scheduledStart,
        scheduledEnd,
      )
      if (!check.ok) {
        return {
          ok: false,
          error: check.conflicts.map((c) => c.message).join(' '),
        }
      }
      status = 'scheduled'
    } else if (input.scheduledStart && !input.technicianId) {
      scheduledEnd = new Date(
        new Date(input.scheduledStart).getTime() + input.estimatedMinutes * 60_000,
      ).toISOString()
      status = 'unassigned'
    }

    const now = new Date().toISOString()
    const checklists: Record<ServiceCategory, string[]> = {
      air_conditioning: [
        'Isolate power / confirm safe access',
        'Inspect filters and coils',
        'Check drain / condensate path',
        'Verify supply air temperature',
        'Record findings for customer',
      ],
      electrical: [
        'Isolate and lock out as required',
        'Inspect circuit and terminations',
        'Test operation under load',
        'Restore and label if changed',
      ],
      plumbing: [
        'Isolate water supply',
        'Diagnose leak / fault source',
        'Complete repair or replacement',
        'Pressure test / check for drips',
      ],
      general_maintenance: [
        'Assess site condition',
        'Complete requested maintenance',
        'Clean work area',
        'Confirm customer satisfaction',
      ],
    }

    const job: Job = {
      id: uid('job'),
      reference: nextReference(),
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      priority: input.priority,
      status,
      customerId: input.customerId,
      addressIndex: input.addressIndex,
      technicianId: input.technicianId,
      scheduledStart: input.scheduledStart,
      scheduledEnd,
      estimatedMinutes: input.estimatedMinutes,
      blocked: false,
      internalNotes: input.internalNotes,
      checklist: checklists[input.category].map((label, i) => ({
        id: `cl-${i + 1}`,
        label,
        done: false,
      })),
      materials: [],
      notes: '',
      labour: { startedAt: null, endedAt: null, elapsedSeconds: 0, running: false },
      signOff: null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    }

    const acts = [pushActivity(job.id, 'created', `Job ${job.reference} created`, actorName())]
    if (status === 'scheduled' && input.technicianId) {
      const tech = state.technicians.find((t) => t.id === input.technicianId)
      acts.push(
        pushActivity(job.id, 'assigned', `Assigned to ${tech?.name ?? 'technician'}`, actorName()),
      )
    }

    setState({
      jobs: [...state.jobs, job],
      activities: [...acts, ...state.activities],
    })
    return { ok: true, job }
  },

  updateJob(
    jobId: string,
    patch: Partial<Job>,
    options?: { activityMessage?: string; activityType?: ActivityEntry['type'] },
  ): { ok: true } | { ok: false; error: string } {
    const job = state.jobs.find((j) => j.id === jobId)
    if (!job) return { ok: false, error: 'Job not found.' }

    const next = { ...job, ...patch, id: jobId, updatedAt: new Date().toISOString() }

    if (next.technicianId && next.scheduledStart && next.scheduledEnd) {
      if (
        next.technicianId !== job.technicianId ||
        next.scheduledStart !== job.scheduledStart ||
        next.scheduledEnd !== job.scheduledEnd
      ) {
        const check = canAssignSchedule(
          state.jobs,
          next.technicianId,
          next.scheduledStart,
          next.scheduledEnd,
          jobId,
        )
        if (!check.ok) {
          return { ok: false, error: check.conflicts.map((c) => c.message).join(' ') }
        }
      }
    }

    if (
      next.technicianId &&
      next.scheduledStart &&
      (next.status === 'unassigned' || (!job.technicianId && next.technicianId))
    ) {
      if (next.status === 'unassigned') next.status = 'scheduled'
    }

    const acts: ActivityEntry[] = []
    if (options?.activityMessage) {
      acts.push(
        pushActivity(
          jobId,
          options.activityType ?? 'status_changed',
          options.activityMessage,
          actorName(),
        ),
      )
    }

    setState({
      jobs: state.jobs.map((j) => (j.id === jobId ? next : j)),
      activities: acts.length ? [...acts, ...state.activities] : state.activities,
    })
    return { ok: true }
  },

  assignJob(
    jobId: string,
    technicianId: string,
    scheduledStart: string,
    estimatedMinutes: number,
  ): { ok: true } | { ok: false; error: string } {
    const scheduledEnd = new Date(
      new Date(scheduledStart).getTime() + estimatedMinutes * 60_000,
    ).toISOString()
    const check = canAssignSchedule(state.jobs, technicianId, scheduledStart, scheduledEnd, jobId)
    if (!check.ok) {
      return { ok: false, error: check.conflicts.map((c) => c.message).join(' ') }
    }
    const tech = state.technicians.find((t) => t.id === technicianId)
    const job = state.jobs.find((j) => j.id === jobId)
    if (!job) return { ok: false, error: 'Job not found.' }

    const wasAssigned = Boolean(job.technicianId && job.scheduledStart)
    const nextStatus: JobStatus =
      job.status === 'unassigned' || job.status === 'cancelled' ? 'scheduled' : job.status
    return actions.updateJob(
      jobId,
      {
        technicianId,
        scheduledStart,
        scheduledEnd,
        estimatedMinutes,
        status: nextStatus,
      },
      {
        activityType: wasAssigned ? 'rescheduled' : 'assigned',
        activityMessage: wasAssigned
          ? `Rescheduled with ${tech?.name ?? 'technician'}`
          : `Assigned to ${tech?.name ?? 'technician'}`,
      },
    )
  },

  cancelJob(jobId: string, reason?: string) {
    return actions.updateJob(
      jobId,
      { status: 'cancelled', blocked: false, blockedReason: reason },
      { activityType: 'cancelled', activityMessage: reason ? `Cancelled: ${reason}` : 'Job cancelled' },
    )
  },

  setBlocked(jobId: string, blocked: boolean, reason?: string) {
    return actions.updateJob(
      jobId,
      { blocked, blockedReason: blocked ? reason : undefined },
      {
        activityType: 'status_changed',
        activityMessage: blocked ? `Marked blocked: ${reason ?? 'No reason'}` : 'Cleared blocked flag',
      },
    )
  },

  startTravel(jobId: string) {
    return actions.updateJob(
      jobId,
      { status: 'en_route' },
      { activityType: 'status_changed', activityMessage: 'Technician en route' },
    )
  },

  startWork(jobId: string) {
    const job = state.jobs.find((j) => j.id === jobId)
    if (!job) return { ok: false as const, error: 'Job not found.' }

    // Only one running timer per technician
    const techId = job.technicianId ?? state.activeTechnicianId
    const updatedJobs = state.jobs.map((j) => {
      if (j.technicianId === techId && j.labour.running && j.id !== jobId) {
        const now = Date.now()
        const started = j.labour.startedAt ? new Date(j.labour.startedAt).getTime() : now
        const extra = Math.max(0, Math.floor((now - started) / 1000))
        return {
          ...j,
          labour: {
            ...j.labour,
            running: false,
            endedAt: new Date().toISOString(),
            elapsedSeconds: j.labour.elapsedSeconds + extra,
            startedAt: j.labour.startedAt,
          },
        }
      }
      return j
    })

    state = { ...state, jobs: updatedJobs }

    return actions.updateJob(
      jobId,
      {
        status: 'in_progress',
        labour: {
          startedAt: new Date().toISOString(),
          endedAt: null,
          elapsedSeconds: job.labour.elapsedSeconds,
          running: true,
        },
      },
      { activityType: 'status_changed', activityMessage: 'Work started' },
    )
  },

  tickLabour(jobId: string) {
    const job = state.jobs.find((j) => j.id === jobId)
    if (!job?.labour.running || !job.labour.startedAt) return
    const started = new Date(job.labour.startedAt).getTime()
    const base = job.labour.elapsedSeconds
    // elapsedSeconds stores completed segments; display = base + (now - started) when running
    // Keep startedAt as segment start; no need to rewrite every tick — UI derives live value.
    void base
    void started
  },

  toggleChecklist(jobId: string, itemId: string) {
    const job = state.jobs.find((j) => j.id === jobId)
    if (!job) return { ok: false as const, error: 'Job not found.' }
    const checklist: ChecklistItem[] = job.checklist.map((c) =>
      c.id === itemId ? { ...c, done: !c.done } : c,
    )
    return actions.updateJob(
      jobId,
      { checklist },
      { activityType: 'checklist_updated', activityMessage: 'Checklist updated' },
    )
  },

  updateNotes(jobId: string, notes: string) {
    return actions.updateJob(jobId, { notes })
  },

  setMaterials(jobId: string, materials: MaterialItem[]) {
    return actions.updateJob(jobId, { materials })
  },

  setSignOff(jobId: string, signOff: SignOff) {
    return actions.updateJob(
      jobId,
      { signOff, unavailableReason: undefined },
      { activityType: 'signed_off', activityMessage: `Signed off by ${signOff.name}` },
    )
  },

  setUnavailable(jobId: string, reason: string) {
    return actions.updateJob(
      jobId,
      { unavailableReason: reason, signOff: null },
      { activityType: 'status_changed', activityMessage: `Customer unavailable: ${reason}` },
    )
  },

  completeJob(jobId: string): { ok: true } | { ok: false; error: string } {
    const job = state.jobs.find((j) => j.id === jobId)
    if (!job) return { ok: false, error: 'Job not found.' }
    const check = checkCompletionRules(job)
    if (!check.canComplete) {
      return { ok: false, error: check.reasons.join(' ') }
    }

    let labour = { ...job.labour }
    if (labour.running && labour.startedAt) {
      const extra = Math.max(0, Math.floor((Date.now() - new Date(labour.startedAt).getTime()) / 1000))
      labour = {
        startedAt: labour.startedAt,
        endedAt: new Date().toISOString(),
        elapsedSeconds: labour.elapsedSeconds + extra,
        running: false,
      }
    } else {
      labour = { ...labour, running: false, endedAt: labour.endedAt ?? new Date().toISOString() }
    }

    return actions.updateJob(
      jobId,
      {
        status: 'completed',
        completedAt: new Date().toISOString(),
        labour,
        blocked: false,
      },
      { activityType: 'completed', activityMessage: 'Job completed' },
    )
  },

  async addPhoto(
    jobId: string,
    file: File,
    kind: 'before' | 'after',
  ): Promise<{ ok: true; photo: JobPhoto } | { ok: false; error: string }> {
    const fileErr = validatePhotoFile(file)
    if (fileErr) return { ok: false, error: fileErr }
    const limitErr = canAddPhoto(state.photoMeta, jobId)
    if (limitErr) return { ok: false, error: limitErr }

    const photo: JobPhoto = {
      id: uid('photo'),
      jobId,
      kind,
      name: file.name,
      mimeType: file.type,
      size: file.size,
      createdAt: new Date().toISOString(),
    }

    try {
      await savePhotoBlob(photo.id, file)
    } catch {
      return {
        ok: false,
        error: 'Could not save photo to browser storage. Check available space and try again.',
      }
    }

    setState({
      photoMeta: [...state.photoMeta, photo],
      activities: [
        pushActivity(jobId, 'photo_added', `Added ${kind} photo: ${file.name}`, actorName()),
        ...state.activities,
      ],
    })
    return { ok: true, photo }
  },

  async removePhoto(photoId: string) {
    try {
      await deletePhotoBlob(photoId)
    } catch {
      // still remove meta so UI recovers
    }
    setState({ photoMeta: state.photoMeta.filter((p) => p.id !== photoId) })
  },
}

export type Actions = typeof actions
