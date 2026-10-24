import { useEffect, useState } from 'react';
import { api } from '../api.js';

const fmt = (iso) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default function Bookings() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  // GET /bookings  -> নিজের সব booking
  const load = () => api.get('/bookings').then((r) => setList(r.data)).catch(setError);
  useEffect(() => { load(); }, []);

  // একটা action চালিয়ে তালিকা নতুন করে আনি; error হলে দেখাই
  const run = (fn) => async () => {
    setError(null);
    try { await fn(); await load(); } catch (err) { setError(err); }
  };

  if (!list) return <p>Loading…</p>;
  return (
    <div>
      <h2>আমার booking</h2>
      {error && <div className="error">{error.status} {error.code}: {error.message}</div>}
      {list.length === 0 && <p>এখনো কোনো booking নেই।</p>}
      {list.map((b) => <BookingCard key={b.id} b={b} run={run} />)}
    </div>
  );
}

function BookingCard({ b, run }) {
  const [seats, setSeats] = useState(b.seats.join(','));
  const pending = b.status === 'pending';

  return (
    <article className="card">
      <h3>{b.movie?.title} <span className={`badge ${b.status}`}>{b.status}</span></h3>
      <p className="meta">{b.showtime && `${fmt(b.showtime.startsAt)} · ${b.showtime.hall}`}</p>
      <p>Seat: <b>{b.seats.join(', ')}</b> · মোট ৳{b.totalPrice} {b.paymentRef && <small>· {b.paymentRef}</small>}</p>
      {pending && <p className="hint">⏳ {fmt(b.expiresAt)}-এর মধ্যে payment না করলে seat ছেড়ে দেওয়া হবে</p>}

      <div className="row">
        {pending && (
          <>
            {/* POST /bookings/:id/pay */}
            <button className="primary" onClick={run(() => api.post(`/bookings/${b.id}/pay`, { method: 'bkash' }))}>bKash দিয়ে pay</button>
            {/* PATCH /bookings/:id  (শুধু seats বদলায়) */}
            <input value={seats} onChange={(e) => setSeats(e.target.value)} className="small" aria-label="seats" />
            <button onClick={run(() => api.patch(`/bookings/${b.id}`, { seats: seats.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean) }))}>Seat বদলাও</button>
          </>
        )}
        {/* DELETE /bookings/:id  -> 204 */}
        {b.status !== 'expired' && <button className="danger" onClick={run(() => api.delete(`/bookings/${b.id}`))}>Cancel</button>}
      </div>
    </article>
  );
}
