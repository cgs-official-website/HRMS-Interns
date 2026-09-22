import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const COLLECTIONS = [
  "companies",
  "companyDomains",
  "users",
  "attendance",
  "attendanceLogs",
  "leave_requests",
  "paid_leaves",
  "regularization_requests",
  "projects",
  "tasks",
  "task_reports",
  "channels",
  "messages",
  "dm_threads",
  "daily_reports",
  "weekly_reports",
  "assets",
  "notifications",
  "external_links",
  "settings"
];

function cleanData(data) {
  if (!data) return data;
  if (Array.isArray(data)) {
    return data.map(item => cleanData(item));
  }
  if (typeof data === "object") {
    if (data.toDate && typeof data.toDate === "function") {
      return data.toDate().toISOString();
    }
    if (data._seconds !== undefined || data.seconds !== undefined) {
      const sec = data._seconds ?? data.seconds;
      const nano = data._nanoseconds ?? data.nanoseconds ?? 0;
      return new Date(sec * 1000 + nano / 1000000).toISOString();
    }
    const cleaned = {};
    for (const [key, val] of Object.entries(data)) {
      cleaned[key] = cleanData(val);
    }
    return cleaned;
  }
  return data;
}

async function runExport() {
  console.log("==================================================");
  console.log("🔥 HRMS FIRESTORE ROOT DATA EXPORT ENGINE");
  console.log("==================================================");

  const serviceAccountPath = path.resolve(__dirname, "../serviceAccountKey.json");
  if (!fs.existsSync(serviceAccountPath)) {
    console.error("❌ ERROR: serviceAccountKey.json not found at:", serviceAccountPath);
    process.exit(1);
  }

  console.log("🔑 Initializing Firebase Admin with Service Account...");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount)
    });
  }

  const adminDb = getFirestore();

  const exportData = {
    exportedAt: new Date().toISOString(),
    projectId: serviceAccount.project_id,
    mode: "firebase-admin-root",
    summary: {},
    collections: {},
    subcollections: {}
  };

  let totalDocs = 0;

  for (const colName of COLLECTIONS) {
    process.stdout.write(`Exporting '${colName}'... `);
    try {
      const snapshot = await adminDb.collection(colName).get();
      const docs = [];
      snapshot.forEach(doc => {
        docs.push({
          _id: doc.id,
          ...cleanData(doc.data())
        });
      });
      exportData.collections[colName] = docs;
      exportData.summary[colName] = docs.length;
      totalDocs += docs.length;
      console.log(`✅ (${docs.length} records)`);
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
      exportData.collections[colName] = [];
      exportData.summary[colName] = 0;
    }
  }

  console.log("\nExporting subcollections...");
  const subcols = ["roles", "environment_settings", "employeePayroll"];
  for (const subcol of subcols) {
    try {
      const snap = await adminDb.collectionGroup(subcol).get();
      const docs = [];
      snap.forEach(doc => {
        docs.push({
          _id: doc.id,
          _parentPath: doc.ref.parent.parent ? doc.ref.parent.parent.path : null,
          ...cleanData(doc.data())
        });
      });
      exportData.subcollections[subcol] = docs;
      exportData.summary[`sub_${subcol}`] = docs.length;
      totalDocs += docs.length;
      console.log(`✅ ${subcol}: (${docs.length} records)`);
    } catch (err) {
      console.log(`⚠️ ${subcol}: ${err.message}`);
    }
  }

  const backupDir = path.resolve(__dirname, "../backup");
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `firestore_export_${timestamp}.json`;
  const latestFileName = "firestore_export_latest.json";
  const filePath = path.join(backupDir, fileName);
  const latestFilePath = path.join(backupDir, latestFileName);

  fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2), "utf8");
  fs.writeFileSync(latestFilePath, JSON.stringify(exportData, null, 2), "utf8");

  console.log("\n==================================================");
  console.log(`🎉 EXPORT COMPLETE! Total Records Exported: ${totalDocs}`);
  console.log(`📁 Saved to: ${filePath}`);
  console.log("==================================================");
  console.table(exportData.summary);
}

runExport().catch(err => {
  console.error("Export failed:", err);
  process.exit(1);
});
