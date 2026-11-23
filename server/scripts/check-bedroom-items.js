import fs from "fs";

let dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf16le");
if (!dump.includes("========================================")) {
  dump = fs.readFileSync("e:/anitigravity/server/scratch/all_items_dump.txt", "utf8");
}

const itemBlocks = dump.split("========================================").slice(1);

const bedroomItems = [];
const allItems = [];

for (const block of itemBlocks) {
  const idMatch = block.match(/ID:\s*(\d+)\s*\|\s*NAME:\s*([^\r\n]+)/);
  if (!idMatch) continue;
  const id = idMatch[1];
  const name = idMatch[2].trim();

  const catMatch = block.match(/Cat:\s*(\d+)\s*\|\s*Sub:\s*(\d+)\s*\|\s*Child:\s*(\d+)/);
  const cat = catMatch ? catMatch[1] : "";
  const sub = catMatch ? catMatch[2] : "";
  const child = catMatch ? catMatch[3] : "";

  allItems.push({ id, name, cat, sub, child });
  if (cat === "63" || name.toLowerCase().includes("bed") || sub === "8" || sub === "53") {
    bedroomItems.push({ id, name, cat, sub, child });
  }
}

console.log(`Total items: ${allItems.length}`);
console.log(`Bedroom or Bed items (${bedroomItems.length}):`);
for (const it of bedroomItems) {
  console.log(`ID: ${it.id.padEnd(4)} | Cat: ${it.cat.padEnd(3)} | Sub: ${it.sub.padEnd(3)} | Child: ${it.child.padEnd(4)} | Name: "${it.name}"`);
}

