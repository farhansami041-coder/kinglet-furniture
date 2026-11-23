const norm = (s) => (s || "").toLowerCase().replace(/[-\s]/g, "");

const matchesSubcategory = (p, subSlug) => {
  if (!subSlug || subSlug === "all") return true;
  const subNorm = norm(subSlug);
  const pSubNorm = norm(p.subcategory || p.subcategorySlug);
  const pSubLabelNorm = norm(p.subcategoryLabel);

  if (pSubNorm === subNorm || pSubLabelNorm === subNorm) return true;

  if (subNorm === "bed") {
    return pSubNorm === "bed" || pSubLabelNorm === "bed";
  }
  if (subNorm === "dressingtable") {
    return pSubNorm === "dressingtable" || pSubLabelNorm === "dressingtable" || pSubNorm === "dressing-table";
  }
  if (subNorm === "almirah") {
    return pSubNorm === "almirah" || pSubLabelNorm === "almirah" || pSubNorm === "almira";
  }
  if (subNorm === "bedsidetable") {
    return pSubNorm === "bedsidetable" || pSubLabelNorm === "bedsidetable" || pSubNorm === "bedside-table";
  }
  if (subNorm === "wardrobe") {
    return pSubNorm === "wardrobe" || pSubLabelNorm === "wardrobe";
  }
  if (subNorm === "readingtable") {
    return pSubNorm === "readingtable" || pSubLabelNorm === "readingtable" || pSubNorm === "reading-table";
  }

  return false;
};

async function testFrontendFilter() {
  const res = await fetch("http://localhost:5000/api/v1/products?limit=250");
  const json = await res.json();
  const products = json.data;

  console.log(`Fetched ${products.length} products from live API.`);

  // 1. Bedroom products
  const bedroomProducts = products.filter(p => norm(p.category) === "bedroom" || norm(p.category) === "bedroom");
  console.log(`Total Bedroom products: ${bedroomProducts.length}`);

  // 2. Bed subcategory
  const beds = bedroomProducts.filter(p => matchesSubcategory(p, "bed"));
  console.log(`\n--- Beds (${beds.length} products) ---`);
  beds.forEach(b => console.log(`  [${b.sku}] ${b.name} (${b.subcategoryLabel} > ${b.childCategoryLabel}) -> Dims: "${b.dimensions}"`));

  // 3. Dressing tables
  const dressingTables = bedroomProducts.filter(p => matchesSubcategory(p, "dressing-table"));
  console.log(`\n--- Dressing Tables (${dressingTables.length} products) ---`);
  dressingTables.forEach(d => console.log(`  [${d.sku}] ${d.name} (${d.subcategoryLabel} > ${d.childCategoryLabel}) -> Dims: "${d.dimensions}"`));

  // 4. Almirahs
  const almirahs = bedroomProducts.filter(p => matchesSubcategory(p, "almirah"));
  console.log(`\n--- Almirahs (${almirahs.length} products) ---`);
  almirahs.forEach(a => console.log(`  [${a.sku}] ${a.name} (${a.subcategoryLabel} > ${a.childCategoryLabel}) -> Dims: "${a.dimensions}"`));

  // 5. Check if any non-bed is in beds
  const invalidInBeds = beds.filter(b => norm(b.subcategorySlug) !== "bed");
  console.log(`\nInvalid items inside Beds: ${invalidInBeds.length}`);
  if (invalidInBeds.length > 0) {
    console.error("FAIL: Non-beds found:", invalidInBeds);
    process.exit(1);
  } else {
    console.log("PASS: 100% of products inside Beds are actual beds!");
  }
}

testFrontendFilter().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
