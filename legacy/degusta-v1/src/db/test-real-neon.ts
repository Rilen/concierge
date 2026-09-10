import "dotenv/config";
import { db } from "./index";
import * as schema from "./schema";
import { eq, sql } from "drizzle-orm";

async function runRealNeonTests() {
  console.log("=================================================");
  console.log("🧪 INICIANDO TESTES EMPÍRICOS NO NEON REAL");
  console.log("=================================================");

  // Obter restaurante existente (do seed)
  const demoRestaurant = await db.query.restaurants.findFirst({
    where: eq(schema.restaurants.slug, "pizzaria-demo"),
  });

  if (!demoRestaurant) {
    throw new Error("Restaurante demo não encontrado. Execute o seed antes dos testes.");
  }

  const restaurantId = demoRestaurant.id;

  // Limpeza preventiva de execuções anteriores de teste
  await db.delete(schema.orders).where(eq(schema.orders.customerPhone, "11999990000"));
  await db.delete(schema.orders).where(eq(schema.orders.customerPhone, "11900001111"));
  await db.delete(schema.orders).where(eq(schema.orders.customerPhone, "11900002222"));
  await db.delete(schema.orders).where(eq(schema.orders.customerPhone, "11900003333"));
  await db.delete(schema.restaurants).where(eq(schema.restaurants.name, "Restaurante Teste Unicidade C4"));

  // -----------------------------------------------------------------
  // 1. TESTE EMPÍRICO C3: ATOMICIDADE E ROLLBACK REAL NO NEON-HTTP
  // -----------------------------------------------------------------
  console.log("\n--- TESTE C3: ATOMICIDADE DE BATCH NO NEON-HTTP ---");

  // Contagem ANTES
  const [beforeOrders] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orders);
  const [beforeItems] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orderItems);
  const [beforeOptions] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orderItemOptions);
  const [beforeHistory] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orderStatusHistory);
  const [beforePayments] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.payments);

  console.log("ESTADO ANTES:");
  console.log(`- orders: ${beforeOrders.count}`);
  console.log(`- order_items: ${beforeItems.count}`);
  console.log(`- order_item_options: ${beforeOptions.count}`);
  console.log(`- order_status_history: ${beforeHistory.count}`);
  console.log(`- payments: ${beforePayments.count}`);

  const testOrderId = crypto.randomUUID();
  const testItemId = crypto.randomUUID();
  const testOptionId = crypto.randomUUID();
  const testHistoryId = crypto.randomUUID();
  const testPaymentId = crypto.randomUUID();

  let batchFailed = false;
  let failureErrorCode = "";
  let failureErrorMessage = "";

  console.log("\nExecutando db.batch com 5 queries sendo a 5ª deliberadamente inválida (FK inexistente)...");

  try {
    await db.batch([
      // 1. Inserção do pedido
      db.insert(schema.orders).values({
        id: testOrderId,
        publicId: `pld_c3_test_${Date.now()}`,
        orderNumber: 999101,
        restaurantId: restaurantId,
        customerName: "Teste Atomicidade C3",
        customerPhone: "11999990000",
        type: "DELIVERY",
        status: "RECEIVED",
        subtotal: "50.00",
        deliveryFee: "5.00",
        discount: "0.00",
        total: "55.00",
        platformFee: "0.28",
        paymentMethod: "PIX",
      }),
      // 2. Inserção do item do pedido
      db.insert(schema.orderItems).values({
        id: testItemId,
        orderId: testOrderId,
        productName: "Item de Teste C3",
        unitPrice: "50.00",
        quantity: 1,
        subtotal: "50.00",
      }),
      // 3. Inserção do snapshot de opção
      db.insert(schema.orderItemOptions).values({
        id: testOptionId,
        orderItemId: testItemId,
        groupName: "Grupo Teste",
        optionName: "Opção Teste",
        price: "0.00",
      }),
      // 4. Inserção do histórico de status
      db.insert(schema.orderStatusHistory).values({
        id: testHistoryId,
        orderId: testOrderId,
        fromStatus: null,
        toStatus: "RECEIVED",
        changedBy: "TEST_RUNNER",
        note: "Teste C3",
      }),
      // 5. FALHA DELIBERADA: FK inválida em payments (restaurant_id inexistente)
      db.insert(schema.payments).values({
        id: testPaymentId,
        orderId: testOrderId,
        restaurantId: "00000000-0000-0000-0000-000000000000", // VIOLAÇÃO DE FK
        method: "PIX",
        amount: "55.00",
        status: "PENDING",
      }),
    ]);
  } catch (err: unknown) {
    batchFailed = true;
    const e = err as { code?: string; message?: string; cause?: { code?: string; message?: string } };
    failureErrorCode = e.code || e.cause?.code || "UNKNOWN";
    failureErrorMessage = e.message || "";
    console.log(`✓ Falha deliberada capturada com sucesso:`);
    console.log(`  Código do erro PostgreSQL: ${failureErrorCode}`);
    console.log(`  Mensagem: ${failureErrorMessage}`);
  }

  // Contagem DEPOIS da falha
  const [afterOrders] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orders);
  const [afterItems] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orderItems);
  const [afterOptions] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orderItemOptions);
  const [afterHistory] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.orderStatusHistory);
  const [afterPayments] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.payments);

  // Verificação específica dos IDs submetidos no lote
  const specificOrder = await db.query.orders.findFirst({ where: eq(schema.orders.id, testOrderId) });
  const specificItem = await db.query.orderItems.findFirst({ where: eq(schema.orderItems.id, testItemId) });
  const specificOption = await db.query.orderItemOptions.findFirst({ where: eq(schema.orderItemOptions.id, testOptionId) });
  const specificHistory = await db.query.orderStatusHistory.findFirst({ where: eq(schema.orderStatusHistory.id, testHistoryId) });

  console.log("\nESTADO DEPOIS DO ROLLBACK:");
  console.log(`- orders: ${afterOrders.count} (esperado: ${beforeOrders.count}, ID específico encontrado: ${!!specificOrder})`);
  console.log(`- order_items: ${afterItems.count} (esperado: ${beforeItems.count}, ID específico encontrado: ${!!specificItem})`);
  console.log(`- order_item_options: ${afterOptions.count} (esperado: ${beforeOptions.count}, ID específico encontrado: ${!!specificOption})`);
  console.log(`- order_status_history: ${afterHistory.count} (esperado: ${beforeHistory.count}, ID específico encontrado: ${!!specificHistory})`);
  console.log(`- payments: ${afterPayments.count} (esperado: ${beforePayments.count})`);

  const c3RollbackSuccess =
    batchFailed &&
    beforeOrders.count === afterOrders.count &&
    beforeItems.count === afterItems.count &&
    beforeOptions.count === afterOptions.count &&
    beforeHistory.count === afterHistory.count &&
    beforePayments.count === afterPayments.count &&
    !specificOrder &&
    !specificItem &&
    !specificOption &&
    !specificHistory;

  if (c3RollbackSuccess) {
    console.log("\n✅ C3 RESULTADO: COMPROVADO");
    console.log("   Todas as gravações anteriores foram 100% revertidas pelo PostgreSQL/Neon.");
  } else {
    console.error("\n❌ C3 RESULTADO: FALHOU");
    throw new Error("Persistência parcial detectada! Rollback não ocorreu como esperado.");
  }

  // -----------------------------------------------------------------
  // 2. TESTE EMPÍRICO C4: UNICIDADE E CONCORRÊNCIA REAL NO NEON
  // -----------------------------------------------------------------
  console.log("\n--- TESTE C4: UNICIDADE REAL (restaurant_id, order_number) ---");

  // Criar segundo restaurante temporário para validar Cenário B
  const [tempRestaurant] = await db
    .insert(schema.restaurants)
    .values({
      name: "Restaurante Teste Unicidade C4",
      slug: `teste-c4-${Date.now()}`,
      phone: "11988880000",
      address: "Rua Teste, 100",
      status: "OPEN",
    })
    .returning();

  const testOrderNumber = 888801;
  const orderA1Id = crypto.randomUUID();
  const orderA2Id = crypto.randomUUID();
  const orderB1Id = crypto.randomUUID();

  // Cenário A1: Inserção inicial no restaurante A
  console.log(`Cenário A1: Inserindo Pedido #${testOrderNumber} no Restaurante A...`);
  await db.insert(schema.orders).values({
    id: orderA1Id,
    publicId: `pld_c4_a1_${Date.now()}`,
    orderNumber: testOrderNumber,
    restaurantId: restaurantId,
    customerName: "Cliente A1",
    customerPhone: "11900001111",
    type: "DELIVERY",
    subtotal: "30.00",
    total: "30.00",
    paymentMethod: "PIX",
  });
  console.log("✓ Pedido A1 inserido com sucesso.");

  // Cenário A2: Tentativa de inserção duplicada no MESMO restaurante A
  console.log(`Cenário A2: Tentando duplicar Pedido #${testOrderNumber} no mesmo Restaurante A...`);
  let duplicateCaught = false;
  let duplicateErrorCode = "";

  try {
    await db.insert(schema.orders).values({
      id: orderA2Id,
      publicId: `pld_c4_a2_${Date.now()}`,
      orderNumber: testOrderNumber, // DUPLICADO NO MESMO RESTAURANTE
      restaurantId: restaurantId,
      customerName: "Cliente A2 Duplicado",
      customerPhone: "11900002222",
      type: "DELIVERY",
      subtotal: "40.00",
      total: "40.00",
      paymentMethod: "PIX",
    });
  } catch (err: unknown) {
    duplicateCaught = true;
    const errorObj = err as { code?: string; cause?: { code?: string; constraint?: string; detail?: string } };
    duplicateErrorCode = errorObj.code || errorObj?.cause?.code || "";
    console.log(`✓ Colisão bloqueada com sucesso pelo índice único orders_restaurant_order_number_idx!`);
    console.log(`  Código retornado pelo PostgreSQL: ${duplicateErrorCode}`);
    console.log(`  Constraint violada: ${errorObj?.cause?.constraint}`);
    console.log(`  Detalhe: ${errorObj?.cause?.detail}`);
  }

  if (!duplicateCaught || duplicateErrorCode !== "23505") {
    throw new Error(`Cenário A FALHOU: esperado erro 23505, obtido code '${duplicateErrorCode}'.`);
  }

  // Cenário B: Inserção do MESMO orderNumber no Restaurante B (multi-tenancy)
  console.log(`Cenário B: Inserindo mesmo Pedido #${testOrderNumber} no Restaurante B (outro tenant)...`);
  let scenarioBSuccess = false;
  try {
    await db.insert(schema.orders).values({
      id: orderB1Id,
      publicId: `pld_c4_b1_${Date.now()}`,
      orderNumber: testOrderNumber, // MESMO NÚMERO, OUTRO RESTAURANTE
      restaurantId: tempRestaurant.id,
      customerName: "Cliente B1 Outro Tenant",
      customerPhone: "11900003333",
      type: "DELIVERY",
      subtotal: "25.00",
      total: "25.00",
      paymentMethod: "PIX",
    });
    scenarioBSuccess = true;
    console.log("✓ Pedido B1 em restaurante diferente inserido com sucesso!");
  } catch (err: unknown) {
    console.error("❌ Erro inesperado no Cenário B:", err);
  }

  // Limpeza dos registros de teste
  console.log("\nLimpando registros criados pelo teste C4...");
  await db.delete(schema.orders).where(eq(schema.orders.id, orderA1Id));
  await db.delete(schema.orders).where(eq(schema.orders.id, orderB1Id));
  await db.delete(schema.restaurants).where(eq(schema.restaurants.id, tempRestaurant.id));
  console.log("✓ Registros de teste limpos com sucesso.");

  if (duplicateCaught && scenarioBSuccess) {
    console.log("\n✅ C4 RESULTADO: COMPROVADO");
    console.log("   Constraint orders_restaurant_order_number_idx validada fisicamente no banco Neon.");
  } else {
    throw new Error("Falha na validação de unicidade C4.");
  }

  console.log("\n=================================================");
  console.log("🎉 TODOS OS TESTES EMPÍRICOS NO NEON PASSARAM COM SUCESSO!");
  console.log("=================================================");
}

runRealNeonTests().catch((err) => {
  console.error("\n❌ ERRO FATAL NOS TESTES EMPÍRICOS:", err);
  process.exit(1);
});
