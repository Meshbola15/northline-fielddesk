import { isAfter, isBefore, isSameDay, parseISO, startOfDay, endOfDay } from 'date-fns'
import type { Job, JobFilters, JobStatus } from '../types'

const ACTIVE: JobStatus[] = ['unassigned', 'scheduled', 'en_route', 'in_progress']

export function isOverdue(job: Job, now = new Date()): boolean {
  if (!job.scheduledEnd) return false
  if (!ACTIVE.includes(job.status)) return false
  return isAfter(now, parseISO(job.scheduledEnd))
}

export function isJobToday(job: Job, day = new Date()): boolean {
  if (!job.scheduledStart) return false
  return isSameDay(parseISO(job.scheduledStart), day)
}

export function filterJobs(jobs: Job[], filters: JobFilters, now = new Date()): Job[] {
  return jobs.filter((job) => {
    if (filters.q) {
      const q = filters.q.toLowerCase()
      const hay = `${job.reference} ${job.title} ${job.description}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'blocked') {
        if (!job.blocked) return false
      } else if (filters.status === 'overdue') {
        if (!isOverdue(job, now)) return false
      } else if (job.status !== filters.status) {
        return false
      }
    }
    if (filters.priority && filters.priority !== 'all' && job.priority !== filters.priority) {
      return false
    }
    if (filters.technicianId && filters.technicianId !== 'all') {
      if (filters.technicianId === 'unassigned') {
        if (job.technicianId) return false
      } else if (job.technicianId !== filters.technicianId) {
        return false
      }
    }
    if (filters.dateFrom && job.scheduledStart) {
      if (isBefore(parseISO(job.scheduledStart), startOfDay(parseISO(filters.dateFrom)))) return false
    }
    if (filters.dateTo && job.scheduledStart) {
      if (isAfter(parseISO(job.scheduledStart), endOfDay(parseISO(filters.dateTo)))) return false
    }
    return true
  })
}

export function sortJobs(jobs: Job[], key: string, dir: 'asc' | 'desc' = 'asc'): Job[] {
  const mul = dir === 'asc' ? 1 : -1
  return [...jobs].sort((a, b) => {
    const av = (a as unknown as Record<string, unknown>)[key]
    const bv = (b as unknown as Record<string, unknown>)[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * mul
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul
    return String(av).localeCompare(String(bv)) * mul
  })
}

export function bookedHoursForTechnician(jobs: Job[], technicianId: string, day = new Date()): number {
  return jobs
    .filter(
      (j) =>
        j.technicianId === technicianId &&
        j.scheduledStart &&
        isSameDay(parseISO(j.scheduledStart), day) &&
        j.status !== 'cancelled',
    )
    .reduce((sum, j) => sum + j.estimatedMinutes / 60, 0)
}
