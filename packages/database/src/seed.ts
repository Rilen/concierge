import { prisma } from "./client";

async function main() {
  console.log("🌱 Invocando seed do banco de dados Concierge / Ostras.ai...");

  console.log("🍕 Criando restaurante modelo: Pizzaria Mamma Mia (Costazul, Rio das Ostras)...");

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "pizzaria-mamma-mia" },
    update: {
      name: "Pizzaria Mamma Mia",
      phone: "22999998877",
      address: "Rua da Praia, 450 - Costazul, Rio das Ostras - RJ",
      openingHours: "17:00 às 23:30",
      status: "OPEN",
      estimatedTimeMin: 25,
      estimatedTimeMax: 45,
      deliveryEnabled: true,
      pickupEnabled: true,
      fixedDeliveryFee: 8.0,
      minOrderAmount: 25.0,
      commissionRate: 0.005,
      rating: 4.8,
      priceTier: 2,
    },
    create: {
      name: "Pizzaria Mamma Mia",
      slug: "pizzaria-mamma-mia",
      phone: "22999998877",
      address: "Rua da Praia, 450 - Costazul, Rio das Ostras - RJ",
      openingHours: "17:00 às 23:30",
      status: "OPEN",
      estimatedTimeMin: 25,
      estimatedTimeMax: 45,
      deliveryEnabled: true,
      pickupEnabled: true,
      fixedDeliveryFee: 8.0,
      minOrderAmount: 25.0,
      commissionRate: 0.005,
      rating: 4.8,
      priceTier: 2,
    },
  });

  console.log(`✅ Restaurante: ${restaurant.name} (${restaurant.id})`);

  // Clean existing menu data for idempotent re-seed
  await prisma.productOption.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.productOptionGroup.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.product.deleteMany({ where: { restaurantId: restaurant.id } });
  await prisma.category.deleteMany({ where: { restaurantId: restaurant.id } });

  console.log("📋 Criando categorias...");

  const catPizzasTrad = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Pizzas Tradicionais",
      description: "Pizzas clássicas da tradição italiana",
      displayOrder: 0,
    },
  });

  const catPizzasEspeciais = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Pizzas Especiais",
      description: "Pizzas gourmet e especiais da casa",
      displayOrder: 1,
    },
  });

  const catBebidas = await prisma.category.create({
    data: {
      restaurantId: restaurant.id,
      name: "Bebidas",
      description: "Refrigerantes, sucos e outras bebidas",
      displayOrder: 2,
    },
  });

  console.log("🍕 Criando produtos e grupos de opções...");

  // Sabores de pizza (shared across products)
  const saboresOptions = [
    { name: "Calabresa", price: 0.0, displayOrder: 0 },
    { name: "Margherita", price: 0.0, displayOrder: 1 },
    { name: "Portuguesa", price: 3.5, displayOrder: 2 },
    { name: "Quatro Queijos", price: 2.5, displayOrder: 3 },
    { name: "Frango com Catupiry", price: 4.0, displayOrder: 4 },
    { name: "Pepperoni", price: 5.0, displayOrder: 5 },
    { name: "Vegetariana", price: 0.0, displayOrder: 6 },
  ];

  const bordaOptions = [
    { name: "Sem Borda", price: 0.0, displayOrder: 0 },
    { name: "Catupiry", price: 5.0, displayOrder: 1 },
    { name: "Cheddar", price: 5.0, displayOrder: 2 },
    { name: "Chocolate", price: 6.0, displayOrder: 3 },
  ];

  // Pizza Grande (2 Sabores)
  const pizzaGrande = await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catPizzasTrad.id,
      name: "Pizza Grande (2 Sabores)",
      description: "Pizza grande média com até 2 sabores diferentes",
      price: 45.0,
      displayOrder: 0,
    },
  });

  // Sabores group (minSelect: 1, maxSelect: 2, required: true)
  const saboresGroupGrande = await prisma.productOptionGroup.create({
    data: {
      restaurantId: restaurant.id,
      productId: pizzaGrande.id,
      name: "Sabores",
      minSelect: 1,
      maxSelect: 2,
      required: true,
      displayOrder: 0,
    },
  });

  await prisma.productOption.createMany({
    data: saboresOptions.map((opt) => ({
      restaurantId: restaurant.id,
      optionGroupId: saboresGroupGrande.id,
      name: opt.name,
      price: opt.price,
      displayOrder: opt.displayOrder,
    })),
  });

  // Borda Recheada group (minSelect: 0, maxSelect: 1)
  const bordaGroupGrande = await prisma.productOptionGroup.create({
    data: {
      restaurantId: restaurant.id,
      productId: pizzaGrande.id,
      name: "Borda",
      minSelect: 0,
      maxSelect: 1,
      required: false,
      displayOrder: 1,
    },
  });

  await prisma.productOption.createMany({
    data: bordaOptions.map((opt) => ({
      restaurantId: restaurant.id,
      optionGroupId: bordaGroupGrande.id,
      name: opt.name,
      price: opt.price,
      displayOrder: opt.displayOrder,
    })),
  });

  // Pizza Média (1 Sabor)
  const pizzaMedia = await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catPizzasTrad.id,
      name: "Pizza Média (1 Sabor)",
      description: "Pizza média com 1 sabor",
      price: 32.0,
      displayOrder: 1,
    },
  });

  const saboresGroupMedia = await prisma.productOptionGroup.create({
    data: {
      restaurantId: restaurant.id,
      productId: pizzaMedia.id,
      name: "Sabores",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      displayOrder: 0,
    },
  });

  await prisma.productOption.createMany({
    data: saboresOptions.map((opt) => ({
      restaurantId: restaurant.id,
      optionGroupId: saboresGroupMedia.id,
      name: opt.name,
      price: opt.price,
      displayOrder: opt.displayOrder,
    })),
  });

  const bordaGroupMedia = await prisma.productOptionGroup.create({
    data: {
      restaurantId: restaurant.id,
      productId: pizzaMedia.id,
      name: "Borda",
      minSelect: 0,
      maxSelect: 1,
      required: false,
      displayOrder: 1,
    },
  });

  await prisma.productOption.createMany({
    data: bordaOptions.map((opt) => ({
      restaurantId: restaurant.id,
      optionGroupId: bordaGroupMedia.id,
      name: opt.name,
      price: opt.price,
      displayOrder: opt.displayOrder,
    })),
  });

  // Pizza Especial Trufada
  await prisma.product.create({
    data: {
      restaurantId: restaurant.id,
      categoryId: catPizzasEspeciais.id,
      name: "Pizza Especial Trufada",
      description: "Massa fina, molho de trufa, mussarela de búfala e rúcula",
      price: 58.0,
      displayOrder: 0,
    },
  });

  // Bebidas
  await prisma.product.createMany({
    data: [
      {
        restaurantId: restaurant.id,
        categoryId: catBebidas.id,
        name: "Refrigerante Lata",
        description: "Coca-Cola, Pepsi ou Guaraná",
        price: 7.0,
        displayOrder: 0,
      },
      {
        restaurantId: restaurant.id,
        categoryId: catBebidas.id,
        name: "Suco Natural (500ml)",
        description: "Sabor de manga, abacaxi ou laranja",
        price: 9.0,
        displayOrder: 1,
      },
      {
        restaurantId: restaurant.id,
        categoryId: catBebidas.id,
        name: "Água Mineral",
        description: "Água mineral sem gás 500ml",
        price: 4.0,
        displayOrder: 2,
      },
    ],
  });

  // Count totals
  const totalCategories = await prisma.category.count({ where: { restaurantId: restaurant.id } });
  const totalProducts = await prisma.product.count({ where: { restaurantId: restaurant.id } });
  const totalOptions = await prisma.productOption.count({ where: { restaurantId: restaurant.id } });

  console.log(`✅ Seed concluído:`);
  console.log(`   Restaurante: 1 (Pizzaria Mamma Mia)`);
  console.log(`   Categorias: ${totalCategories}`);
  console.log(`   Produtos: ${totalProducts}`);
  console.log(`   Opções de produto: ${totalOptions}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
