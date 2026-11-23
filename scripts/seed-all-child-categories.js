import { NAV_CATEGORIES } from "../src/data/kingletData.js";
import prisma from "../server/src/db/prisma.js";

async function seedAllMissingChildCategories() {
  console.log("=== SYNCHRONIZING ALL PARENT & CHILD CATEGORIES INTO DATABASE ===");

  const existingCategories = await prisma.category.findMany();
  const slugMap = new Map(existingCategories.map((c) => [c.slug, c]));
  const nameMap = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c]));

  let createdCount = 0;
  let updatedCount = 0;

  for (const parent of NAV_CATEGORIES) {
    // 1. Ensure Parent Category Exists
    let parentDb = existingCategories.find(
      (c) => (c.slug === parent.slug || c.name.toLowerCase() === parent.name.toLowerCase()) && !c.parentId
    );

    if (!parentDb) {
      console.log(`[+] Creating missing Parent Category: ${parent.name} (${parent.slug})`);
      parentDb = await prisma.category.create({
        data: {
          name: parent.name,
          slug: parent.slug,
          description: parent.description || `${parent.name} collection`,
          displayOrder: 0,
          isActive: true,
        },
      });
      existingCategories.push(parentDb);
      createdCount++;
    }

    if (!parent.subcategories || parent.subcategories.length === 0) continue;

    // 2. Ensure every Child Subcategory exists under this Parent
    for (let idx = 0; idx < parent.subcategories.length; idx++) {
      const sub = parent.subcategories[idx];
      const cleanSubName = sub.name.trim();

      // Check if child category already exists under this parent
      const existingChild = existingCategories.find(
        (c) =>
          c.parentId === parentDb.id &&
          (c.name.toLowerCase() === cleanSubName.toLowerCase() || c.slug === sub.slug)
      );

      if (existingChild) {
        console.log(`[✓] Exists: ${parent.name} ➔ ${existingChild.name}`);
        continue;
      }

      // Check if slug is taken globally
      let candidateSlug = sub.slug;
      if (slugMap.has(candidateSlug)) {
        candidateSlug = `${parent.slug}-${sub.slug}`;
      }

      console.log(`[+] Creating Child Category: ${parent.name} ➔ ${cleanSubName} (slug: ${candidateSlug})`);

      const newChild = await prisma.category.create({
        data: {
          name: cleanSubName,
          slug: candidateSlug,
          parentId: parentDb.id,
          description: `${cleanSubName} under ${parent.name} collection. Handcrafted from authentic seasoned wood.`,
          displayOrder: idx + 1,
          isActive: true,
        },
      });

      existingCategories.push(newChild);
      slugMap.set(newChild.slug, newChild);
      createdCount++;
    }
  }

  console.log(`\n=== SYNC COMPLETE: Created ${createdCount} new categories ===`);

  // Final summary of categories by Parent
  const finalCats = await prisma.category.findMany({
    include: { subcategories: true, parent: true },
    orderBy: { name: "asc" },
  });

  const parents = finalCats.filter((c) => !c.parentId);
  console.log(`Total Parent Categories in DB: ${parents.length}`);
  parents.forEach((p) => {
    console.log(`\n📁 ${p.name} (${p.subcategories.length} subcategories):`);
    p.subcategories.forEach((sc) => {
      console.log(`   ↳ ${sc.name} (slug: ${sc.slug})`);
    });
  });

  await prisma.$disconnect();
}

seedAllMissingChildCategories().catch((e) => {
  console.error("Error during category seeding:", e);
  process.exit(1);
});

