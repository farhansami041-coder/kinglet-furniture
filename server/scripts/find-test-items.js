import fs from "fs";

let dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf16le");
if (!dump.includes("========================================")) {
  dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf8");
}

const itemBlocks = dump.split("========================================").slice(1);

const testItems = [];
const realItems = [];

for (const block of itemBlocks) {
  const idMatch = block.match(/ID:\s*(\d+)\s*\|\s*NAME:\s*([^\r\n]+)/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const name = idMatch[2].trim();

  const skuMatch = block.match(/SKU:\s*([^\s|]+)\s*\|\s*Model:\s*([^\r\n]*)/);
  const catMatch = block.match(/Cat:\s*(\d+)\s*\|\s*Sub:\s*(\d+)\s*\|\s*Child:\s*(\d+)/);

  // Check if test item
  const lowerName = name.toLowerCase();
  const isTest = (
    lowerName === "hfdddf" ||
    lowerName === "kk" ||
    lowerName === "master room" ||
    lowerName === "m t r" ||
    lowerName === "c sofa" ||
    lowerName === "sofa r" ||
    lowerName.length < 3 ||
    (lowerName.includes("test") && !lowerName.includes("latest"))
  );

  if (isTest) {
    testItems.push({ id, name, sku: skuMatch ? skuMatch[1] : "", cat: catMatch ? `${catMatch[1]}/${catMatch[2]}/${catMatch[3]}` : "" });
  } else {
    realItems.push({ id, name, sku: skuMatch ? skuMatch[1] : "", cat: catMatch ? `${catMatch[1]}/${catMatch[2]}/${catMatch[3]}` : "" });
  }
}

console.log(`Real items: ${realItems.length}`);
console.log(`Test items: ${testItems.length}`);
console.log("\nTest items found:");
testItems.forEach(t => console.log(`ID ${t.id}: "${t.name}" (Cat: ${t.cat})`));

