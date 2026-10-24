import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register
  const [form, setForm] = useState({ name: '', email: 'user@demo.com', password: 'user123' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register';
      const body = mode === 'login' ? { email: form.email, password: form.password } : form;
      const { token, user } = await api.post(path, body);
      setToken(token); // এখন থেকে প্রতিটা request-এ Authorization: Bearer <token> যাবে
      onLogin(user);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Login' : 'নতুন account'}</h2>
      {mode === 'register' && <label>Name<input value={form.name} onChange={set('name')} required /></label>}
      <label>Email<input type="email" value={form.email} onChange={set('email')} required /></label>
      <label>Password<input type="password" value={form.password} onChange={set('password')} required /></label>
      {error && (
        <div className="error">
          {error.message}
          {error.details?.map((d) => <div key={d.field}>• {d.field}: {d.message}</div>)}
        </div>
      )}
      <button className="primary" disabled={busy}>{busy ? '…' : mode === 'login' ? 'Login' : 'Register'}</button>
      <button type="button" className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'Account নেই? Register করো' : 'Account আছে? Login করো'}
      </button>
      <p className="hint">Demo: user@demo.com / user123 · admin@demo.com / admin123</p>
    </form>
  );
}
