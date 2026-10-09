import { useEffect, useState } from 'react';
import { onApiLog } from './api.js';

// শেখার জন্য: প্রতিটা API call-এর header, body আর status code এখানে দেখা যায়
export default function ApiConsole() {
  const [logs, setLogs] = useState([]);
  const [open, setOpen] = useState(true);

  useEffect(() => onApiLog((entry) => setLogs((l) => [entry, ...l].slice(0, 8))), []);

  return (
    <section className="console">
      <button className="link" onClick={() => setOpen(!open)}>{open ? '▼' : '▶'} API console (শেষ {logs.length}টা request)</button>
      {open && logs.map((l, i) => (
        <details key={i} open={i === 0}>
          <summary>
            <b>{l.method}</b> {l.url.replace(/^https?:\/\/[^/]+/, '')}
            <span className={`code c${String(l.status)[0]}`}>{l.status}</span> <small>{l.ms}ms</small>
          </summary>
          <pre>{'Request headers\n' + JSON.stringify(l.requestHeaders, null, 2)}</pre>
          {l.requestBody !== undefined && <pre>{'Request body\n' + JSON.stringify(l.requestBody, null, 2)}</pre>}
          <pre>{'Response body\n' + (l.responseBody ? JSON.stringify(l.responseBody, null, 2) : '(খালি: 204 No Content)')}</pre>
        </details>
      ))}
    </section>
  );
}
