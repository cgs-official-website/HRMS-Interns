import pg from "pg";

const url = "postgresql://postgres:wbmoHIZoKMKVvFhmAHgDYLUdVhZCcTzq@kodama.proxy.rlwy.net:52896/railway";
console.log("Connecting to Railway PostgreSQL at kodama.proxy.rlwy.net:52896...");

const client = new pg.Client({
  connectionString: url,
  ssl: { rejectUnauthorized: false }
});

client.connect(async (err) => {
  if (err) {
    console.error("❌ Connection Failed:", err.message);
    process.exit(1);
  } else {
    console.log("✅ Successfully connected to Railway PostgreSQL!");
    const res = await client.query("SELECT NOW() as current_time, version() as pg_version;");
    console.log("Database Time:", res.rows[0].current_time);
    console.log("Postgres Version:", res.rows[0].pg_version);
    await client.end();
    process.exit(0);
  }
});
