-- ============================================================
-- Session B  ·  Terminal 2  ·  psql -d bank
-- Setup আর Reset transaction-A.sql-এ। এখানে শুধু B-এর ধাপ।
-- [x.y] নম্বর ধরে A-এর সাথে পালা করে চালাও।
-- ============================================================

SELECT current_database();   -- bank হওয়া উচিত


-- ============ 1 · READ UNCOMMITTED ============
/* [1.3] */ BEGIN;
/* [1.4] */ UPDATE accounts SET balance = balance - 500 WHERE id = 1;   -- এখনো commit হয়নি
--          → A: [1.5]
/* [1.6] */ ROLLBACK;                                    -- পরিবর্তনটা কখনো ছিলই না
--          → A: [1.7]


-- ============ 2 · READ COMMITTED ============
-- psql-এ BEGIN ছাড়া প্রতিটা statement নিজেই একটা transaction (autocommit)
/* [2.4] */ UPDATE accounts SET balance = balance - 500 WHERE id = 1;   -- সাথে সাথে commit
/* [2.5] */ INSERT INTO accounts VALUES (3, 'Jamal', 800);              -- সাথে সাথে commit
--          → A: [2.6]


-- ============ 3 · REPEATABLE READ ============
/* [3.4] */ UPDATE accounts SET balance = balance - 500 WHERE id = 1;
/* [3.5] */ INSERT INTO accounts VALUES (3, 'Jamal', 800);
--          → A: [3.6]


-- ============ 4 · SERIALIZABLE ============
/* [4.2] */ BEGIN ISOLATION LEVEL SERIALIZABLE;
--          → A: [4.3]
/* [4.4] */ SELECT sum(balance) FROM accounts;           -- 1500 (A-র পরিবর্তন দেখা যায় না)
--          → A: [4.5]
/* [4.6] */ UPDATE accounts SET balance = balance - 500 WHERE id = 2;
--          → A: [4.7]
/* [4.8] */ COMMIT;
--          ERROR: could not serialize access due to read/write dependencies among transactions
--          HINT:  The transaction might succeed if retried.
