import fs from "fs";
import readline from "readline";

function parseSqlInsertValues(line) {
  const match = line.match(/^INSERT INTO [`"]?(\w+)[`"]?\s*\(([^)]+)\)\s*VALUES\s*\((.*)\);?$/s);
  if (!match) return null;
  const table = match[1];
  const cols = match[2].split(",").map(c => c.trim().replace(/[`'"]/g, ""));
  const valString = match[3];

  const vals = [];
  let cur = "";
  let inQ = false;
  let qCh = "";

  for (let i = 0; i < valString.length; i++) {
    const ch = valString[i];
    const prev = i > 0 ? valString[i - 1] : "";
    if ((ch === "'" || ch === '"') && prev !== "\\") {
      if (!inQ) {
        inQ = true;
        qCh = ch;
      } else if (ch === qCh) {
        inQ = false;
        qCh = "";
      } else {
        cur += ch;
      }
    } else if (ch === "," && !inQ) {
      vals.push(cur.trim().replace(/^['"]|['"]$/g, ""));
      cur = "";
    } else {
      cur += ch;
    }
  }
  vals.push(cur.trim().replace(/^['"]|['"]$/g, ""));

  const row = {};
  cols.forEach((c, idx) => {
    row[c] = vals[idx] !== undefined ? vals[idx] : null;
  });
  return { table, row };
}

async function analyzeItemsAndCategories() {
  const fileStream = fs.createReadStream("c:/Users/DK/Downloads/database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const categories = [];
  const subcategories = [];
  const childcategories = [];
  const items = [];

  let inStatement = false;
  let currentStmt = "";

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!inStatement) {
      if (
        trimmed.startsWith("INSERT INTO categories ") ||
        trimmed.startsWith("INSERT INTO subcategories ") ||
        trimmed.startsWith("INSERT INTO chield_categories ") ||
        trimmed.startsWith("INSERT INTO items ")
      ) {
        inStatement = true;
        currentStmt = line;
      }
    } else {
      currentStmt += "\n" + line;
    }

    if (inStatement && trimmed.endsWith(";")) {
      const parsed = parseSqlInsertValues(currentStmt.replace(/[\r\n]+/g, " "));
      if (parsed) {
        if (parsed.table === "categories") categories.push(parsed.row);
        else if (parsed.table === "subcategories") subcategories.push(parsed.row);
        else if (parsed.table === "chield_categories") childcategories.push(parsed.row);
        else if (parsed.table === "items") items.push(parsed.row);
      }
      inStatement = false;
      currentStmt = "";
    }
  }

  console.log(`Total Categories: ${categories.length}`);
  console.log(`Total Subcategories: ${subcategories.length}`);
  console.log(`Total Child Categories: ${childcategories.length}`);
  console.log(`Total Items: ${items.length}`);

  console.log("\n--- Category names & IDs ---");
  for (const cat of categories) {
    console.log(`Cat ID: ${cat.id} | Name: "${cat.name}" | Slug: "${cat.slug}"`);
  }

  console.log("\n--- Subcategory names with 'bed' or bedroom ---");
  for (const sub of subcategories) {
    if (sub.name.toLowerCase().includes("bed")) {
      console.log(`Sub ID: ${sub.id} | Cat ID: ${sub.category_id} | Name: "${sub.name}" | Slug: "${sub.slug}"`);
    }
  }

  console.log("\n--- Child categories with 'bed' ---");
  for (const ch of childcategories) {
    if (ch.name.toLowerCase().includes("bed")) {
      console.log(`Child ID: ${ch.id} | Sub ID: ${ch.subcategory_id} | Cat ID: ${ch.category_id} | Name: "${ch.name}" | Slug: "${ch.slug}"`);
    }
  }

  console.log("\n--- Sample Items inspection (first 10 items) ---");
  for (let i = 0; i < Math.min(10, items.length); i++) {
    const it = items[i];
    console.log(`\nItem ID: ${it.id} | Name: "${it.name}"`);
    console.log(`  cat_id: ${it.category_id}, sub_id: ${it.subcategory_id}, child_id: ${it.childcategory_id}`);
    console.log(`  model_no: "${it.model_no}", sku: "${it.sku}"`);
    console.log(`  spec_name: "${(it.specification_name || "").slice(0, 100)}"`);
    console.log(`  spec_desc: "${(it.specification_description || "").slice(0, 100)}"`);
    console.log(`  spec_update: "${(it.specification_update || "").slice(0, 150)}"`);
    console.log(`  details: "${(it.details || "").slice(0, 150)}"`);
  }
}

analyzeItemsAndCategories();

