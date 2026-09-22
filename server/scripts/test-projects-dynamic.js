import http from "http";
import app from "../src/app.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "hrms_jwt_super_secret_railway_2026";

async function run() {
  console.log("==================================================");
  console.log("🧪 DYNAMIC PROJECT MODULE REGRESSION TEST SUITE");
  console.log("==================================================");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  let passed = 0;
  let failed = 0;

  const assert = (desc, cond) => {
    if (cond) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  };

  try {
    // 1. Admin login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@teamcarrezza.com", password: "12345678" })
    });
    const loginData = await loginRes.json();
    const adminToken = loginData.token;
    assert("Admin can login and obtain token", Boolean(adminToken));

    // 2. Mock Employee token
    const employeeToken = jwt.sign(
      { id: "usr_emp_reg", email: "emp@teamcarrezza.com", role: "employee", companyId: "carrezza-global-solutions" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 3. GET /projects - Dynamic Database-Driven list
    const getProjRes = await fetch(`${baseUrl}/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const projectsList = await getProjRes.json();
    assert("GET /projects returns 200", getProjRes.status === 200);
    assert("GET /projects returns array of projects", Array.isArray(projectsList) && projectsList.length > 0);
    
    const sample = projectsList[0];
    assert("Project contains valid id and name", Boolean(sample.id && sample.name));
    assert("Project contains clean startDate (YYYY-MM-DD)", Boolean(sample.startDate && /^\d{4}-\d{2}-\d{2}$/.test(sample.startDate)));
    assert("Project contains clean endDate (YYYY-MM-DD)", Boolean(sample.endDate && /^\d{4}-\d{2}-\d{2}$/.test(sample.endDate)));
    assert("Project contains aggregated teamMembers array", Array.isArray(sample.teamMembers));
    assert("Project contains task metrics (taskCount, progress)", typeof sample.taskCount === "number" && typeof sample.progress === "number");

    // 4. Employee cannot CREATE project
    const empCreateRes = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${employeeToken}`
      },
      body: JSON.stringify({ name: "Rogue Project", startDate: "2026-09-01", endDate: "2026-09-30" })
    });
    assert("Employee cannot create project (returns 403)", empCreateRes.status === 403);

    // 5. Admin CREATES real project in PostgreSQL
    const testProjectName = "Automated Dynamic Project " + Date.now();
    const createRes = await fetch(`${baseUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: testProjectName,
        description: "Test description for dynamic project verification",
        startDate: "2026-09-01",
        endDate: "2026-09-30",
        status: "Ongoing",
        teamMembers: [loginData.user.id]
      })
    });
    const createdProject = await createRes.json();
    assert("Admin can create real project in PostgreSQL (returns 201)", createRes.status === 201);
    assert("Created project has id, correct name and dates", createdProject.name === testProjectName && createdProject.startDate === "2026-09-01");

    const createdId = createdProject.id;

    // 6. Admin UPDATES project in PostgreSQL
    const updateRes = await fetch(`${baseUrl}/projects/${createdId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: "Completed",
        description: "Updated project description"
      })
    });
    const updatedProject = await updateRes.json();
    assert("Admin can update project in PostgreSQL (returns 200)", updateRes.status === 200);
    assert("Updated project reflects new status: 'Completed'", updatedProject.status === "Completed");

    // 7. Employee cannot DELETE project
    const empDelRes = await fetch(`${baseUrl}/projects/${createdId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${employeeToken}` }
    });
    assert("Employee cannot delete project (returns 403)", empDelRes.status === 403);

    // 8. Admin DELETES project from PostgreSQL
    const deleteRes = await fetch(`${baseUrl}/projects/${createdId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert("Admin can delete project in PostgreSQL (returns 200)", deleteRes.status === 200);

    // 9. Verify project is removed
    const verifyGetRes = await fetch(`${baseUrl}/projects`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const verifyList = await verifyGetRes.json();
    assert("Deleted project no longer appears in project list", !verifyList.some(p => p.id === createdId));

  } finally {
    server.close();
  }

  console.log("\n==================================================");
  console.log(`📊 PROJECT TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) process.exit(1);
  process.exit(0);
}

run().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
