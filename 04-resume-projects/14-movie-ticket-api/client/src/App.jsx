import { useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';
import ApiConsole from './ApiConsole.jsx';
import Login from './pages/Login.jsx';
import Movies from './pages/Movies.jsx';
import Bookings from './pages/Bookings.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(getToken()));
  const [tab, setTab] = useState('movies');

  // Page খুললে saved token দিয়ে GET /auth/me করে দেখি এখনো login আছে কিনা
  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me').then((r) => setUser(r.user)).catch(() => {}).finally(() => setBooting(false));
  }, []);

  // api.js কোথাও 401 পেলে এই event ছোড়ে
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const logout = () => { setToken(null); setUser(null); setTab('movies'); };

  if (booting) return <p className="center">Loading…</p>;

  return (
    <div className="app">
      {import.meta.env.VITE_MOCK && (
        <div className="demo-banner">
          🧪 Demo mode: এই page-এ আসল Node server নেই, browser-এর ভেতরেই একটা নকল API server চলছে (একই endpoint, একই status code)।
          Reload দিলে data আবার প্রথম অবস্থায় ফেরে। নিচের <b>API console</b> দেখো: প্রতিটা request, header আর response সেখানে।
        </div>
      )}
      <header className="top">
        <h1>🎬 CineBook</h1>
        {user && (
          <nav>
            <button className={tab === 'movies' ? 'on' : ''} onClick={() => setTab('movies')}>Movies</button>
            <button className={tab === 'bookings' ? 'on' : ''} onClick={() => setTab('bookings')}>My bookings</button>
            {user.role === 'admin' && <button className={tab === 'admin' ? 'on' : ''} onClick={() => setTab('admin')}>Admin</button>}
            <span className="who">{user.name} ({user.role})</span>
            <button onClick={logout}>Logout</button>
          </nav>
        )}
      </header>

      <main>
        {!user && <Login onLogin={setUser} />}
        {user && tab === 'movies' && <Movies onBooked={() => setTab('bookings')} />}
        {user && tab === 'bookings' && <Bookings />}
        {user && tab === 'admin' && user.role === 'admin' && <Admin />}
      </main>

      <ApiConsole />
    </div>
  );
}
