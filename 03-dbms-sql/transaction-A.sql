-- ============================================================
-- Session A  ·  Terminal 1  ·  psql -d bank
-- পাশে আরেকটা terminal-এ transaction-B.sql খোলো।
-- পুরো file একবারে চালাবে না — [x.y] নম্বর ধরে A আর B-তে পালা করে
-- একেকটা লাইন চালাও। গাইড: transactions/index.html
-- ============================================================

SELECT current_database();   -- bank হওয়া উচিত


-- ---------- Setup (একবার) ----------
DROP TABLE IF EXISTS accounts;
CREATE TABLE accounts (
  id      int  PRIMARY KEY,
  name    text NOT NULL,
  balance int  NOT NULL CHECK (balance >= 0)
);

-- ---------- Reset (প্রতিটা level-এর আগে) ----------
TRUNCATE accounts;
INSERT INTO accounts VALUES (1, 'Rahim', 1000), (2, 'Karim', 500);


-- ============ 1 · READ UNCOMMITTED — dirty read হয়? ============
/* [1.1] */ BEGIN ISOLATION LEVEL READ UNCOMMITTED;
/* [1.2] */ SELECT balance FROM accounts WHERE id = 1;   -- 1000
--          → B: [1.3] [1.4]
/* [1.5] */ SELECT balance FROM accounts WHERE id = 1;   -- 1000 (PostgreSQL-এ dirty read নেই)
--          → B: [1.6]
/* [1.7] */ COMMIT;


-- ============ 2 · READ COMMITTED — non-repeatable + phantom ============
-- (আগে Reset চালাও)
/* [2.1] */ BEGIN ISOLATION LEVEL READ COMMITTED;        -- PostgreSQL-এর default
/* [2.2] */ SELECT balance FROM accounts WHERE id = 1;   -- 1000
/* [2.3] */ SELECT count(*) FROM accounts WHERE balance >= 500;   -- 2
--          → B: [2.4] [2.5]
/* [2.6] */ SELECT balance FROM accounts WHERE id = 1;   -- 500  ✗ non-repeatable read
/* [2.7] */ SELECT count(*) FROM accounts WHERE balance >= 500;   -- 3  ✗ phantom read
/* [2.8] */ COMMIT;


-- ============ 3 · REPEATABLE READ — একই snapshot ============
-- (আগে Reset চালাও)
/* [3.1] */ BEGIN ISOLATION LEVEL REPEATABLE READ;
/* [3.2] */ SELECT balance FROM accounts WHERE id = 1;   -- 1000
/* [3.3] */ SELECT count(*) FROM accounts WHERE balance >= 500;   -- 2
--          → B: [3.4] [3.5]
/* [3.6] */ SELECT balance FROM accounts WHERE id = 1;   -- 1000  ✓
/* [3.7] */ SELECT count(*) FROM accounts WHERE balance >= 500;   -- 2  ✓
/* [3.8] */ UPDATE accounts SET balance = balance - 100 WHERE id = 1;
--          ERROR: could not serialize access due to concurrent update
/* [3.9] */ ROLLBACK;


-- ============ 4 · SERIALIZABLE — write skew ধরা ============
-- নিয়ম: Rahim + Karim মিলিয়ে কমপক্ষে 1000 থাকতে হবে। (আগে Reset চালাও)
/* [4.1] */ BEGIN ISOLATION LEVEL SERIALIZABLE;
--          → B: [4.2]
/* [4.3] */ SELECT sum(balance) FROM accounts;           -- 1500 → 500 তুললেও 1000 থাকে
--          → B: [4.4]
/* [4.5] */ UPDATE accounts SET balance = balance - 500 WHERE id = 1;
--          → B: [4.6]
/* [4.7] */ COMMIT;                                      -- ✓ সফল
--          → B: [4.8]
SELECT * FROM accounts ORDER BY id;                      -- sum = 1000, নিয়ম টিকে আছে
