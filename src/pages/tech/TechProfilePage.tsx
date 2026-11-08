import { useStore } from '../../store/StoreContext'
import { CATEGORY_LABEL } from '../../lib/format'
import { RoleSwitcher } from '../../components/layout/RoleSwitcher'
import { Avatar } from '../../components/ui/Avatar'

export function TechProfilePage() {
  const { state, getTechnician } = useStore()
  const tech = getTechnician(state.activeTechnicianId)

  if (!tech) return null

  return (
    <div className="space-y-6">
      <section className="panel p-5">
        <div className="flex items-center gap-3">
          <Avatar initials={tech.initials} size="lg" />
          <div>
            <h2 className="text-[22px] font-medium tracking-tight">{tech.name}</h2>
            <p className="text-[14px] text-muted">Northline Maintenance</p>
          </div>
        </div>
        <dl className="mt-5 space-y-2.5 text-[14px]">
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Email</dt>
            <dd>{tech.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Phone</dt>
            <dd>{tech.phone}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Hours</dt>
            <dd className="mono-meta !text-ink">
              {tech.workingHours.start}–{tech.workingHours.end}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tech.skills.map((s) => (
            <span key={s} className="rounded-md bg-raised px-2 py-1 text-[12px] text-muted">
              {CATEGORY_LABEL[s]}
            </span>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <h3 className="text-[14px] font-medium">Switch demo role</h3>
        <p className="mt-1 text-[13px] text-muted">
          Shared dataset — office views update when you complete work here
        </p>
        <div className="mt-3">
          <RoleSwitcher compact />
        </div>
      </section>
    </div>
  )
}
