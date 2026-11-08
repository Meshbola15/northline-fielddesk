export type JobStatus =
  | 'unassigned'
  | 'scheduled'
  | 'en_route'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent'

export type ServiceCategory =
  | 'air_conditioning'
  | 'electrical'
  | 'plumbing'
  | 'general_maintenance'

export type CustomerType = 'individual' | 'business'

export type DemoRole = 'office' | 'technician'

export type ActivityType =
  | 'created'
  | 'assigned'
  | 'rescheduled'
  | 'status_changed'
  | 'note_added'
  | 'completed'
  | 'cancelled'
  | 'checklist_updated'
  | 'photo_added'
  | 'signed_off'

export interface Address {
  line1: string
  line2?: string
  city: string
  state: string
  postcode: string
}

export interface Contact {
  name: string
  email: string
  phone: string
  role?: string
}

export interface Customer {
  id: string
  type: CustomerType
  name: string
  contacts: Contact[]
  addresses: Address[]
  notes?: string
  createdAt: string
}

export interface WorkingHours {
  start: string
  end: string
  days: number[]
}

export interface Technician {
  id: string
  name: string
  initials: string
  email: string
  phone: string
  skills: ServiceCategory[]
  workingHours: WorkingHours
  color: string
  available: boolean
}

export interface ChecklistItem {
  id: string
  label: string
  done: boolean
}

export interface MaterialItem {
  id: string
  name: string
  quantity: number
  unit: string
}

export interface JobPhoto {
  id: string
  jobId: string
  kind: 'before' | 'after'
  name: string
  mimeType: string
  size: number
  createdAt: string
}

export interface LabourRecord {
  startedAt: string | null
  endedAt: string | null
  elapsedSeconds: number
  running: boolean
}

export interface SignOff {
  name: string
  signedAt: string
  signatureDataUrl: string
  acknowledgement: string
}

export interface ActivityEntry {
  id: string
  jobId: string
  type: ActivityType
  message: string
  actor: string
  at: string
}

export interface Job {
  id: string
  reference: string
  title: string
  description: string
  category: ServiceCategory
  priority: JobPriority
  status: JobStatus
  customerId: string
  addressIndex: number
  technicianId: string | null
  scheduledStart: string | null
  scheduledEnd: string | null
  estimatedMinutes: number
  blocked: boolean
  blockedReason?: string
  internalNotes: string
  checklist: ChecklistItem[]
  materials: MaterialItem[]
  notes: string
  labour: LabourRecord
  signOff: SignOff | null
  unavailableReason?: string
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface CompanySettings {
  name: string
  phone: string
  email: string
  address: string
  workingHours: WorkingHours
}

export interface AppState {
  version: number
  seededAt: string
  anchorDate: string
  customers: Customer[]
  technicians: Technician[]
  jobs: Job[]
  activities: ActivityEntry[]
  settings: CompanySettings
  demoRole: DemoRole
  activeTechnicianId: string
  photoMeta: JobPhoto[]
}

export interface JobFilters {
  q?: string
  status?: JobStatus | 'all' | 'blocked' | 'overdue'
  priority?: JobPriority | 'all'
  technicianId?: string | 'all' | 'unassigned'
  dateFrom?: string
  dateTo?: string
}
