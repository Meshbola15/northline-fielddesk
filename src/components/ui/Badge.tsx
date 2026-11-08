import clsx from 'clsx'
import type { JobPriority, JobStatus } from '../../types'
import { PRIORITY_LABEL, STATUS_LABEL } from '../../lib/format'

const statusClass: Record<JobStatus, string> = {
  unassigned: 'text-muted border-border bg-raised',
  scheduled: 'text-secondary border-border bg-surface',
  en_route: 'text-accent-ink border-accent/20 bg-accent-soft',
  in_progress: 'text-warning border-transparent bg-warning-bg',
  completed: 'text-success border-transparent bg-success-bg',
  cancelled: 'text-danger border-transparent bg-danger-bg',
}

const priorityClass: Record<JobPriority, string> = {
  low: 'text-muted',
  normal: 'text-secondary',
  high: 'text-warning',
  urgent: 'text-danger',
}

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium',
        statusClass[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: JobPriority }) {
  return (
    <span className={clsx('inline-flex items-center text-[12px] font-medium', priorityClass[priority])}>
      {PRIORITY_LABEL[priority]}
    </span>
  )
}

export function FlagBadge({
  children,
  tone = 'warning',
}: {
  children: React.ReactNode
  tone?: 'warning' | 'danger' | 'info'
}) {
  const tones = {
    warning: 'text-warning bg-warning-bg',
    danger: 'text-danger bg-danger-bg',
    info: 'text-info bg-info-bg',
  }
  return (
    <span className={clsx('inline-flex items-center rounded-md px-2 py-0.5 text-[12px] font-medium', tones[tone])}>
      {children}
    </span>
  )
}
