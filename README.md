# welldev

Software engineering interview prep — বাংলায় ব্যাখ্যা, ছবি আর কোড সহ। প্রতিটি page একটা HTML file; download করে browser-এ খুললেই চলবে।

🌐 **Live site: [mdabarik.github.io/welldev](https://mdabarik.github.io/welldev/)** — কিছু download না করেই browser-এ সব গাইড দেখুন।

**সব গাইড এক জায়গায়: [index.html](index.html)** — রঙিন হোম পেজ, যেখান থেকে প্রতিটা গাইড নতুন tab-এ খোলে।

## 01 · DSA & Problem Solving

_শীঘ্রই আসছে।_

## 02 · OOP (Java)

- [OOP in C#](02-oop-java/oop/index.html) — ৪টি পিলার, sealed / private constructor, upcasting-downcasting, diamond problem, coupling ও cohesion
- [UML Class Diagram](02-oop-java/oop/ood/index.html) — ১৪টি UML ডায়াগ্রাম, ক্লাস বক্স, multiplicity আর ৬টি relationship, আসল UML চিহ্নে আঁকা
- [DRY, KISS, YAGNI ও SoC](02-oop-java/design-principle/kiss-dry-yagni-soc/index.html) — ৪টি বেসিক design principle, Bad বনাম Good কোড সহ
- [SOLID Principles](02-oop-java/design-principle/solid/index.html) — SRP, OCP, LSP, ISP, DIP — Violation বনাম Solution কোড আর এক নজরে cheat sheet
- [Design Patterns](02-oop-java/design-pattern/index.html) — Creational, Structural, Behavioural pattern, বাংলা ব্যাখ্যা ও C# কোড সহ

## 03 · DBMS & SQL

- [LeetCode SQL 50 — Visual Guide](03-dbms-sql/top-50-sql/index.html) — ৫০টি problem, PostgreSQL solution আর প্রতিটি ধাপের intermediate table
- [ACID Properties](03-dbms-sql/acid/index.html) — bank transfer দিয়ে A, C, I, D; PostgreSQL output, crash test আর C# কোড
- [Transaction Isolation Levels](03-dbms-sql/transactions/index.html) — ৪টি level, D3 playground-এ A/B session চালিয়ে দেখা, দুইটা psql session পাশাপাশি ([transaction-A.sql](03-dbms-sql/transaction-A.sql) · [transaction-B.sql](03-dbms-sql/transaction-B.sql))
- [Optimistic vs Pessimistic Locking](03-dbms-sql/optimistic-pessimistic/index.html) — lost update, FOR UPDATE / NOWAIT / SKIP LOCKED আর version column, A/B animation সহ
- [N+1, Race Condition ও Deadlock](03-dbms-sql/dbms-theory/index.html) — N+1 query ও সমাধান, race condition, DB deadlock; আসল PostgreSQL output আর D3 animation
- [Idempotency](03-dbms-sql/dbms/index.html) — retry-তে duplicate charge ঠেকানো: idempotency key, ON CONFLICT, UNIQUE, conditional update, D3 simulation
- [DBMS Keys](03-dbms-sql/dbms/keys/index.html) — super, candidate, primary, alternate, composite, unique, foreign, surrogate key; interactive key checker
- [Normalization](03-dbms-sql/dbms/normalization/index.html) — 1NF, 2NF, 3NF, BCNF: definition, সমস্যা ও সমাধান আসল table-এ, step-through demo আর quiz
- [Indexing](03-dbms-sql/dbms/indexing/index.html) — index কোথায় থাকে, B-tree / B+ tree animation, unique, hash, partial, GIN index, EXPLAIN

## 04 · Resume Projects

- [XSS, CSRF, JWT, Access ও Refresh Token](04-resume-projects/01-xss-csrf-jwt-refresh-token-access-token/index.html)
- [Encoding, Encryption ও Hashing](04-resume-projects/02-encoding-encryption-hashing/index.html)
- [CORS](04-resume-projects/03-cors/index.html) — Same-Origin Policy, preflight, error ও fix, simulator; CORS বনাম CSRF / XSS / SQL injection

## 05 · Operating System

- [OS, Kernel, Process ও Thread](05-operating-system/01-os-kernel-process-thread.html) — boot থেকে context switch পর্যন্ত, ২৫টি diagram
- [Process & Thread Internals](05-operating-system/thread-process/index.html) — process/thread কে বানায়, user/kernel space, page table, MMU/TLB, cache, register, core, IMC, stack, PCB/TCB, context switch, driver, NIC
- [CPU Scheduling](05-operating-system/os-scheduling-algo/index.html) — FCFS, SJF/SRTF, Priority, Round Robin; convoy effect, starvation, time quantum, Gantt chart simulator
- [Thread Scheduling · Multi-core CPU](05-operating-system/thread/index.html) — process-এর thread কীভাবে ready queue, scheduler আর context switch পেরিয়ে multi-core CPU-তে চলে, 3D simulation
- [Deadlock](05-operating-system/deadlock/index.html) — DB আর thread-এর উদাহরণ, ৪টি necessary condition, Banker's algorithm simulator, multiprogramming বনাম multitasking
- [Mutex](05-operating-system/mutex/index.html) — race condition, mutex / spinlock / atomic ভেতরে কীভাবে কাজ করে, futex, D3 animation, আসল C ও Java run

## 06 · Networking

- [Seq, Checksum ও CRC — OSI Interactive](06-networking/OSI/index.html) — একটা মেসেজের যাত্রা, seq / checksum / CRC-32 কে কোন ভুল ধরে, D3 অ্যানিমেশনে
- [একটা Request-এর যাত্রা — Web Server Interactive](06-networking/web-server/index.html) — DNS → TCP → TLS → Nginx → app → Redis → database → response, আর Nginx বনাম Apache
- [URL থেকে Pixel — Browser Rendering Interactive](06-networking/browser/index.html) ([live](https://mdabarik.github.io/welldev/06-networking/browser/)) — DOM, CSSOM, layout, paint, আর `<link>`, `<script>`, async, defer, module কখন চলে, timeline অ্যানিমেশনে
