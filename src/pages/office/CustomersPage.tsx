import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store/StoreContext'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { EmptyState } from '../../components/ui/EmptyState'
import { useToast } from '../../components/ui/Toast'
import { StatusBadge } from '../../components/ui/Badge'
import { fmtDateTime } from '../../lib/format'
import type { Customer, CustomerType } from '../../types'

export function CustomersPage() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const qq = q.toLowerCase()
    return state.customers.filter((c) => {
      if (!qq) return true
      const hay = `${c.name} ${c.contacts.map((x) => x.name + x.email + x.phone).join(' ')}`.toLowerCase()
      return hay.includes(qq)
    })
  }, [state.customers, q])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-sm flex-1"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search customers…"
          aria-label="Search customers"
        />
        <Button onClick={() => setCreateOpen(true)}>Add customer</Button>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No customers found" />
      ) : (
        <div className="overflow-hidden panel">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-raised text-[12px] text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Primary contact</th>
                <th className="px-3 py-2 font-medium">Sites</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="cursor-pointer border-t border-border hover:bg-app/60"
                  onClick={() => navigate(`/customers/${c.id}`)}
                >
                  <td className="px-3 py-2.5 font-medium text-accent">{c.name}</td>
                  <td className="px-3 py-2.5 capitalize text-muted">{c.type}</td>
                  <td className="px-3 py-2.5">
                    {c.contacts[0]?.name}
                    <div className="text-xs text-muted">{c.contacts[0]?.phone}</div>
                  </td>
                  <td className="px-3 py-2.5 text-muted">{c.addresses.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <CustomerFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}

export function CustomerDetailPage() {
  const { customerId } = useParams()
  const { state, getCustomer } = useStore()
  const customer = getCustomer(customerId ?? '')
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)

  if (!customer) {
    return <EmptyState title="Customer not found" action={<Button onClick={() => navigate('/customers')}>Back</Button>} />
  }

  const jobs = state.jobs
    .filter((j) => j.customerId === customer.id)
    .sort((a, b) => (b.scheduledStart ?? b.createdAt).localeCompare(a.scheduledStart ?? a.createdAt))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12px] capitalize text-muted">{customer.type}</div>
          <h2 className="mt-1 text-[28px] font-medium tracking-tight">{customer.name}</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          <Button onClick={() => navigate(`/jobs/new?customerId=${customer.id}`)}>Create job</Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-5">
          <h3 className="text-[14px] font-medium">Contacts</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {customer.contacts.map((c, i) => (
              <li key={i}>
                <div className="font-medium">{c.name}</div>
                <div className="text-muted">{c.role}</div>
                <a className="text-accent hover:underline" href={`tel:${c.phone}`}>
                  {c.phone}
                </a>
                <div className="text-muted">{c.email}</div>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel p-5">
          <h3 className="text-[14px] font-medium">Addresses</h3>
          <ul className="mt-3 space-y-3 text-sm">
            {customer.addresses.map((a, i) => (
              <li key={i}>
                {a.line1}
                {a.line2 ? <div>{a.line2}</div> : null}
                <div className="text-muted">
                  {a.city} {a.state} {a.postcode}
                </div>
              </li>
            ))}
          </ul>
          {customer.notes ? (
            <p className="mt-4 rounded-md bg-app px-3 py-2 text-xs text-muted">{customer.notes}</p>
          ) : null}
        </section>
      </div>

      <section className="panel">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-[14px] font-medium">Job history</h3>
        </div>
        <ul className="divide-y divide-border">
          {jobs.map((job) => (
            <li key={job.id}>
              <Link to={`/jobs/${job.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-app/60">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {job.reference} · {job.title}
                  </div>
                  <div className="text-xs text-muted">{fmtDateTime(job.scheduledStart)}</div>
                </div>
                <StatusBadge status={job.status} />
              </Link>
            </li>
          ))}
          {jobs.length === 0 ? <li className="px-4 py-6 text-sm text-muted">No jobs yet.</li> : null}
        </ul>
      </section>

      <CustomerFormModal open={editOpen} onClose={() => setEditOpen(false)} customer={customer} />
    </div>
  )
}

function CustomerFormModal({
  open,
  onClose,
  customer,
}: {
  open: boolean
  onClose: () => void
  customer?: Customer
}) {
  const { actions } = useStore()
  const toast = useToast()
  const [name, setName] = useState(customer?.name ?? '')
  const [type, setType] = useState<CustomerType>(customer?.type ?? 'business')
  const [contactName, setContactName] = useState(customer?.contacts[0]?.name ?? '')
  const [email, setEmail] = useState(customer?.contacts[0]?.email ?? '')
  const [phone, setPhone] = useState(customer?.contacts[0]?.phone ?? '')
  const [line1, setLine1] = useState(customer?.addresses[0]?.line1 ?? '')
  const [city, setCity] = useState(customer?.addresses[0]?.city ?? '')
  const [stateCode, setStateCode] = useState(customer?.addresses[0]?.state ?? 'NSW')
  const [postcode, setPostcode] = useState(customer?.addresses[0]?.postcode ?? '')
  const [notes, setNotes] = useState(customer?.notes ?? '')

  return (
    <Modal
      open={open}
      title={customer ? 'Edit customer' : 'Add customer'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (!name.trim() || !contactName.trim() || !line1.trim()) {
                toast.error('Name, contact, and address are required.')
                return
              }
              const payload = {
                type,
                name: name.trim(),
                contacts: [{ name: contactName.trim(), email, phone }],
                addresses: [{ line1, city, state: stateCode, postcode }],
                notes,
              }
              if (customer) {
                actions.updateCustomer(customer.id, payload)
                toast.success('Customer updated')
              } else {
                actions.createCustomer(payload)
                toast.success('Customer created')
              }
              onClose()
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Type">
          <Select value={type} onChange={(e) => setType(e.target.value as CustomerType)}>
            <option value="business">Business</option>
            <option value="individual">Individual</option>
          </Select>
        </Field>
        <Field label="Contact name">
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Address line">
            <Input value={line1} onChange={(e) => setLine1(e.target.value)} />
          </Field>
        </div>
        <Field label="City">
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </Field>
        <Field label="State">
          <Input value={stateCode} onChange={(e) => setStateCode(e.target.value)} />
        </Field>
        <Field label="Postcode">
          <Input value={postcode} onChange={(e) => setPostcode(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notes">
            <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  )
}
