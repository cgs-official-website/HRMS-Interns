import pg from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

const { Pool } = pg;

const DEFAULT_DB_URL = "postgresql://postgres:wbmoHIZoKMKVvFhmAHgDYLUdVhZCcTzq@kodama.proxy.rlwy.net:52896/railway";
const activeDbUrl = process.env.DATABASE_URL || DEFAULT_DB_URL;

const pool = new Pool({
  connectionString: activeDbUrl,
  ssl: { rejectUnauthorized: false }
});

pool.on("connect", () => {
  console.log("🐘 PostgreSQL client connected successfully.");
});

pool.on("error", (err) => {
  console.error("❌ Unexpected error on idle PostgreSQL client:", err);
});

export const query = (text, params) => pool.query(text, params);
export default pool;
