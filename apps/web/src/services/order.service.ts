import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  calculateItemSubtotal,
  calculateOrderSubtotal,
  calculateDeliveryFee,
  calculateOrderTotal,
  calculatePlatformFee,
  calculateChange,
  canTransitionStatus,
  OrderStatus,
  OrderType,
  PaymentMethod,
} from "@/domain/orders/calculations";
import { validateProductOptionSelections } from "@/domain/orders/validation";
import { sanitizePublicOrder, type PublicOrder } from "@/domain/orders/sanitizer";
import { logAudit } from "@/lib/auth-guard";

export { sanitizePublicOrder, type PublicOrder };

export interface CreateOrderInput {
  restaurantSlug: string;
  customerName: string;
  customerPhone: string;
  type: OrderType;
  deliveryStreet?: string | null;
  deliveryNumber?: string | null;
  deliveryComplement?: string | null;
  deliveryNeighborhood?: string | null;
  deliveryPostalCode?: string | null;
  deliveryReference?: string | null;
  paymentMethod: PaymentMethod;
  changeFor?: number | null;
  notes?: string | null;
  items: Array<{
    productId: string;
    quantity: number;
    notes?: string | null;
    selectedOptionIds?: string[];
  }>;
}

export async function createCustomerOrder(input: CreateOrderInput) {
  // 1. Fetch restaurant and verify status (Article 84)
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(schema.restaurants.slug, input.restaurantSlug),
  });

  if (!restaurant) {
    throw new Error("Restaurante não encontrado.");
  }

  if (restaurant.status !== "OPEN") {
    throw new Error("O restaurante está temporariamente fechado para novos pedidos.");
  }

  if (input.type === "DELIVERY" && !restaurant.deliveryEnabled) {
    throw new Error("Entrega temporariamente desativada para este estabelecimento.");
  }

  if (input.type === "PICKUP" && !restaurant.pickupEnabled) {
    throw new Error("Retirada no local temporariamente desativada para este estabelecimento.");
  }

  // 2. Fetch all products with option groups and options to enforce server-side authority (Article 8 & C1)
  const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
  const dbProducts = await db.query.products.findMany({
    where: and(
      eq(schema.products.restaurantId, restaurant.id),
      eq(schema.products.active, true),
      inArray(schema.products.id, productIds)
    ),
    with: {
      optionGroups: {
        with: {
          options: true,
        },
      },
    },
  });

  const productMap = new Map(dbProducts.map((p) => [p.id, p]));

  // 3. Validate product options hierarchy and calculate verified items with immutable snapshots (Article 10 & C1)
  interface VerifiedItem {
    productId: string;
    productName: string;
    unitPrice: number;
    quantity: number;
    subtotal: number;
    notes?: string | null;
    options: Array<{
      productOptionId: string;
      groupName: string;
      optionName: string;
      price: number;
    }>;
  }

  const verifiedItems: VerifiedItem[] = [];

  for (const itemInput of input.items) {
    const product = productMap.get(itemInput.productId);
    if (!product) {
      throw new Error(`Produto não disponível ou inativo: ${itemInput.productId}`);
    }

    // Strict domain validation of option groups (required, minSelect, maxSelect, active, tenant)
    const validation = validateProductOptionSelections(
      product as unknown as Parameters<typeof validateProductOptionSelections>[0],
      itemInput.selectedOptionIds || [],
      restaurant.id
    );

    if (!validation.isValid) {
      throw new Error(validation.error || "Seleção de opções inválida.");
    }

    const verifiedOptions = validation.verifiedOptions;
    const optionsSum = verifiedOptions.reduce((acc, opt) => acc + opt.price, 0);
    const itemUnitPrice = Number(product.price);
    const itemSubtotal = calculateItemSubtotal(itemUnitPrice, itemInput.quantity, optionsSum);

    verifiedItems.push({
      productId: product.id,
      productName: product.name,
      unitPrice: itemUnitPrice,
      quantity: itemInput.quantity,
      subtotal: itemSubtotal,
      notes: itemInput.notes,
      options: verifiedOptions,
    });
  }

  // 4. Calculate Order Financials (Article 8 & 9)
  const subtotal = calculateOrderSubtotal(verifiedItems);
  const deliveryFee = calculateDeliveryFee(input.type, Number(restaurant.fixedDeliveryFee));
  const discount = 0;
  const total = calculateOrderTotal(subtotal, deliveryFee, discount);
  const platformFee = calculatePlatformFee(total);

  // Check minimum order amount
  const minOrder = Number(restaurant.minOrderAmount);
  if (minOrder > 0 && subtotal < minOrder) {
    throw new Error(`O pedido mínimo para este restaurante é de R$ ${minOrder.toFixed(2)}.`);
  }

  // Check cash change if applicable (Section 13)
  if (input.paymentMethod === "CASH" && input.changeFor) {
    const changeCheck = calculateChange(total, input.changeFor);
    if (!changeCheck.isValid) {
      throw new Error(changeCheck.error || "Valor de troco inválido.");
    }
  }

  // 5. Customer lookup
  let customer = await db.query.customers.findFirst({
    where: and(
      eq(schema.customers.restaurantId, restaurant.id),
      eq(schema.customers.phone, input.customerPhone.trim())
    ),
  });

  // 6. Concurrency retry loop and atomic persistence via db.batch (C3 & C4)
  const MAX_RETRIES = 5;
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_RETRIES) {
    attempt++;
    try {
      // Get next sequential order number for this restaurant (Article 80 & C4)
      const lastOrder = await db.query.orders.findFirst({
        where: eq(schema.orders.restaurantId, restaurant.id),
        orderBy: [desc(schema.orders.orderNumber)],
      });
      const orderNumber = (lastOrder?.orderNumber ?? 100) + 1;

      // Pre-generate UUIDs so relational foreign keys are fully determined before batch dispatch (C3)
      const orderId = crypto.randomUUID();
      const publicId = `pld_${nanoid(16)}`;

      const batchQueries: Array<Parameters<typeof db.batch>[0][number]> = [];

      let customerId: string;
      if (!customer) {
        customerId = crypto.randomUUID();
        batchQueries.push(
          db.insert(schema.customers).values({
            id: customerId,
            restaurantId: restaurant.id,
            name: input.customerName.trim(),
            phone: input.customerPhone.trim(),
            totalOrders: 1,
            totalSpent: total.toFixed(2),
            firstOrderAt: new Date(),
            lastOrderAt: new Date(),
          })
        );
      } else {
        customerId = customer.id;
        batchQueries.push(
          db
            .update(schema.customers)
            .set({
              name: input.customerName.trim(),
              totalOrders: customer.totalOrders + 1,
              totalSpent: (Number(customer.totalSpent) + total).toFixed(2),
              lastOrderAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(schema.customers.id, customer.id))
        );
      }

      // Insert Order
      batchQueries.push(
        db.insert(schema.orders).values({
          id: orderId,
          publicId,
          orderNumber,
          restaurantId: restaurant.id,
          customerId,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.trim(),
          type: input.type,
          status: "RECEIVED",
          deliveryStreet: input.deliveryStreet || null,
          deliveryNumber: input.deliveryNumber || null,
          deliveryComplement: input.deliveryComplement || null,
          deliveryNeighborhood: input.deliveryNeighborhood || null,
          deliveryPostalCode: input.deliveryPostalCode || null,
          deliveryReference: input.deliveryReference || null,
          subtotal: subtotal.toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          discount: discount.toFixed(2),
          total: total.toFixed(2),
          platformFee: platformFee.toFixed(2),
          paymentMethod: input.paymentMethod,
          changeFor: input.changeFor ? input.changeFor.toFixed(2) : null,
          notes: input.notes || null,
          estimatedMinutes:
            input.type === "DELIVERY"
              ? restaurant.estimatedTimeMax
              : restaurant.estimatedTimeMin,
        })
      );

      // Insert Order Items with snapshots
      const itemsToInsert = [];
      const optionsToInsert = [];

      for (const item of verifiedItems) {
        const orderItemId = crypto.randomUUID();
        itemsToInsert.push({
          id: orderItemId,
          orderId,
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice.toFixed(2),
          quantity: item.quantity,
          subtotal: item.subtotal.toFixed(2),
          notes: item.notes || null,
        });

        for (const opt of item.options) {
          optionsToInsert.push({
            id: crypto.randomUUID(),
            orderItemId,
            productOptionId: opt.productOptionId,
            groupName: opt.groupName,
            optionName: opt.optionName,
            price: opt.price.toFixed(2),
          });
        }
      }

      if (itemsToInsert.length > 0) {
        batchQueries.push(db.insert(schema.orderItems).values(itemsToInsert));
      }

      if (optionsToInsert.length > 0) {
        batchQueries.push(db.insert(schema.orderItemOptions).values(optionsToInsert));
      }

      // Initial Order Status History (Article 12)
      batchQueries.push(
        db.insert(schema.orderStatusHistory).values({
          id: crypto.randomUUID(),
          orderId,
          fromStatus: null,
          toStatus: "RECEIVED",
          changedBy: "CLIENT",
          note: "Pedido realizado pelo cliente",
        })
      );

      // Initial payment record
      batchQueries.push(
        db.insert(schema.payments).values({
          id: crypto.randomUUID(),
          orderId,
          restaurantId: restaurant.id,
          method: input.paymentMethod,
          amount: total.toFixed(2),
          status: "PENDING",
        })
      );

      // Execute all operations atomically in a single round-trip transaction batch (C3)
      await db.batch(batchQueries as [typeof batchQueries[0], ...typeof batchQueries]);

      return {
        orderId,
        publicId,
        orderNumber,
      };
    } catch (err: unknown) {
      lastError = err;
      const pgErr = err as { code?: string; message?: string } | undefined;
      const isUniqueViolation =
        pgErr?.code === "23505" ||
        pgErr?.message?.includes("orders_restaurant_order_number_idx") ||
        pgErr?.message?.includes("unique constraint") ||
        pgErr?.message?.includes("duplicate key");

      if (isUniqueViolation && attempt < MAX_RETRIES) {
        // Refresh customer if needed and retry with small backoff
        customer = await db.query.customers.findFirst({
          where: and(
            eq(schema.customers.restaurantId, restaurant.id),
            eq(schema.customers.phone, input.customerPhone.trim())
          ),
        });
        await new Promise((res) => setTimeout(res, 20 * attempt));
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error("Falha ao gerar número do pedido após múltiplas tentativas.");
}

/**
 * Public customer tracking endpoint (Article 14 & 70, C2).
 * Exposes only safe customer-facing data with sanitized projection.
 */
export async function getOrderByPublicId(publicId: string): Promise<PublicOrder | null> {
  const order = await db.query.orders.findFirst({
    where: eq(schema.orders.publicId, publicId),
    with: {
      restaurant: {
        columns: {
          id: true,
          name: true,
          slug: true,
          phone: true,
          address: true,
          logoUrl: true,
        },
      },
      items: {
        with: {
          options: true,
        },
      },
      statusHistory: {
        orderBy: [desc(schema.orderStatusHistory.createdAt)],
      },
    },
  });

  if (!order) return null;

  return sanitizePublicOrder(order);
}

/**
 * List restaurant orders for manager/kitchen operator (RBAC & Multi-tenant enforced).
 */
export async function listRestaurantOrders(
  restaurantId: string,
  filterStatus?: OrderStatus
) {
  const whereClause = filterStatus
    ? and(eq(schema.orders.restaurantId, restaurantId), eq(schema.orders.status, filterStatus))
    : eq(schema.orders.restaurantId, restaurantId);

  return await db.query.orders.findMany({
    where: whereClause,
    orderBy: [desc(schema.orders.createdAt)],
    with: {
      items: {
        with: {
          options: true,
        },
      },
      statusHistory: {
        orderBy: [desc(schema.orderStatusHistory.createdAt)],
      },
    },
  });
}

/**
 * Updates order status following valid lifecycle rules and audits the change (Articles 11 & 12).
 */
export async function updateOrderStatus(params: {
  restaurantId: string;
  orderId: string;
  nextStatus: OrderStatus;
  userId: string;
  note?: string;
}) {
  const order = await db.query.orders.findFirst({
    where: and(
      eq(schema.orders.id, params.orderId),
      eq(schema.orders.restaurantId, params.restaurantId)
    ),
  });

  if (!order) {
    throw new Error("Pedido não encontrado neste restaurante.");
  }

  const currentStatus = order.status as OrderStatus;
  const orderType = order.type as OrderType;

  if (!canTransitionStatus(currentStatus, params.nextStatus, orderType)) {
    throw new Error(
      `Transição de status inválida: não é permitido mudar de '${currentStatus}' para '${params.nextStatus}' em pedidos do tipo ${orderType}.`
    );
  }

  const [updatedOrder] = await db
    .update(schema.orders)
    .set({
      status: params.nextStatus,
      updatedAt: new Date(),
    })
    .where(eq(schema.orders.id, params.orderId))
    .returning();

  // Record audit history
  await db.insert(schema.orderStatusHistory).values({
    orderId: params.orderId,
    fromStatus: currentStatus,
    toStatus: params.nextStatus,
    changedBy: params.userId,
    note: params.note || null,
  });

  await logAudit({
    restaurantId: params.restaurantId,
    userId: params.userId,
    action: "UPDATE_ORDER_STATUS",
    entity: "orders",
    entityId: params.orderId,
    metadata: {
      fromStatus: currentStatus,
      toStatus: params.nextStatus,
      note: params.note,
    },
  });

  return updatedOrder;
}
