// Browser-এর ভেতরে চলা নকল API server (GitHub Pages-এ Node চলে না, তাই এটা)।
// server/src/routes-এর একই endpoint, একই validation, একই status code। fetch() বদলে দিয়ে কাজ করে,
// তাই React-এর api.js একটুও না বদলে সরাসরি এটার সাথে কথা বলে। আসল server-এর জন্য server/ দেখো।
const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E'];
const SEAT_COLS = 8;
const MAX_SEATS = 6;
const HOLD_MS = 10 * 60 * 1000;
const PAY_METHODS = ['card', 'bkash', 'nagad'];
const MOVIE_FIELDS = ['title', 'genre', 'durationMin', 'rating', 'description', 'posterUrl'];

let db;
let ids;
const nextId = (k) => ++ids[k];
const allSeatIds = () => SEAT_ROWS.flatMap((r) => Array.from({ length: SEAT_COLS }, (_, i) => `${r}${i + 1}`));
const VALID_SEATS = new Set(allSeatIds());

export function resetMock() {
  ids = { user: 0, movie: 0, showtime: 0, booking: 0 };
  db = { users: [], movies: [], showtimes: [], bookings: [] };
  db.users.push(
    { id: nextId('user'), name: 'Admin', email: 'admin@demo.com', role: 'admin', password: 'admin123' },
    { id: nextId('user'), name: 'Rahim', email: 'user@demo.com', role: 'user', password: 'user123' },
  );
  [
    ['Inception', 'Sci-Fi', 148, 8.8, 'স্বপ্নের ভেতরে স্বপ্নে চুরির গল্প।'],
    ['The Dark Knight', 'Action', 152, 9.0, 'Batman বনাম Joker।'],
    ['Interstellar', 'Sci-Fi', 169, 8.7, 'নতুন পৃথিবীর খোঁজে মহাকাশযাত্রা।'],
  ].forEach(([title, genre, durationMin, rating, description]) =>
    db.movies.push({ id: nextId('movie'), title, genre, durationMin, rating, description, posterUrl: '' }));
  const at = (d, h) => { const x = new Date(Date.now() + d * 864e5); x.setHours(h, 0, 0, 0); return x.toISOString(); };
  [[1, 'Hall 1', at(1, 15), 350], [1, 'Hall 1', at(1, 19), 400], [2, 'Hall 2', at(1, 18), 400], [2, 'Hall 2', at(2, 21), 450], [3, 'Hall 1', at(2, 17), 380]]
    .forEach(([movieId, hall, startsAt, price]) => db.showtimes.push({ id: nextId('showtime'), movieId, hall, startsAt, price }));
}
resetMock();

/* ---------- helpers ---------- */
const json = (status, body, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const noContent = () => new Response(null, { status: 204 });
const fail = (status, code, message, details) => json(status, { error: { code, message, ...(details ? { details } : {}) } });
const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

const b64 = (o) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const unb64 = (s) => JSON.parse(atob(s.replace(/-/g, '+').replace(/_/g, '/')));
const signToken = (u) => `${b64({ alg: 'MOCK', typ: 'JWT' })}.${b64({ sub: u.id, role: u.role, exp: Math.floor(Date.now() / 1000) + 3600 })}.mock-signature`;

const isStr = (v, min = 1, max = 200) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
const isNum = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isFuture = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && Date.parse(v) > Date.now();
const holds = (b) => b.status === 'paid' || (b.status === 'pending' && Date.now() - b.createdAt < HOLD_MS);
const takenSeats = (showtimeId, except = null) => new Set(db.bookings.filter((b) => b.showtimeId === showtimeId && b.id !== except && holds(b)).flatMap((b) => b.seats));

const MOVIE_RULES = {
  title: (v) => isStr(v, 1, 120) || 'title দরকার (১-১২০ অক্ষর)',
  genre: (v) => isStr(v, 1, 40) || 'genre দরকার',
  durationMin: (v) => isInt(v, 1, 600) || 'durationMin ১ থেকে ৬০০-এর মধ্যে পূর্ণসংখ্যা হতে হবে',
  rating: (v) => isNum(v, 0, 10) || 'rating ০ থেকে ১০-এর মধ্যে হতে হবে',
  description: (v) => (typeof v === 'string' && v.length <= 1000) || 'description সর্বোচ্চ ১০০০ অক্ষর',
  posterUrl: (v) => (typeof v === 'string' && v.length <= 500) || 'posterUrl সর্বোচ্চ ৫০০ অক্ষর',
};
function validateMovie(body, full) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [{ field: 'body', message: 'JSON object দিতে হবে' }];
  const details = [];
  const given = Object.keys(body).filter((k) => MOVIE_FIELDS.includes(k));
  if (!full && !given.length) details.push({ field: 'body', message: `অন্তত একটা field দাও: ${MOVIE_FIELDS.join(', ')}` });
  if (full) for (const f of ['title', 'genre', 'durationMin']) if (body[f] === undefined) details.push({ field: f, message: `${f} দরকার` });
  for (const f of given) { const r = MOVIE_RULES[f](body[f]); if (r !== true) details.push({ field: f, message: r }); }
  return details;
}
const pickMovie = (b) => Object.fromEntries(MOVIE_FIELDS.filter((k) => b[k] !== undefined).map((k) => [k, typeof b[k] === 'string' ? b[k].trim() : b[k]]));
const VALIDATION = (details) => fail(400, 'VALIDATION_ERROR', 'Input ঠিক নয়', details);

function checkSeats(seats) {
  if (!Array.isArray(seats) || seats.length < 1 || seats.length > MAX_SEATS) return `seats array-তে ১ থেকে ${MAX_SEATS}টা seat দাও (যেমন ["A1","A2"])`;
  const bad = seats.filter((s) => !VALID_SEATS.has(s));
  if (bad.length) return `ভুল seat: ${bad.join(', ')} (A1 থেকে E8 পর্যন্ত আছে)`;
  if (new Set(seats).size !== seats.length) return 'একই seat দুবার দেওয়া যাবে না';
  return null;
}
function bookingView(b) {
  const show = db.showtimes.find((s) => s.id === b.showtimeId);
  const movie = show && db.movies.find((m) => m.id === show.movieId);
  const expired = b.status === 'pending' && !holds(b);
  return {
    id: b.id, status: expired ? 'expired' : b.status, seats: b.seats, totalPrice: b.totalPrice,
    createdAt: new Date(b.createdAt).toISOString(),
    ...(b.status === 'pending' && !expired ? { expiresAt: new Date(b.createdAt + HOLD_MS).toISOString() } : {}),
    ...(b.paymentRef ? { paymentRef: b.paymentRef } : {}),
    showtime: show ? { id: show.id, hall: show.hall, startsAt: show.startsAt, price: show.price } : null,
    movie: movie ? { id: movie.id, title: movie.title } : null,
  };
}

/* ---------- routes: [method, pattern, access, handler] ---------- */
const movieOr404 = (p) => db.movies.find((m) => m.id === Number(p.id)) || null;
const showOr404 = (p) => db.showtimes.find((s) => s.id === Number(p.id)) || null;
const NO_MOVIE = (p) => fail(404, 'MOVIE_NOT_FOUND', `${p.id} নম্বর movie নেই`);
const NO_SHOW = (p) => fail(404, 'SHOWTIME_NOT_FOUND', `${p.id} নম্বর show নেই`);
function loadBooking(p, user) {
  const b = db.bookings.find((x) => x.id === Number(p.id));
  if (!b) return { res: fail(404, 'BOOKING_NOT_FOUND', `${p.id} নম্বর booking নেই`) };
  if (b.userId !== user.id && user.role !== 'admin') return { res: fail(403, 'FORBIDDEN', 'এই booking তোমার নয়') };
  return { b };
}

const routes = [
  ['GET', '/health', 'public', () => json(200, { status: 'ok', time: new Date().toISOString() })],

  ['POST', '/auth/register', 'public', ({ body }) => {
    const { name, email, password } = body || {};
    const d = [];
    if (!isStr(name, 2, 60)) d.push({ field: 'name', message: 'name ২-৬০ অক্ষরের হতে হবে' });
    if (!isEmail(email)) d.push({ field: 'email', message: 'ঠিক email দাও' });
    if (!isStr(password, 6, 100)) d.push({ field: 'password', message: 'password কমপক্ষে ৬ অক্ষর' });
    if (d.length) return VALIDATION(d);
    if (db.users.some((u) => u.email === email.toLowerCase())) return fail(409, 'EMAIL_TAKEN', 'এই email দিয়ে আগেই account আছে');
    const user = { id: nextId('user'), name: name.trim(), email: email.toLowerCase(), role: 'user', password };
    db.users.push(user);
    return json(201, { user: pub(user), token: signToken(user) });
  }],
  ['POST', '/auth/login', 'public', ({ body }) => {
    const { email, password } = body || {};
    if (!isEmail(email) || !isStr(password, 1, 100)) return fail(400, 'VALIDATION_ERROR', 'email আর password দিতে হবে');
    const user = db.users.find((u) => u.email === email.toLowerCase());
    if (!user || user.password !== password) return fail(401, 'INVALID_CREDENTIALS', 'email বা password ভুল');
    return json(200, { user: pub(user), token: signToken(user) });
  }],
  ['GET', '/auth/me', 'user', ({ user }) => json(200, { user: pub(user) })],
  ['PATCH', '/auth/me', 'user', ({ user, body }) => {
    const { name, password } = body || {};
    if (name === undefined && password === undefined) return fail(400, 'VALIDATION_ERROR', 'name বা password-এর অন্তত একটা দাও');
    const d = [];
    if (name !== undefined && !isStr(name, 2, 60)) d.push({ field: 'name', message: 'name ২-৬০ অক্ষরের হতে হবে' });
    if (password !== undefined && !isStr(password, 6, 100)) d.push({ field: 'password', message: 'password কমপক্ষে ৬ অক্ষর' });
    if (d.length) return VALIDATION(d);
    if (name !== undefined) user.name = name.trim();
    if (password !== undefined) user.password = password;
    return json(200, { user: pub(user) });
  }],

  ['GET', '/movies', 'public', ({ query }) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    let list = db.movies;
    if (query.search) list = list.filter((m) => m.title.toLowerCase().includes(String(query.search).toLowerCase()));
    if (query.genre) list = list.filter((m) => m.genre.toLowerCase() === String(query.genre).toLowerCase());
    return json(200, { data: list.slice((page - 1) * limit, page * limit), meta: { page, limit, total: list.length, totalPages: Math.max(1, Math.ceil(list.length / limit)) } });
  }],
  ['GET', '/movies/:id', 'public', ({ params }) => { const m = movieOr404(params); return m ? json(200, { data: m }) : NO_MOVIE(params); }],
  ['GET', '/movies/:id/showtimes', 'public', ({ params }) => {
    const m = movieOr404(params); if (!m) return NO_MOVIE(params);
    const total = allSeatIds().length;
    const data = db.showtimes.filter((s) => s.movieId === m.id).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).map((s) => ({ ...s, seatsLeft: total - takenSeats(s.id).size }));
    return json(200, { data });
  }],
  ['POST', '/movies', 'admin', ({ body }) => {
    const d = validateMovie(body, true); if (d.length) return VALIDATION(d);
    const movie = { id: nextId('movie'), rating: 0, description: '', posterUrl: '', ...pickMovie(body) };
    db.movies.push(movie);
    return json(201, { data: movie }, { Location: `/api/movies/${movie.id}` });
  }],
  ['PUT', '/movies/:id', 'admin', ({ params, body }) => {
    const m = movieOr404(params); if (!m) return NO_MOVIE(params);
    const d = validateMovie(body, true); if (d.length) return VALIDATION(d);
    const replaced = { id: m.id, rating: 0, description: '', posterUrl: '', ...pickMovie(body) };
    db.movies[db.movies.indexOf(m)] = replaced;
    return json(200, { data: replaced });
  }],
  ['PATCH', '/movies/:id', 'admin', ({ params, body }) => {
    const m = movieOr404(params); if (!m) return NO_MOVIE(params);
    const d = validateMovie(body, false); if (d.length) return VALIDATION(d);
    Object.assign(m, pickMovie(body));
    return json(200, { data: m });
  }],
  ['DELETE', '/movies/:id', 'admin', ({ params }) => {
    const m = movieOr404(params); if (!m) return NO_MOVIE(params);
    const showIds = db.showtimes.filter((s) => s.movieId === m.id).map((s) => s.id);
    if (db.bookings.some((b) => showIds.includes(b.showtimeId))) return fail(409, 'MOVIE_HAS_BOOKINGS', 'এই movie-র booking আছে, মোছা যাবে না');
    db.showtimes = db.showtimes.filter((s) => s.movieId !== m.id);
    db.movies.splice(db.movies.indexOf(m), 1);
    return noContent();
  }],

  ['GET', '/showtimes', 'public', ({ query }) => json(200, { data: query.movieId ? db.showtimes.filter((s) => s.movieId === Number(query.movieId)) : db.showtimes })],
  ['GET', '/showtimes/:id/seats', 'public', ({ params }) => {
    const s = showOr404(params); if (!s) return NO_SHOW(params);
    const taken = takenSeats(s.id);
    return json(200, { data: { showtimeId: s.id, price: s.price, layout: { rows: SEAT_ROWS, cols: SEAT_COLS }, seats: allSeatIds().map((id) => ({ id, status: taken.has(id) ? 'booked' : 'available' })) } });
  }],
  ['POST', '/showtimes', 'admin', ({ body }) => {
    const { movieId, hall, startsAt, price } = body || {};
    const d = [];
    if (!isStr(hall, 1, 40)) d.push({ field: 'hall', message: 'hall দরকার' });
    if (!isFuture(startsAt)) d.push({ field: 'startsAt', message: 'startsAt ভবিষ্যতের ISO তারিখ হতে হবে (যেমন 2030-01-01T18:00:00Z)' });
    if (!isNum(price, 1, 100000)) d.push({ field: 'price', message: 'price ১ থেকে ১,০০,০০০-এর মধ্যে সংখ্যা' });
    if (d.length) return VALIDATION(d);
    if (!db.movies.some((m) => m.id === movieId)) return fail(404, 'MOVIE_NOT_FOUND', 'movieId-র movie নেই');
    const show = { id: nextId('showtime'), movieId, hall: hall.trim(), startsAt: new Date(startsAt).toISOString(), price };
    db.showtimes.push(show);
    return json(201, { data: show }, { Location: `/api/showtimes/${show.id}` });
  }],
  ['PATCH', '/showtimes/:id', 'admin', ({ params, body }) => {
    const s = showOr404(params); if (!s) return NO_SHOW(params);
    const { hall, startsAt, price } = body || {};
    if (hall === undefined && startsAt === undefined && price === undefined) return fail(400, 'VALIDATION_ERROR', 'hall, startsAt বা price-এর অন্তত একটা দাও');
    const d = [];
    if (hall !== undefined && !isStr(hall, 1, 40)) d.push({ field: 'hall', message: 'hall ঠিক নয়' });
    if (startsAt !== undefined && !isFuture(startsAt)) d.push({ field: 'startsAt', message: 'startsAt ভবিষ্যতের তারিখ হতে হবে' });
    if (price !== undefined && !isNum(price, 1, 100000)) d.push({ field: 'price', message: 'price ঠিক নয়' });
    if (d.length) return VALIDATION(d);
    if (hall !== undefined) s.hall = hall.trim();
    if (startsAt !== undefined) s.startsAt = new Date(startsAt).toISOString();
    if (price !== undefined) s.price = price;
    return json(200, { data: s });
  }],
  ['DELETE', '/showtimes/:id', 'admin', ({ params }) => {
    const s = showOr404(params); if (!s) return NO_SHOW(params);
    if (db.bookings.some((b) => b.showtimeId === s.id)) return fail(409, 'SHOWTIME_HAS_BOOKINGS', 'এই show-তে booking আছে, মোছা যাবে না');
    db.showtimes.splice(db.showtimes.indexOf(s), 1);
    return noContent();
  }],

  ['GET', '/bookings', 'user', ({ user, query }) => {
    const list = user.role === 'admin' ? db.bookings : db.bookings.filter((b) => b.userId === user.id);
    return json(200, { data: list.map(bookingView).filter((v) => !query.status || v.status === query.status).sort((a, b) => b.id - a.id) });
  }],
  ['GET', '/bookings/:id', 'user', ({ params, user }) => { const { b, res } = loadBooking(params, user); return res || json(200, { data: bookingView(b) }); }],
  ['POST', '/bookings', 'user', ({ user, body }) => {
    const { showtimeId, seats } = body || {};
    const show = db.showtimes.find((s) => s.id === showtimeId);
    if (!show) return fail(404, 'SHOWTIME_NOT_FOUND', 'showtimeId-র show নেই');
    const problem = checkSeats(seats); if (problem) return fail(400, 'VALIDATION_ERROR', problem);
    if (Date.parse(show.startsAt) <= Date.now()) return fail(400, 'SHOWTIME_STARTED', 'এই show শুরু হয়ে গেছে');
    const taken = takenSeats(show.id);
    const clash = seats.filter((s) => taken.has(s));
    if (clash.length) return fail(409, 'SEAT_TAKEN', `এই seat আগেই booked: ${clash.join(', ')}`, { seats: clash });
    const booking = { id: nextId('booking'), userId: user.id, showtimeId: show.id, seats: [...seats].sort(), totalPrice: show.price * seats.length, status: 'pending', createdAt: Date.now() };
    db.bookings.push(booking);
    return json(201, { data: bookingView(booking) }, { Location: `/api/bookings/${booking.id}` });
  }],
  ['PATCH', '/bookings/:id', 'user', ({ params, user, body }) => {
    const { b, res } = loadBooking(params, user); if (res) return res;
    if (b.status === 'paid') return fail(409, 'BOOKING_NOT_EDITABLE', 'payment হয়ে গেছে, seat বদলানো যাবে না');
    if (!holds(b)) return fail(410, 'BOOKING_EXPIRED', 'Booking-এর মেয়াদ শেষ, নতুন করে booking করো');
    const { seats } = body || {};
    const problem = checkSeats(seats); if (problem) return fail(400, 'VALIDATION_ERROR', problem);
    const taken = takenSeats(b.showtimeId, b.id);
    const clash = seats.filter((s) => taken.has(s));
    if (clash.length) return fail(409, 'SEAT_TAKEN', `এই seat আগেই booked: ${clash.join(', ')}`, { seats: clash });
    const show = db.showtimes.find((s) => s.id === b.showtimeId);
    b.seats = [...seats].sort(); b.totalPrice = show.price * seats.length;
    return json(200, { data: bookingView(b) });
  }],
  ['POST', '/bookings/:id/pay', 'user', ({ params, user, body }) => {
    const { b, res } = loadBooking(params, user); if (res) return res;
    if (b.status === 'paid') return fail(409, 'ALREADY_PAID', 'এই booking-এর payment আগেই হয়েছে');
    if (!holds(b)) return fail(410, 'BOOKING_EXPIRED', 'Booking-এর মেয়াদ শেষ, নতুন করে booking করো');
    if (!PAY_METHODS.includes((body || {}).method)) return fail(400, 'VALIDATION_ERROR', `method হতে হবে: ${PAY_METHODS.join(' / ')}`);
    b.status = 'paid'; b.paymentRef = `PAY-${Date.now().toString(36).toUpperCase()}-${b.id}`;
    return json(200, { data: bookingView(b) });
  }],
  ['DELETE', '/bookings/:id', 'user', ({ params, user }) => {
    const { b, res } = loadBooking(params, user); if (res) return res;
    const show = db.showtimes.find((s) => s.id === b.showtimeId);
    if (show && Date.parse(show.startsAt) <= Date.now()) return fail(409, 'CANNOT_CANCEL', 'show শুরু হয়ে গেছে, cancel করা যাবে না');
    db.bookings.splice(db.bookings.indexOf(b), 1);
    return noContent();
  }],
].map(([method, pattern, access, handler]) => ({
  method, access, handler,
  re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '/?$'),
}));

function authenticate(headers) {
  const [scheme, token] = (headers.Authorization || headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return { res: fail(401, 'UNAUTHORIZED', 'Authorization: Bearer <token> header দিতে হবে') };
  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('shape');
    const p = unb64(parts[1]);
    if (p.exp * 1000 < Date.now()) return { res: fail(401, 'TOKEN_EXPIRED', 'Token-এর মেয়াদ শেষ, আবার login করো') };
    const user = db.users.find((u) => u.id === p.sub);
    if (!user) return { res: fail(401, 'INVALID_TOKEN', 'Token-এর user আর নেই') };
    return { user };
  } catch {
    return { res: fail(401, 'INVALID_TOKEN', 'Token ঠিক নয়') };
  }
}

export function handleMock(method, rawUrl, headers = {}, rawBody) {
  const url = new URL(rawUrl, 'http://mock.local');
  const path = url.pathname.replace(/^\/?.*?\/api(?=\/|$)/, '') || '/';
  const query = Object.fromEntries(url.searchParams);

  let body;
  if (rawBody !== undefined && rawBody !== null && rawBody !== '') {
    try { body = JSON.parse(rawBody); } catch { return fail(400, 'INVALID_JSON', 'Request body ঠিক JSON নয়'); }
  }
  for (const r of routes) {
    if (r.method !== method) continue;
    const m = r.re.exec(path);
    if (!m) continue;
    let user = null;
    if (r.access !== 'public') {
      const a = authenticate(headers);
      if (a.res) return a.res;
      user = a.user;
      if (r.access === 'admin' && user.role !== 'admin') return fail(403, 'FORBIDDEN', 'এই কাজ শুধু admin-এর জন্য');
    }
    return r.handler({ params: m.groups || {}, query, body, user });
  }
  return fail(404, 'ROUTE_NOT_FOUND', `${method} ${url.pathname} নামে কোনো endpoint নেই`);
}

// window.fetch বদলে দেয়: /api দিয়ে শুরু হওয়া call গুলো এই নকল server সামলায়
export function installMock({ latency = 140 } = {}) {
  const realFetch = globalThis.fetch?.bind(globalThis);
  globalThis.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    if (!/\/api(\/|$|\?)/.test(url)) return realFetch(input, init);
    if (latency) await new Promise((r) => setTimeout(r, latency));
    return handleMock((init.method || 'GET').toUpperCase(), url, init.headers || {}, init.body);
  };
}
