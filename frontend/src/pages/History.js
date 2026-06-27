// src/pages/History.js
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { useWa } from '../context/WaContext';

function CampaignRow({ c, onExpand }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const { getCampaign } = useWa();
  const pct = c.totalRecipients > 0 ? Math.round((c.sent / c.totalRecipients) * 100) : 0;

  const toggle = async () => {
    if (!expanded && !detail) {
      try { setDetail(await getCampaign(c.id)); } catch (_) {}
    }
    setExpanded(!expanded);
  };

  return (
    <>
      <tr style={{ cursor: 'pointer' }} onClick={toggle}>
        <td>
          <div style={{ fontWeight: 600 }}>{c.name || 'Untitled'}</div>
          <div className="text-muted text-sm">{new Date(c.createdAt).toLocaleString()}</div>
          {c.mediaFile && <div className="text-muted text-sm">📎 {c.mediaFile.originalName}</div>}
        </td>
        <td><span className={`badge ${c.status === 'COMPLETED' ? 'badge-green' : c.status === 'RUNNING' ? 'badge-yellow' : c.status === 'FAILED' ? 'badge-red' : 'badge-blue'}`}>{c.status.toLowerCase()}</span></td>
        <td>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="progress-bar" style={{ width: 80 }}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pct}%</span>
          </div>
        </td>
        <td>{c.totalRecipients}</td>
        <td className="text-success">{c.sent}</td>
        <td className="text-danger">{c.failed}</td>
        <td>{expanded ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={7} style={{ padding: 0, background: 'var(--bg-input)' }}>
            <div style={{ padding: '12px 16px' }}>
              {c.message && <p style={{ fontSize: 13, marginBottom: 10, color: 'var(--text)', background: 'var(--bg-card)', padding: '8px 12px', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{c.message}</p>}
              {detail ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 6 }}>
                  {detail.results.map((r) => (
                    <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', borderRadius: 8, padding: '8px 12px' }}>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 12 }}>{r.contact?.name || '?'}</div>
                        <div className="text-muted" style={{ fontSize: 11 }}>+{r.contact?.phone}</div>
                      </div>
                      <span className={`badge ${r.status === 'sent' ? 'badge-green' : 'badge-red'}`}>
                        {r.status === 'sent' ? '✓ Sent' : `✕ ${r.error || 'Failed'}`}
                      </span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted text-sm">Loading results…</p>}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function History({ setPage }) {
  const { getCampaigns } = useWa();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setCampaigns(await getCampaigns()); } catch (_) {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, []);

  const totalSent = campaigns.reduce((a, c) => a + (c.sent || 0), 0);
  const totalFailed = campaigns.reduce((a, c) => a + (c.failed || 0), 0);
  const totalRecipients = campaigns.reduce((a, c) => a + (c.totalRecipients || 0), 0);

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Campaign History</h1><p className="page-subtitle">{campaigns.length} campaigns</p></div>
        <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13} /> Refresh</button>
      </div>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Campaigns', value: campaigns.length },
          { label: 'Total Recipients', value: totalRecipients },
          { label: 'Delivered', value: totalSent, color: 'var(--wa-green)' },
          { label: 'Failed', value: totalFailed, color: 'var(--danger)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="stat-card">
            <div className="stat-label">{label}</div>
            <div className="stat-value" style={color ? { color } : {}}>{value}</div>
          </div>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><p>Loading campaigns…</p></div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No campaigns yet</h3>
            <button className="btn btn-primary btn-sm mt-2" onClick={() => setPage('compose')}>Create Campaign</button>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Campaign</th><th>Status</th><th>Progress</th><th>Total</th><th>Sent</th><th>Failed</th><th style={{ width: 40 }}></th></tr></thead>
              <tbody>{campaigns.map((c) => <CampaignRow key={c.id} c={c} />)}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
