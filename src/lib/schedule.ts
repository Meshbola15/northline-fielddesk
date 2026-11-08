import { areIntervalsOverlapping, parseISO } from 'date-fns'
import type { Job } from '../types'

export interface ScheduleConflict {
  conflictingJobId: string
  conflictingReference: string
  conflictingTitle: string
  message: string
}

/** Detect overlapping appointments for the same technician (excludes cancelled/completed). */
export function findScheduleConflicts(
  jobs: Job[],
  technicianId: string,
  startIso: string,
  endIso: string,
  excludeJobId?: string,
): ScheduleConflict[] {
  const start = parseISO(startIso)
  const end = parseISO(endIso)
  if (!(start < end)) {
    return [
      {
        conflictingJobId: '',
        conflictingReference: '',
        conflictingTitle: '',
        message: 'End time must be after start time.',
      },
    ]
  }

  const conflicts: ScheduleConflict[] = []
  for (const job of jobs) {
    if (excludeJobId && job.id === excludeJobId) continue
    if (job.technicianId !== technicianId) continue
    if (job.status === 'cancelled' || job.status === 'completed') continue
    if (!job.scheduledStart || !job.scheduledEnd) continue

    const otherStart = parseISO(job.scheduledStart)
    const otherEnd = parseISO(job.scheduledEnd)
    const overlaps = areIntervalsOverlapping(
      { start, end },
      { start: otherStart, end: otherEnd },
      { inclusive: false },
    )
    if (overlaps) {
      conflicts.push({
        conflictingJobId: job.id,
        conflictingReference: job.reference,
        conflictingTitle: job.title,
        message: `Overlaps ${job.reference} — ${job.title}`,
      })
    }
  }
  return conflicts
}

export function canAssignSchedule(
  jobs: Job[],
  technicianId: string,
  startIso: string,
  endIso: string,
  excludeJobId?: string,
): { ok: true } | { ok: false; conflicts: ScheduleConflict[] } {
  const conflicts = findScheduleConflicts(jobs, technicianId, startIso, endIso, excludeJobId)
  if (conflicts.length) return { ok: false, conflicts }
  return { ok: true }
}
