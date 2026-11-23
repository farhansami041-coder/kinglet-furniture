import fs from "fs";

let dump;
try {
  dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf16le");
  if (!dump.includes("========================================")) {
    dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf8");
  }
} catch (e) {
  dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf8");
}

const itemBlocks = dump.split("========================================").slice(1);
console.log(`Analyzing ${itemBlocks.length} item blocks...`);

const parsed = [];

for (const block of itemBlocks) {
  const idMatch = block.match(/ID:\s*(\d+)\s*\|\s*NAME:\s*([^\r\n]+)/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const name = idMatch[2].trim();

  const catMatch = block.match(/Cat:\s*(\d+)\s*\|\s*Sub:\s*(\d+)\s*\|\s*Child:\s*(\d+)/);
  const skuMatch = block.match(/SKU:\s*([^\s|]+)\s*\|\s*Model:\s*([^\r\n]*)/);

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

  parsed.push({
    id,
    name,
    cat: catMatch ? { cat: catMatch[1], sub: catMatch[2], child: catMatch[3] } : {},
    rawModel: skuMatch ? skuMatch[2].trim() : "",
    sku: skuMatch ? skuMatch[1].trim() : "",
    realModel,
    realDimension,
    realStructure,
    realColor,
  });
}

console.log(`Parsed ${parsed.length} items.`);
let countWithDim = 0;
let countWithModel = 0;

for (const p of parsed) {
  if (p.realDimension) countWithDim++;
  if (p.realModel) countWithModel++;
  console.log(`[ID ${p.id}] ${p.name}`);
  console.log(`   Cat: ${p.cat.cat}/${p.cat.sub}/${p.cat.child}`);
  console.log(`   Model: "${p.realModel}" | Dim: "${p.realDimension}" | Wood: "${p.realStructure}" | Color: "${p.realColor}"`);
}

console.log(`\nSummary: ${countWithDim} items have real Dimension extracted. ${countWithModel} items have real Model extracted.`);
