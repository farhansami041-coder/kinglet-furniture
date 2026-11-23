import fs from "fs";

let dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf16le");
if (!dump.includes("========================================")) {
  dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf8");
}

const itemBlocks = dump.split("========================================").slice(1);

const items = [];

for (const block of itemBlocks) {
  const idMatch = block.match(/ID:\s*(\d+)\s*\|\s*NAME:\s*([^\r\n]+)/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const name = idMatch[2].trim();

  const skuMatch = block.match(/SKU:\s*([^\s|]+)\s*\|\s*Model:\s*([^\r\n]*)/);
  const catMatch = block.match(/Cat:\s*(\d+)\s*\|\s*Sub:\s*(\d+)\s*\|\s*Child:\s*(\d+)/);
  const priceMatch = block.match(/Price:\s*prev=([0-9.]+),\s*disc=([0-9.]+),\s*stock=(\d+)/);

  // Extract sort_details
  const sortDetailsMatch = block.match(/sort_details:\s*"([\s\S]*?)"\r?\ndetails:/);
  const sortDetails = sortDetailsMatch ? sortDetailsMatch[1] : "";

  // Extract details
  const detailsMatch = block.match(/details:\s*"([\s\S]*?)"(?=\r?\n\r?\n|$)/);
  const details = detailsMatch ? detailsMatch[1] : "";

  // Clean html
  const text = (sortDetails + "\n" + details)
    .replace(/<[^>]+>/g, "\n")
    .replace(/&nbsp;/g, " ")
    .replace(/&mdash;/g, "—")
    .replace(/&amp;/g, "&");

  let realModel = "";
  let realDimension = "";
  let realStructure = "";
  let realColor = "";

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const l of lines) {
    const lower = l.toLowerCase();
    if (lower.startsWith("model no") || lower.startsWith("model:")) {
      realModel = l.replace(/^model\s*(no\.?)?\s*[-:]?\s*/i, "").trim();
    } else if (lower.startsWith("dimension")) {
      realDimension = l.replace(/^dimension\s*[-:]?\s*/i, "").trim();
    } else if (lower.startsWith("structure")) {
      realStructure = l.replace(/^structure\s*(made\s*(by|of))?\s*[-:]?\s*/i, "").trim();
    } else if (lower.startsWith("color")) {
      realColor = l.replace(/^color\s*[-:—]?\s*/i, "").trim();
    }
  }

  // Filter test items
  const lowerName = name.toLowerCase();
  const isTest = (
    lowerName === "hfdddf" ||
    lowerName === "kk" ||
    lowerName === "master room" ||
    lowerName === "m t r" ||
    lowerName === "c sofa" ||
    lowerName === "sofa r" ||
    lowerName.length < 3
  );

  if (!isTest) {
    items.push({
      id,
      name,
      cat: catMatch ? catMatch[1] : "",
      sub: catMatch ? catMatch[2] : "",
      child: catMatch ? catMatch[3] : "",
      prevPrice: priceMatch ? priceMatch[1] : "0",
      discPrice: priceMatch ? priceMatch[2] : "0",
      stock: priceMatch ? priceMatch[3] : "1",
      sku: skuMatch ? skuMatch[1].trim() : "",
      rawModel: skuMatch ? skuMatch[2].trim() : "",
      realModel,
      realDimension,
      realStructure,
      realColor,
      details,
      sortDetails,
    });
  }
}

console.log(`Total real items: ${items.length}`);

// Group by category
const catGroups = {};
for (const it of items) {
  const key = `${it.cat}/${it.sub}/${it.child}`;
  if (!catGroups[key]) catGroups[key] = [];
  catGroups[key].push(it);
}

for (const [k, list] of Object.entries(catGroups)) {
  console.log(`\n=== Category Path: ${k} (${list.length} items) ===`);
  for (const it of list) {
    console.log(`  [${it.id}] ${it.name} | Model: "${it.realModel}" | Dim: "${it.realDimension}" | Wood: "${it.realStructure}"`);
  }
}

