import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import movieRoutes from './routes/movies.js';
import showtimeRoutes from './routes/showtimes.js';
import bookingRoutes from './routes/bookings.js';
import { notFound, errorHandler } from './middleware/errors.js';

export const app = express();

// React (Vite) dev server আলাদা port-এ চলে, তাই CORS লাগে।
// Authorization header ব্যবহার করলে browser আগে একটা OPTIONS (preflight) পাঠায়,
// cors() সেটা নিজেই সামলায়, শুধু allowedHeaders-এ Authorization থাকতে হয়।
app.use(cors({
  origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Location'],
}));
app.use(express.json({ limit: '100kb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const t = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - t}ms)`));
    next();
  });
}

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);

app.use(notFound);
app.use(errorHandler);
