import { query } from "../src/config/db.js";

async function main() {
  const existing = await query("SELECT * FROM users WHERE email = $1", ["mohamedasfaque123@gmail.com"]);
  if (existing.rows.length === 0) {
    const template = await query("SELECT * FROM users WHERE email = $1", ["mohamedasfaquea@gmail.com"]);
    const passwordHash = template.rows[0]?.password_hash || "$2a$10$3Ym2aX4e8d...";
    await query(
      `INSERT INTO users (id, company_id, email, password_hash, name, employee_id, role, department, designation, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email`,
      [
        "usr_asfaque123",
        "carrezza-global-solutions",
        "mohamedasfaque123@gmail.com",
        passwordHash,
        "Mohamed Asfaque",
        "EMP_ASFAQUE",
        "admin",
        "Management",
        "Lead Developer",
        "active"
      ]
    );
    console.log("Created user mohamedasfaque123@gmail.com in database.");
  } else {
    console.log("User mohamedasfaque123@gmail.com already exists.");
  }
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
