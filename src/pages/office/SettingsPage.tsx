import { useState } from 'react'
import { useStore } from '../../store/StoreContext'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Input'
import { ConfirmDialog } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'

export function SettingsPage() {
  const { state, actions } = useStore()
  const toast = useToast()
  const [settings, setSettings] = useState(state.settings)
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="panel p-5">
        <h2 className="text-[14px] font-medium">Company</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Company name">
              <Input
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Phone">
            <Input
              value={settings.phone}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Address">
              <Input
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Working hours start">
            <Input
              type="time"
              value={settings.workingHours.start}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, start: e.target.value },
                })
              }
            />
          </Field>
          <Field label="Working hours end">
            <Input
              type="time"
              value={settings.workingHours.end}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  workingHours: { ...settings.workingHours, end: e.target.value },
                })
              }
            />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={() => {
              actions.updateSettings(settings)
              toast.success('Settings saved')
            }}
          >
            Save settings
          </Button>
        </div>
      </section>

      <section className="panel border-danger/25 p-5">
        <h2 className="text-[14px] font-medium text-danger">Reset demo</h2>
        <p className="mt-2 text-sm text-muted">
          Restores the original Northline sample data relative to today and clears stored photos.
          Local changes will be lost.
        </p>
        <div className="mt-4">
          <Button variant="danger" onClick={() => setResetOpen(true)}>
            Reset demo data
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Reset demo data?"
        message="This restores seed customers, technicians, and jobs, and clears IndexedDB photos."
        confirmLabel="Reset demo"
        danger
        onClose={() => setResetOpen(false)}
        onConfirm={() => {
          void actions.resetDemo().then(() => {
            toast.success('Demo data reset')
            window.location.assign('/')
          })
        }}
      />
    </div>
  )
}
