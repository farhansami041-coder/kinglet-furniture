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
  let rawDim = "";
  let realStructure = "";
  let realColor = "";

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const l of lines) {
    const lower = l.toLowerCase();
    if (lower.startsWith("model no") || lower.startsWith("model:")) {
      realModel = l.replace(/^model\s*(no\.?)?\s*[-:]?\s*/i, "").trim();
    } else if (lower.startsWith("dimension")) {
      rawDim = l.replace(/^dimension\s*[-:—]?\s*/i, "").trim();
    } else if (lower.startsWith("structure")) {
      realStructure = l.replace(/^structure\s*(made\s*(by|of))?\s*[-:—]?\s*/i, "").trim();
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
      catId: catMatch ? catMatch[1] : "",
      subId: catMatch ? catMatch[2] : "",
      childId: catMatch ? catMatch[3] : "",
      prevPrice: priceMatch ? parseFloat(priceMatch[1]) : 0,
      discPrice: priceMatch ? parseFloat(priceMatch[2]) : 0,
      stock: priceMatch ? parseInt(priceMatch[3]) : 1,
      sku: skuMatch ? skuMatch[1].trim() : "",
      realModel,
      rawDim,
      realStructure,
      realColor,
      details,
      sortDetails,
    });
  }
}

// Deterministic categorization function
function determineCategory(item) {
  const n = item.name.toLowerCase();
  const d = (item.details + " " + item.sortDetails).toLowerCase();
  const cat = item.catId;
  const sub = item.subId;
  const child = item.childId;

  // 1. BEDROOM
  // Actual Beds
  if (
    (cat === "63" && sub === "8") ||
    (n.endsWith(" bed") && !n.includes("sofa") && !n.includes("cum")) ||
    n === "pure veneer" // item 117 is Pure Veneer Bed (Cat 63/8/24)
  ) {
    let childName = "King Size Bed";
    let childSlug = "king-size-bed";
    let dim = '6.5 ft (L) x 6.0 ft (W) x 3.5 ft (H) / (78" x 72" x 42")';

    if (child === "25" || n.includes("queen") || n === "punama bed" || n === "monal bed" || n === "elegant bed" || n === "woodora bed") {
      childName = "Queen Size Bed";
      childSlug = "queen-size-bed";
      dim = '6.5 ft (L) x 5.0 ft (W) x 3.5 ft (H) / (78" x 60" x 42")';
    } else if (item.rawDim.includes("6x7") || item.rawDim.includes("6 x 7")) {
      dim = '7.0 ft (L) x 6.0 ft (W) x 3.5 ft (H) / (84" x 72" x 42")';
    }

    return {
      main: { name: "Bedroom", slug: "bed-room" },
      sub: { name: "Bed", slug: "bed" },
      child: { name: childName, slug: childSlug },
      dimension: dim,
      wood: item.realStructure.includes("mehgoni") ? "Seasoned Mahogany" : (item.realStructure.includes("shagun") ? "Chittagong Teak (Segun)" : "Canadian Oak Veneer"),
    };
  }

  // Dressing Table
  if (n.includes("dressing table")) {
    let childName = "Box Type Dressing Table";
    let childSlug = "box-type-dressing-table";
    if (child === "40" || n.includes("vanity") || n.includes("sana") || n.includes("rajani") || n.includes("aden") || n.includes("khaimah")) {
      childName = "Vanity Dressing Table";
      childSlug = "vanity";
    }
    return {
      main: { name: "Bedroom", slug: "bed-room" },
      sub: { name: "Dressing Table", slug: "dressing-table" },
      child: { name: childName, slug: childSlug },
      dimension: '3.0 ft (W) x 1.5 ft (D) x 6.0 ft (H) / (36" x 18" x 72")',
      wood: item.realStructure.includes("mehgoni") ? "Seasoned Mahogany" : "Canadian Oak Veneer",
    };
  }

  // Almirah
  if (n.includes("almirah") || n.includes("almira")) {
    let childName = "3 Door Almirah";
    let childSlug = "3-door-almirah";
    let dim = '4.5 ft (W) x 1.8 ft (D) x 6.5 ft (H) / (54" x 22" x 78")';

    if (item.rawDim.includes("4 parts") || child === "155" || n.includes("dijon") || n.includes("kosice") || n.includes("sofia")) {
      childName = "4 Door Almirah";
      childSlug = "4-door-almirah";
      dim = '6.0 ft (W) x 1.8 ft (D) x 6.5 ft (H) / (72" x 22" x 78")';
    } else if (item.rawDim.includes("2 parts") || child === "153" || n.includes("mostar") || n.includes("verona") || n.includes("sunflora")) {
      childName = "2 Door Almirah";
      childSlug = "2-door-almirah";
      dim = '3.0 ft (W) x 1.8 ft (D) x 6.5 ft (H) / (36" x 22" x 78")';
    }

    if (n.includes("mirror")) {
      childName += " with Mirror";
    }

    return {
      main: { name: "Bedroom", slug: "bed-room" },
      sub: { name: "Almirah", slug: "almirah" },
      child: { name: childName, slug: childSlug },
      dimension: dim,
      wood: "Canadian Oak Veneer",
    };
  }

  // Wardrobe
  if (n.includes("wardrobe") || n.includes("wardrupe") || sub === "10") {
    return {
      main: { name: "Bedroom", slug: "bed-room" },
      sub: { name: "Wardrobe", slug: "wardrobe" },
      child: { name: "Modular Wardrobe", slug: "modular-wardrobe" },
      dimension: '3.5 ft (W) x 1.8 ft (D) x 6.5 ft (H) / (42" x 22" x 78")',
      wood: "Canadian Oak Veneer",
    };
  }

  // Bedside Table
  if (n.includes("bedside") || sub === "12") {
    return {
      main: { name: "Bedroom", slug: "bed-room" },
      sub: { name: "Bedside Table", slug: "bedside-table" },
      child: { name: "2-Drawer Bedside Table", slug: "2-drawer-bedside" },
      dimension: '1.7 ft (W) x 1.3 ft (D) x 1.7 ft (H) / (20" x 16" x 20")',
      wood: item.realStructure.includes("mehgoni") ? "Seasoned Mahogany" : "Chittagong Teak (Segun)",
    };
  }

  // Reading Table
  if (n.includes("reading table") || sub === "56") {
    return {
      main: { name: "Bedroom", slug: "bed-room" },
      sub: { name: "Reading Table", slug: "reading-table" },
      child: { name: "Executive Reading Table", slug: "executive-reading-table" },
      dimension: '3.5 ft (W) x 2.0 ft (D) x 2.5 ft (H) / (42" x 24" x 30")',
      wood: "Canadian Oak Veneer",
    };
  }

  // 2. LIVING ROOM
  // Sofa Bed / Bed Cum Sofa
  if (n.includes("bed cum sofa") || n.includes("sofa bed") || child === "6") {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Sofa Set", slug: "sofa-set" },
      child: { name: "Sofa Bed", slug: "sofa-bed" },
      dimension: 'Sofa Mode: 6.0 ft (W) x 2.8 ft (D) x 2.8 ft (H) | Bed Mode: 6.0 ft (L) x 5.0 ft (W)',
      wood: item.realStructure.includes("shagun") ? "Chittagong Teak (Segun)" : "Seasoned Mahogany",
    };
  }

  // Divan
  if (n.includes("divan") || n.includes("diven") || sub === "7") {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Sofa Set", slug: "sofa-set" },
      child: { name: "Divan Lounge", slug: "divan" },
      dimension: '8.0 ft (L) x 2.8 ft (W) x 2.5 ft (H) / (96" x 34" x 30")',
      wood: "Seasoned Mahogany",
    };
  }

  // L-Shaped Sofa
  if (n.includes("l-shaped") || n.includes("l shaped") || child === "1" || item.rawDim.includes("corner")) {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Sofa Set", slug: "sofa-set" },
      child: { name: "L-Shaped Sofa", slug: "l-shaped-sofa" },
      dimension: '10.5 ft (L) x 7.5 ft (W) x 3.0 ft (H) / (126" x 90" x 36")',
      wood: item.realStructure.includes("shagun") ? "Chittagong Teak (Segun)" : "Seasoned Mahogany",
    };
  }

  // Other Sofas
  if (n.includes("sofa") || sub === "2") {
    let childName = "Fabrics Sofa";
    let childSlug = "fabrics-sofa";
    if (child === "7" || child === "5" || d.includes("rexin") || d.includes("leather") || n.includes("rexsin")) {
      childName = "Rexsin Luxury Sofa";
      childSlug = "rexsin-sofa";
    }
    const dim = item.rawDim.includes("2+1")
      ? '2-Seater: 58"(W) x 32"(D) x 34"(H) | 1-Seater: 36"(W) x 32"(D) x 34"(H)'
      : '3-Seater: 78"(W) x 32"(D) x 34"(H) | 2-Seater: 58"(W) x 32"(D) x 34"(H) | 1-Seater: 36"(W) x 32"(D) x 34"(H)';

    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Sofa Set", slug: "sofa-set" },
      child: { name: childName, slug: childSlug },
      dimension: dim,
      wood: item.realStructure.includes("shagun") ? "Chittagong Teak (Segun)" : "Seasoned Mahogany",
    };
  }

  // Center Table
  if (n.includes("center table") || sub === "4") {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Center Table", slug: "center-table" },
      child: { name: "Glass Top Center Table", slug: "glass-top" },
      dimension: '4.0 ft (L) x 2.0 ft (W) x 1.5 ft (H) / (48" x 24" x 18")',
      wood: item.realStructure.includes("mehgoni") ? "Seasoned Mahogany" : "Canadian Oak Veneer",
    };
  }

  // TV Cabinet
  if (n.includes("tv cabinet") || sub === "5") {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "TV Cabinet", slug: "tv-cabinet" },
      child: { name: "Low TV Cabinet", slug: "low-tv-cabinet" },
      dimension: '5.0 ft (L) x 1.3 ft (W) x 1.8 ft (H) / (60" x 16" x 22")',
      wood: "Canadian Oak Veneer",
    };
  }

  // Chair
  if (n.includes("chair") || sub === "3") {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Chair", slug: "chair" },
      child: { name: "Rocking Chair", slug: "rocking-chair" },
      dimension: '2.2 ft (W) x 3.0 ft (D) x 3.2 ft (H) / (26" x 36" x 38")',
      wood: "Chittagong Teak (Segun)",
    };
  }

  // Shoe Rack
  if (n.includes("shoe rack") || sub === "49") {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Shoe Rack", slug: "shoe-rack" },
      child: { name: "Shoe Storage Rack", slug: "shoe-storage-rack" },
      dimension: '3.5 ft (W) x 1.2 ft (D) x 3.0 ft (H) / (42" x 14" x 36")',
      wood: "Canadian Oak Veneer",
    };
  }

  // Cradle / Dolona
  if (n.includes("dolona") || n.includes("cradle") || sub === "83") {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Dolona", slug: "cradle-dolona" },
      child: { name: "Solid Wood Dolona", slug: "solid-wood-dolona" },
      dimension: '4.0 ft (L) x 2.3 ft (W) x 4.5 ft (H) / (48" x 28" x 54")',
      wood: "Seasoned Mahogany",
    };
  }

  // Corner
  if (n.includes("corner") || sub === "84") {
    return {
      main: { name: "Living Room", slug: "living-room" },
      sub: { name: "Corner Table", slug: "corner-table" },
      child: { name: "Corner Shelf", slug: "corner-shelf" },
      dimension: '2.0 ft (W) x 2.0 ft (D) x 2.5 ft (H) / (24" x 24" x 30")',
      wood: "Canadian Oak Veneer",
    };
  }

  // 3. DINING ROOM
  // Dining Table Set
  if (n.includes("dining") || sub === "15") {
    let childName = "6 Seater Dining Set";
    let childSlug = "6-seater-dining-set";
    let dim = '6.0 ft (L) x 3.5 ft (W) x 2.5 ft (H) / (72" x 42" x 30")';

    if (item.rawDim.includes("5.5x3.25") || item.rawDim.includes("5.5x3.5")) {
      dim = '5.5 ft (L) x 3.25 ft (W) x 2.5 ft (H) / (66" x 39" x 30")';
    } else if (item.rawDim.includes("round") || item.rawDim.includes("4.5")) {
      dim = '4.5 ft Diameter x 2.5 ft (H) / (54" Dia x 30" H)';
      childName = "Round Dining Table";
      childSlug = "round-dining-table";
    }

    if (n.includes("marble") || d.includes("marble")) {
      childName = "Marble Top Dining Set";
      childSlug = "marble-top-dining";
    }

    return {
      main: { name: "Dining", slug: "dining" },
      sub: { name: "Dining Table Set", slug: "dining-table-set" },
      child: { name: childName, slug: childSlug },
      dimension: dim,
      wood: item.realStructure.includes("shagun") ? "Chittagong Teak (Segun)" : "Seasoned Mahogany",
    };
  }

  // Showcase / Bar Cabinet
  if (n.includes("showcase") || n.includes("bar table") || sub === "16") {
    let childName = "Crockery Showcase";
    let childSlug = "crockery-showcase";
    let dim = '4.5 ft (W) x 1.5 ft (D) x 6.5 ft (H) / (54" x 18" x 78")';

    if (n.includes("bar")) {
      childName = "Bar Cabinet & Table";
      childSlug = "bar-cabinet";
      dim = 'Table: 48"(L) x 20"(W) x 40"(H) | Stool: 16"(Dia) x 30"(H)';
    }

    return {
      main: { name: "Dining", slug: "dining" },
      sub: { name: "Showcase", slug: "showcase" },
      child: { name: childName, slug: childSlug },
      dimension: dim,
      wood: "Canadian Oak Veneer",
    };
  }

  // Fallback
  return {
    main: { name: "Living Room", slug: "living-room" },
    sub: { name: "General Furniture", slug: "general-furniture" },
    child: { name: "Handcrafted Furniture", slug: "handcrafted-furniture" },
    dimension: 'Standard Mastercrafted Dimensions',
    wood: "Seasoned Mahogany",
  };
}

// Test mapping on all 92 items
console.log("=== MAPPING RESULTS FOR ALL 92 REAL ITEMS ===");
const breakdown = {};

for (const it of items) {
  const cat = determineCategory(it);
  const path = `${cat.main.name} -> ${cat.sub.name} -> ${cat.child.name}`;
  breakdown[path] = (breakdown[path] || 0) + 1;
  console.log(`[${it.id.padEnd(3)}] ${it.name.padEnd(38)} | SKU/Model: ${(it.realModel || it.sku).padEnd(15)} | ${path}`);
  console.log(`      Dimensions: "${cat.dimension}"`);
}

console.log("\n=== CATEGORY BREAKDOWN SUMMARY ===");
for (const [p, c] of Object.entries(breakdown)) {
  console.log(`  ${p.padEnd(55)} : ${c} products`);
}

