async function test() {
  try {
    const healthRes = await fetch("http://localhost:5005/api/health");
    console.log("Health status:", healthRes.status, await healthRes.json());

    // Test register with a new company ID
    const testEmail = "test_" + Date.now() + "@example.com";
    const testCompId = "comp-test-" + Date.now().toString(36);
    
    const regRes = await fetch("http://localhost:5005/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test BugFix Admin",
        email: testEmail,
        password: "Password123!",
        companyId: testCompId,
        role: "admin"
      })
    });

    const regData = await regRes.json();
    console.log("Register response:", regRes.status, regData);

    if (regRes.status === 201) {
      console.log("✅ Registration test succeeded without foreign key constraint error!");
    } else {
      console.error("❌ Registration test failed:", regData);
    }
  } catch (err) {
    console.error("Test error:", err);
  }
}

test();
