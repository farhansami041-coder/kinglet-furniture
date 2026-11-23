import fs from "fs";
import readline from "readline";

async function parseCatalog() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const categories = [];
  const subcategories = [];
  const childcategories = [];
  const items = [];
  const galleries = [];

  for await (const line of rl) {
    if (line.startsWith("INSERT INTO categories ")) {
      categories.push(line);
    } else if (line.startsWith("INSERT INTO subcategories ")) {
      subcategories.push(line);
    } else if (line.startsWith("INSERT INTO chield_categories ")) {
      childcategories.push(line);
    } else if (line.startsWith("INSERT INTO items ")) {
      items.push(line);
    } else if (line.startsWith("INSERT INTO galleries ")) {
      galleries.push(line);
    }
  }

  console.log(`Summary of Backup Data:`);
  console.log(`- Categories: ${categories.length}`);
  console.log(`- Subcategories: ${subcategories.length}`);
  console.log(`- Child Categories: ${childcategories.length}`);
  console.log(`- Items (Products): ${items.length}`);
  console.log(`- Galleries (Product Images): ${galleries.length}`);
}

parseCatalog().catch(console.error);

