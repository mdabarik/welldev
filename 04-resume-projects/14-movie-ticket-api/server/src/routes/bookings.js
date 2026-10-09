import { Router } from 'express';
import { db, nextId, takenSeats, allSeatIds, holdsSeats, HOLD_MS, MAX_SEATS_PER_BOOKING } from '../data.js';
import { auth } from '../middleware/auth.js';
import { fail } from '../middleware/errors.js';

const router = Router();
router.use(auth); // এই file-এর সব route-এ login লাগবে

const VALID_SEATS = new Set(allSeatIds());
const PAY_METHODS = ['card', 'bkash', 'nagad'];

// Client-কে দেখানোর আকার: booking + show আর movie-র দরকারি অংশ
function view(b) {
  const show = db.showtimes.find((s) => s.id === b.showtimeId);
  const movie = show && db.movies.find((m) => m.id === show.movieId);
  const expired = b.status === 'pending' && !holdsSeats(b);
  return {
    id: b.id,
    status: expired ? 'expired' : b.status,
    seats: b.seats,
    totalPrice: b.totalPrice,
    createdAt: new Date(b.createdAt).toISOString(),
    ...(b.status === 'pending' && !expired ? { expiresAt: new Date(b.createdAt + HOLD_MS).toISOString() } : {}),
    ...(b.paymentRef ? { paymentRef: b.paymentRef } : {}),
    showtime: show ? { id: show.id, hall: show.hall, startsAt: show.startsAt, price: show.price } : null,
    movie: movie ? { id: movie.id, title: movie.title } : null,
  };
}

// seats[] ঠিক আছে কিনা: ১-৬টা, সব valid আর আলাদা আলাদা seat
function checkSeats(seats) {
  if (!Array.isArray(seats) || seats.length < 1 || seats.length > MAX_SEATS_PER_BOOKING) {
    return `seats array-তে ১ থেকে ${MAX_SEATS_PER_BOOKING}টা seat দাও (যেমন ["A1","A2"])`;
  }
  const bad = seats.filter((s) => !VALID_SEATS.has(s));
  if (bad.length) return `ভুল seat: ${bad.join(', ')} (A1 থেকে E8 পর্যন্ত আছে)`;
  if (new Set(seats).size !== seats.length) return 'একই seat দুবার দেওয়া যাবে না';
  return null;
}

// owner অথবা admin ছাড়া কেউ দেখতে/বদলাতে পারবে না
function loadOwned(req, res) {
  const b = db.bookings.find((x) => x.id === Number(req.params.id));
  if (!b) { fail(res, 404, 'BOOKING_NOT_FOUND', `${req.params.id} নম্বর booking নেই`); return null; }
  if (b.userId !== req.user.id && req.user.role !== 'admin') {
    fail(res, 403, 'FORBIDDEN', 'এই booking তোমার নয়');
    return null;
  }
  return b;
}

// GET /api/bookings?status=paid   -> নিজের booking (admin হলে সবার)
router.get('/', (req, res) => {
  let list = req.user.role === 'admin' ? db.bookings : db.bookings.filter((b) => b.userId === req.user.id);
  const data = list.map(view).filter((v) => !req.query.status || v.status === req.query.status);
  res.json({ data: data.sort((a, b) => b.id - a.id) });
});

// GET /api/bookings/:id
router.get('/:id', (req, res) => {
  const b = loadOwned(req, res);
  if (b) res.json({ data: view(b) });
});

// POST /api/bookings   { showtimeId, seats: ["A1","A2"] }   -> 201 | 409 (seat আগেই নেওয়া)
router.post('/', (req, res) => {
  const { showtimeId, seats } = req.body || {};
  const show = db.showtimes.find((s) => s.id === showtimeId);
  if (!show) return fail(res, 404, 'SHOWTIME_NOT_FOUND', 'showtimeId-র show নেই');
  const problem = checkSeats(seats);
  if (problem) return fail(res, 400, 'VALIDATION_ERROR', problem);
  if (Date.parse(show.startsAt) <= Date.now()) return fail(res, 400, 'SHOWTIME_STARTED', 'এই show শুরু হয়ে গেছে');

  const taken = takenSeats(show.id);
  const clash = seats.filter((s) => taken.has(s));
  if (clash.length) return fail(res, 409, 'SEAT_TAKEN', `এই seat আগেই booked: ${clash.join(', ')}`, { seats: clash });

  const booking = {
    id: nextId('booking'), userId: req.user.id, showtimeId: show.id,
    seats: [...seats].sort(), totalPrice: show.price * seats.length,
    status: 'pending', createdAt: Date.now(),
  };
  db.bookings.push(booking);
  res.status(201).location(`/api/bookings/${booking.id}`).json({ data: view(booking) });
});

// PATCH /api/bookings/:id   { seats: [...] }  -> payment-এর আগে seat বদলানো
router.patch('/:id', (req, res) => {
  const b = loadOwned(req, res);
  if (!b) return;
  if (b.status === 'paid') return fail(res, 409, 'BOOKING_NOT_EDITABLE', 'payment হয়ে গেছে, seat বদলানো যাবে না');
  if (!holdsSeats(b)) return fail(res, 410, 'BOOKING_EXPIRED', 'Booking-এর মেয়াদ শেষ, নতুন করে booking করো');

  const { seats } = req.body || {};
  const problem = checkSeats(seats);
  if (problem) return fail(res, 400, 'VALIDATION_ERROR', problem);

  const taken = takenSeats(b.showtimeId, b.id);
  const clash = seats.filter((s) => taken.has(s));
  if (clash.length) return fail(res, 409, 'SEAT_TAKEN', `এই seat আগেই booked: ${clash.join(', ')}`, { seats: clash });

  const show = db.showtimes.find((s) => s.id === b.showtimeId);
  b.seats = [...seats].sort();
  b.totalPrice = show.price * seats.length;
  res.json({ data: view(b) });
});

// POST /api/bookings/:id/pay   { method: "bkash" }  -> 200 (mock payment)
router.post('/:id/pay', (req, res) => {
  const b = loadOwned(req, res);
  if (!b) return;
  if (b.status === 'paid') return fail(res, 409, 'ALREADY_PAID', 'এই booking-এর payment আগেই হয়েছে');
  if (!holdsSeats(b)) return fail(res, 410, 'BOOKING_EXPIRED', 'Booking-এর মেয়াদ শেষ, নতুন করে booking করো');
  const { method } = req.body || {};
  if (!PAY_METHODS.includes(method)) {
    return fail(res, 400, 'VALIDATION_ERROR', `method হতে হবে: ${PAY_METHODS.join(' / ')}`);
  }
  b.status = 'paid';
  b.paymentRef = `PAY-${Date.now().toString(36).toUpperCase()}-${b.id}`;
  res.json({ data: view(b) });
});

// DELETE /api/bookings/:id  -> cancel, 204 No Content
router.delete('/:id', (req, res) => {
  const b = loadOwned(req, res);
  if (!b) return;
  const show = db.showtimes.find((s) => s.id === b.showtimeId);
  if (show && Date.parse(show.startsAt) <= Date.now()) {
    return fail(res, 409, 'CANNOT_CANCEL', 'show শুরু হয়ে গেছে, cancel করা যাবে না');
  }
  db.bookings.splice(db.bookings.indexOf(b), 1);
  res.status(204).end();
});

export default router;
