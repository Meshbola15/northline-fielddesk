import { addDays, addHours, addMinutes, setHours, setMinutes, startOfDay, subDays } from 'date-fns'
import type {
  ActivityEntry,
  AppState,
  Customer,
  Job,
  ServiceCategory,
  Technician,
} from '../types'

function id(prefix: string, n: number) {
  return `${prefix}-${String(n).padStart(3, '0')}`
}

function at(day: Date, hour: number, minute = 0) {
  return setMinutes(setHours(startOfDay(day), hour), minute).toISOString()
}

function checklist(labels: string[], doneCount = 0) {
  return labels.map((label, i) => ({
    id: `cl-${i + 1}`,
    label,
    done: i < doneCount,
  }))
}

const defaultHours = { start: '08:00', end: '17:00', days: [1, 2, 3, 4, 5] }

export function createSeedState(anchor = new Date()): AppState {
  const day0 = startOfDay(anchor)
  const d = (offset: number) => addDays(day0, offset)

  const customers: Customer[] = [
    {
      id: id('cus', 1),
      type: 'business',
      name: 'Harbourview Apartments',
      contacts: [
        { name: 'Priya Nair', email: 'priya@harbourview.example', phone: '+61 2 9001 1101', role: 'Building manager' },
      ],
      addresses: [
        { line1: '18 Quay Street', city: 'Sydney', state: 'NSW', postcode: '2000' },
        { line1: 'Basement plant room', line2: '18 Quay Street', city: 'Sydney', state: 'NSW', postcode: '2000' },
      ],
      notes: 'Access via loading dock after 7am. Concierge has spare keys.',
      createdAt: subDays(day0, 120).toISOString(),
    },
    {
      id: id('cus', 2),
      type: 'business',
      name: 'Northside Medical Clinic',
      contacts: [
        { name: 'Dr. Helen Cho', email: 'admin@northsidemed.example', phone: '+61 2 9001 2202', role: 'Practice manager' },
      ],
      addresses: [{ line1: '44 Pacific Highway', city: 'St Leonards', state: 'NSW', postcode: '2065' }],
      notes: 'Quiet hours 09:00–12:00 for consulting rooms.',
      createdAt: subDays(day0, 90).toISOString(),
    },
    {
      id: id('cus', 3),
      type: 'individual',
      name: 'James Whitaker',
      contacts: [{ name: 'James Whitaker', email: 'james.whitaker@example.com', phone: '+61 412 300 301' }],
      addresses: [{ line1: '7 Maple Lane', city: 'Chatswood', state: 'NSW', postcode: '2067' }],
      createdAt: subDays(day0, 60).toISOString(),
    },
    {
      id: id('cus', 4),
      type: 'business',
      name: 'Cedar Ridge Hotel',
      contacts: [
        { name: 'Marcus Lee', email: 'facilities@cedarridge.example', phone: '+61 2 9001 3303', role: 'Facilities' },
      ],
      addresses: [
        { line1: '210 George Street', city: 'Sydney', state: 'NSW', postcode: '2000' },
        { line1: 'Level 12 plant', line2: '210 George Street', city: 'Sydney', state: 'NSW', postcode: '2000' },
      ],
      notes: 'Sign in at front desk. PPE required on roof plant.',
      createdAt: subDays(day0, 200).toISOString(),
    },
    {
      id: id('cus', 5),
      type: 'individual',
      name: 'Sofia Alvarez',
      contacts: [{ name: 'Sofia Alvarez', email: 'sofia.alvarez@example.com', phone: '+61 413 400 402' }],
      addresses: [{ line1: '29 Ocean View Rd', city: 'Manly', state: 'NSW', postcode: '2095' }],
      createdAt: subDays(day0, 40).toISOString(),
    },
    {
      id: id('cus', 6),
      type: 'business',
      name: 'Brightpath Early Learning',
      contacts: [
        { name: 'Amy Tran', email: 'amy@brightpath.example', phone: '+61 2 9001 4404', role: 'Centre director' },
      ],
      addresses: [{ line1: '5 Grove Avenue', city: 'Lane Cove', state: 'NSW', postcode: '2066' }],
      notes: 'Work outside nap window 12:30–14:00 when possible.',
      createdAt: subDays(day0, 75).toISOString(),
    },
    {
      id: id('cus', 7),
      type: 'business',
      name: 'Kestrel Logistics Warehouse',
      contacts: [
        { name: 'Tom Briggs', email: 'tom.briggs@kestrel.example', phone: '+61 2 9001 5505', role: 'Site supervisor' },
      ],
      addresses: [{ line1: '88 Industrial Drive', city: 'Silverwater', state: 'NSW', postcode: '2128' }],
      createdAt: subDays(day0, 150).toISOString(),
    },
    {
      id: id('cus', 8),
      type: 'individual',
      name: 'Elena Petrova',
      contacts: [{ name: 'Elena Petrova', email: 'elena.petrova@example.com', phone: '+61 414 500 503' }],
      addresses: [{ line1: '12 Riverview Court', city: 'Gladesville', state: 'NSW', postcode: '2111' }],
      createdAt: subDays(day0, 25).toISOString(),
    },
    {
      id: id('cus', 9),
      type: 'business',
      name: 'Ashbury Co-working',
      contacts: [
        { name: 'Noah Patel', email: 'noah@ashbury.example', phone: '+61 2 9001 6606', role: 'Ops lead' },
      ],
      addresses: [{ line1: '301 Oxford Street', city: 'Bondi Junction', state: 'NSW', postcode: '2022' }],
      createdAt: subDays(day0, 110).toISOString(),
    },
    {
      id: id('cus', 10),
      type: 'individual',
      name: 'Chris Nguyen',
      contacts: [{ name: 'Chris Nguyen', email: 'chris.nguyen@example.com', phone: '+61 415 600 604' }],
      addresses: [{ line1: '3 Hilltop Street', city: 'Mosman', state: 'NSW', postcode: '2088' }],
      createdAt: subDays(day0, 18).toISOString(),
    },
    {
      id: id('cus', 11),
      type: 'business',
      name: 'Parkside Retail Arcade',
      contacts: [
        { name: 'Lina Okonkwo', email: 'lina@parkside.example', phone: '+61 2 9001 7707', role: 'Centre manager' },
      ],
      addresses: [{ line1: '55 Park Road', city: 'Parramatta', state: 'NSW', postcode: '2150' }],
      createdAt: subDays(day0, 80).toISOString(),
    },
    {
      id: id('cus', 12),
      type: 'business',
      name: 'Westfield Plant Services (site)',
      contacts: [
        { name: 'Gary Mills', email: 'gary.mills@site.example', phone: '+61 2 9001 8808', role: 'On-site contact' },
      ],
      addresses: [{ line1: 'Level B2 plant corridor', line2: '100 Market Street', city: 'Sydney', state: 'NSW', postcode: '2000' }],
      notes: 'Inducted contractors only. Bring photo ID.',
      createdAt: subDays(day0, 300).toISOString(),
    },
  ]

  const technicians: Technician[] = [
    {
      id: id('tech', 1),
      name: 'Alex Rivera',
      initials: 'AR',
      email: 'alex.rivera@northline.example',
      phone: '+61 400 111 201',
      skills: ['air_conditioning', 'general_maintenance'],
      workingHours: defaultHours,
      color: '#087F8C',
      available: true,
    },
    {
      id: id('tech', 2),
      name: 'Jordan Blake',
      initials: 'JB',
      email: 'jordan.blake@northline.example',
      phone: '+61 400 111 202',
      skills: ['electrical', 'general_maintenance'],
      workingHours: defaultHours,
      color: '#1B6CA8',
      available: true,
    },
    {
      id: id('tech', 3),
      name: 'Sam Okada',
      initials: 'SO',
      email: 'sam.okada@northline.example',
      phone: '+61 400 111 203',
      skills: ['plumbing', 'general_maintenance'],
      workingHours: defaultHours,
      color: '#1F7A4D',
      available: true,
    },
    {
      id: id('tech', 4),
      name: 'Morgan Ellis',
      initials: 'ME',
      email: 'morgan.ellis@northline.example',
      phone: '+61 400 111 204',
      skills: ['air_conditioning', 'electrical'],
      workingHours: defaultHours,
      color: '#B86E00',
      available: true,
    },
    {
      id: id('tech', 5),
      name: 'Casey Tran',
      initials: 'CT',
      email: 'casey.tran@northline.example',
      phone: '+61 400 111 205',
      skills: ['plumbing', 'electrical'],
      workingHours: { start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] },
      color: '#6B5B95',
      available: true,
    },
    {
      id: id('tech', 6),
      name: 'Riley Chen',
      initials: 'RC',
      email: 'riley.chen@northline.example',
      phone: '+61 400 111 206',
      skills: ['general_maintenance', 'air_conditioning', 'plumbing'],
      workingHours: defaultHours,
      color: '#C0392B',
      available: false,
    },
  ]

  const emptyLabour = () => ({
    startedAt: null as string | null,
    endedAt: null as string | null,
    elapsedSeconds: 0,
    running: false,
  })

  type JobSeed = Partial<Job> &
    Pick<Job, 'title' | 'description' | 'category' | 'priority' | 'status' | 'customerId'> & {
      dayOffset?: number
      hour?: number
      minutes?: number
      tech?: number | null
      blocked?: boolean
      blockedReason?: string
      addressIndex?: number
      materials?: Job['materials']
      checklistDone?: number
      notes?: string
      completed?: boolean
      labourMinutes?: number
      signName?: string
    }

  const jobDefs: JobSeed[] = [
    // Demo walkthrough job — clearly identifiable
    {
      title: 'DEMO: Complete this AC warm-air call',
      description:
        'Lobby split system blowing warm air. Filter access from side panel. Visitor walkthrough job — start travel, start work, complete checklist and sign-off.',
      category: 'air_conditioning',
      priority: 'high',
      status: 'scheduled',
      customerId: id('cus', 1),
      dayOffset: 0,
      hour: 10,
      minutes: 90,
      tech: 1,
      checklistDone: 0,
      notes: '',
    },
    {
      title: 'Kitchen sink leak under cabinet',
      description: 'Slow drip from P-trap after dishwasher install. Customer reports water pooling overnight.',
      category: 'plumbing',
      priority: 'urgent',
      status: 'scheduled',
      customerId: id('cus', 3),
      dayOffset: 0,
      hour: 8,
      minutes: 60,
      tech: 3,
    },
    {
      title: 'Lighting circuit intermittent on Level 2',
      description: 'Corridor lights flicker between 2B and 2F. Check breaker and junction boxes.',
      category: 'electrical',
      priority: 'high',
      status: 'en_route',
      customerId: id('cus', 4),
      dayOffset: 0,
      hour: 9,
      minutes: 120,
      tech: 2,
    },
    {
      title: 'Quarterly plant room inspection',
      description: 'Scheduled quarterly inspection of chillers and pumps. Complete full checklist.',
      category: 'air_conditioning',
      priority: 'normal',
      status: 'scheduled',
      customerId: id('cus', 12),
      dayOffset: 0,
      hour: 13,
      minutes: 180,
      tech: 4,
      addressIndex: 0,
    },
    {
      title: 'Blocked drain — staff kitchen',
      description: 'Standing water in sink. Suspected grease build-up.',
      category: 'plumbing',
      priority: 'high',
      status: 'in_progress',
      customerId: id('cus', 2),
      dayOffset: 0,
      hour: 8,
      minutes: 75,
      tech: 5,
      checklistDone: 2,
      labourMinutes: 40,
    },
    {
      title: 'Emergency exit light failed',
      description: 'Exit light above rear fire door not illuminating on test.',
      category: 'electrical',
      priority: 'urgent',
      status: 'unassigned',
      customerId: id('cus', 6),
      dayOffset: 0,
      hour: 14,
      minutes: 45,
      tech: null,
    },
    {
      title: 'Rooftop condenser cleaning',
      description: 'Annual clean and coil inspection. Bring PPE for roof access.',
      category: 'air_conditioning',
      priority: 'normal',
      status: 'scheduled',
      customerId: id('cus', 4),
      dayOffset: 1,
      hour: 9,
      minutes: 150,
      tech: 1,
      addressIndex: 1,
    },
    {
      title: 'Hot water unit not heating',
      description: 'No hot water in bathrooms since yesterday evening.',
      category: 'plumbing',
      priority: 'urgent',
      status: 'scheduled',
      customerId: id('cus', 5),
      dayOffset: 0,
      hour: 15,
      minutes: 90,
      tech: 3,
      blocked: true,
      blockedReason: 'Parts on order — waiting for element kit',
    },
    {
      title: 'Power point sparking in office 3',
      description: 'Outlet on west wall sparked when vacuum plugged in. Isolate and replace.',
      category: 'electrical',
      priority: 'urgent',
      status: 'scheduled',
      customerId: id('cus', 9),
      dayOffset: 1,
      hour: 8,
      minutes: 60,
      tech: 2,
    },
    {
      title: 'Door closer adjustment — main entry',
      description: 'Front door slamming. Adjust closer and check hinges.',
      category: 'general_maintenance',
      priority: 'low',
      status: 'scheduled',
      customerId: id('cus', 6),
      dayOffset: 1,
      hour: 11,
      minutes: 45,
      tech: 6,
    },
    {
      title: 'AC warm air — consulting room 4',
      description: 'Room not cooling. Check refrigerant and filters.',
      category: 'air_conditioning',
      priority: 'high',
      status: 'scheduled',
      customerId: id('cus', 2),
      dayOffset: 2,
      hour: 9,
      minutes: 90,
      tech: 4,
    },
    {
      title: 'Warehouse roller door sensor fault',
      description: 'Door reverses mid-close. Inspect photo-eyes and tracks.',
      category: 'general_maintenance',
      priority: 'high',
      status: 'scheduled',
      customerId: id('cus', 7),
      dayOffset: 2,
      hour: 10,
      minutes: 120,
      tech: 1,
    },
    {
      title: 'Toilet cistern continuous fill',
      description: 'Cistern valve not seating. Replace inlet valve.',
      category: 'plumbing',
      priority: 'normal',
      status: 'scheduled',
      customerId: id('cus', 8),
      dayOffset: 2,
      hour: 14,
      minutes: 60,
      tech: 3,
    },
    {
      title: 'Switchboard label refresh',
      description: 'Update circuit schedules after recent fit-out.',
      category: 'electrical',
      priority: 'low',
      status: 'scheduled',
      customerId: id('cus', 9),
      dayOffset: 3,
      hour: 9,
      minutes: 90,
      tech: 2,
    },
    {
      title: 'Gutter overflow after rain',
      description: 'Front gutter overflowing onto entry. Clear debris and check fall.',
      category: 'general_maintenance',
      priority: 'normal',
      status: 'scheduled',
      customerId: id('cus', 10),
      dayOffset: 3,
      hour: 13,
      minutes: 75,
      tech: 5,
    },
    {
      title: 'Retail tenancy AC filter change',
      description: 'Monthly filter service for arcade tenancies A–D.',
      category: 'air_conditioning',
      priority: 'normal',
      status: 'completed',
      customerId: id('cus', 11),
      dayOffset: -1,
      hour: 9,
      minutes: 120,
      tech: 4,
      checklistDone: 5,
      notes: 'Filters replaced on tenancies A–D. Next due in 30 days.',
      labourMinutes: 95,
      signName: 'Lina Okonkwo',
    },
    // Completed historical jobs
    {
      title: 'Kitchen mixer replacement',
      description: 'Replaced leaking kitchen mixer and checked isolation valves.',
      category: 'plumbing',
      priority: 'normal',
      status: 'completed',
      customerId: id('cus', 3),
      dayOffset: -1,
      hour: 11,
      minutes: 60,
      tech: 3,
      checklistDone: 4,
      notes: 'Replaced mixer; advised customer on cartridge warranty.',
      labourMinutes: 55,
      signName: 'James Whitaker',
      materials: [
        { id: 'mat-1', name: 'Kitchen mixer — chrome', quantity: 1, unit: 'ea' },
        { id: 'mat-2', name: 'PTFE tape', quantity: 1, unit: 'roll' },
      ],
    },
    {
      title: 'Lighting circuit repair — store room',
      description: 'Fixed loose neutral causing intermittent outage.',
      category: 'electrical',
      priority: 'high',
      status: 'completed',
      customerId: id('cus', 7),
      dayOffset: -2,
      hour: 8,
      minutes: 90,
      tech: 2,
      checklistDone: 4,
      notes: 'Tightened neutrals; Megger test passed.',
      labourMinutes: 80,
      signName: 'Tom Briggs',
      materials: [{ id: 'mat-1', name: 'Wago connectors', quantity: 6, unit: 'ea' }],
    },
    {
      title: 'Split system service — apartment 12B',
      description: 'Quarterly service: filters, drain, performance check.',
      category: 'air_conditioning',
      priority: 'normal',
      status: 'completed',
      customerId: id('cus', 1),
      dayOffset: -2,
      hour: 13,
      minutes: 60,
      tech: 1,
      checklistDone: 5,
      notes: 'Filters cleaned. Drain clear. Cooling OK.',
      labourMinutes: 50,
      signName: 'Priya Nair',
    },
    {
      title: 'Emergency lighting test — Level 1',
      description: 'Monthly emergency lighting discharge test.',
      category: 'electrical',
      priority: 'normal',
      status: 'completed',
      customerId: id('cus', 4),
      dayOffset: -3,
      hour: 10,
      minutes: 120,
      tech: 2,
      checklistDone: 4,
      notes: 'All fittings passed except one — replaced battery pack.',
      labourMinutes: 110,
      signName: 'Marcus Lee',
      materials: [{ id: 'mat-1', name: 'Exit light battery pack', quantity: 1, unit: 'ea' }],
    },
    {
      title: 'Tap reseat — bathroom',
      description: 'Dripping basin tap. Reseated washer.',
      category: 'plumbing',
      priority: 'low',
      status: 'completed',
      customerId: id('cus', 5),
      dayOffset: -3,
      hour: 15,
      minutes: 45,
      tech: 5,
      checklistDone: 3,
      notes: 'Washer replaced. No further drip.',
      labourMinutes: 35,
      signName: 'Sofia Alvarez',
    },
    {
      title: 'Door lock cylinder change',
      description: 'Rekeyed storage cupboard after staff change.',
      category: 'general_maintenance',
      priority: 'normal',
      status: 'completed',
      customerId: id('cus', 6),
      dayOffset: -4,
      hour: 9,
      minutes: 45,
      tech: 6,
      checklistDone: 3,
      notes: 'New cylinder fitted. Keys left with director.',
      labourMinutes: 40,
      signName: 'Amy Tran',
      materials: [{ id: 'mat-1', name: 'Euro cylinder 60mm', quantity: 1, unit: 'ea' }],
    },
    {
      title: 'Condensate pump replacement',
      description: 'Failed condensate pump on ducted unit — replace like-for-like.',
      category: 'air_conditioning',
      priority: 'high',
      status: 'completed',
      customerId: id('cus', 9),
      dayOffset: -4,
      hour: 13,
      minutes: 90,
      tech: 4,
      checklistDone: 5,
      notes: 'Pump replaced; tested overflow switch.',
      labourMinutes: 85,
      signName: 'Noah Patel',
      materials: [{ id: 'mat-1', name: 'Condensate pump kit', quantity: 1, unit: 'ea' }],
    },
    {
      title: 'Distribution board tidy-up',
      description: 'Cable management and blanking plates after fit-out.',
      category: 'electrical',
      priority: 'low',
      status: 'completed',
      customerId: id('cus', 11),
      dayOffset: -5,
      hour: 8,
      minutes: 120,
      tech: 2,
      checklistDone: 4,
      notes: 'Board compliant. Photos attached in job notes.',
      labourMinutes: 100,
      signName: 'Lina Okonkwo',
    },
    {
      title: 'Burst hose isolation — laundry',
      description: 'Isolated washing machine hose and capped supply.',
      category: 'plumbing',
      priority: 'urgent',
      status: 'completed',
      customerId: id('cus', 8),
      dayOffset: -5,
      hour: 16,
      minutes: 60,
      tech: 3,
      checklistDone: 3,
      notes: 'Customer to arrange machine repair separately.',
      labourMinutes: 45,
      signName: 'Elena Petrova',
    },
    {
      title: 'Preventive roof plant walkthrough',
      description: 'Visual inspection ahead of summer peak.',
      category: 'air_conditioning',
      priority: 'normal',
      status: 'completed',
      customerId: id('cus', 12),
      dayOffset: -6,
      hour: 9,
      minutes: 150,
      tech: 1,
      checklistDone: 5,
      notes: 'Recommend coil clean next quarter on unit 3.',
      labourMinutes: 140,
      signName: 'Gary Mills',
    },
    {
      title: 'Hand dryer circuit trip',
      description: 'Hand dryer trips RCD. Diagnose and repair.',
      category: 'electrical',
      priority: 'normal',
      status: 'cancelled',
      customerId: id('cus', 11),
      dayOffset: -1,
      hour: 15,
      minutes: 60,
      tech: 5,
    },
    {
      title: 'Unassigned — lobby thermostat fault',
      description: 'Lobby thermostat blank display. Diagnose power and controls.',
      category: 'air_conditioning',
      priority: 'high',
      status: 'unassigned',
      customerId: id('cus', 1),
      dayOffset: 1,
      hour: 15,
      minutes: 60,
      tech: null,
    },
    {
      title: 'Outdoor tap seized',
      description: 'Garden tap will not open. Likely seized spindle.',
      category: 'plumbing',
      priority: 'low',
      status: 'scheduled',
      customerId: id('cus', 10),
      dayOffset: 4,
      hour: 10,
      minutes: 45,
      tech: 3,
    },
    {
      title: 'Ceiling tile water stain investigation',
      description: 'Brown stain above reception. Trace leak source.',
      category: 'general_maintenance',
      priority: 'high',
      status: 'scheduled',
      customerId: id('cus', 9),
      dayOffset: -1,
      hour: 14,
      minutes: 90,
      tech: 1,
      blocked: true,
      blockedReason: 'Awaiting access to ceiling void from landlord',
    },
  ]

  const categoryChecklists: Record<ServiceCategory, string[]> = {
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

  let refCounter = 1042
  const jobs: Job[] = []
  const activities: ActivityEntry[] = []

  for (let i = 0; i < jobDefs.length; i++) {
    const def = jobDefs[i]
    const jobId = id('job', i + 1)
    const minutes = def.minutes ?? 60
    const dayOffset = def.dayOffset ?? 0
    const hour = def.hour ?? 9
    const techId = def.tech == null ? null : id('tech', def.tech)
    const start = def.status === 'unassigned' && !def.dayOffset && def.tech == null && i === 5
      ? null
      : at(d(dayOffset), hour)
    const end = start ? addMinutes(new Date(start), minutes).toISOString() : null
    const createdAt = subDays(day0, Math.max(1, 10 - dayOffset)).toISOString()
    const labels = categoryChecklists[def.category]
    const doneCount = def.checklistDone ?? (def.status === 'completed' ? labels.length : 0)
    const completed = def.status === 'completed'
    const labourSeconds = (def.labourMinutes ?? 0) * 60

    const job: Job = {
      id: jobId,
      reference: `FD-${refCounter++}`,
      title: def.title,
      description: def.description,
      category: def.category,
      priority: def.priority,
      status: def.status,
      customerId: def.customerId,
      addressIndex: def.addressIndex ?? 0,
      technicianId: techId,
      scheduledStart: start,
      scheduledEnd: end,
      estimatedMinutes: minutes,
      blocked: def.blocked ?? false,
      blockedReason: def.blockedReason,
      internalNotes: def.title.startsWith('DEMO:')
        ? 'Portfolio walkthrough job — assign already set; complete via technician role.'
        : '',
      checklist: checklist(labels, doneCount),
      materials: def.materials ?? [],
      notes: def.notes ?? '',
      labour: completed
        ? {
            startedAt: start ? addMinutes(new Date(start), 5).toISOString() : null,
            endedAt: start ? addMinutes(new Date(start), 5 + (def.labourMinutes ?? 45)).toISOString() : null,
            elapsedSeconds: labourSeconds || 45 * 60,
            running: false,
          }
        : def.labourMinutes
          ? {
              startedAt: start ? addMinutes(new Date(start), 5).toISOString() : null,
              endedAt: null,
              elapsedSeconds: labourSeconds,
              running: def.status === 'in_progress',
            }
          : emptyLabour(),
      signOff: completed && def.signName
        ? {
            name: def.signName,
            signedAt: end ?? createdAt,
            signatureDataUrl:
              'data:image/svg+xml;base64,' +
              btoa(
                `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80"><text x="12" y="48" font-family="cursive" font-size="28" fill="#172126">${def.signName}</text></svg>`,
              ),
            acknowledgement: 'Demo acknowledgement — not a legal verification.',
          }
        : null,
      completedAt: completed ? end : null,
      createdAt,
      updatedAt: createdAt,
    }

    // Fix unassigned without schedule for emergency exit light
    if (job.reference === 'FD-1047') {
      job.scheduledStart = null
      job.scheduledEnd = null
      job.technicianId = null
      job.status = 'unassigned'
    }

    jobs.push(job)

    activities.push({
      id: `act-${jobId}-1`,
      jobId,
      type: 'created',
      message: `Job ${job.reference} created`,
      actor: 'Dispatch',
      at: createdAt,
    })
    if (techId && start) {
      activities.push({
        id: `act-${jobId}-2`,
        jobId,
        type: 'assigned',
        message: `Assigned to ${technicians.find((t) => t.id === techId)?.name ?? 'technician'}`,
        actor: 'Dispatch',
        at: addHours(new Date(createdAt), 1).toISOString(),
      })
    }
    if (completed) {
      activities.push({
        id: `act-${jobId}-3`,
        jobId,
        type: 'completed',
        message: 'Job marked completed',
        actor: technicians.find((t) => t.id === techId)?.name ?? 'Technician',
        at: end ?? createdAt,
      })
    }
  }

  return {
    version: 1,
    seededAt: new Date().toISOString(),
    anchorDate: day0.toISOString(),
    customers,
    technicians,
    jobs,
    activities,
    settings: {
      name: 'Northline Maintenance',
      phone: '+61 2 9000 1200',
      email: 'ops@northline.example',
      address: 'Suite 4, 120 Harbour Road, Sydney NSW 2000',
      workingHours: defaultHours,
    },
    demoRole: 'office',
    activeTechnicianId: id('tech', 1),
    photoMeta: [],
  }
}
