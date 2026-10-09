// In-memory "database". Server restart দিলে data seed অবস্থায় ফিরে যায়।
// আসল project-এ এখানে PostgreSQL / MongoDB বসবে, route-গুলো প্রায় একই থাকবে।
import bcrypt from 'bcryptjs';

export const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E'];
export const SEAT_COLS = 8;
export const MAX_SEATS_PER_BOOKING = 6;
export const HOLD_MS = 10 * 60 * 1000; // pending booking 10 মিনিট seat ধরে রাখে

export const db = { users: [], movies: [], showtimes: [], bookings: [] };

const counters = { user: 0, movie: 0, showtime: 0, booking: 0 };
export const nextId = (kind) => ++counters[kind];

export const allSeatIds = () =>
  SEAT_ROWS.flatMap((r) => Array.from({ length: SEAT_COLS }, (_, i) => `${r}${i + 1}`));

// একটা booking এখনো seat আটকে রেখেছে কিনা (paid, অথবা এখনো মেয়াদের মধ্যে থাকা pending)
export const holdsSeats = (b, now = Date.now()) =>
  b.status === 'paid' || (b.status === 'pending' && now - b.createdAt < HOLD_MS);

export function takenSeats(showtimeId, exceptBookingId = null) {
  return new Set(
    db.bookings
      .filter((b) => b.showtimeId === showtimeId && b.id !== exceptBookingId && holdsSeats(b))
      .flatMap((b) => b.seats),
  );
}

export function resetAndSeed() {
  db.users.length = db.movies.length = db.showtimes.length = db.bookings.length = 0;
  Object.keys(counters).forEach((k) => (counters[k] = 0));

  db.users.push(
    { id: nextId('user'), name: 'Admin', email: 'admin@demo.com', role: 'admin', passwordHash: bcrypt.hashSync('admin123', 8) },
    { id: nextId('user'), name: 'Rahim', email: 'user@demo.com', role: 'user', passwordHash: bcrypt.hashSync('user123', 8) },
  );

  const movies = [
    { title: 'Inception', genre: 'Sci-Fi', durationMin: 148, rating: 8.8, description: 'স্বপ্নের ভেতরে স্বপ্নে চুরির গল্প।' },
    { title: 'The Dark Knight', genre: 'Action', durationMin: 152, rating: 9.0, description: 'Batman বনাম Joker।' },
    { title: 'Interstellar', genre: 'Sci-Fi', durationMin: 169, rating: 8.7, description: 'নতুন পৃথিবীর খোঁজে মহাকাশযাত্রা।' },
  ];
  for (const m of movies) db.movies.push({ id: nextId('movie'), posterUrl: '', ...m });

  const day = 24 * 60 * 60 * 1000;
  const at = (daysAhead, hour) => {
    const d = new Date(Date.now() + daysAhead * day);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  };
  const shows = [
    [1, 'Hall 1', at(1, 15), 350], [1, 'Hall 1', at(1, 19), 400],
    [2, 'Hall 2', at(1, 18), 400], [2, 'Hall 2', at(2, 21), 450],
    [3, 'Hall 1', at(2, 17), 380],
  ];
  for (const [movieId, hall, startsAt, price] of shows) {
    db.showtimes.push({ id: nextId('showtime'), movieId, hall, startsAt, price });
  }
}

resetAndSeed();
