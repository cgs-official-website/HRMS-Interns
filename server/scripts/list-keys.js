import fs from "fs";

const raw = JSON.parse(fs.readFileSync("./backup/firestore_export_latest.json", "utf8"));
console.log("Collections:", Object.keys(raw.collections || {}));
console.log("Subcollections:", Object.keys(raw.subcollections || {}));

for (const k of Object.keys(raw.collections || {})) {
  console.log(`- ${k}: ${(raw.collections[k] || []).length}`);
}
for (const k of Object.keys(raw.subcollections || {})) {
  console.log(`- sub:${k}: ${(raw.subcollections[k] || []).length}`);
}
