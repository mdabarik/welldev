// ছোট validation helper। Project বড় হলে zod / joi ব্যবহার করো।
export const isStr = (v, min = 1, max = 200) => typeof v === 'string' && v.trim().length >= min && v.trim().length <= max;
export const isInt = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;
export const isNum = (v, min, max) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
export const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const isFutureDate = (v) => typeof v === 'string' && !Number.isNaN(Date.parse(v)) && Date.parse(v) > Date.now();

const MOVIE_RULES = {
  title: (v) => isStr(v, 1, 120) || 'title দরকার (১-১২০ অক্ষর)',
  genre: (v) => isStr(v, 1, 40) || 'genre দরকার',
  durationMin: (v) => isInt(v, 1, 600) || 'durationMin ১ থেকে ৬০০-এর মধ্যে পূর্ণসংখ্যা হতে হবে',
  rating: (v) => isNum(v, 0, 10) || 'rating ০ থেকে ১০-এর মধ্যে হতে হবে',
  description: (v) => typeof v === 'string' && v.length <= 1000 || 'description সর্বোচ্চ ১০০০ অক্ষর',
  posterUrl: (v) => typeof v === 'string' && v.length <= 500 || 'posterUrl সর্বোচ্চ ৫০০ অক্ষর',
};
export const MOVIE_FIELDS = Object.keys(MOVIE_RULES);
const MOVIE_REQUIRED = ['title', 'genre', 'durationMin'];

// full = PUT/POST (required field সব লাগবে), partial = PATCH (যা এসেছে শুধু সেটাই যাচাই)
export function validateMovie(body, { full }) {
  const details = [];
  if (!body || typeof body !== 'object' || Array.isArray(body)) return [{ field: 'body', message: 'JSON object দিতে হবে' }];
  const given = Object.keys(body).filter((k) => MOVIE_FIELDS.includes(k));
  if (!full && given.length === 0) details.push({ field: 'body', message: `অন্তত একটা field দাও: ${MOVIE_FIELDS.join(', ')}` });
  if (full) for (const f of MOVIE_REQUIRED) if (body[f] === undefined) details.push({ field: f, message: `${f} দরকার` });
  for (const f of given) {
    const r = MOVIE_RULES[f](body[f]);
    if (r !== true) details.push({ field: f, message: r });
  }
  return details;
}

export const pickMovie = (body) => Object.fromEntries(MOVIE_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, typeof body[k] === 'string' ? body[k].trim() : body[k]]));
