import { NAV_CATEGORIES } from "../src/data/kingletData.js";
import prisma from "../server/src/db/prisma.js";

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

async function seedAllLevel3ChildCategories() {
  console.log("=== SYNCHRONIZING ALL 170+ FRONTEND CHILD CATEGORIES INTO DATABASE ===");

  const existingCategories = await prisma.category.findMany();
  const slugSet = new Set(existingCategories.map((c) => c.slug));

  let createdL1 = 0;
  let createdL2 = 0;
  let createdL3 = 0;

  for (const parent of NAV_CATEGORIES) {
    // 1. Ensure Parent (Level 1)
    let parentDb = existingCategories.find(
      (c) => (c.slug === parent.slug || c.name.toLowerCase() === parent.name.toLowerCase()) && !c.parentId
    );

    if (!parentDb) {
      console.log(`[+] Creating Level 1 Parent: ${parent.name} (${parent.slug})`);
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
      slugSet.add(parent.slug);
      createdL1++;
    }

    if (!parent.subcategories || parent.subcategories.length === 0) continue;

    for (let subIdx = 0; subIdx < parent.subcategories.length; subIdx++) {
      const sub = parent.subcategories[subIdx];
      const cleanSubName = sub.name.trim();

      // 2. Ensure Subcategory (Level 2)
      let subDb = existingCategories.find(
        (c) =>
          c.parentId === parentDb.id &&
          (c.name.toLowerCase() === cleanSubName.toLowerCase() || c.slug === sub.slug)
      );

      if (!subDb) {
        let subSlug = sub.slug;
        if (slugSet.has(subSlug)) {
          subSlug = `${parent.slug}-${sub.slug}`;
        }
        console.log(`[+] Creating Level 2 Subcategory: ${parent.name} ➔ ${cleanSubName} (${subSlug})`);
        subDb = await prisma.category.create({
          data: {
            parentId: parentDb.id,
            name: cleanSubName,
            slug: subSlug,
            description: `${cleanSubName} in ${parent.name}`,
            displayOrder: subIdx,
            isActive: true,
          },
        });
        existingCategories.push(subDb);
        slugSet.add(subSlug);
        createdL2++;
      }

      // 3. Ensure Child Category (Level 3)
      if (!sub.children || sub.children.length === 0) continue;

      for (let childIdx = 0; childIdx < sub.children.length; childIdx++) {
        const childName = sub.children[childIdx].trim();

        // Check if child already exists under this subDb
        let childDb = existingCategories.find(
          (c) =>
            c.parentId === subDb.id &&
            c.name.toLowerCase() === childName.toLowerCase()
        );

        if (childDb) {
          // Already exists
          continue;
        }

        // Determine unique slug
        let baseSlug = slugify(childName);
        if (!baseSlug) baseSlug = `child-${childIdx + 1}`;
        let childSlug = baseSlug;

        if (slugSet.has(childSlug)) {
          childSlug = `${subDb.slug}-${baseSlug}`;
        }
        if (slugSet.has(childSlug)) {
          childSlug = `${parentDb.slug}-${subDb.slug}-${baseSlug}`;
        }
        let counter = 1;
        while (slugSet.has(childSlug)) {
          childSlug = `${subDb.slug}-${baseSlug}-${counter++}`;
        }

        console.log(`[+] Creating Level 3 Child: ${parent.name} ➔ ${sub.name} ➔ ${childName} (${childSlug})`);
        childDb = await prisma.category.create({
          data: {
            parentId: subDb.id,
            name: childName,
            slug: childSlug,
            description: `${childName} - ${sub.name} collection`,
            displayOrder: childIdx,
            isActive: true,
          },
        });
        existingCategories.push(childDb);
        slugSet.add(childSlug);
        createdL3++;
      }
    }
  }

  console.log(`\n=== SEEDING COMPLETE ===`);
  console.log(`Created Level 1 Parents: ${createdL1}`);
  console.log(`Created Level 2 Subcategories: ${createdL2}`);
  console.log(`Created Level 3 Children: ${createdL3}`);

  const totalInDb = await prisma.category.count();
  console.log(`Total Categories now in Database: ${totalInDb}`);

  // Verification breakdown for Bedroom > Bed and Bedroom > Almirah
  const bedSub = await prisma.category.findFirst({
    where: { name: "Bed", parent: { name: "Bedroom" } },
    include: { subcategories: true },
  });
  if (bedSub) {
    console.log(`\nBedroom > Bed has ${bedSub.subcategories.length} children in DB:`);
    bedSub.subcategories.forEach((c) => console.log(`   - ${c.name} (${c.slug})`));
  }

  const almirahSub = await prisma.category.findFirst({
    where: { name: "Almirah", parent: { name: "Bedroom" } },
    include: { subcategories: true },
  });
  if (almirahSub) {
    console.log(`\nBedroom > Almirah has ${almirahSub.subcategories.length} children in DB:`);
    almirahSub.subcategories.forEach((c) => console.log(`   - ${c.name} (${c.slug})`));
  }
}

seedAllLevel3ChildCategories()
  .catch((e) => {
    console.error("Error seeding categories:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

