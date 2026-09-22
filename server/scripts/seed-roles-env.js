import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("rlwy.net") ? false : { rejectUnauthorized: false }
});

async function seedRolesAndEnv() {
  const client = await pool.connect();
  console.log("==================================================");
  console.log("⚙️ POPULATING ROLES & ENVIRONMENT SETTINGS (POSTGRESQL)");
  console.log("==================================================");

  const companyRows = (await client.query("SELECT id, name FROM companies")).rows;
  console.log(`Configuring roles & environment settings for ${companyRows.length} companies...`);

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
    // 1. Roles
    for (const r of defaultRoles) {
      const roleId = `role_${c.id}_${r.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
      await client.query(
        `INSERT INTO roles (id, company_id, name, permissions, created_at, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, permissions = EXCLUDED.permissions`,
        [roleId, c.id, r.name, JSON.stringify(r.permissions)]
      );
    }

    // 2. Environment Settings
    for (const env of defaultEnvSettings) {
      const envId = `env_${c.id}_${env.key}`;
      await client.query(
        `INSERT INTO environment_settings (id, company_id, category, key, value, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value`,
        [envId, c.id, env.category, env.key, JSON.stringify(env.value)]
      );
    }
  }

  const roleCount = (await client.query("SELECT COUNT(*) FROM roles")).rows[0].count;
  const envCount = (await client.query("SELECT COUNT(*) FROM environment_settings")).rows[0].count;

  console.log(`\n🎉 Populated Successfully!`);
  console.log(`- roles: ${roleCount} total rows`);
  console.log(`- environment_settings: ${envCount} total rows`);

  client.release();
  await pool.end();
}

seedRolesAndEnv().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
