import fs from "fs";
import readline from "readline";

async function inspectSettings() {
  const fileStream = fs.createReadStream("c:/Users/DK/Downloads/database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const settingLines = [];
  let inStatement = false;
  let currentStmt = "";

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!inStatement) {
      if (trimmed.startsWith("INSERT INTO settings ") || trimmed.startsWith("INSERT INTO `settings` ")) {
        inStatement = true;
        currentStmt = line;
      }
    } else {
      currentStmt += "\n" + line;
    }

    if (inStatement && trimmed.endsWith(";")) {
      settingLines.push(currentStmt);
      inStatement = false;
      currentStmt = "";
    }
  }

  console.log(`Found ${settingLines.length} settings insert statements.`);
  for (const s of settingLines) {
    console.log("Statement preview (first 1000 chars):");
    console.log(s.slice(0, 1000));
  }
}

inspectSettings();

