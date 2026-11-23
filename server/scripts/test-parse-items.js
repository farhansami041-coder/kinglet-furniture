import fs from "fs";
import readline from "readline";

function parseSqlStatement(stmt) {
  const valuesIdx = stmt.indexOf("VALUES");
  if (valuesIdx === -1) return null;

  const colPart = stmt.slice(0, valuesIdx);
  const valPart = stmt.slice(valuesIdx + 6).trim().replace(/;$/, "");

  // Extract column names
  const colMatch = colPart.match(/\(([^)]+)\)/);
  if (!colMatch) return null;
  const columns = colMatch[1].split(",").map(c => c.trim().replace(/[`'"]/g, ""));

  // Parse values properly respecting escaped quotes and newlines
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

async function testAllItems() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inItems = false;
  let currentStatement = "";
  const parsedItems = [];

  for await (const line of rl) {
    if (line.startsWith("INSERT INTO items ") || line.startsWith("INSERT INTO `items` ")) {
      inItems = true;
      currentStatement = line;
    } else if (inItems) {
      currentStatement += "\n" + line;
    }

    if (inItems && line.trim().endsWith(";")) {
      const item = parseSqlStatement(currentStatement);
      if (item && item.name) parsedItems.push(item);
      inItems = false;
      currentStatement = "";
    }
  }

  console.log(`Successfully parsed: ${parsedItems.length}/98 products!`);
  console.log("\nSample 3 Products:");
  parsedItems.slice(0, 3).forEach((p, i) => {
    console.log(`[Product ${i + 1}]: ID: ${p.id} | Name: "${p.name}" | Price: ৳${p.previous_price || p.discount_price} | Photo: ${p.photo}`);
  });
}

testAllItems().catch(console.error);

