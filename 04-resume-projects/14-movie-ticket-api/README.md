# 🎬 CineBook: Movie Ticket Booking API (Node.js + React)

একটা পুরো REST API project: **Node.js + Express** server, **JWT Bearer token** দিয়ে auth, আর **React (Vite)** client।
সব HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`), response body আর status code আছে।

```
14-movie-ticket-api/
├── server/   Node.js + Express API  (port 4000)
│   ├── src/app.js · index.js · data.js · validate.js
│   ├── src/middleware/  auth.js (JWT) · errors.js
│   ├── src/routes/      auth.js · movies.js · showtimes.js · bookings.js
│   └── test/smoke.js    ৫৩টা check, সব endpoint ঘুরে দেখে
└── client/   React (Vite)  (port 5173)
    └── src/ api.js (header + token) · ApiConsole.jsx · pages/
```

## 🌐 Live demo

সাইটে চালিয়ে দেখো: `04-resume-projects/14-movie-ticket-api/index.html` (GitHub Pages)। সেখানে Node server চলে না, তাই browser-এর ভেতরে নকল server (`client/src/mockServer.js`) চলে। `server/` আর mock দুটোই একই ৫৩টা test পাশ করে (`npm test`, `npm run test:mock`)। Demo আবার build করতে: `cd client && npm run build:demo` (output: `demo/`)।

## চালানোর নিয়ম

```bash
# Terminal 1: API
cd server
npm install
npm start          # http://localhost:4000/api

# Terminal 2: React
cd client
npm install
npm run dev        # http://localhost:5173
```

Demo login: **user@demo.com / user123** (সাধারণ user) · **admin@demo.com / admin123** (admin)
Server test: `cd server && npm test`

> Data memory-তে থাকে, server restart দিলে seed অবস্থায় ফিরে যায়। আসল project-এ `data.js`-এর জায়গায় database বসবে।

---

## 1. Auth: Bearer token কীভাবে চলে

```
১) POST /api/auth/login   { email, password }   ->  { token, user }
২) প্রতিটা পরের request-এ header:   Authorization: Bearer <token>
৩) Server token যাচাই করে (মেয়াদ ১ ঘণ্টা)
      ঠিক নেই / নেই  -> 401 Unauthorized
      ঠিক, কিন্তু অনুমতি নেই -> 403 Forbidden
```

| Status | মানে | কখন |
|---|---|---|
| **401** | তুমি কে জানি না | token নেই, ভুল, বা মেয়াদ শেষ |
| **403** | জানি, কিন্তু অনুমতি নেই | user হয়ে admin-এর কাজ, অন্যের booking দেখা |

## 2. সব Endpoint

Base URL: `http://localhost:4000/api` · 🔓 = login ছাড়াই · 🔑 = Bearer token লাগবে · 👑 = শুধু admin

### Auth

| Method | Endpoint | Auth | কাজ | সফল হলে |
|---|---|---|---|---|
| POST | `/auth/register` | 🔓 | নতুন account | **201** `{ user, token }` |
| POST | `/auth/login` | 🔓 | login | **200** `{ user, token }` |
| GET | `/auth/me` | 🔑 | নিজের তথ্য | **200** `{ user }` |
| PATCH | `/auth/me` | 🔑 | নিজের name / password বদল | **200** `{ user }` |

### Movies

| Method | Endpoint | Auth | কাজ | সফল হলে |
|---|---|---|---|---|
| GET | `/movies?search=&genre=&page=&limit=` | 🔓 | তালিকা (filter + pagination) | **200** `{ data[], meta }` |
| GET | `/movies/:id` | 🔓 | একটা movie | **200** · না পেলে **404** |
| GET | `/movies/:id/showtimes` | 🔓 | সেই movie-র show, `seatsLeft` সহ | **200** |
| POST | `/movies` | 👑 | নতুন movie | **201** + `Location` header |
| PUT | `/movies/:id` | 👑 | **পুরো** movie বদলানো (সব required field লাগে) | **200** |
| PATCH | `/movies/:id` | 👑 | **আংশিক** বদল (যেমন শুধু `rating`) | **200** |
| DELETE | `/movies/:id` | 👑 | মোছা | **204** (body নেই) · booking থাকলে **409** |

### Showtimes

| Method | Endpoint | Auth | কাজ | সফল হলে |
|---|---|---|---|---|
| GET | `/showtimes?movieId=1` | 🔓 | show-র তালিকা | **200** |
| GET | `/showtimes/:id/seats` | 🔓 | seat map (`available` / `booked`) | **200** |
| POST | `/showtimes` | 👑 | নতুন show | **201** |
| PATCH | `/showtimes/:id` | 👑 | hall / startsAt / price বদল | **200** |
| DELETE | `/showtimes/:id` | 👑 | মোছা | **204** · booking থাকলে **409** |

### Bookings (সবগুলোতে 🔑)

| Method | Endpoint | কাজ | সফল হলে |
|---|---|---|---|
| GET | `/bookings?status=paid` | নিজের booking (admin হলে সবার) | **200** |
| GET | `/bookings/:id` | একটা booking | **200** · অন্যের হলে **403** |
| POST | `/bookings` | seat booking `{ showtimeId, seats }` | **201** · seat আগেই নেওয়া হলে **409** |
| PATCH | `/bookings/:id` | payment-এর আগে seat বদল `{ seats }` | **200** |
| POST | `/bookings/:id/pay` | payment (mock) `{ method: "bkash" }` | **200** · আগেই paid হলে **409** |
| DELETE | `/bookings/:id` | cancel | **204** |

**Booking-এর নিয়ম:** `pending` অবস্থায় seat **১০ মিনিট** আটকে থাকে। এর মধ্যে `pay` না করলে seat ছেড়ে দেওয়া হয় (status `expired`, পরে `pay` করলে **410 Gone**)।

### Utility
`GET /health` → **200** `{ status: "ok" }`

## 3. Status code একনজরে

| Code | কোথায় | মানে |
|---|---|---|
| 200 OK | GET, PUT, PATCH, pay | সফল |
| 201 Created | POST (তৈরি) | নতুন কিছু তৈরি, `Location` header-এ তার URL |
| 204 No Content | DELETE | মোছা হয়েছে, ফেরত দেওয়ার কিছু নেই |
| 400 Bad Request | সব write | input ভুল (`details`-এ কোন field) |
| 401 Unauthorized | 🔑 endpoint | token নেই / ভুল / মেয়াদ শেষ |
| 403 Forbidden | 👑 endpoint, অন্যের booking | অনুমতি নেই |
| 404 Not Found | `/:id` | জিনিসটা নেই |
| 409 Conflict | seat, duplicate, মোছা | অবস্থার সাথে সংঘর্ষ (seat নেওয়া, email আছে, booking আছে) |
| 410 Gone | pay / patch | booking-এর মেয়াদ শেষ |
| 500 | যেকোনো | server-এর ভুল |

**Error-এর আকার** (সবসময় একই, তাই client সহজে সামলায়):

```json
{ "error": { "code": "SEAT_TAKEN", "message": "এই seat আগেই booked: A2", "details": { "seats": ["A2"] } } }
```

## 4. `curl` দিয়ে পুরো গল্প

```bash
API=http://localhost:4000/api

# ১) Login করে token নাও
TOKEN=$(curl -s -X POST $API/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"user@demo.com","password":"user123"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# ২) Movie দেখো (token লাগে না)
curl -s "$API/movies?search=inc"

# ৩) Seat map
curl -s $API/showtimes/1/seats

# ৪) Booking: Authorization header সহ
curl -i -X POST $API/bookings \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"showtimeId":1,"seats":["A1","A2"]}'
#  -> HTTP/1.1 201 Created   Location: /api/bookings/1

# ৫) Seat বদলাও (PATCH), তারপর pay
curl -s -X PATCH $API/bookings/1 -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"seats":["B1","B2"]}'
curl -s -X POST  $API/bookings/1/pay -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"method":"bkash"}'

# ৬) Token ছাড়া -> 401, user দিয়ে admin কাজ -> 403
curl -i -X DELETE $API/movies/1
curl -i -X DELETE $API/movies/1 -H "Authorization: Bearer $TOKEN"
```

## 5. React থেকে call: কোথায় কী

সব কিছু [`client/src/api.js`](client/src/api.js)-এ। মূল অংশ:

```js
const headers = { Accept: 'application/json' };
if (body !== undefined) headers['Content-Type'] = 'application/json';
const token = localStorage.getItem('cinebook_token');
if (token) headers.Authorization = `Bearer ${token}`;      // <- Bearer token

const res = await fetch(BASE + path, { method, headers, body: JSON.stringify(body) });
const data = res.status === 204 ? null : await res.json(); // 204-এ body থাকে না
if (!res.ok) throw new ApiError(res.status, data);          // 401 হলে auto logout
```

ব্যবহার:

```js
await api.post('/auth/login', { email, password });          // POST
await api.get('/movies?search=inc');                         // GET
await api.post('/bookings', { showtimeId: 1, seats: ['A1'] });
await api.put(`/movies/${id}`, fullMovie);                   // PUT   (পুরোটা)
await api.patch(`/movies/${id}`, { rating: 9.1 });           // PATCH (আংশিক)
await api.delete(`/bookings/${id}`);                         // DELETE -> 204
```

UI-র নিচে **API console** আছে: প্রতিটা request-এর header (token সহ), body আর status code সেখানে দেখা যায়, শেখার জন্য।

## 6. CORS কেন লাগে

React (`localhost:5173`) আর API (`localhost:4000`) আলাদা origin। `Authorization` header পাঠালে browser আগে একটা `OPTIONS` (preflight) পাঠায়। Server `cors()` দিয়ে `Authorization` header আর `PUT/PATCH/DELETE` method অনুমতি দেয় ([`server/src/app.js`](server/src/app.js)), নইলে browser request আটকে দেয়।

## 7. Production-এ আর যা লাগবে

- `JWT_SECRET` env variable (এখনকার default শুধু dev-এর জন্য)
- Database (PostgreSQL / MongoDB), আর seat booking-এ transaction বা unique constraint (দুজন একসাথে একই seat না নিতে পারে)
- Refresh token, login-এ rate limit (`express-rate-limit`), `helmet`, HTTPS
- Input validation library (`zod` / `joi`), আসল payment gateway
