import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Bank EMI schedule into database...");

  const emiRates = [
    { tenure: 3, label: "3 Months", rate: 6.00 },
    { tenure: 6, label: "6 Months", rate: 6.50 },
    { tenure: 9, label: "9 Months", rate: 6.95 },
    { tenure: 12, label: "12 Months", rate: 9.29 },
    { tenure: 18, label: "18 Months", rate: 12.99 },
    { tenure: 24, label: "24 Months", rate: 18.34 },
    { tenure: 30, label: "30 Months", rate: 19.76 },
    { tenure: 36, label: "36 Months", rate: 24.22 },
  ];

  await prisma.websiteSetting.upsert({
    where: { key: "emi_tenures_available" },
    update: { value: "3,6,9,12,18,24,30,36", group: "payment" },
    create: {
      key: "emi_tenures_available",
      value: "3,6,9,12,18,24,30,36",
      group: "payment",
      description: "Comma-separated Bank EMI installment tenures in months (3,6,9,12,18,24,30,36)",
    },
  });

  await prisma.websiteSetting.upsert({
    where: { key: "emi_rates_json" },
    update: { value: JSON.stringify(emiRates), group: "payment" },
    create: {
      key: "emi_rates_json",
      value: JSON.stringify(emiRates),
      group: "payment",
      description: "Official Bank EMI interest rates per tenure",
    },
  });

  console.log("✅ Bank EMI schedule seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
