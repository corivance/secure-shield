import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { ProtectedRoute } from './components/layout/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PoliciesPage from './pages/PoliciesPage.jsx';
import PolicyDetailPage from './pages/PolicyDetailPage.jsx';
import CheckEligibilityPage from './pages/CheckEligibilityPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import CheckDetailPage from './pages/CheckDetailPage.jsx';
import DisputesPage from './pages/DisputesPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import NotificationsPage from './pages/NotificationsPage.jsx';
import CompliancePage from './pages/CompliancePage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import HowItWorksPage from './pages/HowItWorksPage.jsx';
import GettingStartedPage from './pages/GettingStartedPage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import AdminUsersPage from './pages/AdminUsersPage.jsx';
import AdminRegulationsPage from './pages/AdminRegulationsPage.jsx';
import AdminPlansPage from './pages/AdminPlansPage.jsx';
import AdminApiKeysPage from './pages/AdminApiKeysPage.jsx';

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/policies" element={<PoliciesPage />} />
          <Route path="/policies/:id" element={<PolicyDetailPage />} />
          <Route path="/check" element={<CheckEligibilityPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/checks/:id" element={<CheckDetailPage />} />
          <Route path="/disputes" element={<DisputesPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/getting-started" element={<GettingStartedPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/regulations" element={<AdminRegulationsPage />} />
          <Route path="/admin/plans" element={<AdminPlansPage />} />
          <Route path="/admin/api-keys" element={<AdminApiKeysPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
