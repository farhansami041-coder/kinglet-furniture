import prisma from "../src/db/prisma.js";

async function test() {
  console.log("Testing settings persistence in MySQL...");
  // Test upsert
  await prisma.websiteSetting.upsert({
    where: { key: "test_dynamic_sync" },
    update: { value: "working_100_percent" },
    create: { key: "test_dynamic_sync", value: "working_100_percent", group: "test" },
  });

  const check = await prisma.websiteSetting.findUnique({ where: { key: "test_dynamic_sync" } });
  console.log("Read back from DB:", check.key, "=", check.value);

  // Clean up
  await prisma.websiteSetting.delete({ where: { key: "test_dynamic_sync" } });
  console.log("Cleaned up test setting.");
  await prisma.$disconnect();
}

test().catch(console.error);

