import { useStore } from '../../store/StoreContext'
import { Select } from '../ui/Input'

export function RoleSwitcher({ compact }: { compact?: boolean }) {
  const { state, actions } = useStore()

  return (
    <div className={compact ? 'flex flex-col gap-1.5' : 'flex items-center gap-2'}>
      <span className={compact ? 'text-[12px] text-muted' : 'hidden text-[12px] text-muted sm:inline'}>
        Demo role
      </span>
      <Select
        aria-label="Demo role switcher"
        value={state.demoRole === 'office' ? 'office' : state.activeTechnicianId}
        onChange={(e) => {
          const v = e.target.value
          if (v === 'office') {
            actions.setDemoRole('office')
          } else {
            actions.setActiveTechnician(v)
            actions.setDemoRole('technician')
          }
        }}
        className={compact ? 'h-8 text-[13px]' : 'h-8 w-[12rem] text-[13px]'}
      >
        <option value="office">Office · Dispatch</option>
        {state.technicians.map((t) => (
          <option key={t.id} value={t.id}>
            Tech · {t.name}
          </option>
        ))}
      </Select>
    </div>
  )
}
