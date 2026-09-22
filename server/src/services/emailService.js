import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Creates and returns a Nodemailer transporter.
 * If credentials are missing, returns null so operations fail gracefully without crashing.
 */
const getTransporter = () => {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const user = process.env.SMTP_USER || "carrezzaglobalsolutions@gmail.com";
  const pass = (process.env.SMTP_PASS || "cpho bpmz hplc fstb").replace(/\s+/g, "");
  const port = parseInt(process.env.SMTP_PORT || "587", 10);

  if (!user || !pass) {
    return null;
  }

  // Use service: "gmail" with explicit IPv4 and connection timeouts to prevent cloud networking stalls
  if (!process.env.SMTP_HOST || process.env.SMTP_HOST === "smtp.gmail.com") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      family: 4, // Force IPv4 to prevent cloud container IPv6 routing stalls
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 8000
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    family: 4,
    connectionTimeout: 8000,
    greetingTimeout: 8000,
    socketTimeout: 8000
  });
};

const getSender = () => {
  return process.env.SMTP_FROM || `"Zuna HRMS" <${process.env.SMTP_USER || "carrezzaglobalsolutions@gmail.com"}>`;
};

/**
 * Reusable email wrapper with HTML layout
 */
const baseEmailTemplate = (title, contentHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 24px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { margin: 6px 0 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 32px 24px; font-size: 15px; line-height: 1.6; }
    .card { background-color: #f1f5f9; border-radius: 8px; padding: 18px; margin: 20px 0; border-left: 4px solid #4f46e5; }
    .card-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .card-row:last-child { margin-bottom: 0; }
    .label { font-weight: 600; color: #475569; }
    .value { color: #0f172a; font-weight: 500; }
    .btn-container { text-align: center; margin: 28px 0; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-weight: 600; font-size: 15px; }
    .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Zuna HRMS</h1>
      <p>Workplace & Attendance Management Portal</p>
    </div>
    <div class="content">
      ${contentHtml}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Zuna HRMS. All rights reserved.</p>
      <p>This is an automated notification, please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Generic Mail Dispatcher with fallback and timeout
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = getTransporter();
    if (!transporter) {
      console.log(`ℹ️ [EmailService] SMTP credentials not set. Email to <${to}> with subject "${subject}" was skipped.`);
      return { success: false, reason: "SMTP_NOT_CONFIGURED" };
    }

    const mailOptions = {
      from: getSender(),
      to,
      subject,
      text: text || "",
      html
    };

    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) => setTimeout(() => reject(new Error("SMTP connection timed out")), 9000))
    ]);

    console.log(`📧 [EmailService] Email sent successfully to ${to}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`⚠️ [EmailService] Primary send attempt failed (${error.message}). Retrying via port 587 fallback...`);
    try {
      const user = process.env.SMTP_USER || "carrezzaglobalsolutions@gmail.com";
      const pass = (process.env.SMTP_PASS || "cpho bpmz hplc fstb").replace(/\s+/g, "");
      const fallbackTransporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        family: 4,
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000
      });

      const info = await fallbackTransporter.sendMail({
        from: getSender(),
        to,
        subject,
        text: text || "",
        html
      });

      console.log(`📧 [EmailService] Email sent via port 587 fallback to ${to}. Message ID: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (fallbackError) {
      console.error(`❌ [EmailService] All email delivery attempts failed to ${to}:`, fallbackError.message);
      return { success: false, error: fallbackError.message };
    }
  }
};

/**
 * 1. Welcome Email on User Registration
 */
export const sendWelcomeEmail = async ({ email, name, employeeId, shiftStart, shiftEnd, password, role }) => {
  const content = `
    <h2>Welcome to Carrezza HRMS, ${name}! 🎉</h2>
    <p>Your employee profile has been successfully created in the portal. Here are your account details:</p>
    
    <div class="card">
      <div class="card-row"><span class="label">Email / Login ID:</span> <span class="value">${email}</span></div>
      ${password ? `<div class="card-row"><span class="label">Initial Password:</span> <span class="value">${password}</span></div>` : ""}
      ${employeeId ? `<div class="card-row"><span class="label">Employee ID:</span> <span class="value">${employeeId}</span></div>` : ""}
      <div class="card-row"><span class="label">Role:</span> <span class="value" style="text-transform: capitalize;">${role || "employee"}</span></div>
      <div class="card-row"><span class="label">Shift Timings:</span> <span class="value">${shiftStart || "09:00"} - ${shiftEnd || "18:00"}</span></div>
    </div>

    <p>Please log in to your dashboard to complete your profile, mark attendance, and manage daily tasks.</p>
    
    <div class="btn-container">
      <a href="${process.env.APP_URL || "https://attendance-cgs.vercel.app"}" class="btn">Login to HRMS Portal</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Welcome to Carrezza HRMS - Account Activated`,
    html: baseEmailTemplate("Welcome to HRMS", content)
  });
};

/**
 * 2. Leave Application Submitted (Notification to Admins / Managers)
 */
export const sendLeaveRequestNotification = async ({ adminEmail, employeeName, leaveType, startDate, endDate, totalDays, reason }) => {
  const content = `
    <h2>New Leave Request Submitted 📋</h2>
    <p><strong>${employeeName}</strong> has applied for leave and is awaiting your review.</p>
    
    <div class="card">
      <div class="card-row"><span class="label">Employee:</span> <span class="value">${employeeName}</span></div>
      <div class="card-row"><span class="label">Leave Type:</span> <span class="value" style="text-transform: capitalize;">${leaveType}</span></div>
      <div class="card-row"><span class="label">Duration:</span> <span class="value">${startDate} to ${endDate} (${totalDays} day${totalDays > 1 ? "s" : ""})</span></div>
      <div class="card-row"><span class="label">Reason:</span> <span class="value">${reason}</span></div>
    </div>

    <p>Please log in to the admin portal to review and approve or reject this request.</p>
    
    <div class="btn-container">
      <a href="${process.env.APP_URL || "https://attendance-cgs.vercel.app"}" class="btn">Review Leave Request</a>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[Leave Request] ${employeeName} - ${leaveType} (${totalDays} days)`,
    html: baseEmailTemplate("New Leave Request", content)
  });
};

/**
 * 3. Leave Status Decision (Approved / Rejected) Notification to Employee
 */
export const sendLeaveStatusEmail = async ({ email, name, leaveType, startDate, endDate, totalDays, status, rejectionReason }) => {
  const isApproved = status.toLowerCase() === "approved";
  const badgeColor = isApproved ? "#16a34a" : "#dc2626";

  const content = `
    <h2>Leave Request Update 📝</h2>
    <p>Hello ${name},</p>
    <p>Your leave request for <strong>${startDate} to ${endDate} (${totalDays} days)</strong> has been:</p>
    
    <div style="text-align: center; margin: 16px 0;">
      <span style="background-color: ${badgeColor}; color: white; font-weight: 700; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px;">
        ${status}
      </span>
    </div>

    <div class="card">
      <div class="card-row"><span class="label">Leave Type:</span> <span class="value" style="text-transform: capitalize;">${leaveType}</span></div>
      <div class="card-row"><span class="label">Period:</span> <span class="value">${startDate} to ${endDate}</span></div>
      <div class="card-row"><span class="label">Total Days:</span> <span class="value">${totalDays}</span></div>
      ${rejectionReason ? `<div class="card-row"><span class="label">Remarks / Reason:</span> <span class="value" style="color: #dc2626;">${rejectionReason}</span></div>` : ""}
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Leave Request ${status.toUpperCase()} - Carrezza HRMS`,
    html: baseEmailTemplate("Leave Status Update", content)
  });
};

/**
 * 4. Task Assignment Email
 */
export const sendTaskAssignmentEmail = async ({ email, name, taskTitle, description, priority, dueDate, projectName }) => {
  const content = `
    <h2>New Task Assigned 📌</h2>
    <p>Hello ${name},</p>
    <p>A new task has been assigned to you in <strong>${projectName || "HRMS"}</strong>.</p>
    
    <div class="card">
      <div class="card-row"><span class="label">Task Title:</span> <span class="value">${taskTitle}</span></div>
      ${description ? `<div class="card-row"><span class="label">Description:</span> <span class="value">${description}</span></div>` : ""}
      <div class="card-row"><span class="label">Priority:</span> <span class="value" style="text-transform: capitalize;">${priority || "Medium"}</span></div>
      ${dueDate ? `<div class="card-row"><span class="label">Due Date:</span> <span class="value">${dueDate}</span></div>` : ""}
    </div>

    <div class="btn-container">
      <a href="${process.env.APP_URL || "https://attendance-cgs.vercel.app"}" class="btn">View Task in Portal</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `[New Task Assigned] ${taskTitle}`,
    html: baseEmailTemplate("New Task Assigned", content)
  });
};

/**
 * 5. Password Reset Request Email
 */
export const sendPasswordResetEmail = async ({ email, name, resetToken, resetUrl }) => {
  const link = resetUrl || `${process.env.APP_URL || "https://attendance-cgs.vercel.app"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  
  const content = `
    <h2>Password Reset Request 🔑</h2>
    <p>Hello ${name || "User"},</p>
    <p>We received a request to reset your Carrezza HRMS portal password. Click the button below to set a new password:</p>
    
    <div class="btn-container">
      <a href="${link}" class="btn">Reset Password</a>
    </div>

    <p style="font-size: 13px; color: #64748b;">If you did not request a password reset, you can safely ignore this email. The link will expire in 30 minutes.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Password Reset Request - Carrezza HRMS`,
    html: baseEmailTemplate("Reset Password", content)
  });
};

/**
 * Test SMTP Connection Utility
 */
export const verifySmtpConnection = async () => {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, message: "SMTP configuration is incomplete or missing in environment variables." };
  }
  try {
    await transporter.verify();
    return { ok: true, message: "SMTP connection established successfully!" };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};
