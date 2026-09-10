import { prisma } from "./client";

async function main() {
  console.log("🌱 Invocando seed do banco de dados Concierge / Ostras.ai...");

  // Create demo restaurant
  const demoRestaurant = await prisma.restaurant.upsert({
    where: { slug: "degusta-burger" },
    update: {},
    create: {
      name: "Degusta Burger & Grill",
      slug: "degusta-burger",
      phone: "11988887777",
      address: "Av. Costeira, 1200 - Centro",
      openingHours: "18:00 às 23:30",
      status: "OPEN",
      estimatedTimeMin: 25,
      estimatedTimeMax: 45,
      deliveryEnabled: true,
      pickupEnabled: true,
      fixedDeliveryFee: 7.5,
      minOrderAmount: 20.0,
      rating: 4.9,
      priceTier: 2,
    },
  });

  console.log(`✅ Restaurante demo criado: ${demoRestaurant.name} (${demoRestaurant.id})`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
