import fs from "fs";
import readline from "readline";

// Helper to robustly parse SQL INSERT statement values
function parseSqlInsertValues(line) {
  const valuesIndex = line.indexOf("VALUES");
  if (valuesIndex === -1) return null;

  const rawValues = line.slice(valuesIndex + 6).trim().replace(/;$/, "");
  // Matches '('...fields...')'
  if (!rawValues.startsWith("(") || !rawValues.endsWith(")")) return null;

  const inner = rawValues.slice(1, -1);
  const fields = [];
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
      fields.push(current.trim().replace(/^['"]|['"]$/g, ""));
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim().replace(/^['"]|['"]$/g, ""));
  return fields;
}

async function dryRun() {
  const fileStream = fs.createReadStream("c:\\Users\\DK\\Downloads\\database_backup_on_26-11-15 (1).sql");
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const categories = [];
  const subcategories = [];
  const childcategories = [];
  const items = [];
  const galleries = [];
  const coupons = [];
  const subscribers = [];
  const banners = [];

  for await (const line of rl) {
    if (line.startsWith("INSERT INTO categories ")) {
      const vals = parseSqlInsertValues(line);
      if (vals) categories.push({ id: vals[0], name: vals[1], slug: vals[2], photo: vals[3] });
    } else if (line.startsWith("INSERT INTO subcategories ")) {
      const vals = parseSqlInsertValues(line);
      if (vals) subcategories.push({ id: vals[0], name: vals[1], slug: vals[2], categoryId: vals[3] });
    } else if (line.startsWith("INSERT INTO chield_categories ")) {
      const vals = parseSqlInsertValues(line);
      if (vals) childcategories.push({ id: vals[0], name: vals[1], slug: vals[2], categoryId: vals[3], subcategoryId: vals[4] });
    } else if (line.startsWith("INSERT INTO items ")) {
      const vals = parseSqlInsertValues(line);
      if (vals) {
        items.push({
          id: vals[0],
          categoryId: vals[1],
          subcategoryId: vals[2],
          childcategoryId: vals[3],
          name: vals[6],
          slug: vals[7],
          sku: vals[8],
          details: vals[15],
          photo: vals[16],
          discountPrice: parseFloat(vals[17]) || 0,
          previousPrice: parseFloat(vals[18]) || 0,
          stock: parseInt(vals[19]) || 0,
          metaTitle: vals[20],
          metaDescription: vals[22],
          status: vals[23] === "1",
        });
      }
    } else if (line.startsWith("INSERT INTO galleries ")) {
      const vals = parseSqlInsertValues(line);
      if (vals) galleries.push({ id: vals[0], itemId: vals[1], photo: vals[2] });
    } else if (line.startsWith("INSERT INTO coupons ")) {
      const vals = parseSqlInsertValues(line);
      if (vals) coupons.push({ id: vals[0], title: vals[1], code: vals[2], type: vals[3], price: vals[4] });
    } else if (line.startsWith("INSERT INTO subscribers ")) {
      const vals = parseSqlInsertValues(line);
      if (vals) subscribers.push({ id: vals[0], email: vals[1] });
    } else if (line.startsWith("INSERT INTO banners ")) {
      const vals = parseSqlInsertValues(line);
      if (vals) banners.push({ id: vals[0], title: vals[1], subtitle: vals[2], url: vals[3], image: vals[4] });
    }
  }

  console.log("=== DRY RUN PARSE RESULTS ===");
  console.log(`Categories: ${categories.length}`);
  console.log(`Subcategories: ${subcategories.length}`);
  console.log(`Child Categories: ${childcategories.length}`);
  console.log(`Items (Products): ${items.length}`);
  console.log(`Galleries: ${galleries.length}`);
  console.log(`Coupons: ${coupons.length}`);
  console.log(`Subscribers: ${subscribers.length}`);
  console.log(`Banners: ${banners.length}`);

  // Test image mappings
  const itemsWithImages = items.filter(it => it.photo && it.photo.length > 3);
  console.log(`Items with valid primary photos: ${itemsWithImages.length}/${items.length}`);

  // Check gallery distribution
  const galleryByItem = {};
  galleries.forEach(g => {
    galleryByItem[g.itemId] = (galleryByItem[g.itemId] || 0) + 1;
  });
  const itemsWithGalleries = Object.keys(galleryByItem).length;
  console.log(`Items with extra gallery photos: ${itemsWithGalleries}`);
  console.log(`Sample item gallery count: Item ${Object.keys(galleryByItem)[0]} has ${Object.values(galleryByItem)[0]} gallery images`);

  console.log("\nSample parsed product:", items[0]);
}

dryRun().catch(console.error);

