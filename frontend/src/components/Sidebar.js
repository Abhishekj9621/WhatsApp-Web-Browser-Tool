// src/components/Sidebar.js
import React from 'react';
import { LayoutDashboard, Users, Send, History, Wifi, WifiOff, Loader, QrCode, LogOut, User } from 'lucide-react';
import { useWa } from '../context/WaContext';
import { useAuth } from '../context/AuthContext';

const STATUS_LABELS = {
  ready: 'Connected', disconnected: 'Disconnected',
  qr: 'Scan QR', loading: 'Connecting…', authenticated: 'Auth…',
};

export default function Sidebar({ page, setPage }) {
  const { waStatus, logoutWa } = useWa();
  const { user, logout } = useAuth();

  const statusClass = waStatus === 'ready' ? 'connected'
    : waStatus === 'qr' ? 'qr'
    : (waStatus === 'loading' || waStatus === 'authenticated') ? 'loading'
    : 'disconnected';

  const nav = [
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
    { id: 'contacts', label: 'Contacts', Icon: Users },
    { id: 'compose', label: 'Send Campaign', Icon: Send },
    { id: 'history', label: 'Campaign History', Icon: History },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">📣</div>
        <span>WA Marketing<small>Dashboard v2</small></span>
      </div>

      <div className="sidebar-section-label">Menu</div>
      {nav.map(({ id, label, Icon }) => (
        <button key={id}
          className={`nav-item ${page === id ? 'active' : ''}`}
          onClick={() => setPage(id)}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }}
        >
          <Icon size={16} />{label}
        </button>
      ))}

      <div className="sidebar-bottom">
        {/* WA Status */}
        <div style={{ padding: '0 20px 8px' }}>
          <div className={`status-pill ${statusClass}`}>
            <span className="dot" />
            {STATUS_LABELS[waStatus] || waStatus}
          </div>
        </div>

        {waStatus === 'ready' && (
          <button className="nav-item" onClick={logoutWa}
            style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'var(--warning)' }}>
            <Wifi size={16} />Disconnect WA
          </button>
        )}

        <hr className="divider" style={{ margin: '8px 0' }} />

        {/* User info */}
        <div style={{ padding: '6px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--wa-dark), var(--wa-green))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>
            {user?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {user?.role}
            </div>
          </div>
        </div>

        <button className="nav-item" onClick={logout}
          style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', color: 'var(--danger)' }}>
          <LogOut size={16} />Sign Out
        </button>
      </div>

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </aside>
  );
}
