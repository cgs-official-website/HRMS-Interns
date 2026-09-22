import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import { verifySmtpConnection, sendEmail } from "../src/services/emailService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function testEmailSetup() {
  console.log("==========================================");
  console.log("📧 NODEMAILER / SMTP CONFIGURATION TESTER");
  console.log("==========================================");
  console.log("SMTP_HOST:", process.env.SMTP_HOST || "(not set)");
  console.log("SMTP_PORT:", process.env.SMTP_PORT || "(not set)");
  console.log("SMTP_USER:", process.env.SMTP_USER || "(not set)");
  console.log("SMTP_PASS:", process.env.SMTP_PASS ? "********" : "(not set)");
  console.log("SMTP_FROM:", process.env.SMTP_FROM || "(not set)");
  console.log("------------------------------------------");

  console.log("Verifying connection to SMTP server...");
  const status = await verifySmtpConnection();
  
  if (!status.ok) {
    console.error("❌ Connection Failed:", status.message);
    console.log("\n💡 Reminder: If using Gmail, make sure you created an 'App Password' from https://myaccount.google.com/apppasswords");
    process.exit(1);
  }

  console.log("✅ SMTP Connection Successful!");
  
  // Optional test email if target specified
  const testRecipient = process.argv[2] || process.env.SMTP_USER;
  if (testRecipient && !testRecipient.includes("your-email")) {
    console.log(`Sending test email to <${testRecipient}>...`);
    const result = await sendEmail({
      to: testRecipient,
      subject: "Test Email from Carrezza HRMS",
      html: "<h3>Hello!</h3><p>Your Nodemailer integration with Carrezza HRMS is working perfectly! 🎉</p>"
    });

    if (result.success) {
      console.log("🎉 Test email delivered successfully!");
    } else {
      console.error("❌ Failed to send test email:", result.error);
    }
  }

  process.exit(0);
}

testEmailSetup();
