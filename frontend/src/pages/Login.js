// src/pages/Login.js
import React, { useState } from 'react';
import { LogIn, UserPlus, MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back!');
      } else {
        await register(form.name, form.email, form.password);
        toast.success('Account created!');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, var(--wa-green), var(--wa-dark))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28,
          }}>
            <MessageCircle size={28} color="#fff" />
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            WA Marketing
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            {mode === 'login' ? 'Sign in to your dashboard' : 'Create your account'}
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" placeholder="John Doe"
                  value={form.name} onChange={(e) => set('name', e.target.value)} required />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={(e) => set('password', e.target.value)}
                required minLength={8} />
              {mode === 'register' && (
                <p className="text-muted text-sm mt-1" style={{ marginTop: 4 }}>Minimum 8 characters</p>
              )}
            </div>

            <button className="btn btn-primary btn-lg w-full" type="submit"
              disabled={loading} style={{ justifyContent: 'center' }}>
              {mode === 'login'
                ? <><LogIn size={16} /> {loading ? 'Signing in…' : 'Sign In'}</>
                : <><UserPlus size={16} /> {loading ? 'Creating…' : 'Create Account'}</>
              }
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
              {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>

        <p className="text-muted text-sm" style={{ textAlign: 'center', marginTop: 20, fontSize: 12 }}>
          First registration creates the admin account.
        </p>
      </div>
    </div>
  );
}
