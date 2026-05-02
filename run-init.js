require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({ connectionString: process.env.DIRECT_URL });
const sql = fs.readFileSync("init.sql", "utf-8");
const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0);

async function run() {
  for (const stmt of statements) {
    console.log("Running:", stmt.substring(0, 50) + "...");
    await pool.query(stmt);
  }
  console.log("Successfully created tables.");
  pool.end();
}

run().catch(err => {
  console.error("Error executing SQL:", err.message);
  pool.end();
});
