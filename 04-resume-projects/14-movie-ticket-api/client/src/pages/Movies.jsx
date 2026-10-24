import { useEffect, useState } from 'react';
import { api } from '../api.js';

const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function Movies({ onBooked }) {
  const [search, setSearch] = useState('');
  const [movies, setMovies] = useState([]);
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState(null);

  // GET /movies?search=...   (search বদলালে আবার আনি)
  useEffect(() => {
    const t = setTimeout(() => {
      api.get(`/movies?limit=20&search=${encodeURIComponent(search)}`)
        .then((r) => setMovies(r.data)).catch(setError);
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  if (movie) return <Showtimes movie={movie} onBack={() => setMovie(null)} onBooked={onBooked} />;

  return (
    <div>
      <input className="search" placeholder="Movie খোঁজো…" value={search} onChange={(e) => setSearch(e.target.value)} />
      {error && <div className="error">{error.message}</div>}
      <div className="grid">
        {movies.map((m) => (
          <article key={m.id} className="card movie" onClick={() => setMovie(m)}>
            <h3>{m.title}</h3>
            <p className="meta">{m.genre} · {m.durationMin} min · ⭐ {m.rating}</p>
            <p>{m.description}</p>
            <button className="primary">Show দেখো</button>
          </article>
        ))}
        {movies.length === 0 && <p>কোনো movie পাওয়া যায়নি।</p>}
      </div>
    </div>
  );
}

function Showtimes({ movie, onBack, onBooked }) {
  const [shows, setShows] = useState([]);
  const [show, setShow] = useState(null);

  // GET /movies/:id/showtimes
  useEffect(() => { api.get(`/movies/${movie.id}/showtimes`).then((r) => setShows(r.data)); }, [movie.id]);

  return (
    <div>
      <button className="link" onClick={onBack}>← সব movie</button>
      <h2>{movie.title}</h2>
      <div className="row">
        {shows.map((s) => (
          <button key={s.id} className={`chip ${show?.id === s.id ? 'on' : ''}`} onClick={() => setShow(s)}>
            {fmt(s.startsAt)} · {s.hall} · ৳{s.price} <small>({s.seatsLeft} seat বাকি)</small>
          </button>
        ))}
        {shows.length === 0 && <p>এই movie-র কোনো show নেই।</p>}
      </div>
      {show && <SeatPicker key={show.id} show={show} onBooked={onBooked} />}
    </div>
  );
}

function SeatPicker({ show, onBooked }) {
  const [map, setMap] = useState(null);
  const [picked, setPicked] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // GET /showtimes/:id/seats
  const load = () => api.get(`/showtimes/${show.id}/seats`).then((r) => setMap(r.data));
  useEffect(() => { load(); }, [show.id]);

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 6 ? [...p, id] : p));

  async function book() {
    setBusy(true); setError(null);
    try {
      // POST /bookings   { showtimeId, seats }  -> 201
      await api.post('/bookings', { showtimeId: show.id, seats: picked });
      onBooked(); // My bookings tab-এ নিয়ে যাই, সেখানে pay করতে হবে
    } catch (err) {
      setError(err);
      if (err.status === 409) { setPicked([]); load(); } // কেউ আগে seat নিয়ে নিয়েছে: নতুন seat map আনি
    } finally {
      setBusy(false);
    }
  }

  if (!map) return <p>Seat map আসছে…</p>;
  return (
    <div className="card">
      <div className="screen">SCREEN</div>
      {map.layout.rows.map((row) => (
        <div className="seat-row" key={row}>
          {map.seats.filter((s) => s.id.startsWith(row)).map((s) => (
            <button
              key={s.id}
              disabled={s.status === 'booked'}
              className={`seat ${s.status} ${picked.includes(s.id) ? 'picked' : ''}`}
              onClick={() => toggle(s.id)}
            >{s.id}</button>
          ))}
        </div>
      ))}
      <p>
        বাছা seat: <b>{picked.join(', ') || '—'}</b> · মোট <b>৳{picked.length * map.price}</b>
      </p>
      {error && (
        <div className="error">
          {error.status} {error.code}: {error.message}
        </div>
      )}
      <button className="primary" disabled={!picked.length || busy} onClick={book}>{busy ? '…' : 'Book করো'}</button>
    </div>
  );
}
