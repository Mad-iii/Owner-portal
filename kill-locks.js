require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function clearLocks() {
  try {
    const res = await pool.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE pid <> pg_backend_pid()
        AND state in ('idle in transaction', 'active')
    `);
    console.log("Terminated backends:", res.rowCount);
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    pool.end();
  }
}

clearLocks();
