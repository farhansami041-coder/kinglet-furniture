import prisma from "../src/db/prisma.js";

async function main() {
  const cats = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
  console.log("Categories:", cats);

  const offerProds = await prisma.product.findMany({
    where: {
      OR: [
        { isOffer: true },
        { oldPrice: { gt: 0 } },
        { badge: { contains: "offer" } },
      ],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      oldPrice: true,
      isOffer: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
    },
    take: 10,
  });
  console.log("Sample Offer Products:", offerProds);

  const regProds = await prisma.product.findMany({
    where: {
      isOffer: false,
      OR: [{ oldPrice: null }, { oldPrice: 0 }],
    },
    select: {
      id: true,
      name: true,
      slug: true,
      basePrice: true,
      oldPrice: true,
      isOffer: true,
      category: { select: { name: true, slug: true } },
    },
    take: 5,
  });
  console.log("Sample Regular Products:", regProds);

  const coupons = await prisma.coupon.findMany();
  console.log("Coupons:", coupons);

  await prisma.$disconnect();
}

main().catch(console.error);
