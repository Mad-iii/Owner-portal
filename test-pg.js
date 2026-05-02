require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("SELECT NOW()", (err, res) => {
  if (err) console.error("Error:", err.message);
  else console.log("Success:", res.rows);
  pool.end();
});
