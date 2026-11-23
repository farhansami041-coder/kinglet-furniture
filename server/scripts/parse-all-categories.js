import fs from "fs";
import readline from "readline";

async function parseAllCategories() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const cats = [];
  const subcats = [];
  const childcats = [];

  // Helper to parse SQL INSERT statement values
  // e.g. INSERT INTO categories (id, name, slug, ...) VALUES ('1', 'Name', ...)
  for await (const line of rl) {
    if (line.startsWith("INSERT INTO categories ")) {
      const match = line.match(/VALUES \((.+)\);?$/);
      if (match) {
        // Quick extraction
        const parts = match[1].split("','").map(s => s.replace(/^'|'$/g, "").trim());
        cats.push({ id: parts[0], name: parts[1], slug: parts[2] });
      }
    } else if (line.startsWith("INSERT INTO subcategories ")) {
      const match = line.match(/VALUES \((.+)\);?$/);
      if (match) {
        const parts = match[1].split("','").map(s => s.replace(/^'|'$/g, "").trim());
        subcats.push({ id: parts[0], name: parts[1], slug: parts[2], categoryId: parts[3] });
      }
    } else if (line.startsWith("INSERT INTO chield_categories ")) {
      const match = line.match(/VALUES \((.+)\);?$/);
      if (match) {
        const parts = match[1].split("','").map(s => s.replace(/^'|'$/g, "").trim());
        childcats.push({ id: parts[0], name: parts[1], slug: parts[2], categoryId: parts[3], subcategoryId: parts[4] });
      }
    }
  }

  console.log(`Extracted Categories: ${cats.length}`);
  console.log("Sample Main Categories:", cats.slice(0, 15));
  console.log(`Extracted Subcategories: ${subcats.length}`);
  console.log("Sample Subcategories:", subcats.slice(0, 15));
  console.log(`Extracted Child Categories: ${childcats.length}`);
  console.log("Sample Child Categories:", childcats.slice(0, 15));
}

parseAllCategories().catch(console.error);

