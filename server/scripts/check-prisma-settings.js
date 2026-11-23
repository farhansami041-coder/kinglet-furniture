import prisma from "../src/db/prisma.js";

async function main() {
  const rows = await prisma.websiteSetting.findMany({ orderBy: { key: "asc" } });
  console.log("Total settings in DB:", rows.length);
  rows.forEach((r) => {
    console.log(`${r.key}: ${r.value ? r.value.substring(0, 60) : "(empty)"}`);
  });
  await prisma.$disconnect();
}

main().catch(console.error);

