import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";

const SEED_FILE = path.resolve(__dirname, "../../../../db/seed/seed.sql");

async function run(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const sql = await readFile(SEED_FILE, "utf-8");
    await pool.query(sql);
    console.log("Seed data applied.");
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
