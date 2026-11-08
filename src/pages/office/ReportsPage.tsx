import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  eachDayOfInterval,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  subDays,
} from 'date-fns'
import { useStore } from '../../store/StoreContext'
import { CATEGORY_LABEL, fmtElapsed } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import type { ServiceCategory } from '../../types'

export function ReportsPage() {
  const { state, getTechnician, getCustomer } = useStore()
  const today = startOfDay(new Date())
  const [from, setFrom] = useState(format(subDays(today, 13), 'yyyy-MM-dd'))
  const [to, setTo] = useState(format(today, 'yyyy-MM-dd'))

  const range = {
    start: startOfDay(parseISO(from)),
    end: startOfDay(parseISO(to)),
  }

  const completedInRange = useMemo(() => {
    const interval = {
      start: startOfDay(parseISO(from)),
      end: startOfDay(parseISO(to)),
    }
    return state.jobs.filter((j) => {
      if (j.status !== 'completed' || !j.completedAt) return false
      return isWithinInterval(parseISO(j.completedAt), interval)
    })
  }, [state.jobs, from, to])

  const byDay = eachDayOfInterval(range).map((day) => ({
    day: format(day, 'dd MMM'),
    count: completedInRange.filter(
      (j) => format(parseISO(j.completedAt!), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'),
    ).length,
  }))

  const byCategory = (Object.keys(CATEGORY_LABEL) as ServiceCategory[]).map((cat) => ({
    category: CATEGORY_LABEL[cat],
    count: completedInRange.filter((j) => j.category === cat).length,
  }))

  const labourByTech = state.technicians.map((t) => {
    const jobs = completedInRange.filter((j) => j.technicianId === t.id)
    const seconds = jobs.reduce((sum, j) => sum + j.labour.elapsedSeconds, 0)
    return { name: t.name, hours: Math.round((seconds / 3600) * 10) / 10, seconds }
  })

  const avgDurationMinutes =
    completedInRange.length === 0
      ? 0
      : Math.round(
          completedInRange.reduce((sum, j) => sum + j.labour.elapsedSeconds, 0) /
            completedInRange.length /
            60,
        )

  const exportCsv = () => {
    const filtered = state.jobs.filter((j) => {
      if (!j.scheduledStart && !j.completedAt) return true
      const anchor = j.completedAt ?? j.scheduledStart
      if (!anchor) return true
      return isWithinInterval(parseISO(anchor), range)
    })
    const header = [
      'reference',
      'title',
      'status',
      'priority',
      'category',
      'customer',
      'technician',
      'scheduledStart',
      'completedAt',
      'labourSeconds',
    ]
    const rows = filtered.map((j) =>
      [
        j.reference,
        csv(j.title),
        j.status,
        j.priority,
        j.category,
        csv(getCustomer(j.customerId)?.name ?? ''),
        csv(j.technicianId ? getTechnician(j.technicianId)?.name ?? '' : ''),
        j.scheduledStart ?? '',
        j.completedAt ?? '',
        String(j.labour.elapsedSeconds),
      ].join(','),
    )
    const blob = new Blob([[header.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fielddesk-jobs-${from}-to-${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 panel p-5">
        <Field label="From">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </Field>
        <Field label="To">
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </Field>
        <Button variant="outline" onClick={exportCsv}>
          Export CSV
        </Button>
        <div className="ml-auto text-sm text-muted">
          {completedInRange.length} completed · avg labour {avgDurationMinutes}m (
          {fmtElapsed(avgDurationMinutes * 60)})
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Jobs completed over time">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EC" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#68747D' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#68747D' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="count" fill="#087f8c" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="By service category">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byCategory} layout="vertical" margin={{ left: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EC" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#68747D' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" width={120} tick={{ fontSize: 11, fill: '#68747D' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="count" fill="#171717" radius={[0, 4, 4, 0]} name="Jobs" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Labour hours by technician">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={labourByTech}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E8EC" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#68747D' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#68747D' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6 }} />
              <Bar dataKey="hours" fill="#a1a1aa" radius={[4, 4, 0, 0]} name="Hours" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="panel p-5">
          <h3 className="text-[14px] font-medium">Average recorded duration</h3>
          <p className="mt-6 text-[40px] font-medium tabular-nums tracking-tight text-ink">
            {avgDurationMinutes}m
          </p>
          <p className="mt-2 text-sm text-muted">
            Mean labour timer across {completedInRange.length} completed jobs in the selected range.
          </p>
        </section>
      </div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h3 className="mb-3 text-[14px] font-medium">{title}</h3>
      {children}
    </section>
  )
}

function csv(value: string) {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
