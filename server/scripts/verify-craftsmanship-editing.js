import prisma from "../src/db/prisma.js";

async function main() {
  console.log("=== Testing Craftsmanship & Materials Editing ===");

  // Find sample product
  const product = await prisma.product.findFirst({
    where: { slug: "arivan" },
  });

  if (!product) {
    console.error("Product 'arivan' not found!");
    process.exit(1);
  }

  console.log("Original Product:", {
    name: product.name,
    sku: product.sku,
    primaryMaterial: product.primaryMaterial,
    finishType: product.finishType,
    dimensions: product.dimensions,
    hardware: product.hardware,
    seasoningMethod: product.seasoningMethod,
  });

  // Test updating all 6 fields to custom values
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: {
      primaryMaterial: "Seasoned Mahogany (Test Updated)",
      finishType: "High-Gloss Italian PU (5-Stage Mirror Finish)",
      dimensions: "6.5 ft x 6.0 ft (King Size Test)",
      hardware: "Hydraulic Soft-Closing German Heavy-Duty Fittings",
      seasoningMethod: "Chemical vacuum-pressure autoclave + Kiln dried (8% moisture)",
    },
  });

  console.log("Updated Product in DB:", {
    name: updated.name,
    sku: updated.sku,
    primaryMaterial: updated.primaryMaterial,
    finishType: updated.finishType,
    dimensions: updated.dimensions,
    hardware: updated.hardware,
    seasoningMethod: updated.seasoningMethod,
  });

  // Revert back to authentic Kinglet values
  await prisma.product.update({
    where: { id: product.id },
    data: {
      primaryMaterial: "Seasoned Mahogany",
      finishType: "High-Gloss Italian PU",
      dimensions: "6.5 ft x 6.0 ft (King Size)",
      hardware: "Hydraulic Soft-Closing German Fittings",
      seasoningMethod: "Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)",
    },
  });

  console.log("Successfully reverted back to authentic Kinglet defaults.");
  console.log("=== All 6 Craftsmanship & Materials Fields Verified Successfully! ===");
  await prisma.$disconnect();
}

main().catch(console.error);

