import type { Job } from '../types'

export interface CompletionCheck {
  canComplete: boolean
  reasons: string[]
}

/** Completion rules: checklist complete + sign-off, unless customer unavailable with reason. */
export function checkCompletionRules(job: Job): CompletionCheck {
  const reasons: string[] = []

  if (job.status === 'completed') {
    return { canComplete: false, reasons: ['Job is already completed.'] }
  }
  if (job.status === 'cancelled') {
    return { canComplete: false, reasons: ['Cancelled jobs cannot be completed.'] }
  }
  if (job.status !== 'in_progress' && job.status !== 'en_route' && job.status !== 'scheduled') {
    reasons.push('Job must be started before completion.')
  }

  const unavailable = Boolean(job.unavailableReason?.trim())
  if (unavailable) {
    return { canComplete: true, reasons: [] }
  }

  const incomplete = job.checklist.filter((c) => !c.done)
  if (incomplete.length > 0) {
    reasons.push(
      incomplete.length === 1
        ? 'Complete the remaining checklist item.'
        : `Complete ${incomplete.length} remaining checklist items.`,
    )
  }

  if (!job.signOff?.signatureDataUrl || !job.signOff.name.trim()) {
    reasons.push('Customer sign-off is required (or mark customer unavailable).')
  }

  return { canComplete: reasons.length === 0, reasons }
}

export function canStartTravel(job: Job): boolean {
  return job.status === 'scheduled'
}

export function canStartWork(job: Job): boolean {
  return job.status === 'scheduled' || job.status === 'en_route'
}

export function nextStatusAfterTravel(): Job['status'] {
  return 'en_route'
}

export function nextStatusAfterStartWork(): Job['status'] {
  return 'in_progress'
}
