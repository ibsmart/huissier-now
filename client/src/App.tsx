import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'

// Auth client
import LoginPage from './pages/client/LoginPage'
import RegisterPage from './pages/client/RegisterPage'

// Client pages
import OnboardingPage from './pages/client/OnboardingPage'
import InterventionTypePage from './pages/client/InterventionTypePage'
import DescribePage from './pages/client/DescribePage'
import LocationPage from './pages/client/LocationPage'
import ConfirmPage from './pages/client/ConfirmPage'
import UrgencyPage from './pages/client/UrgencyPage'
import SearchingPage from './pages/client/SearchingPage'
import TrackingPage from './pages/client/TrackingPage'
import PaymentPage from './pages/client/PaymentPage'
import DonePage from './pages/client/DonePage'
import ProfilePage from './pages/client/ProfilePage'
import HistoryPage from './pages/client/HistoryPage'

// Demo
import DemoPage from './pages/DemoPage'

// Huissier/Agent pages
import HuissierLoginPage from './pages/huissier/HuissierLoginPage'
import HuissierRegisterPage from './pages/huissier/HuissierRegisterPage'
import DashboardPage from './pages/huissier/DashboardPage'
import MissionPage from './pages/huissier/MissionPage'
import ManageAgentsPage from './pages/huissier/ManageAgentsPage'
import StatsPage from './pages/huissier/StatsPage'
import SettingsPage from './pages/huissier/SettingsPage'

export default function App() {
  return (
    <div className="max-w-md mx-auto h-full bg-white relative overflow-hidden">
      <Routes>
        {/* Public */}
        <Route path="/" element={<OnboardingPage />} />
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/huissier/login" element={<HuissierLoginPage />} />
        <Route path="/huissier/register" element={<HuissierRegisterPage />} />

        {/* Client flow — protégé */}
        <Route path="/request/type" element={<PrivateRoute role="client"><InterventionTypePage /></PrivateRoute>} />
        <Route path="/request/describe" element={<PrivateRoute role="client"><DescribePage /></PrivateRoute>} />
        <Route path="/request/location" element={<PrivateRoute role="client"><LocationPage /></PrivateRoute>} />
        <Route path="/request/urgency" element={<PrivateRoute role="client"><UrgencyPage /></PrivateRoute>} />
        <Route path="/request/confirm" element={<PrivateRoute role="client"><ConfirmPage /></PrivateRoute>} />
        <Route path="/request/searching" element={<PrivateRoute role="client"><SearchingPage /></PrivateRoute>} />
        <Route path="/tracking/:id" element={<PrivateRoute role="client"><TrackingPage /></PrivateRoute>} />
        <Route path="/payment/:id" element={<PrivateRoute role="client"><PaymentPage /></PrivateRoute>} />
        <Route path="/done/:id" element={<PrivateRoute role="client"><DonePage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute role="client"><ProfilePage /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute role="client"><HistoryPage /></PrivateRoute>} />

        {/* Huissier (patron) + Agent — protégés */}
        <Route path="/huissier/dashboard" element={
          <PrivateRoute role={['huissier', 'agent']}><DashboardPage /></PrivateRoute>
        } />
        <Route path="/huissier/mission/:id" element={
          <PrivateRoute role={['huissier', 'agent']}><MissionPage /></PrivateRoute>
        } />
        <Route path="/huissier/agents" element={
          <PrivateRoute role="huissier"><ManageAgentsPage /></PrivateRoute>
        } />
        <Route path="/huissier/stats" element={
          <PrivateRoute role="huissier"><StatsPage /></PrivateRoute>
        } />
        <Route path="/huissier/settings" element={
          <PrivateRoute role="agent"><SettingsPage /></PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
