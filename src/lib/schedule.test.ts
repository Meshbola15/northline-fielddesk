import { describe, expect, it } from 'vitest'
import { findScheduleConflicts, canAssignSchedule } from './schedule'
import type { Job } from '../types'

function job(partial: Partial<Job> & Pick<Job, 'id' | 'reference' | 'title' | 'technicianId' | 'scheduledStart' | 'scheduledEnd'>): Job {
  return {
    description: '',
    category: 'general_maintenance',
    priority: 'normal',
    status: 'scheduled',
    customerId: 'cus-001',
    addressIndex: 0,
    estimatedMinutes: 60,
    blocked: false,
    internalNotes: '',
    checklist: [],
    materials: [],
    notes: '',
    labour: { startedAt: null, endedAt: null, elapsedSeconds: 0, running: false },
    signOff: null,
    completedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  }
}

describe('findScheduleConflicts', () => {
  const existing = [
    job({
      id: 'job-1',
      reference: 'FD-1001',
      title: 'Existing visit',
      technicianId: 'tech-1',
      scheduledStart: '2026-11-08T09:00:00.000Z',
      scheduledEnd: '2026-11-08T10:30:00.000Z',
    }),
  ]

  it('detects overlapping appointments for the same technician', () => {
    const conflicts = findScheduleConflicts(
      existing,
      'tech-1',
      '2026-11-08T10:00:00.000Z',
      '2026-11-08T11:00:00.000Z',
    )
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].conflictingReference).toBe('FD-1001')
  })

  it('allows back-to-back appointments', () => {
    const conflicts = findScheduleConflicts(
      existing,
      'tech-1',
      '2026-11-08T10:30:00.000Z',
      '2026-11-08T11:30:00.000Z',
    )
    expect(conflicts).toHaveLength(0)
  })

  it('ignores other technicians and completed jobs', () => {
    const jobs = [
      ...existing,
      job({
        id: 'job-2',
        reference: 'FD-1002',
        title: 'Other tech',
        technicianId: 'tech-2',
        scheduledStart: '2026-11-08T10:00:00.000Z',
        scheduledEnd: '2026-11-08T11:00:00.000Z',
      }),
      job({
        id: 'job-3',
        reference: 'FD-1003',
        title: 'Done',
        technicianId: 'tech-1',
        status: 'completed',
        scheduledStart: '2026-11-08T10:00:00.000Z',
        scheduledEnd: '2026-11-08T11:00:00.000Z',
      }),
    ]
    expect(
      findScheduleConflicts(jobs, 'tech-1', '2026-11-08T10:00:00.000Z', '2026-11-08T10:45:00.000Z'),
    ).toHaveLength(1)
  })

  it('canAssignSchedule returns ok when clear', () => {
    expect(
      canAssignSchedule(
        existing,
        'tech-1',
        '2026-11-08T11:00:00.000Z',
        '2026-11-08T12:00:00.000Z',
      ),
    ).toEqual({ ok: true })
  })
})
