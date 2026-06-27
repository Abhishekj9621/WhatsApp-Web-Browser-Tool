// src/pages/Contacts.js
import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Trash2, Edit2, Upload, X, Check, Search, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWa } from '../context/WaContext';

function ContactModal({ contact, onSave, onClose }) {
  const [form, setForm] = useState({ name: contact?.name || '', phone: contact?.phone || '', group: contact?.group || 'General', notes: contact?.notes || '' });
  const handleSubmit = (e) => { e.preventDefault(); if (!form.phone.trim()) return toast.error('Phone required'); onSave(form); };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 420 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>{contact ? 'Edit Contact' : 'Add Contact'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label className="form-label">Name</label>
            <input className="form-input" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Phone *</label>
            <input className="form-input" placeholder="919876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
            <p className="text-muted text-sm" style={{ marginTop: 4 }}>With country code, no + sign (e.g. 91 for India)</p></div>
          <div className="form-group"><label className="form-label">Group</label>
            <input className="form-input" placeholder="General, VIP, Customers…" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} /></div>
          <div className="form-group"><label className="form-label">Notes</label>
            <input className="form-input" placeholder="Optional note" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary"><Check size={14} /> {contact ? 'Save' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BulkModal({ onClose, onImport }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState([]);
  const parse = () => {
    const rows = text.trim().split('\n').filter(Boolean).map((l) => {
      const [phone, name, group] = l.split(',').map((s) => s.trim());
      return { phone: phone?.replace(/\D/g, ''), name: name || phone, group: group || 'General' };
    }).filter((c) => c.phone);
    setPreview(rows);
  };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div className="card" style={{ width: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 17 }}>Bulk Import</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <p className="text-muted text-sm" style={{ marginBottom: 8 }}>Format: <code style={{ color: 'var(--text)' }}>phone, name, group</code> — one per line</p>
        <p className="text-muted text-sm" style={{ marginBottom: 10, fontSize: 12 }}>Example: <code style={{ color: 'var(--text)' }}>919876543210, Rahul Sharma, VIP</code></p>
        <textarea className="form-textarea" style={{ minHeight: 130, marginBottom: 10 }}
          placeholder={"919876543210, Rahul Sharma, VIP\n447700900000, Bob Jones\n18005551234, Jane, Customers"}
          value={text} onChange={(e) => { setText(e.target.value); setPreview([]); }} />
        <button className="btn btn-secondary btn-sm" onClick={parse} style={{ marginBottom: 10 }}>
          Preview {text.trim().split('\n').filter(Boolean).length} lines
        </button>
        {preview.length > 0 && (
          <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 12, border: '1px solid var(--border)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Phone','Name','Group'].map((h) => <th key={h} style={{ padding: '6px 10px', fontSize: 11, color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)', textTransform: 'uppercase' }}>{h}</th>)}</tr></thead>
              <tbody>{preview.map((c, i) => <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}><td style={{ padding: '6px 10px', fontSize: 12 }}>{c.phone}</td><td style={{ padding: '6px 10px', fontSize: 12 }}>{c.name}</td><td style={{ padding: '6px 10px', fontSize: 12 }}>{c.group}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => onImport(preview)} disabled={preview.length === 0}>
            <Upload size={14} /> Import {preview.length > 0 ? `${preview.length} contacts` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Contacts() {
  const { getContacts, addContact, updateContact, deleteContact, bulkImport, getGroups } = useWa();
  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [editContact, setEditContact] = useState(null);
  const [search, setSearch] = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, g] = await Promise.all([getContacts({ search, group: filterGroup || undefined }), getGroups()]);
      setContacts(c); setGroups(g);
    } catch (_) {} finally { setLoading(false); }
  }, [search, filterGroup]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (form) => {
    try {
      if (editContact) { await updateContact(editContact.id, form); toast.success('Updated'); }
      else { await addContact(form); toast.success('Contact added'); }
      setShowModal(false); setEditContact(null); load();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this contact?')) return;
    try { await deleteContact(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleBulk = async (list) => {
    try { const r = await bulkImport(list); toast.success(`${r.added} contacts imported`); setShowBulk(false); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Import failed'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Contacts</h1>
          <p className="page-subtitle">{contacts.length} contacts · {groups.length} groups</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setShowBulk(true)}><Upload size={14} /> Bulk Import</button>
          <button className="btn btn-primary" onClick={() => { setEditContact(null); setShowModal(true); }}><UserPlus size={14} /> Add Contact</button>
        </div>
      </div>

      <div className="card card-sm" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search name or phone…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 180 }} value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
          <option value="">All Groups</option>
          {groups.map((g) => <option key={g.name} value={g.name}>{g.name} ({g.count})</option>)}
        </select>
        <button className="btn btn-ghost btn-sm" onClick={load}><RefreshCw size={13} /></button>
      </div>

      <div className="card">
        {loading ? (
          <div className="empty-state"><p>Loading contacts…</p></div>
        ) : contacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>No contacts found</h3>
            <p>{search || filterGroup ? 'Try adjusting your filters' : 'Add your first contact to get started'}</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Phone</th><th>Group</th><th>Notes</th><th>Added</th><th style={{ width: 80 }}>Actions</th></tr></thead>
              <tbody>
                {contacts.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,var(--wa-dark),var(--wa-green))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {(c.name||c.phone)[0].toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{c.name}</span>
                      </div>
                    </td>
                    <td className="font-mono" style={{ fontSize: 13 }}>+{c.phone}</td>
                    <td><span className="badge badge-blue">{c.group}</span></td>
                    <td className="text-muted text-sm">{c.notes || '—'}</td>
                    <td className="text-muted text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => { setEditContact(c); setShowModal(true); }}><Edit2 size={13} /></button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && <ContactModal contact={editContact} onSave={handleSave} onClose={() => { setShowModal(false); setEditContact(null); }} />}
      {showBulk && <BulkModal onClose={() => setShowBulk(false)} onImport={handleBulk} />}
    </div>
  );
}
