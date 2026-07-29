import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AIWorkspaceModal } from './components/ai/AIWorkspaceModal';

import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { Customers } from './pages/Customers';
import { Companies } from './pages/Companies';
import { Contacts } from './pages/Contacts';
import { Leads } from './pages/Leads';
import { Deals } from './pages/Deals';
import { Pipeline } from './pages/Pipeline';
import { Calendar } from './pages/Calendar';
import { Tasks } from './pages/Tasks';
import { Analytics } from './pages/Analytics';
import { AIWorkspace } from './pages/AIWorkspace';
import { Notifications } from './pages/Notifications';
import { Settings } from './pages/Settings';

const ProtectedLayout = ({ children, onOpenAISearch }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-[#090d16] text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto max-h-screen">
        <Header onOpenAISearch={onOpenAISearch} onOpenNewDeal={() => {}} />
        <main className="flex-1 pb-12">{children}</main>
      </div>
    </div>
  );
};

export default function App() {
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);

  const handleOpenAISearch = () => setIsAISearchOpen(true);
  const handleCloseAISearch = () => setIsAISearchOpen(false);

  return (
    <AuthProvider>
      <ThemeProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/*"
            element={
              <ProtectedLayout onOpenAISearch={handleOpenAISearch}>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard onOpenAISearch={handleOpenAISearch} />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/companies" element={<Companies />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/leads" element={<Leads onOpenAISearch={handleOpenAISearch} />} />
                  <Route path="/deals" element={<Deals />} />
                  <Route path="/pipeline" element={<Pipeline />} />
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

        <AIWorkspaceModal isOpen={isAISearchOpen} onClose={handleCloseAISearch} />
      </ThemeProvider>
    </AuthProvider>
  );
}
