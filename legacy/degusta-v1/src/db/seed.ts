import * as dotenv from "dotenv";
dotenv.config();

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hashPassword } from "better-auth/crypto";
import * as schema from "./schema";
import { eq } from "drizzle-orm";

async function runSeed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || dbUrl.includes("placeholder") || dbUrl.includes("sample-")) {
    console.log("⚠️ DATABASE_URL de produção/desenvolvimento ainda não foi configurada (usando placeholder ou sample).");
    console.log("👉 Insira a URL real do Neon PostgreSQL no arquivo .env para aplicar migrations e rodar o seed.");
    return;
  }

  console.log("🌱 Iniciando seed do PALADAR...");
  const sql = neon(dbUrl);
  const db = drizzle(sql, { schema });

  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || "Paladar@2026";
  const hashedPassword = await hashPassword(defaultPassword);

  // 1. USUÁRIOS
  console.log("👤 Criando usuários padrão (MASTER, GERENTE, PEDIDOS, CLIENTE)...");

  const seedUsers = [
    {
      id: "usr_master_001",
      name: "Administrador Paladar",
      email: "master@paladar.local",
      role: "MASTER",
    },
    {
      id: "usr_gerente_001",
      name: "Carlos Gerente",
      email: "gerente@pizzaria.local",
      role: "GERENTE",
    },
    {
      id: "usr_pedidos_001",
      name: "Marcos Operador",
      email: "pedidos@pizzaria.local",
      role: "PEDIDOS",
    },
    {
      id: "usr_cliente_001",
      name: "Ana Oliveira",
      email: "cliente@exemplo.local",
      role: "CLIENTE",
    },
  ];

  for (const u of seedUsers) {
    await db
      .insert(schema.users)
      .values({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        emailVerified: true,
      })
      .onConflictDoUpdate({
        target: schema.users.id,
        set: { name: u.name, email: u.email, role: u.role },
      });

    await db
      .insert(schema.accounts)
      .values({
        id: `acc_${u.id}`,
        userId: u.id,
        accountId: u.id,
        providerId: "credential",
        password: hashedPassword,
      })
      .onConflictDoUpdate({
        target: schema.accounts.id,
        set: { accountId: u.id, password: hashedPassword },
      });
  }

  // 2. RESTAURANTE DEMO
  console.log("🍕 Criando restaurante 'Pizzaria Demo'...");

  const existingRestaurant = await db.query.restaurants.findFirst({
    where: eq(schema.restaurants.slug, "pizzaria-demo"),
  });

  let restaurantId = existingRestaurant?.id;

  if (!existingRestaurant) {
    const [inserted] = await db
      .insert(schema.restaurants)
      .values({
        name: "Pizzaria Demo",
        slug: "pizzaria-demo",
        phone: "(11) 98765-4321",
        address: "Av. Principal, 1000 - Centro",
        openingHours: "18:00 às 23:30",
        status: "OPEN",
        estimatedTimeMin: 25,
        estimatedTimeMax: 45,
        deliveryEnabled: true,
        pickupEnabled: true,
        fixedDeliveryFee: "7.00",
        minOrderAmount: "20.00",
      })
      .returning({ id: schema.restaurants.id });
    restaurantId = inserted.id;
  }

  if (!restaurantId) throw new Error("Erro ao obter restaurantId");

  // 3. ASSOCIAÇÕES DE USUÁRIOS AO RESTAURANTE
  console.log("🔗 Vinculando GERENTE e PEDIDOS ao restaurante...");

  await db
    .insert(schema.restaurantUsers)
    .values([
      {
        restaurantId,
        userId: "usr_gerente_001",
        role: "GERENTE",
      },
      {
        restaurantId,
        userId: "usr_pedidos_001",
        role: "PEDIDOS",
      },
    ])
    .onConflictDoNothing();

  // 4. CONFIGURAÇÕES DO RESTAURANTE
  console.log("⚙️ Criando configurações operacionais e de pagamento...");

  await db
    .insert(schema.restaurantSettings)
    .values({
      restaurantId,
      loyaltyPointsPerReal: "1.00",
      loyaltyRedemptionValue: "0.05",
      autoAcceptOrders: false,
      soundNotifications: true,
    })
    .onConflictDoUpdate({
      target: schema.restaurantSettings.restaurantId,
      set: { loyaltyPointsPerReal: "1.00", soundNotifications: true },
    });

  await db
    .insert(schema.paymentSettings)
    .values({
      restaurantId,
      acceptsPix: true,
      pixKey: "pix@pizzariademo.com.br",
      acceptsCredit: true,
      acceptsDebit: true,
      acceptsCash: true,
    })
    .onConflictDoUpdate({
      target: schema.paymentSettings.restaurantId,
      set: { acceptsPix: true, acceptsCash: true },
    });

  // 5. CATEGORIAS
  console.log("📂 Criando categorias do cardápio...");

  const categoryMap: Record<string, string> = {};

  const categoriesData = [
    { name: "Pizzas", description: "Pizzas artesanais assadas em forno a lenha", order: 1 },
    { name: "Hambúrgueres", description: "Hambúrgueres artesanais de 160g no pão brioche", order: 2 },
    { name: "Porções", description: "Acompanhamentos crocantes e saborosos", order: 3 },
    { name: "Bebidas", description: "Refrigerantes, sucos e águas geladas", order: 4 },
  ];

  for (const cat of categoriesData) {
    const existing = await db.query.categories.findFirst({
      where: (t, { and, eq }) => and(eq(t.restaurantId, restaurantId), eq(t.name, cat.name)),
    });

    if (existing) {
      categoryMap[cat.name] = existing.id;
    } else {
      const [inserted] = await db
        .insert(schema.categories)
        .values({
          restaurantId,
          name: cat.name,
          description: cat.description,
          displayOrder: cat.order,
          active: true,
        })
        .returning({ id: schema.categories.id });
      categoryMap[cat.name] = inserted.id;
    }
  }

  // 6. PRODUTOS DO PROMPT MESTRE
  console.log("🍔 Criando produtos obrigatórios...");

  // Pizza Calabresa
  await db.insert(schema.products).values({
    restaurantId,
    categoryId: categoryMap["Pizzas"],
    name: "Pizza Calabresa",
    description: "Molho de tomate artesanal, calabresa fatiada, cebola e azeitonas pretas.",
    price: "42.00",
    active: true,
    displayOrder: 1,
  });

  // Pizza Frango
  await db.insert(schema.products).values({
    restaurantId,
    categoryId: categoryMap["Pizzas"],
    name: "Pizza Frango",
    description: "Frango desfiado temperado, milho fresco e cobertura cremosa de Catupiry original.",
    price: "46.00",
    active: true,
    displayOrder: 2,
  });

  // Pizza 2 Sabores (Configurável)
  const [pizza2Sabores] = await db
    .insert(schema.products)
    .values({
      restaurantId,
      categoryId: categoryMap["Pizzas"],
      name: "Pizza 2 Sabores",
      description: "Monte sua pizza grande escolhendo até 2 sabores de sua preferência.",
      price: "48.00",
      active: true,
      displayOrder: 3,
    })
    .returning({ id: schema.products.id });

  // Grupos de Opções para Pizza 2 Sabores
  const [grpSabor1] = await db
    .insert(schema.productOptionGroups)
    .values({
      restaurantId,
      productId: pizza2Sabores.id,
      name: "1º Sabor (Metade)",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      displayOrder: 1,
    })
    .returning({ id: schema.productOptionGroups.id });

  await db.insert(schema.productOptions).values([
    { restaurantId, optionGroupId: grpSabor1.id, name: "Metade Calabresa", price: "0.00", displayOrder: 1 },
    { restaurantId, optionGroupId: grpSabor1.id, name: "Metade Frango com Catupiry", price: "0.00", displayOrder: 2 },
    { restaurantId, optionGroupId: grpSabor1.id, name: "Metade Quatro Queijos", price: "2.00", displayOrder: 3 },
  ]);

  const [grpSabor2] = await db
    .insert(schema.productOptionGroups)
    .values({
      restaurantId,
      productId: pizza2Sabores.id,
      name: "2º Sabor (Metade)",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      displayOrder: 2,
    })
    .returning({ id: schema.productOptionGroups.id });

  await db.insert(schema.productOptions).values([
    { restaurantId, optionGroupId: grpSabor2.id, name: "Metade Calabresa", price: "0.00", displayOrder: 1 },
    { restaurantId, optionGroupId: grpSabor2.id, name: "Metade Frango com Catupiry", price: "0.00", displayOrder: 2 },
    { restaurantId, optionGroupId: grpSabor2.id, name: "Metade Quatro Queijos", price: "2.00", displayOrder: 3 },
  ]);

  const [grpBorda] = await db
    .insert(schema.productOptionGroups)
    .values({
      restaurantId,
      productId: pizza2Sabores.id,
      name: "Borda Recheada (Opcional)",
      minSelect: 0,
      maxSelect: 1,
      required: false,
      displayOrder: 3,
    })
    .returning({ id: schema.productOptionGroups.id });

  await db.insert(schema.productOptions).values([
    { restaurantId, optionGroupId: grpBorda.id, name: "Borda de Catupiry", price: "7.00", displayOrder: 1 },
    { restaurantId, optionGroupId: grpBorda.id, name: "Borda de Cheddar", price: "7.00", displayOrder: 2 },
  ]);

  // X-Burger
  const [xBurger] = await db
    .insert(schema.products)
    .values({
      restaurantId,
      categoryId: categoryMap["Hambúrgueres"],
      name: "X-Burger",
      description: "Pão brioche, burger artesanal 160g, queijo prato derretido e maionese da casa.",
      price: "24.00",
      active: true,
      displayOrder: 4,
    })
    .returning({ id: schema.products.id });

  const [grpPonto] = await db
    .insert(schema.productOptionGroups)
    .values({
      restaurantId,
      productId: xBurger.id,
      name: "Ponto da Carne",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      displayOrder: 1,
    })
    .returning({ id: schema.productOptionGroups.id });

  await db.insert(schema.productOptions).values([
    { restaurantId, optionGroupId: grpPonto.id, name: "Ao ponto", price: "0.00", displayOrder: 1 },
    { restaurantId, optionGroupId: grpPonto.id, name: "Bem passado", price: "0.00", displayOrder: 2 },
    { restaurantId, optionGroupId: grpPonto.id, name: "Mal passado", price: "0.00", displayOrder: 3 },
  ]);

  // X-Bacon
  const [xBacon] = await db
    .insert(schema.products)
    .values({
      restaurantId,
      categoryId: categoryMap["Hambúrgueres"],
      name: "X-Bacon",
      description: "Pão brioche, burger artesanal 160g, muito bacon crocante, queijo prato e maionese.",
      price: "29.90",
      active: true,
      displayOrder: 5,
    })
    .returning({ id: schema.products.id });

  const [grpPontoBacon] = await db
    .insert(schema.productOptionGroups)
    .values({
      restaurantId,
      productId: xBacon.id,
      name: "Ponto da Carne",
      minSelect: 1,
      maxSelect: 1,
      required: true,
      displayOrder: 1,
    })
    .returning({ id: schema.productOptionGroups.id });

  await db.insert(schema.productOptions).values([
    { restaurantId, optionGroupId: grpPontoBacon.id, name: "Ao ponto", price: "0.00", displayOrder: 1 },
    { restaurantId, optionGroupId: grpPontoBacon.id, name: "Bem passado", price: "0.00", displayOrder: 2 },
    { restaurantId, optionGroupId: grpPontoBacon.id, name: "Mal passado", price: "0.00", displayOrder: 3 },
  ]);

  const [grpAdicionais] = await db
    .insert(schema.productOptionGroups)
    .values({
      restaurantId,
      productId: xBacon.id,
      name: "Adicionais",
      minSelect: 0,
      maxSelect: 3,
      required: false,
      displayOrder: 2,
    })
    .returning({ id: schema.productOptionGroups.id });

  await db.insert(schema.productOptions).values([
    { restaurantId, optionGroupId: grpAdicionais.id, name: "Bacon Extra", price: "4.50", displayOrder: 1 },
    { restaurantId, optionGroupId: grpAdicionais.id, name: "Queijo Cheddar Extra", price: "3.50", displayOrder: 2 },
    { restaurantId, optionGroupId: grpAdicionais.id, name: "Cebola Caramelizada", price: "3.00", displayOrder: 3 },
  ]);

  // Batata Frita
  await db.insert(schema.products).values({
    restaurantId,
    categoryId: categoryMap["Porções"],
    name: "Batata Frita",
    description: "Porção de 400g de batata palito crocante com sal e páprica suave.",
    price: "22.00",
    active: true,
    displayOrder: 6,
  });

  // Refrigerante
  await db.insert(schema.products).values({
    restaurantId,
    categoryId: categoryMap["Bebidas"],
    name: "Refrigerante",
    description: "Lata 350ml (Coca-Cola, Guaraná Antarctica ou Zero).",
    price: "6.50",
    active: true,
    displayOrder: 7,
  });

  // 7. ESTOQUE SIMPLES (Section 20)
  console.log("📦 Criando itens básicos de estoque...");

  const stockData = [
    { name: "Pão Brioche", unit: "un", qty: "100.000", min: "20.000" },
    { name: "Hambúrguer 160g", unit: "un", qty: "80.000", min: "15.000" },
    { name: "Queijo Prato Fatiado", unit: "kg", qty: "10.000", min: "2.000" },
    { name: "Bacon Fatiado", unit: "kg", qty: "8.000", min: "1.500" },
    { name: "Refrigerante Lata 350ml", unit: "un", qty: "120.000", min: "24.000" },
  ];

  for (const item of stockData) {
    await db
      .insert(schema.stockItems)
      .values({
        restaurantId,
        name: item.name,
        unit: item.unit,
        currentQuantity: item.qty,
        minQuantity: item.min,
      })
      .onConflictDoNothing();
  }

  console.log("✅ Seed do PALADAR concluído com sucesso!");
  console.log("-----------------------------------------");
  console.log("Restaurante demo criado: Pizzaria Demo (/r/pizzaria-demo)");
  console.log("Usuários criados:");
  console.log("  - MASTER: master@paladar.local");
  console.log("  - GERENTE: gerente@pizzaria.local");
  console.log("  - PEDIDOS: pedidos@pizzaria.local");
  console.log("  - CLIENTE: cliente@exemplo.local");
  console.log(`Senha padrão de desenvolvimento: ${defaultPassword}`);
  console.log("-----------------------------------------");
}

runSeed().catch((err) => {
  console.error("❌ Erro durante execução do seed:", err);
  process.exit(1);
});
