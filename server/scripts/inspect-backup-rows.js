import fs from "fs";
import readline from "readline";

async function inspectSampleRows() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const samples = {
    categories: [],
    subcategories: [],
    chield_categories: [],
    items: [],
    galleries: [],
    banners: [],
    sliders: [],
  };

  for await (const line of rl) {
    for (const table of Object.keys(samples)) {
      if (line.startsWith(`INSERT INTO ${table} `) || line.startsWith(`INSERT INTO \`${table}\` `)) {
        if (samples[table].length < 2) {
          samples[table].push(line);
        }
      }
    }
  }

  for (const [table, rows] of Object.entries(samples)) {
    console.log(`\n=== Table: ${table} (${rows.length} samples) ===`);
    rows.forEach((r, i) => console.log(`[Row ${i + 1}]: ${r.slice(0, 300)}...`));
  }
}

inspectSampleRows().catch(console.error);

