import fs from "fs";

const raw = JSON.parse(fs.readFileSync("./backup/firestore_export_latest.json", "utf8"));
console.log("paid_leaves sample:", raw.collections.paid_leaves);
console.log("weekly_reports sample:", raw.collections.weekly_reports[0]);
