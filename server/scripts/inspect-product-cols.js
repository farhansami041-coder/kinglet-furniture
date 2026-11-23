import prisma from "../src/db/prisma.js";

async function main() {
  const cols = await prisma.$queryRawUnsafe("DESCRIBE Product");
  console.log("Product table columns:", cols.map((c) => c.Field));
  await prisma.$disconnect();
}

main().catch(console.error);

