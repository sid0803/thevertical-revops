import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { SalesCopilotDrawer } from './components/copilot/SalesCopilotDrawer';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Customer360 } from './pages/Customer360';
import { Customers } from './pages/Customers';
import { Companies } from './pages/Companies';
import { Contacts } from './pages/Contacts';
import { Leads } from './pages/Leads';
import { Deals } from './pages/Deals';
import { Pipeline } from './pages/Pipeline';
import { Workflows } from './pages/Workflows';
import { EmailInbox } from './pages/EmailInbox';
import { Calendar } from './pages/Calendar';
import { Tasks } from './pages/Tasks';
import { Analytics } from './pages/Analytics';
import { AIWorkspace } from './pages/AIWorkspace';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

const ProtectedLayout = ({ children, onOpenCopilot }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#090d16] text-white overflow-hidden">
      <Sidebar onOpenCopilot={onOpenCopilot} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <Header onOpenAISearch={onOpenCopilot} onOpenNewDeal={() => {}} />
        <main className="flex-1 pb-12">{children}</main>
      </div>
    </div>
  );
};

export default function App() {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);

  const handleOpenCopilot = () => setIsCopilotOpen(true);
  const handleCloseCopilot = () => setIsCopilotOpen(false);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/*"
            element={
              <ProtectedLayout onOpenCopilot={handleOpenCopilot}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard onOpenAISearch={handleOpenCopilot} />} />
                  <Route path="/customer-360" element={<Customer360 />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/leads" element={<Leads onOpenAISearch={handleOpenCopilot} />} />
                  <Route path="/deals" element={<Deals />} />
                  <Route path="/pipeline" element={<Pipeline />} />
                  <Route path="/workflows" element={<Workflows />} />
                  <Route path="/inbox" element={<EmailInbox />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/tasks" element={<Tasks />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/ai-assistant" element={<AIWorkspace />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </ProtectedLayout>
            }
          />
        </Routes>

        <SalesCopilotDrawer isOpen={isCopilotOpen} onClose={handleCloseCopilot} />
      </ThemeProvider>
    </AuthProvider>
  );
}
