import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { StoreProvider, useStore } from './store/StoreContext'
import { ToastProvider } from './components/ui/Toast'
import { OfficeShell } from './components/layout/OfficeShell'
import { TechShell } from './components/layout/TechShell'
import { OverviewPage } from './pages/office/OverviewPage'
import { JobsPage } from './pages/office/JobsPage'
import { JobDetailPage } from './pages/office/JobDetailPage'
import { JobFormPage } from './pages/office/JobFormPage'
import { SchedulePage } from './pages/office/SchedulePage'
import { CustomersPage, CustomerDetailPage } from './pages/office/CustomersPage'
import { TeamPage } from './pages/office/TeamPage'
import { ReportsPage } from './pages/office/ReportsPage'
import { SettingsPage } from './pages/office/SettingsPage'
import { TechTodayPage } from './pages/tech/TechTodayPage'
import { TechJobsPage } from './pages/tech/TechJobsPage'
import { TechJobPage } from './pages/tech/TechJobPage'
import { TechProfilePage } from './pages/tech/TechProfilePage'

function RoleGate() {
  const { state } = useStore()
  const location = useLocation()
  const onTech = location.pathname.startsWith('/tech')

  useEffect(() => {
    // keep URL aligned with demo role so shared navigation feels coherent
  }, [state.demoRole, onTech])

  if (state.demoRole === 'technician' && !onTech) {
    return <Navigate to="/tech" replace />
  }
  if (state.demoRole === 'office' && onTech) {
    return <Navigate to="/" replace />
  }

  return (
    <Routes>
      <Route element={<OfficeShell />}>
        <Route index element={<OverviewPage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/new" element={<JobFormPage />} />
        <Route path="jobs/:jobId" element={<JobDetailPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/:customerId" element={<CustomerDetailPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="tech" element={<TechShell />}>
        <Route index element={<TechTodayPage />} />
        <Route path="jobs" element={<TechJobsPage />} />
        <Route path="jobs/:jobId" element={<TechJobPage />} />
        <Route path="profile" element={<TechProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <RoleGate />
      </ToastProvider>
    </StoreProvider>
  )
}
