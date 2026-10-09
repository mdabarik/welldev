import { useEffect, useState } from 'react';
import { api } from '../api.js';

const empty = { title: '', genre: '', durationMin: 120, rating: 0, description: '' };

export default function Admin() {
  const [movies, setMovies] = useState([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState(null); // null = নতুন (POST), id = পুরো বদল (PUT)
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => api.get('/movies?limit=50').then((r) => setMovies(r.data)).catch(setError);
  useEffect(() => { load(); }, []);

  const run = (fn, done) => async () => {
    setError(null); setMsg(null);
    try { await fn(); setMsg(done); await load(); } catch (err) { setError(err); }
  };

  const set = (k, num) => (e) => setForm({ ...form, [k]: num ? Number(e.target.value) : e.target.value });
  const save = (e) => {
    e.preventDefault();
    // নতুন হলে POST /movies, edit হলে PUT /movies/:id (সব field পাঠাই)
    run(async () => {
      if (editing) await api.put(`/movies/${editing}`, form); else await api.post('/movies', form);
      setForm(empty); setEditing(null);
    }, editing ? 'PUT: movie বদলানো হয়েছে' : 'POST: movie তৈরি হয়েছে')();
  };

  return (
    <div>
      <h2>Admin: Movie ব্যবস্থাপনা</h2>
      {msg && <div className="ok">{msg}</div>}
      {error && (
        <div className="error">
          {error.status} {error.code}: {error.message}
          {error.details?.map((d) => <div key={d.field}>• {d.field}: {d.message}</div>)}
        </div>
      )}

      <form className="card" onSubmit={save}>
        <h3>{editing ? `Movie #${editing} পুরো বদলাও (PUT)` : 'নতুন movie (POST)'}</h3>
        <label>Title<input value={form.title} onChange={set('title')} /></label>
        <label>Genre<input value={form.genre} onChange={set('genre')} /></label>
        <label>Duration (min)<input type="number" value={form.durationMin} onChange={set('durationMin', true)} /></label>
        <label>Rating (0-10)<input type="number" step="0.1" value={form.rating} onChange={set('rating', true)} /></label>
        <label>Description<input value={form.description} onChange={set('description')} /></label>
        <div className="row">
          <button className="primary">{editing ? 'Save (PUT)' : 'Create (POST)'}</button>
          {editing && <button type="button" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
        </div>
      </form>

      {movies.map((m) => (
        <article className="card" key={m.id}>
          <h3>#{m.id} {m.title} <small>{m.genre} · ⭐ {m.rating}</small></h3>
          <div className="row">
            <button onClick={() => { setEditing(m.id); setForm({ title: m.title, genre: m.genre, durationMin: m.durationMin, rating: m.rating, description: m.description }); }}>Edit (PUT)</button>
            {/* PATCH /movies/:id  -> শুধু rating */}
            <button onClick={run(() => api.patch(`/movies/${m.id}`, { rating: Math.min(10, +(m.rating + 0.1).toFixed(1)) }), 'PATCH: rating বাড়ানো হয়েছে')}>Rating +0.1 (PATCH)</button>
            {/* POST /showtimes */}
            <button onClick={run(() => api.post('/showtimes', { movieId: m.id, hall: 'Hall 1', startsAt: new Date(Date.now() + 7 * 864e5).toISOString(), price: 400 }), 'POST: নতুন show যোগ হয়েছে (৭ দিন পরে)')}>+ Show</button>
            {/* DELETE /movies/:id  -> 204 */}
            <button className="danger" onClick={run(() => api.delete(`/movies/${m.id}`), 'DELETE: movie মোছা হয়েছে (204)')}>Delete</button>
          </div>
        </article>
      ))}
    </div>
  );
}
