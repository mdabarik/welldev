// Smoke test: সব endpoint একবার করে চালিয়ে status code মেলায়।  চালাতে: npm test
process.env.NODE_ENV = 'test';
import assert from 'node:assert/strict';
const { app } = await import('../src/app.js'); // env সেট করার পরে import, যাতে request log বন্ধ থাকে

const server = app.listen(0);
const base = `http://localhost:${server.address().port}/api`;
let passed = 0;

async function call(method, path, { token, body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  const text = await res.text();
  return { status: res.status, headers: res.headers, json: text ? JSON.parse(text) : null };
}
function expect(label, res, status, check) {
  assert.equal(res.status, status, `${label}: আশা ${status}, পেলাম ${res.status} ${JSON.stringify(res.json)}`);
  if (check) check(res.json);
  passed++;
  console.log(`  ✓ ${status}  ${label}`);
}

try {
  console.log('Auth');
  expect('health', await call('GET', '/health'), 200);
  expect('register', await call('POST', '/auth/register', { body: { name: 'Karim', email: 'karim@demo.com', password: 'secret1' } }), 201, (j) => assert.ok(j.token));
  expect('register: duplicate email', await call('POST', '/auth/register', { body: { name: 'Karim', email: 'karim@demo.com', password: 'secret1' } }), 409);
  expect('register: invalid body', await call('POST', '/auth/register', { body: { name: 'K', email: 'x', password: '1' } }), 400, (j) => assert.equal(j.error.details.length, 3));
  expect('login: wrong password', await call('POST', '/auth/login', { body: { email: 'user@demo.com', password: 'nope' } }), 401);
  const u = await call('POST', '/auth/login', { body: { email: 'user@demo.com', password: 'user123' } });
  expect('login user', u, 200, (j) => assert.ok(j.token));
  const a = await call('POST', '/auth/login', { body: { email: 'admin@demo.com', password: 'admin123' } });
  expect('login admin', a, 200);
  const U = u.json.token, A = a.json.token;
  expect('me without token', await call('GET', '/auth/me'), 401);
  expect('me with bad token', await call('GET', '/auth/me', { token: 'abc.def.ghi' }), 401);
  expect('me', await call('GET', '/auth/me', { token: U }), 200, (j) => assert.equal(j.user.email, 'user@demo.com'));
  expect('patch me', await call('PATCH', '/auth/me', { token: U, body: { name: 'Rahim Uddin' } }), 200, (j) => assert.equal(j.user.name, 'Rahim Uddin'));

  console.log('Movies');
  expect('list movies', await call('GET', '/movies?limit=2'), 200, (j) => { assert.equal(j.data.length, 2); assert.equal(j.meta.total, 3); });
  expect('search movies', await call('GET', '/movies?search=inter'), 200, (j) => assert.equal(j.data[0].title, 'Interstellar'));
  expect('get movie', await call('GET', '/movies/1'), 200);
  expect('get missing movie', await call('GET', '/movies/999'), 404);
  expect('create movie: no token', await call('POST', '/movies', { body: {} }), 401);
  expect('create movie: user (not admin)', await call('POST', '/movies', { token: U, body: { title: 'X', genre: 'Y', durationMin: 90 } }), 403);
  expect('create movie: invalid', await call('POST', '/movies', { token: A, body: { title: '' } }), 400);
  const created = await call('POST', '/movies', { token: A, body: { title: 'Dune', genre: 'Sci-Fi', durationMin: 155, rating: 8.0 } });
  expect('create movie', created, 201, (j) => assert.ok(created.headers.get('location').endsWith(`/movies/${j.data.id}`)));
  const mid = created.json.data.id;
  expect('put movie (replace)', await call('PUT', `/movies/${mid}`, { token: A, body: { title: 'Dune: Part One', genre: 'Sci-Fi', durationMin: 155 } }), 200, (j) => assert.equal(j.data.rating, 0));
  expect('put movie: missing fields', await call('PUT', `/movies/${mid}`, { token: A, body: { title: 'Only title' } }), 400);
  expect('patch movie (partial)', await call('PATCH', `/movies/${mid}`, { token: A, body: { rating: 8.3 } }), 200, (j) => { assert.equal(j.data.rating, 8.3); assert.equal(j.data.title, 'Dune: Part One'); });
  expect('patch movie: empty body', await call('PATCH', `/movies/${mid}`, { token: A, body: {} }), 400);

  console.log('Showtimes');
  expect('showtimes of movie', await call('GET', '/movies/1/showtimes'), 200, (j) => assert.equal(j.data[0].seatsLeft, 40));
  const future = new Date(Date.now() + 3 * 86400000).toISOString();
  expect('create showtime: past date', await call('POST', '/showtimes', { token: A, body: { movieId: mid, hall: 'H3', startsAt: '2001-01-01T10:00:00Z', price: 300 } }), 400);
  const st = await call('POST', '/showtimes', { token: A, body: { movieId: mid, hall: 'Hall 3', startsAt: future, price: 300 } });
  expect('create showtime', st, 201);
  const sid = st.json.data.id;
  expect('patch showtime', await call('PATCH', `/showtimes/${sid}`, { token: A, body: { price: 320 } }), 200, (j) => assert.equal(j.data.price, 320));
  expect('seat map', await call('GET', `/showtimes/${sid}/seats`), 200, (j) => assert.equal(j.data.seats.length, 40));

  console.log('Bookings');
  expect('book: no token', await call('POST', '/bookings', { body: {} }), 401);
  expect('book: bad seat', await call('POST', '/bookings', { token: U, body: { showtimeId: sid, seats: ['Z9'] } }), 400);
  expect('book: missing show', await call('POST', '/bookings', { token: U, body: { showtimeId: 999, seats: ['A1'] } }), 404);
  const b1 = await call('POST', '/bookings', { token: U, body: { showtimeId: sid, seats: ['A1', 'A2'] } });
  expect('book A1,A2', b1, 201, (j) => { assert.equal(j.data.status, 'pending'); assert.equal(j.data.totalPrice, 640); });
  const bid = b1.json.data.id;
  const other = (await call('POST', '/auth/login', { body: { email: 'karim@demo.com', password: 'secret1' } })).json.token;
  expect('book same seat (other user)', await call('POST', '/bookings', { token: other, body: { showtimeId: sid, seats: ['A2', 'A3'] } }), 409, (j) => assert.deepEqual(j.error.details.seats, ['A2']));
  expect('seat map shows booked', await call('GET', `/showtimes/${sid}/seats`), 200, (j) => assert.equal(j.data.seats.filter((s) => s.status === 'booked').length, 2));
  expect('get booking (owner)', await call('GET', `/bookings/${bid}`, { token: U }), 200);
  expect('get booking (other user)', await call('GET', `/bookings/${bid}`, { token: other }), 403);
  expect('get booking (admin)', await call('GET', `/bookings/${bid}`, { token: A }), 200);
  expect('list my bookings', await call('GET', '/bookings', { token: U }), 200, (j) => assert.equal(j.data.length, 1));
  expect('patch seats', await call('PATCH', `/bookings/${bid}`, { token: U, body: { seats: ['B1', 'B2', 'B3'] } }), 200, (j) => assert.equal(j.data.totalPrice, 960));
  expect('pay: bad method', await call('POST', `/bookings/${bid}/pay`, { token: U, body: { method: 'gold' } }), 400);
  expect('pay', await call('POST', `/bookings/${bid}/pay`, { token: U, body: { method: 'bkash' } }), 200, (j) => { assert.equal(j.data.status, 'paid'); assert.ok(j.data.paymentRef); });
  expect('pay again', await call('POST', `/bookings/${bid}/pay`, { token: U, body: { method: 'bkash' } }), 409);
  expect('patch seats after pay', await call('PATCH', `/bookings/${bid}`, { token: U, body: { seats: ['C1'] } }), 409);
  expect('delete showtime with bookings', await call('DELETE', `/showtimes/${sid}`, { token: A }), 409);
  expect('delete movie with bookings', await call('DELETE', `/movies/${mid}`, { token: A }), 409);
  const b2 = await call('POST', '/bookings', { token: other, body: { showtimeId: sid, seats: ['D4'] } });
  expect('cancel booking (other user, not owner)', await call('DELETE', `/bookings/${b2.json.data.id}`, { token: U }), 403);
  expect('cancel booking', await call('DELETE', `/bookings/${b2.json.data.id}`, { token: other }), 204);
  expect('cancel paid booking', await call('DELETE', `/bookings/${bid}`, { token: U }), 204);

  console.log('Cleanup (DELETE)');
  expect('delete showtime', await call('DELETE', `/showtimes/${sid}`, { token: A }), 204);
  expect('delete movie: user', await call('DELETE', `/movies/${mid}`, { token: U }), 403);
  expect('delete movie', await call('DELETE', `/movies/${mid}`, { token: A }), 204);
  expect('deleted movie is gone', await call('GET', `/movies/${mid}`), 404);
  expect('unknown route', await call('GET', '/nothing'), 404);

  console.log(`\n${passed} check পাশ ✓`);
} catch (err) {
  console.error('\n✗ FAIL:', err.message);
  process.exitCode = 1;
} finally {
  server.close();
}
