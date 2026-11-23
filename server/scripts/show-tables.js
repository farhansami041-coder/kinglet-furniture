import prisma from "../src/db/prisma.js";

async function show() {
  const tables = await prisma.$queryRawUnsafe("SHOW TABLES");
  console.log("Current tables in kinglet_db:", tables.map(t => Object.values(t)[0]));
  await prisma.$disconnect();
}

show().catch(console.error);

