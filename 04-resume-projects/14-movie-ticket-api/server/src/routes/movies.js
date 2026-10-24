import { Router } from 'express';
import { db, nextId, takenSeats, allSeatIds } from '../data.js';
import { auth, requireRole } from '../middleware/auth.js';
import { fail } from '../middleware/errors.js';
import { validateMovie, pickMovie } from '../validate.js';

const router = Router();
const findMovie = (req) => db.movies.find((m) => m.id === Number(req.params.id));
const movieOr404 = (req, res) => {
  const m = findMovie(req);
  if (!m) fail(res, 404, 'MOVIE_NOT_FOUND', `${req.params.id} নম্বর movie নেই`);
  return m;
};

// GET /api/movies?search=inc&genre=Sci-Fi&page=1&limit=10   -> 200
router.get('/', (req, res) => {
  const { search, genre } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));

  let list = db.movies;
  if (search) list = list.filter((m) => m.title.toLowerCase().includes(String(search).toLowerCase()));
  if (genre) list = list.filter((m) => m.genre.toLowerCase() === String(genre).toLowerCase());

  const total = list.length;
  res.json({
    data: list.slice((page - 1) * limit, page * limit),
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  });
});

// GET /api/movies/:id  -> 200 | 404
router.get('/:id', (req, res) => {
  const movie = movieOr404(req, res);
  if (movie) res.json({ data: movie });
});

// GET /api/movies/:id/showtimes  -> সেই movie-র সব show, কতগুলো seat ফাঁকা সহ
router.get('/:id/showtimes', (req, res) => {
  const movie = movieOr404(req, res);
  if (!movie) return;
  const total = allSeatIds().length;
  const data = db.showtimes
    .filter((s) => s.movieId === movie.id)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    .map((s) => ({ ...s, seatsLeft: total - takenSeats(s.id).size }));
  res.json({ data });
});

// POST /api/movies  (admin)  -> 201 Created + Location header
router.post('/', auth, requireRole('admin'), (req, res) => {
  const details = validateMovie(req.body, { full: true });
  if (details.length) return fail(res, 400, 'VALIDATION_ERROR', 'Input ঠিক নয়', details);
  const movie = { id: nextId('movie'), rating: 0, description: '', posterUrl: '', ...pickMovie(req.body) };
  db.movies.push(movie);
  res.status(201).location(`/api/movies/${movie.id}`).json({ data: movie });
});

// PUT /api/movies/:id  (admin)  -> পুরোটা বদলে দেয়, তাই required field সব লাগবে
router.put('/:id', auth, requireRole('admin'), (req, res) => {
  const movie = movieOr404(req, res);
  if (!movie) return;
  const details = validateMovie(req.body, { full: true });
  if (details.length) return fail(res, 400, 'VALIDATION_ERROR', 'Input ঠিক নয়', details);
  const replaced = { id: movie.id, rating: 0, description: '', posterUrl: '', ...pickMovie(req.body) };
  db.movies[db.movies.indexOf(movie)] = replaced;
  res.json({ data: replaced });
});

// PATCH /api/movies/:id  (admin)  -> যা পাঠালে শুধু সেটুকুই বদলায়
router.patch('/:id', auth, requireRole('admin'), (req, res) => {
  const movie = movieOr404(req, res);
  if (!movie) return;
  const details = validateMovie(req.body, { full: false });
  if (details.length) return fail(res, 400, 'VALIDATION_ERROR', 'Input ঠিক নয়', details);
  Object.assign(movie, pickMovie(req.body));
  res.json({ data: movie });
});

// DELETE /api/movies/:id  (admin)  -> 204 No Content (body থাকে না)
router.delete('/:id', auth, requireRole('admin'), (req, res) => {
  const movie = movieOr404(req, res);
  if (!movie) return;
  const showIds = db.showtimes.filter((s) => s.movieId === movie.id).map((s) => s.id);
  if (db.bookings.some((b) => showIds.includes(b.showtimeId))) {
    return fail(res, 409, 'MOVIE_HAS_BOOKINGS', 'এই movie-র booking আছে, মোছা যাবে না');
  }
  db.showtimes = db.showtimes.filter((s) => s.movieId !== movie.id);
  db.movies.splice(db.movies.indexOf(movie), 1);
  res.status(204).end();
});

export default router;
