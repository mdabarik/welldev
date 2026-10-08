# welldev

Software engineering interview prep — বাংলায় ব্যাখ্যা, ছবি আর কোড সহ। প্রতিটি page একটা HTML file; download করে browser-এ খুললেই চলবে।

🌐 **Live site: [mdabarik.github.io/welldev](https://mdabarik.github.io/welldev/)** — কিছু download না করেই browser-এ সব গাইড দেখুন।

**সব গাইড এক জায়গায়: [index.html](index.html)** — রঙিন হোম পেজ, যেখান থেকে প্রতিটা গাইড নতুন tab-এ খোলে।

## 01 · DSA & Problem Solving

- [C++ STL Cheat Sheet](01-dsa-problem-solving/cpp-stl/index.html) - stack, queue, deque, string, vector sort ও custom comparator, priority_queue (min/max heap) এর common method
- [Blind 75](01-dsa-problem-solving/blind-75/index.html) - ৭৫টি problem, ১০টি category, প্রতিটার সংক্ষিপ্ত statement ও example
- [Top Interview 150](01-dsa-problem-solving/top-150/index.html) - LeetCode-এর ১৫০টি problem, ২৩টি category অনুযায়ী
- [Common Graph Algorithms](01-dsa-problem-solving/graph-algorithms/index.html) - BFS, DFS, Dijkstra, Bellman-Ford, Kruskal, Prim, Floyd-Warshall, Kosaraju, bipartite, cycle detection

## 02 · OOP (Java)

- [OOP in C#](02-oop-java/oop/index.html) — ৪টি পিলার, sealed / private constructor, upcasting-downcasting, diamond problem, coupling ও cohesion
- [UML Class Diagram](02-oop-java/oop/ood/index.html) — ১৪টি UML ডায়াগ্রাম, ক্লাস বক্স, multiplicity আর ৬টি relationship, আসল UML চিহ্নে আঁকা
- [DRY, KISS, YAGNI ও SoC](02-oop-java/design-principle/kiss-dry-yagni-soc/index.html) — ৪টি বেসিক design principle, Bad বনাম Good কোড সহ
- [SOLID Principles](02-oop-java/design-principle/solid/index.html) — SRP, OCP, LSP, ISP, DIP — Violation বনাম Solution কোড আর এক নজরে cheat sheet
- [Design Patterns](02-oop-java/design-pattern/index.html) — Creational, Structural, Behavioural + Repository, Unit of Work pattern, বাংলা ব্যাখ্যা ও C# কোড সহ

## 03 · DBMS & SQL

- [LeetCode SQL 50 — Visual Guide](03-dbms-sql/top-50-sql/index.html) — ৫০টি problem, PostgreSQL solution আর প্রতিটি ধাপের intermediate table
- [DBMS Basics](03-dbms-sql/dbms-basics/index.html) - join-এর সব ধরন, clustered বনাম non-clustered index, SQL বনাম NoSQL (Cassandra), data model বনাম ER, trigger ও cascading, view; ধাপে ধাপে D3 animation
- [ACID Properties](03-dbms-sql/acid/index.html) — bank transfer দিয়ে A, C, I, D; PostgreSQL output, crash test আর C# কোড
- [Transaction Isolation Levels](03-dbms-sql/transactions/index.html) — ৪টি level, D3 playground-এ A/B session চালিয়ে দেখা, দুইটা psql session পাশাপাশি ([transaction-A.sql](03-dbms-sql/transaction-A.sql) · [transaction-B.sql](03-dbms-sql/transaction-B.sql))
- [Optimistic vs Pessimistic Locking](03-dbms-sql/optimistic-pessimistic/index.html) — lost update, FOR UPDATE / NOWAIT / SKIP LOCKED আর version column, A/B animation সহ
- [N+1, Race Condition ও Deadlock](03-dbms-sql/dbms-theory/index.html) - তিনটা পরিচিত DB সমস্যা: সমস্যা ও সমাধান, ধাপে ধাপে D3 animation
- [Idempotency](03-dbms-sql/dbms/index.html) - retry-তে duplicate charge ঠেকানো: idempotency key, UNIQUE, conditional update; ধাপে ধাপে D3 animation
- [DBMS Keys](03-dbms-sql/dbms/keys/index.html) — super, candidate, primary, alternate, composite, unique, foreign, surrogate key; interactive key checker
- [Normalization](03-dbms-sql/dbms/normalization/index.html) — 1NF, 2NF, 3NF, BCNF: definition, সমস্যা ও সমাধান আসল table-এ, step-through demo আর quiz
- [Indexing](03-dbms-sql/dbms/indexing/index.html) — index কোথায় থাকে, B-tree / B+ tree animation, unique, hash, partial, GIN index, EXPLAIN

## 04 · Resume Projects + Security + System Design

- [XSS, CSRF, JWT, Access ও Refresh Token](04-resume-projects/01-xss-csrf-jwt-refresh-token-access-token/index.html) — সাথে OWASP Top 10 (2025), Clickjacking, SSRF, IDOR, session/cookie, rate limiting, file upload, path traversal, command injection, open redirect, mass assignment, security header, SSO (OAuth/OIDC/SAML), CORS (simulator সহ)
- [Encoding, Encryption ও Hashing](04-resume-projects/02-encoding-encryption-hashing/index.html)
- [Event Loop — Browser ও Node.js Interactive](04-resume-projects/03-event-loop/index.html) — call stack, microtask, task queue, Node-এর phase, D3 animation-এ
- ★ **Core** · [System Design Basics](04-resume-projects/04-system-design/index.html) - ১৪টি প্রশ্ন (Client-Server, Functional vs Non-functional, Latency, Bandwidth, Throughput, Scalability, Vertical/Horizontal, Reliability, Availability, SPOF, Maintainability, Partition Tolerance, CAP, CDN): প্রতিটির সংক্ষিপ্ত উত্তর ও step-by-step D3 animation
- ★ **Core** · [SDLC ও SDLC Model](04-resume-projects/05-sdlc/index.html) - SDLC কী, ৭টি ধাপ, Waterfall / Agile / Iterative / Incremental: সংক্ষিপ্ত উত্তর, তুলনার table ও step-by-step D3 animation
- [Synchronous বনাম Asynchronous](04-resume-projects/06-sync-async/index.html) - দুটো কীভাবে কাজ করে: thread timeline, blocking / non-blocking, callback / Promise / async-await, Event Loop; ধাপে ধাপে D3 animation
- [React Hooks: State ও useEffect](04-resume-projects/07-reactjs/index.html) - render চক্র, useState, Hooks-এর নিয়ম, useEffect (deps, cleanup, infinite loop); ধাপে ধাপে D3 animation
- [.NET Web API & MVC](04-resume-projects/08-dotnet/index.html) - MVC, MVP, MVVM, Web API বনাম MVC, LINQ, IEnumerable বনাম IQueryable; ধাপে ধাপে D3 animation

## 05 · Operating System

- ★ **Core** · [OS Basics - Interview](05-operating-system/basics/index.html) - OS-এর মূল গাইড: ৪১টি প্রশ্ন, প্রতিটির সংক্ষিপ্ত উত্তর ও step-by-step D3 animation
- ◌ Optional · [OS, Kernel, Process ও Thread](05-operating-system/01-os-kernel-process-thread.html) — boot থেকে context switch পর্যন্ত, ২৫টি diagram
- ◌ Optional · [Process & Thread Internals](05-operating-system/thread-process/index.html) — process/thread কে বানায়, user/kernel space, page table, MMU/TLB, cache, register, core, IMC, stack, PCB/TCB, context switch, driver, NIC
- ◌ Optional · [Thread Scheduling · Multi-core CPU](05-operating-system/thread/index.html) — process-এর thread কীভাবে ready queue, scheduler আর context switch পেরিয়ে multi-core CPU-তে চলে, 3D simulation
- ◌ Optional · [Deadlock](05-operating-system/deadlock/index.html) — DB আর thread-এর উদাহরণ, ৪টি necessary condition, Banker's algorithm simulator, multiprogramming বনাম multitasking

## 06 · Networking

- [Network Basics](06-networking/network-basics/index.html) - ১৮টি interview প্রশ্ন, শেখার ক্রমে সাজানো, উত্তর ও ধাপে ধাপে D3 animation সহ
- [Seq, Checksum ও CRC — OSI Interactive](06-networking/OSI/index.html) — একটা মেসেজের যাত্রা, seq / checksum / CRC-32 কে কোন ভুল ধরে, D3 অ্যানিমেশনে
- [একটা Request-এর যাত্রা — Web Server Interactive](06-networking/web-server/index.html) — DNS → TCP → TLS → Nginx → app → Redis → database → response, আর Nginx বনাম Apache
- [URL থেকে Pixel — Browser Rendering Interactive](06-networking/browser/index.html) ([live](https://mdabarik.github.io/welldev/06-networking/browser/)) — DOM, CSSOM, layout, paint, আর `<link>`, `<script>`, async, defer, module কখন চলে, timeline অ্যানিমেশনে
