import prisma from "../src/db/prisma.js";

async function main() {
  console.log("Checking and adding hardware & seasoningMethod columns to Product table...");
  const cols = await prisma.$queryRawUnsafe("DESCRIBE Product");
  const colNames = cols.map((c) => c.Field);

  if (!colNames.includes("hardware")) {
    console.log("Adding hardware column...");
    await prisma.$executeRawUnsafe(
      "ALTER TABLE Product ADD COLUMN hardware VARCHAR(255) NULL DEFAULT 'Hydraulic Soft-Closing German Fittings'"
    );
    console.log("Added hardware column.");
  } else {
    console.log("hardware column already exists.");
  }

  if (!colNames.includes("seasoningMethod")) {
    console.log("Adding seasoningMethod column...");
    await prisma.$executeRawUnsafe(
      "ALTER TABLE Product ADD COLUMN seasoningMethod VARCHAR(500) NULL DEFAULT 'Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)'"
    );
    console.log("Added seasoningMethod column.");
  } else {
    console.log("seasoningMethod column already exists.");
  }

  // Populate any nulls with default authentic values
  await prisma.$executeRawUnsafe(
    "UPDATE Product SET hardware = 'Hydraulic Soft-Closing German Fittings' WHERE hardware IS NULL OR hardware = ''"
  );
  await prisma.$executeRawUnsafe(
    "UPDATE Product SET seasoningMethod = 'Chemical vacuum-pressure impregnation + Kiln dried (10% moisture)' WHERE seasoningMethod IS NULL OR seasoningMethod = ''"
  );

  const updatedCols = await prisma.$queryRawUnsafe("DESCRIBE Product");
  console.log("Updated Product columns:", updatedCols.map((c) => c.Field));

  const sample = await prisma.$queryRawUnsafe(
    "SELECT id, name, sku, primaryMaterial, finishType, dimensions, hardware, seasoningMethod FROM Product LIMIT 1"
  );
  console.log("Sample product row:", sample[0]);

  await prisma.$disconnect();
}

main().catch(console.error);

