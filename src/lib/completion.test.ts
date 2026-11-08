import { describe, expect, it } from 'vitest'
import { checkCompletionRules, canStartTravel, canStartWork } from './completion'
import type { Job } from '../types'

function baseJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 'job-1',
    reference: 'FD-2001',
    title: 'Test',
    description: 'Test',
    category: 'plumbing',
    priority: 'normal',
    status: 'in_progress',
    customerId: 'cus-001',
    addressIndex: 0,
    technicianId: 'tech-1',
    scheduledStart: '2026-11-08T09:00:00.000Z',
    scheduledEnd: '2026-11-08T10:00:00.000Z',
    estimatedMinutes: 60,
    blocked: false,
    internalNotes: '',
    checklist: [
      { id: '1', label: 'A', done: true },
      { id: '2', label: 'B', done: true },
    ],
    materials: [],
    notes: '',
    labour: { startedAt: '2026-11-08T09:05:00.000Z', endedAt: null, elapsedSeconds: 0, running: true },
    signOff: {
      name: 'Pat Customer',
      signedAt: '2026-11-08T10:00:00.000Z',
      signatureDataUrl: 'data:image/png;base64,abc',
      acknowledgement: 'Demo acknowledgement — not a legal verification.',
    },
    completedAt: null,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-08T09:00:00.000Z',
    ...overrides,
  }
}

describe('checkCompletionRules', () => {
  it('allows completion when checklist and sign-off are done', () => {
    expect(checkCompletionRules(baseJob()).canComplete).toBe(true)
  })

  it('blocks when checklist incomplete', () => {
    const result = checkCompletionRules(
      baseJob({
        checklist: [
          { id: '1', label: 'A', done: true },
          { id: '2', label: 'B', done: false },
        ],
      }),
    )
    expect(result.canComplete).toBe(false)
    expect(result.reasons.join(' ')).toMatch(/checklist/i)
  })

  it('blocks when sign-off missing', () => {
    const result = checkCompletionRules(baseJob({ signOff: null }))
    expect(result.canComplete).toBe(false)
    expect(result.reasons.join(' ')).toMatch(/sign-off/i)
  })

  it('allows customer unavailable exception with reason', () => {
    const result = checkCompletionRules(
      baseJob({
        signOff: null,
        checklist: [{ id: '1', label: 'A', done: false }],
        unavailableReason: 'No answer at door',
      }),
    )
    expect(result.canComplete).toBe(true)
  })

  it('blocks already completed jobs', () => {
    expect(checkCompletionRules(baseJob({ status: 'completed' })).canComplete).toBe(false)
  })
})

describe('workflow helpers', () => {
  it('start travel only from scheduled', () => {
    expect(canStartTravel(baseJob({ status: 'scheduled' }))).toBe(true)
    expect(canStartTravel(baseJob({ status: 'en_route' }))).toBe(false)
  })

  it('start work from scheduled or en route', () => {
    expect(canStartWork(baseJob({ status: 'scheduled' }))).toBe(true)
    expect(canStartWork(baseJob({ status: 'en_route' }))).toBe(true)
    expect(canStartWork(baseJob({ status: 'in_progress' }))).toBe(false)
  })
})
