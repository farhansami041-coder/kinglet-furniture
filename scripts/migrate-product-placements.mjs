import { prisma } from "../server/src/db/prisma.js";

async function main() {
  console.log("Checking columns in MySQL Product table...");
  const cols = await prisma.$queryRawUnsafe("DESCRIBE Product");
  const fieldNames = cols.map((c) => c.Field);

  if (!fieldNames.includes("isNewArrival")) {
    console.log("Adding isNewArrival column...");
    await prisma.$queryRawUnsafe("ALTER TABLE Product ADD COLUMN isNewArrival BOOLEAN NOT NULL DEFAULT FALSE");
    await prisma.$queryRawUnsafe("CREATE INDEX idx_product_isNewArrival ON Product(isNewArrival)");
  } else {
    console.log("isNewArrival column already exists.");
  }

  if (!fieldNames.includes("isOffer")) {
    console.log("Adding isOffer column...");
    await prisma.$queryRawUnsafe("ALTER TABLE Product ADD COLUMN isOffer BOOLEAN NOT NULL DEFAULT FALSE");
    await prisma.$queryRawUnsafe("CREATE INDEX idx_product_isOffer ON Product(isOffer)");
  } else {
    console.log("isOffer column already exists.");
  }

  if (!fieldNames.includes("isShowroomClassic")) {
    console.log("Adding isShowroomClassic column...");
    await prisma.$queryRawUnsafe("ALTER TABLE Product ADD COLUMN isShowroomClassic BOOLEAN NOT NULL DEFAULT FALSE");
    await prisma.$queryRawUnsafe("CREATE INDEX idx_product_isShowroomClassic ON Product(isShowroomClassic)");
  } else {
    console.log("isShowroomClassic column already exists.");
  }

  console.log("Successfully updated MySQL table Product with placement columns!");

  // Verify
  const updatedCols = await prisma.$queryRawUnsafe("DESCRIBE Product");
  console.log("Updated columns:", updatedCols.map((c) => c.Field));
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});

