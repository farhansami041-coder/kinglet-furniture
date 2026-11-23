import prisma from "../src/db/prisma.js";

async function inspectDb() {
  const products = await prisma.product.findMany({
    include: {
      category: {
        include: {
          parent: {
            include: { parent: true }
          }
        }
      }
    }
  });

  console.log("Total products in DB:", products.length);

  for (const p of products) {
    let catPath = p.category ? p.category.name : "NO CAT";
    if (p.category?.parent) {
      catPath = p.category.parent.name + " -> " + catPath;
      if (p.category.parent.parent) {
        catPath = p.category.parent.parent.name + " -> " + catPath;
      }
    }
    console.log(`[${p.id}] ${p.name}`);
    console.log(`    Category Path: ${catPath} (Cat ID: ${p.categoryId}, slug: ${p.category?.slug})`);
    console.log(`    Dimensions: "${p.dimensions}" | SKU: "${p.sku}"`);
  }
}

inspectDb().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

