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

async function inspectAllItems() {
  const fileStream = fs.createReadStream("c:/Users/DK/Downloads/database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const items = [];
  let inStatement = false;
  let currentStatement = "";

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!inStatement) {
      if (trimmed.startsWith("INSERT INTO items ")) {
        inStatement = true;
        currentStatement = line;
      }
    } else {
      currentStatement += "\n" + line;
    }

    if (inStatement && trimmed.endsWith(";")) {
      const row = parseSqlStatement(currentStatement);
      if (row && row.id && row.name) items.push(row);
      inStatement = false;
      currentStatement = "";
    }
  }

  console.log(`Parsed ${items.length} items.`);

  // Let's inspect details of items:
  for (const it of items) {
    console.log(`\n========================================`);
    console.log(`ID: ${it.id} | NAME: ${it.name}`);
    console.log(`Cat: ${it.category_id} | Sub: ${it.subcategory_id} | Child: ${it.childcategory_id}`);
    console.log(`SKU: ${it.sku} | Model: ${it.model_no}`);
    console.log(`Price: prev=${it.previous_price}, disc=${it.discount_price}, stock=${it.stock}`);
    console.log(`spec_name: "${it.specification_name}"`);
    console.log(`spec_desc: "${it.specification_description}"`);
    console.log(`spec_update: "${it.specification_update}"`);
    console.log(`sort_details: "${it.sort_details}"`);
    console.log(`details: "${it.details}"`);
  }
}

inspectAllItems();

