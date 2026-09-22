import { query } from "../src/config/db.js";

async function main() {
  const r = await query("SELECT id, name, slug, status, created_at FROM companies ORDER BY created_at ASC");
  console.log("COMPANIES IN DB:", JSON.stringify(r.rows, null, 2));
  
  const u = await query("SELECT id, name, email, role, company_id FROM users WHERE role IN ('superadmin', 'system admin', 'admin') OR email LIKE '%superadmin%'");
  console.log("SUPERADMIN / ADMIN USERS:", JSON.stringify(u.rows, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
