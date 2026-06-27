// src/pages/Compose.js
import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Send, Users, Zap, Image, Video, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWa } from '../context/WaContext';

export default function Compose({ setPage }) {
  const { waStatus, activeCampaign, getContacts, getGroups, uploadFile, getMediaFiles, sendCampaign, sendSingle } = useWa();

  const [mode, setMode] = useState('campaign');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [caption, setCaption] = useState('');
  const [delay, setDelay] = useState(3000);
  const [recipientMode, setRecipientMode] = useState('all');
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [singlePhone, setSinglePhone] = useState('');

  const [contacts, setContacts] = useState([]);
  const [groups, setGroups] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null); // MediaFile from DB
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  const fileRef = useRef();
  const isReady = waStatus === 'ready';

  useEffect(() => {
    Promise.all([getContacts(), getGroups(), getMediaFiles()]).then(([c, g, m]) => {
      setContacts(c); setGroups(g); setMediaFiles(m);
    }).catch(() => {});
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadingFile(file);
    setUploading(true);
    setUploadProgress(0);
    try {
      const result = await uploadFile(file, setUploadProgress);
      setSelectedMedia(result);
      setMediaFiles((prev) => [result, ...prev]);
      toast.success('Uploaded to Cloudflare R2 ✓');
    } catch (err) {
      toast.error('Upload failed: ' + (err.response?.data?.error || err.message));
      setUploadingFile(null);
    } finally {
      setUploading(false);
    }
  };

  const getRecipientCount = () => {
    if (recipientMode === 'all') return contacts.length;
    if (recipientMode === 'group') return contacts.filter((c) => selectedGroups.includes(c.group)).length;
    return selectedIds.length;
  };

  const handleSend = async () => {
    if (!isReady) return toast.error('WhatsApp not connected');
    if (!message.trim() && !selectedMedia) return toast.error('Add a message or media file');

    const payload = {
      message: message || undefined,
      mediaFileId: selectedMedia?.id,
      caption: caption || undefined,
    };

    if (mode === 'single') {
      if (!singlePhone.trim()) return toast.error('Enter a phone number');
      setSending(true);
      try {
        await sendSingle({ ...payload, phone: singlePhone });
        toast.success('Message sent!');
        setMessage(''); setCaption(''); setSelectedMedia(null); setSinglePhone('');
      } catch (err) {
        toast.error(err.response?.data?.error || 'Failed to send');
      } finally { setSending(false); }
      return;
    }

    if (getRecipientCount() === 0) return toast.error('No recipients selected');
    setSending(true);
    try {
      const campaignPayload = {
        ...payload,
        name: name || `Campaign ${new Date().toLocaleString()}`,
        delayMs: delay,
        ...(recipientMode === 'group' && selectedGroups.length > 0 ? { groups: selectedGroups } : {}),
        ...(recipientMode === 'specific' && selectedIds.length > 0 ? { recipientIds: selectedIds } : {}),
      };
      await sendCampaign(campaignPayload);
      toast.success(`Campaign launched to ${getRecipientCount()} contacts!`);
      setPage('history');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setSending(false); }
  };

  const mediaIcon = selectedMedia?.mimetype?.startsWith('image/') ? '🖼️'
    : selectedMedia?.mimetype?.startsWith('video/') ? '🎥' : '📄';

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Send Message</h1><p className="page-subtitle">Compose and launch campaigns</p></div>
        {!isReady && <div className="status-pill disconnected"><span className="dot" />Not connected</div>}
      </div>

      {/* Active campaign progress */}
      {activeCampaign && (
        <div className="card" style={{ marginBottom: 20, borderColor: 'var(--wa-green)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>📤 Campaign running…</span>
            <span className="text-muted text-sm">{activeCampaign.sent + activeCampaign.failed} / {activeCampaign.total}</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.round(((activeCampaign.sent + activeCampaign.failed) / activeCampaign.total) * 100)}%` }} /></div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
            <span className="text-success text-sm">✓ {activeCampaign.sent} sent</span>
            <span className="text-danger text-sm">✕ {activeCampaign.failed} failed</span>
            {activeCampaign.latest && <span className="text-muted text-sm">Last: {activeCampaign.latest.name} — {activeCampaign.latest.status}</span>}
          </div>
        </div>
      )}

      {/* Mode toggle */}
      <div className="card card-sm" style={{ marginBottom: 20, display: 'flex', gap: 8 }}>
        <button className={`btn ${mode === 'campaign' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('campaign')}><Users size={14} /> Campaign</button>
        <button className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setMode('single')}><Zap size={14} /> Single Message</button>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        {/* Left: compose */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'campaign' && (
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 14 }}>Campaign Details</h3>
              <div className="form-group"><label className="form-label">Campaign Name</label>
                <input className="form-input" placeholder="Summer Sale 2025" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Delay Between Messages</label>
                <select className="form-select" value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
                  <option value={2000}>2s – Fast (riskier)</option>
                  <option value={3000}>3s – Recommended</option>
                  <option value={5000}>5s – Safe</option>
                  <option value={10000}>10s – Safest</option>
                </select></div>
            </div>
          )}

          {mode === 'single' && (
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 14 }}>Recipient</h3>
              <div className="form-group"><label className="form-label">Phone Number</label>
                <input className="form-input" placeholder="919876543210 (with country code)" value={singlePhone} onChange={(e) => setSinglePhone(e.target.value)} /></div>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 14 }}>Message</h3>
            <div className="form-group"><label className="form-label">Text</label>
              <textarea className="form-textarea" placeholder="Type your message…" style={{ minHeight: 110 }}
                value={message} onChange={(e) => setMessage(e.target.value)} />
              <p className="text-muted text-sm" style={{ marginTop: 4 }}>{message.length} chars</p></div>
            {selectedMedia && (
              <div className="form-group"><label className="form-label">Caption (optional)</label>
                <input className="form-input" placeholder="Caption for media" value={caption} onChange={(e) => setCaption(e.target.value)} /></div>
            )}
          </div>

          {/* Media */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 14 }}>Media — Cloudflare R2</h3>

            {!selectedMedia ? (
              <>
                <div className="upload-zone" onClick={() => fileRef.current?.click()}
                  onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files[0]); }}
                  onDragOver={(e) => e.preventDefault()}>
                  <div className="upload-icon">☁️</div>
                  <p>Drop or click to upload to R2</p>
                  <p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-dim)' }}>Images, videos, PDFs · Max 50MB</p>
                </div>
                <input type="file" ref={fileRef} style={{ display: 'none' }} accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={(e) => handleFileUpload(e.target.files[0])} />

                {uploading && (
                  <div style={{ marginTop: 12 }}>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${uploadProgress}%` }} /></div>
                    <p className="text-muted text-sm" style={{ marginTop: 4 }}>Uploading to R2… {uploadProgress}%</p>
                  </div>
                )}

                {/* Previously uploaded files */}
                {mediaFiles.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <p className="form-label" style={{ marginBottom: 8 }}>Or pick a previous upload</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                      {mediaFiles.map((f) => (
                        <button key={f.id} className="btn btn-secondary btn-sm" style={{ justifyContent: 'flex-start', gap: 8 }}
                          onClick={() => setSelectedMedia(f)}>
                          <span>{f.mimetype?.startsWith('image/') ? '🖼️' : f.mimetype?.startsWith('video/') ? '🎥' : '📄'}</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.originalName}</span>
                          <span className="text-muted text-sm" style={{ marginLeft: 'auto' }}>{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ background: 'var(--bg-input)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>{mediaIcon}</span>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{selectedMedia.originalName}</div>
                      <div className="text-muted text-sm">{(selectedMedia.size / 1024 / 1024).toFixed(2)} MB · R2</div>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => setSelectedMedia(null)}><X size={14} /></button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: recipients + preview + send */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'campaign' && (
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 14 }}>Recipients</h3>
              {[
                { value: 'all', label: `All contacts (${contacts.length})` },
                { value: 'group', label: 'By group' },
                { value: 'specific', label: 'Pick specific contacts' },
              ].map(({ value, label }) => (
                <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, cursor: 'pointer', fontSize: 13.5 }}>
                  <input type="radio" name="rmode" value={value} checked={recipientMode === value} onChange={() => setRecipientMode(value)} />
                  {label}
                </label>
              ))}

              {recipientMode === 'group' && (
                <div style={{ marginTop: 4 }}>
                  {groups.map((g) => (
                    <label key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13.5 }}>
                      <input type="checkbox" checked={selectedGroups.includes(g.name)}
                        onChange={(e) => setSelectedGroups((p) => e.target.checked ? [...p, g.name] : p.filter((x) => x !== g.name))} />
                      {g.name} <span className="text-muted text-sm">({g.count})</span>
                    </label>
                  ))}
                </div>
              )}

              {recipientMode === 'specific' && (
                <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
                  {contacts.map((c) => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, cursor: 'pointer', fontSize: 13.5 }}>
                      <input type="checkbox" checked={selectedIds.includes(c.id)}
                        onChange={(e) => setSelectedIds((p) => e.target.checked ? [...p, c.id] : p.filter((x) => x !== c.id))} />
                      <span style={{ fontWeight: 500 }}>{c.name}</span><span className="text-muted text-sm">+{c.phone}</span>
                    </label>
                  ))}
                </div>
              )}

              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span className="text-muted">Recipients</span>
                <span style={{ fontWeight: 700, color: 'var(--wa-green)' }}>{getRecipientCount()} contacts</span>
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, marginBottom: 14 }}>Preview</h3>
            <div style={{ background: '#111b21', borderRadius: 12, padding: 16 }}>
              <div style={{ background: '#005c4b', borderRadius: '8px 8px 8px 0', padding: '10px 12px', maxWidth: '88%', display: 'inline-block' }}>
                {selectedMedia && (
                  <div style={{ marginBottom: 6, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{mediaIcon} {selectedMedia.originalName}</div>
                )}
                <p style={{ color: '#fff', fontSize: 14, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                  {caption || message || <span style={{ color: 'rgba(255,255,255,0.3)' }}>Your message here</span>}
                </p>
                <div style={{ textAlign: 'right', marginTop: 4, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                  {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                </div>
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
            disabled={!isReady || sending || uploading || !!activeCampaign} onClick={handleSend}>
            <Send size={16} />
            {sending ? 'Starting…' : activeCampaign ? 'Campaign running…'
              : mode === 'single' ? 'Send Message'
              : `Send to ${getRecipientCount()} contacts`}
          </button>
          {!isReady && <p className="text-muted text-sm" style={{ textAlign: 'center', fontSize: 12 }}>Connect WhatsApp from Dashboard first</p>}
        </div>
      </div>
    </div>
  );
}
