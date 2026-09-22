import bcrypt from "bcryptjs";
import { query } from "../src/config/db.js";

async function setAllCarrezzaPasswords() {
  const rawPassword = "12345678";
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(rawPassword, salt);

  console.log(`Hashing password '${rawPassword}'...`);

  // 1. Identify all users belonging to Carrezza Global Solutions or with teamcarrezza email
  const userListRes = await query(`
    SELECT id, name, email, role, company_id 
    FROM users 
    WHERE company_id = 'carrezza-global-solutions' 
       OR email ILIKE '%@teamcarrezza.com'
    ORDER BY name ASC
  `);

  console.log(`Found ${userListRes.rows.length} Carrezza Global Solutions users.`);

  // 2. Update password_hash to 12345678 for all of them
  const updateRes = await query(`
    UPDATE users 
    SET password_hash = $1, 
        updated_at = CURRENT_TIMESTAMP 
    WHERE company_id = 'carrezza-global-solutions' 
       OR email ILIKE '%@teamcarrezza.com'
       OR password_hash IS NULL
    RETURNING id, name, email, role
  `, [passwordHash]);

  console.log(`\n Successfully updated password to '${rawPassword}' for ${updateRes.rows.length} users:`);
  for (const u of updateRes.rows) {
    const isMatch = await bcrypt.compare(rawPassword, passwordHash);
    console.log(`- ${u.name} (${u.email}) [Role: ${u.role}] -> Password verified: ${isMatch}`);
  }

  process.exit(0);
}

setAllCarrezzaPasswords().catch(err => {
  console.error("Error setting Carrezza passwords:", err);
  process.exit(1);
});
