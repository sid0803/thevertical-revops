// frontend/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Page Imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Clients from './pages/Clients';
import SplitMapping from './pages/SplitMapping';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import ProposalList from './pages/Proposals/ProposalList';
import ProposalBuilder from './pages/Proposals/ProposalBuilder';
import TargetsDashboard from './pages/Targets/TargetsDashboard';
import InvoiceList from './pages/Billing/InvoiceList';
import CreateInvoice from './pages/Billing/CreateInvoice';
import InvoiceDetail from './pages/Billing/InvoiceDetail';

// Expanded RevOps OS Pages
import UserCreation from './pages/UserCreation';
import Pipeline from './pages/Pipeline';
import WorkQueue from './pages/WorkQueue';
import Leaderboard from './pages/Leaderboard';
import TeamPerformance from './pages/TeamPerformance';
import ChannelPartners from './pages/ChannelPartners';
import Tasks from './pages/Tasks';
import Notifications from './pages/Notifications';

// Layout Wrapper
const DashboardLayout = ({ title }) => {
  return (
    <div className="min-h-screen bg-brandBg flex">
      {/* Sidebar - fixed width 64 */}
      <Sidebar />
      
      {/* Main Viewport */}
      <div className="flex-1 flex flex-col pl-64 min-h-screen">
        <Navbar title={title} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated Routes */}
          <Route element={<ProtectedRoute><DashboardLayout title="Dashboard" /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC']}><DashboardLayout title="Leads Pipeline" /></ProtectedRoute>}>
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'ACCOUNT_MANAGER']}><DashboardLayout title="Client Accounts" /></ProtectedRoute>}>
            <Route path="/clients" element={<Clients />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'FINANCE']}><DashboardLayout title="Billing Ledger" /></ProtectedRoute>}>
            <Route path="/billing" element={<InvoiceList />} />
            <Route path="/billing/new" element={<CreateInvoice />} />
            <Route path="/billing/:id" element={<InvoiceDetail />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'ACCOUNT_MANAGER', 'SALES_EXEC']}><DashboardLayout title="Attribution splits" /></ProtectedRoute>}>
            <Route path="/split-mapping" element={<SplitMapping />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER']}><DashboardLayout title="Performance Reports" /></ProtectedRoute>}>
            <Route path="/reports" element={<Reports />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><DashboardLayout title="Admin Control Center" /></ProtectedRoute>}>
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'FINANCE', 'SALES_EXEC']}><DashboardLayout title="Proposals" /></ProtectedRoute>}>
            <Route path="/proposals" element={<ProposalList />} />
            <Route path="/proposals/new" element={<ProposalBuilder />} />
            <Route path="/proposals/:id" element={<ProposalBuilder />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC']}><DashboardLayout title="Targets" /></ProtectedRoute>}>
            <Route path="/targets" element={<TargetsDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC']}><DashboardLayout title="Work Queue" /></ProtectedRoute>}>
            <Route path="/work-queue" element={<WorkQueue />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC']}><DashboardLayout title="Deal Pipeline" /></ProtectedRoute>}>
            <Route path="/pipeline" element={<Pipeline />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'TEAM_LEADER', 'SALES_EXEC']}><DashboardLayout title="Tasks Checklist" /></ProtectedRoute>}>
            <Route path="/tasks" element={<Tasks />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC']}><DashboardLayout title="Leaderboard" /></ProtectedRoute>}>
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER']}><DashboardLayout title="Partners Network" /></ProtectedRoute>}>
            <Route path="/partners" element={<ChannelPartners />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER']}><DashboardLayout title="Team Performance Charts" /></ProtectedRoute>}>
            <Route path="/team" element={<TeamPerformance />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN', 'MANAGER', 'TEAM_LEADER', 'SALES_EXEC', 'ACCOUNT_MANAGER', 'FINANCE']}><DashboardLayout title="Notifications" /></ProtectedRoute>}>
            <Route path="/notifications" element={<Notifications />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><DashboardLayout title="User Management" /></ProtectedRoute>}>
            <Route path="/users" element={<UserCreation />} />
          </Route>

          {/* Fallback Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
