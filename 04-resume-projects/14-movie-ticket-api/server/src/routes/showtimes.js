import { Router } from 'express';
import { db, nextId, takenSeats, allSeatIds, SEAT_ROWS, SEAT_COLS } from '../data.js';
import { auth, requireRole } from '../middleware/auth.js';
import { fail } from '../middleware/errors.js';
import { isStr, isNum, isFutureDate } from '../validate.js';

const router = Router();
const showOr404 = (req, res) => {
  const s = db.showtimes.find((x) => x.id === Number(req.params.id));
  if (!s) fail(res, 404, 'SHOWTIME_NOT_FOUND', `${req.params.id} নম্বর show নেই`);
  return s;
};

// GET /api/showtimes?movieId=1  -> 200
router.get('/', (req, res) => {
  let list = db.showtimes;
  if (req.query.movieId) list = list.filter((s) => s.movieId === Number(req.query.movieId));
  res.json({ data: list });
});

// GET /api/showtimes/:id/seats  -> seat map (কোনটা ফাঁকা, কোনটা booked)
router.get('/:id/seats', (req, res) => {
  const show = showOr404(req, res);
  if (!show) return;
  const taken = takenSeats(show.id);
  res.json({
    data: {
      showtimeId: show.id,
      price: show.price,
      layout: { rows: SEAT_ROWS, cols: SEAT_COLS },
      seats: allSeatIds().map((id) => ({ id, status: taken.has(id) ? 'booked' : 'available' })),
    },
  });
});

// POST /api/showtimes  (admin)  -> 201
router.post('/', auth, requireRole('admin'), (req, res) => {
  const { movieId, hall, startsAt, price } = req.body || {};
  const details = [];
  if (!isStr(hall, 1, 40)) details.push({ field: 'hall', message: 'hall দরকার' });
  if (!isFutureDate(startsAt)) details.push({ field: 'startsAt', message: 'startsAt ভবিষ্যতের ISO তারিখ হতে হবে (যেমন 2030-01-01T18:00:00Z)' });
  if (!isNum(price, 1, 100000)) details.push({ field: 'price', message: 'price ১ থেকে ১,০০,০০০-এর মধ্যে সংখ্যা' });
  if (details.length) return fail(res, 400, 'VALIDATION_ERROR', 'Input ঠিক নয়', details);
  if (!db.movies.some((m) => m.id === movieId)) return fail(res, 404, 'MOVIE_NOT_FOUND', 'movieId-র movie নেই');

  const show = { id: nextId('showtime'), movieId, hall: hall.trim(), startsAt: new Date(startsAt).toISOString(), price };
  db.showtimes.push(show);
  res.status(201).location(`/api/showtimes/${show.id}`).json({ data: show });
});

// PATCH /api/showtimes/:id  (admin)  -> hall / startsAt / price আংশিক বদল
router.patch('/:id', auth, requireRole('admin'), (req, res) => {
  const show = showOr404(req, res);
  if (!show) return;
  const { hall, startsAt, price } = req.body || {};
  if (hall === undefined && startsAt === undefined && price === undefined) {
    return fail(res, 400, 'VALIDATION_ERROR', 'hall, startsAt বা price-এর অন্তত একটা দাও');
  }
  const details = [];
  if (hall !== undefined && !isStr(hall, 1, 40)) details.push({ field: 'hall', message: 'hall ঠিক নয়' });
  if (startsAt !== undefined && !isFutureDate(startsAt)) details.push({ field: 'startsAt', message: 'startsAt ভবিষ্যতের তারিখ হতে হবে' });
  if (price !== undefined && !isNum(price, 1, 100000)) details.push({ field: 'price', message: 'price ঠিক নয়' });
  if (details.length) return fail(res, 400, 'VALIDATION_ERROR', 'Input ঠিক নয়', details);

  if (hall !== undefined) show.hall = hall.trim();
  if (startsAt !== undefined) show.startsAt = new Date(startsAt).toISOString();
  if (price !== undefined) show.price = price;
  res.json({ data: show });
});

// DELETE /api/showtimes/:id  (admin)  -> 204 | 409 (booking থাকলে)
router.delete('/:id', auth, requireRole('admin'), (req, res) => {
  const show = showOr404(req, res);
  if (!show) return;
  if (db.bookings.some((b) => b.showtimeId === show.id)) {
    return fail(res, 409, 'SHOWTIME_HAS_BOOKINGS', 'এই show-তে booking আছে, মোছা যাবে না');
  }
  db.showtimes.splice(db.showtimes.indexOf(show), 1);
  res.status(204).end();
});

export default router;
