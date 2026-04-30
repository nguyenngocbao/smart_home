import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SmartHomeProvider } from './context/SmartHomeContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Automations } from './components/Automations';
import { FloorTrangTret } from './components/FloorTrangTret';
import { FloorLau1 } from './components/FloorLau1';
import { FloorSanThuong } from './components/FloorSanThuong';
import { Login } from './pages/Login';

function AppShell() {
  const { token, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center">
        <svg className="animate-spin w-10 h-10 text-emerald-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      </div>
    );
  }

  if (!token) return <Login />;

  return (
    <SmartHomeProvider>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'dashboard'         && <Dashboard setActiveTab={setActiveTab} />}
        {activeTab === 'floor-trang-tret'  && <FloorTrangTret />}
        {activeTab === 'floor-lau-1'       && <FloorLau1 />}
        {activeTab === 'floor-san-thuong'  && <FloorSanThuong />}
        {activeTab === 'automations'       && <Automations />}
      </Layout>
    </SmartHomeProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
