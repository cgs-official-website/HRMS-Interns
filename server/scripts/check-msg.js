import fs from "fs";

const data = JSON.parse(fs.readFileSync("./backup/firestore_export_latest.json", "utf8"));
console.log("Messages array length:", (data.collections.messages || []).length);
if ((data.collections.messages || []).length > 0) {
  console.log("Sample message:", data.collections.messages[0]);
}
