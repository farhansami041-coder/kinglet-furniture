import fs from "fs";
import readline from "readline";

async function checkSchema() {
  const fileStream = fs.createReadStream("c:/Users/DK/Downloads/database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let inTable = null;
  const tableDefs = {};

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed.startsWith("CREATE TABLE")) {
      const match = trimmed.match(/CREATE TABLE [`"]?([a-zA-Z0-9_]+)[`"]?/);
      if (match) {
        inTable = match[1];
        tableDefs[inTable] = [];
      }
    } else if (inTable) {
      if (trimmed.startsWith(") ENGINE") || trimmed.startsWith(");")) {
        inTable = null;
      } else {
        tableDefs[inTable].push(trimmed);
      }
    }
  }

  console.log("Tables found:", Object.keys(tableDefs));
  console.log("\n--- items table schema ---");
  console.log((tableDefs["items"] || []).join("\n"));

  for (const t of [
    "attributes",
    "attribute_values",
    "item_attributes",
    "additional_item_infos",
    "item_variants",
    "specifications",
    "categories",
    "subcategories",
    "chield_categories"
  ]) {
    if (tableDefs[t]) {
      console.log(`\n--- ${t} table schema ---`);
      console.log(tableDefs[t].join("\n"));
    }
  }
}

checkSchema();

