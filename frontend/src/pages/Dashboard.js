// src/pages/Dashboard.js
import React, { useEffect, useState } from 'react';
import { Users, Send, CheckCircle, XCircle, Wifi, QrCode, RefreshCw } from 'lucide-react';
import { useWa } from '../context/WaContext';
import { useAuth } from '../context/AuthContext';

export default function Dashboard({ setPage }) {
  const { waStatus, qrImage, getDashboard } = useWa();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setStats(await getDashboard()); } catch (_) {}
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [waStatus]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.name}</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={load}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* WhatsApp connection card */}
      {waStatus !== 'ready' && (
        <div className="card mb-4" style={{ borderColor: 'var(--warning)', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {waStatus === 'qr' && qrImage ? (
              <>
                <img src={qrImage} alt="QR" style={{ width: 140, height: 140, borderRadius: 10, border: '3px solid var(--wa-green)', background: '#fff' }} />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 6 }}>Scan to connect WhatsApp</h3>
                  <p className="text-muted text-sm">Open WhatsApp → Linked Devices → Link a Device → Scan QR</p>
                  <p className="text-muted text-sm" style={{ marginTop: 6, fontSize: 12 }}>Session is saved. You only scan once.</p>
                </div>
              </>
            ) : (
              <>
                <QrCode size={32} style={{ color: 'var(--warning)', flexShrink: 0 }} />
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                    {waStatus === 'loading' || waStatus === 'authenticated' ? 'Connecting…' : 'WhatsApp not connected'}
                  </h3>
                  <p className="text-muted text-sm">QR code will appear shortly. Keep this tab open.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {waStatus === 'ready' && (
        <div className="card" style={{ borderColor: 'var(--wa-green)', marginBottom: 24, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Wifi size={16} style={{ color: 'var(--wa-green)' }} />
            <span style={{ color: 'var(--wa-green)', fontWeight: 600, fontSize: 13 }}>WhatsApp connected and ready</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>Loading stats…</div>
      ) : stats && (
        <>
          <div className="stat-grid">
            {[
              { label: 'Total Contacts', value: stats.totalContacts, icon: <Users size={18} />, color: 'var(--wa-green)' },
              { label: 'Campaigns', value: stats.totalCampaigns, icon: <Send size={18} />, color: 'var(--info)' },
              { label: 'Messages Sent', value: stats.totalSent, icon: <CheckCircle size={18} />, color: 'var(--wa-green)' },
              { label: 'Failed', value: stats.totalFailed, icon: <XCircle size={18} />, color: 'var(--danger)' },
            ].map(({ label, value, icon, color }) => (
              <div key={label} className="stat-card">
                <div className="stat-icon" style={{ background: color + '18' }}>
                  <span style={{ color }}>{icon}</span>
                </div>
                <div className="stat-label">{label}</div>
                <div className="stat-value">{value}</div>
              </div>
            ))}
          </div>

          <div className="grid-2">
            {/* Recent campaigns */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 16 }}>Recent Campaigns</h3>
              {stats.recentCampaigns.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="empty-icon">📤</div>
                  <p>No campaigns yet</p>
                  <button className="btn btn-primary btn-sm mt-2" onClick={() => setPage('compose')}>Create First Campaign</button>
                </div>
              ) : (
                stats.recentCampaigns.map((c) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div className="text-muted text-sm">{c.totalRecipients} recipients</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${c.status === 'COMPLETED' ? 'badge-green' : c.status === 'RUNNING' ? 'badge-yellow' : 'badge-blue'}`}>
                        {c.status.toLowerCase()}
                      </span>
                      <div className="text-muted text-sm" style={{ marginTop: 3 }}>✓{c.sent} ✕{c.failed}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Groups */}
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, marginBottom: 16 }}>Contact Groups</h3>
              {stats.groups.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="empty-icon">👥</div>
                  <p>No contacts yet</p>
                  <button className="btn btn-primary btn-sm mt-2" onClick={() => setPage('contacts')}>Add Contacts</button>
                </div>
              ) : (
                stats.groups.map((g) => (
                  <div key={g.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 500, fontSize: 13 }}>📁 {g.name}</span>
                    <span className="badge badge-blue">{g.count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
