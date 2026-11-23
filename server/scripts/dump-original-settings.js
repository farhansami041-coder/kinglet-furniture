import fs from "fs";
import readline from "readline";

function parseSqlStatement(stmt) {
  const valuesIdx = stmt.indexOf("VALUES");
  if (valuesIdx === -1) return null;

  const colPart = stmt.slice(0, valuesIdx);
  const valPart = stmt.slice(valuesIdx + 6).trim().replace(/;$/, "");

  const colMatch = colPart.match(/\(([^)]+)\)/);
  if (!colMatch) return null;
  const columns = colMatch[1].split(",").map((c) => c.trim().replace(/[`'"]/g, ""));

  const inner = valPart.replace(/^\s*\(/, "").replace(/\)\s*$/, "");
  const values = [];
  let current = "";
  let inQuote = false;
  let quoteChar = "";

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    const prev = i > 0 ? inner[i - 1] : "";

    if ((ch === "'" || ch === '"') && prev !== "\\") {
      if (!inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (ch === quoteChar) {
        inQuote = false;
        quoteChar = "";
      } else {
        current += ch;
      }
    } else if (ch === "," && !inQuote) {
      values.push(current.trim().replace(/^['"]|['"]$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current.trim().replace(/^['"]|['"]$/g, ""));

  const record = {};
  columns.forEach((col, idx) => {
    record[col] = values[idx] !== undefined ? values[idx] : null;
  });
  return record;
}

async function dumpOriginalSettings() {
  const fileStream = fs.createReadStream("c:/Users/DK/Downloads/database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

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
      const record = parseSqlStatement(currentStmt);
      console.log("Parsed settings record:");
      for (const [k, v] of Object.entries(record)) {
        console.log(`  ${k.padEnd(25)} : ${v}`);
      }
      break;
    }
  }
}

dumpOriginalSettings();

