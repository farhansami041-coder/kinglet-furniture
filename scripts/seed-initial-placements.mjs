import { prisma } from "../server/src/db/prisma.js";

async function main() {
  const allProducts = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, basePrice: true, oldPrice: true },
  });

  console.log(`Found ${allProducts.length} products to assign smart initial placements.`);

  // 1. Initial Offers: products with oldPrice > basePrice
  const discounted = allProducts.filter((p) => p.oldPrice && p.oldPrice > p.basePrice);
  const offerIds = discounted.slice(0, 8).map((p) => p.id);
  if (offerIds.length > 0) {
    await prisma.product.updateMany({
      where: { id: { in: offerIds } },
      data: { isOffer: true },
    });
    console.log(`Set isOffer: true for ${offerIds.length} products.`);
  }

  // 2. Initial New Arrivals: top 8 products
  const newArrivalIds = allProducts.slice(0, 8).map((p) => p.id);
  await prisma.product.updateMany({
    where: { id: { in: newArrivalIds } },
    data: { isNewArrival: true },
  });
  console.log(`Set isNewArrival: true for ${newArrivalIds.length} products.`);

  // 3. Initial Showroom Classics: next 8 products
  const showroomIds = allProducts.slice(4, 12).map((p) => p.id);
  await prisma.product.updateMany({
    where: { id: { in: showroomIds } },
    data: { isShowroomClassic: true },
  });
  console.log(`Set isShowroomClassic: true for ${showroomIds.length} products.`);

  process.exit(0);
}

main().catch(console.error);

