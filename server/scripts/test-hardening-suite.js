import http from "http";
import app from "../src/app.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "hrms_jwt_super_secret_railway_2026";

async function runTests() {
  console.log("==================================================");
  console.log("🧪 EXHAUSTIVE SECURITY & REGRESSION TEST SUITE");
  console.log("==================================================");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  console.log(`📡 Local test server listening on port ${port}...\n`);

  let passed = 0;
  let failed = 0;

  const assert = (desc, condition) => {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  };

  try {
    // 1. Health Check
    console.log("1. System Health Check:");
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert("Health endpoint returns 200 OK", healthRes.status === 200);
    assert("Health payload has status: 'ok'", healthData.status === "ok");

    // 2. Auth Bypass Vulnerability Test (Issue #2 Fix)
    console.log("\n2. Authentication Bypass Elimination Test:");
    const noTokenRes = await fetch(`${baseUrl}/users`);
    assert("Unauthenticated GET /users returns 401", noTokenRes.status === 401);

    const bypassAttemptRes = await fetch(`${baseUrl}/users?companyId=carrezza-global-solutions`);
    assert("Unauthenticated GET /users?companyId=... returns 401 (Bypass Eliminated!)", bypassAttemptRes.status === 401);

    const invalidTokenRes = await fetch(`${baseUrl}/users`, {
      headers: { Authorization: "Bearer bogus_invalid_token_123" }
    });
    assert("Invalid JWT returns 403 Forbidden", invalidTokenRes.status === 403);

    // 3. User Login & Token Generation
    console.log("\n3. User Authentication Test:");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@teamcarrezza.com", password: "12345678" })
    });
    const loginData = await loginRes.json();
    assert("Superadmin login returns 200 OK", loginRes.status === 200);
    assert("Login response includes signed JWT token", Boolean(loginData.token));
    assert("Login response returns user profile", Boolean(loginData.user?.id));

    const superAdminToken = loginData.token;

    // Generate mock employee tokens for Company A and Company B
    const employeeA_Token = jwt.sign(
      { id: "usr_emp_a", email: "empa@comp-a.com", role: "employee", companyId: "comp-a" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
    const employeeB_Token = jwt.sign(
      { id: "usr_emp_b", email: "empb@comp-b.com", role: "employee", companyId: "comp-b" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 4. Multi-Tenant Cross-Company Isolation (Issue #3 Fix)
    console.log("\n4. Multi-Tenant Boundary Test:");
    const empUsersRes = await fetch(`${baseUrl}/users?companyId=comp-b`, {
      headers: { Authorization: `Bearer ${employeeA_Token}` }
    });
    const empUsersData = await empUsersRes.json();
    assert(
      "Employee of Company A cannot read Company B users by supplying ?companyId=comp-b",
      empUsersRes.status === 200 && Array.isArray(empUsersData) && !empUsersData.some(u => u.company_id === "comp-b")
    );

    // 5. Role-Based Authorization Enforcement
    console.log("\n5. Role-Based Authorization Enforcement:");

    // 5a. User Deletion
    const empDeleteUserRes = await fetch(`${baseUrl}/users/some_user_id`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${employeeA_Token}` }
    });
    assert("Employee cannot delete users (returns 403)", empDeleteUserRes.status === 403);

    // 5b. Payroll Wiping
    const empWipePayrollRes = await fetch(`${baseUrl}/payroll/all`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${employeeA_Token}` }
    });
    assert("Employee cannot wipe payroll (returns 403)", empWipePayrollRes.status === 403);

    // 5c. Payroll Saving
    const empSavePayrollRes = await fetch(`${baseUrl}/payroll`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${employeeA_Token}`
      },
      body: JSON.stringify({ userId: "usr_emp_a", month: "09", year: 2026, grossSalary: 50000 })
    });
    assert("Employee cannot save payroll records (returns 403)", empSavePayrollRes.status === 403);

    // 5d. Leave Status Decision
    const empApproveLeaveRes = await fetch(`${baseUrl}/leaves/leave_123/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${employeeA_Token}`
      },
      body: JSON.stringify({ status: "approved" })
    });
    assert("Employee cannot approve leave requests (returns 403)", empApproveLeaveRes.status === 403);

    // 5e. Regularization Decision
    const empApproveRegRes = await fetch(`${baseUrl}/regularization/reg_123/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${employeeA_Token}`
      },
      body: JSON.stringify({ status: "approved" })
    });
    assert("Employee cannot approve regularization requests (returns 403)", empApproveRegRes.status === 403);

    // 5f. Asset Mutations
    const empCreateAssetRes = await fetch(`${baseUrl}/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${employeeA_Token}`
      },
      body: JSON.stringify({ name: "MacBook Pro", serialNumber: "MBP123" })
    });
    assert("Employee cannot create assets (returns 403)", empCreateAssetRes.status === 403);

    // 5g. Project Deletion
    const empDeleteProjectRes = await fetch(`${baseUrl}/projects/some_proj_id`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${employeeA_Token}` }
    });
    assert("Employee cannot delete projects (returns 403)", empDeleteProjectRes.status === 403);

    // 6. Direct Message Privacy (Issue #6 Fix)
    console.log("\n6. Direct Message Privacy & Eavesdropping Prevention:");
    const empDmRes = await fetch(`${baseUrl}/chat/dm-threads/dm_usr1_usr2/messages`, {
      headers: { Authorization: `Bearer ${employeeA_Token}` }
    });
    assert("Non-participant employee blocked from viewing DM messages (returns 403/404)", [403, 404].includes(empDmRes.status));

    // 7. Rate Limiting Verification (Issue #12 Fix)
    console.log("\n7. Authentication Rate Limiter Test:");
    let rateLimited = false;
    for (let i = 0; i < 25; i++) {
      const r = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `ratetest_${i}@test.local`, password: "password123" })
      });
      if (r.status === 429) {
        rateLimited = true;
        break;
      }
    }
    assert("Auth rate limiter engages on excess attempts (returns 429)", rateLimited);

    // 8. 404 & Error Handler Sanitization
    console.log("\n8. Error Handling & 404 Sanitization:");
    const unknownRes = await fetch(`${baseUrl}/non_existent_route`);
    const unknownData = await unknownRes.json();
    assert("Unknown endpoint returns 404 JSON", unknownRes.status === 404);
    assert("404 response has sanitized error message", Boolean(unknownData.error));

  } finally {
    server.close();
  }

  console.log("\n==================================================");
  console.log(`📊 TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error("Fatal test suite runner error:", err);
  process.exit(1);
});
