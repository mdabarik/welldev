// সব API call এই এক জায়গা দিয়ে যায়: header বসানো, token পাঠানো, error ধরা সবই এখানে।
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'cinebook_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

// UI-র নিচের "API console" এই log শোনে, তাই প্রতিটা request/response চোখে দেখা যায়
const listeners = new Set();
export const onApiLog = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || `HTTP ${status}`);
    this.status = status;
    this.code = body?.error?.code;
    this.details = body?.error?.details;
  }
}

async function request(method, path, body) {
  // ১) Header বানাই
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`; // ২) Bearer token

  const started = performance.now();
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  // ৩) 204 No Content-এ body থাকে না, তাই json() ডাকলে error হত
  const data = res.status === 204 ? null : await res.json().catch(() => null);

  listeners.forEach((fn) => fn({
    method, url: BASE + path, status: res.status, ms: Math.round(performance.now() - started),
    requestHeaders: { ...headers, ...(token ? { Authorization: `Bearer ${token.slice(0, 14)}…` } : {}) },
    requestBody: body, responseBody: data,
  }));

  if (!res.ok) {
    // ৪) token মেয়াদ-উত্তীর্ণ / ভুল হলে সবাইকে logout করিয়ে দিই
    if (res.status === 401 && token) { setToken(null); window.dispatchEvent(new Event('auth:expired')); }
    throw new ApiError(res.status, data);
  }
  return data;
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  delete: (p) => request('DELETE', p),
};
