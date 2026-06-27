// src/App.js
import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WaProvider } from './context/WaContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import Compose from './pages/Compose';
import History from './pages/History';

function AppInner() {
  const { user, loading } = useAuth();
  const [page, setPage] = useState('dashboard');

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📣</div>
          <p>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const pages = { dashboard: Dashboard, contacts: Contacts, compose: Compose, history: History };
  const Page = pages[page] || Dashboard;

  return (
    <WaProvider>
      <div className="layout">
        <Sidebar page={page} setPage={setPage} />
        <main className="main-content">
          <Page setPage={setPage} />
        </main>
      </div>
    </WaProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            fontSize: 13,
          },
          success: { iconTheme: { primary: '#25D366', secondary: '#000' } },
        }}
      />
    </AuthProvider>
  );
}
