import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import pg from "pg";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount)
  });
}

const db = getFirestore();

async function extractAndSeedRolesAndEnv() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("🔍 EXTRACTING / POPULATING ROLES & ENVIRONMENT SETTINGS");
  console.log("==================================================");

  // 1. Fetch all companies from Firestore
  const companiesSnap = await db.collection("companies").get();
  console.log(`Found ${companiesSnap.size} companies in Firestore.`);

  let rolesFound = 0;
  let envSettingsFound = 0;

  for (const compDoc of companiesSnap.docs) {
    const compId = compDoc.id;

    // Check subcollection 'roles'
    const rolesSnap = await compDoc.ref.collection("roles").get();
    for (const rDoc of rolesSnap.docs) {
      const r = rDoc.data();
      await client.query(
        `INSERT INTO roles (id, company_id, name, permissions, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, permissions = EXCLUDED.permissions`,
        [
          rDoc.id, compId, r.name || "Role", JSON.stringify(r.permissions || {}),
          r.createdAt || new Date().toISOString(), r.updatedAt || new Date().toISOString()
        ]
      );
      rolesFound++;
    }

    // Check subcollection 'environment_settings'
    const envSnap = await compDoc.ref.collection("environment_settings").get();
    for (const eDoc of envSnap.docs) {
      const e = eDoc.data();
      await client.query(
        `INSERT INTO environment_settings (id, company_id, category, key, value, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value`,
        [
          eDoc.id, compId, e.category || "general", e.key || eDoc.id, JSON.stringify(e),
          e.createdAt || new Date().toISOString(), e.updatedAt || new Date().toISOString()
        ]
      );
      envSettingsFound++;
    }
  }

  console.log(`Extracted from Firestore subcollections: Roles = ${rolesFound}, Environment Settings = ${envSettingsFound}`);

  // 2. Populate standard system roles & env settings for all 17 companies in PostgreSQL
  const companyRows = (await client.query("SELECT id, name FROM companies")).rows;

  const defaultRoles = [
    {
      name: "Super Admin",
      permissions: {
        all: true,
        manage_users: true,
        manage_attendance: true,
        manage_payroll: true,
        manage_projects: true,
        manage_settings: true
      }
    },
    {
      name: "HR Manager",
      permissions: {
        manage_users: true,
        manage_attendance: true,
        manage_leaves: true,
        manage_payroll: true,
        view_reports: true
      }
    },
    {
      name: "Project Manager",
      permissions: {
        manage_projects: true,
        manage_tasks: true,
        assign_tasks: true,
        view_reports: true
      }
    },
    {
      name: "Employee",
      permissions: {
        view_profile: true,
        check_in_out: true,
        apply_leaves: true,
        view_tasks: true,
        submit_reports: true
      }
    },
    {
      name: "Intern",
      permissions: {
        view_profile: true,
        check_in_out: true,
        apply_leaves: true,
        view_tasks: true,
        submit_reports: true
      }
    }
  ];

  const defaultEnvSettings = [
    {
      category: "attendance_policy",
      key: "work_hours",
      value: {
        shift_start: "09:00",
        shift_end: "18:00",
        grace_period_minutes: 15,
        half_day_hours: 4.5,
        full_day_hours: 8
      }
    },
    {
      category: "leave_policy",
      key: "default_quotas",
      value: {
        casual_leaves_per_year: 25,
        sick_leaves_per_year: 10,
        paid_leaves_per_year: 6,
        allow_half_day: true
      }
    },
    {
      category: "security",
      key: "geofence_settings",
      value: {
        enable_geofencing: false,
        allowed_radius_meters: 100,
        require_selfie: false
      }
    },
    {
      category: "payroll_policy",
      key: "salary_structure",
      value: {
        basic_percentage: 50,
        hra_percentage: 30,
        allowances_percentage: 20,
        pf_employee_percent: 12,
        esi_employee_percent: 0.75
      }
    }
  ];

  for (const c of companyRows) {
    // Seed default roles if not present
    for (const r of defaultRoles) {
      const roleId = `role_${c.id}_${r.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      await client.query(
        `INSERT INTO roles (id, company_id, name, permissions, created_at, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO NOTHING`,
        [roleId, c.id, r.name, JSON.stringify(r.permissions)]
      );
    }

    // Seed default environment settings if not present
    for (const env of defaultEnvSettings) {
      const envId = `env_${c.id}_${env.key}`;
      await client.query(
        `INSERT INTO environment_settings (id, company_id, category, key, value, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO NOTHING`,
        [envId, c.id, env.category, env.key, JSON.stringify(env.value)]
      );
    }
  }

  const roleCount = (await client.query("SELECT COUNT(*) FROM roles")).rows[0].count;
  const envCount = (await client.query("SELECT COUNT(*) FROM environment_settings")).rows[0].count;

  console.log(`\n🎉 Final Database Status:`);
  console.log(`- roles: ${roleCount} rows`);
  console.log(`- environment_settings: ${envCount} rows`);

  client.release();
  await pool.end();
}

extractAndSeedRolesAndEnv().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
