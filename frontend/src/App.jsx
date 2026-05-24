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

          {/* Fallback Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
