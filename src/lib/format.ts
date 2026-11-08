import { format, parseISO, isValid } from 'date-fns'
import type { JobPriority, JobStatus, ServiceCategory } from '../types'

export function fmtDate(iso: string | null | undefined, pattern = 'dd MMM yyyy') {
  if (!iso) return '—'
  const d = parseISO(iso)
  return isValid(d) ? format(d, pattern) : '—'
}

export function fmtTime(iso: string | null | undefined) {
  return fmtDate(iso, 'HH:mm')
}

export function fmtDateTime(iso: string | null | undefined) {
  return fmtDate(iso, 'dd MMM yyyy · HH:mm')
}

export function fmtDuration(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export function fmtElapsed(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export const STATUS_LABEL: Record<JobStatus, string> = {
  unassigned: 'Unassigned',
  scheduled: 'Scheduled',
  en_route: 'En route',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export const PRIORITY_LABEL: Record<JobPriority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
  urgent: 'Urgent',
}

export const CATEGORY_LABEL: Record<ServiceCategory, string> = {
  air_conditioning: 'Air conditioning',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  general_maintenance: 'General maintenance',
}

export const CATEGORY_SHORT: Record<ServiceCategory, string> = {
  air_conditioning: 'AC',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  general_maintenance: 'General',
}
