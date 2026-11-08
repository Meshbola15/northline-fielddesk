import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { actions, getState, subscribe, type Actions } from './store'
import type { AppState, Customer, Job, Technician } from '../types'

interface StoreValue {
  state: AppState
  actions: Actions
  getCustomer: (id: string) => Customer | undefined
  getTechnician: (id: string) => Technician | undefined
  getJob: (id: string) => Job | undefined
  getJobActivities: (jobId: string) => AppState['activities']
  getLiveLabourSeconds: (job: Job) => number
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getState, getState)
  const [, setTick] = useState(0)

  useEffect(() => {
    const anyRunning = state.jobs.some((j) => j.labour.running)
    if (!anyRunning) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [state.jobs])

  const getCustomer = useCallback(
    (id: string) => state.customers.find((c) => c.id === id),
    [state.customers],
  )
  const getTechnician = useCallback(
    (id: string) => state.technicians.find((t) => t.id === id),
    [state.technicians],
  )
  const getJob = useCallback((id: string) => state.jobs.find((j) => j.id === id), [state.jobs])
  const getJobActivities = useCallback(
    (jobId: string) => state.activities.filter((a) => a.jobId === jobId),
    [state.activities],
  )
  const getLiveLabourSeconds = useCallback((job: Job) => {
    if (!job.labour.running || !job.labour.startedAt) return job.labour.elapsedSeconds
    const extra = Math.max(
      0,
      Math.floor((Date.now() - new Date(job.labour.startedAt).getTime()) / 1000),
    )
    return job.labour.elapsedSeconds + extra
  }, [])

  const value = useMemo(
    () => ({
      state,
      actions,
      getCustomer,
      getTechnician,
      getJob,
      getJobActivities,
      getLiveLabourSeconds,
    }),
    [state, getCustomer, getTechnician, getJob, getJobActivities, getLiveLabourSeconds],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
