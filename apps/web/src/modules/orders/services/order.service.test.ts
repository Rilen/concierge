import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock @/db
const mockFindFirstRestaurant = vi.fn();
const mockFindManyProducts = vi.fn();
const mockFindFirstCustomer = vi.fn();
const mockFindFirstOrder = vi.fn();
const mockBatch = vi.fn();

vi.mock("@/db", () => ({
  db: {
    query: {
      restaurants: {
        findFirst: (...args: unknown[]) => mockFindFirstRestaurant(...args),
      },
      products: {
        findMany: (...args: unknown[]) => mockFindManyProducts(...args),
      },
      customers: {
        findFirst: (...args: unknown[]) => mockFindFirstCustomer(...args),
      },
      orders: {
        findFirst: (...args: unknown[]) => mockFindFirstOrder(...args),
      },
    },
    batch: (...args: unknown[]) => mockBatch(...args),
    insert: (table: unknown) => ({
      values: (val: unknown) => ({ _type: "insert", table, val }),
    }),
    update: (table: unknown) => ({
      set: (val: unknown) => ({
        where: (condition: unknown) => ({ _type: "update", table, val, condition }),
      }),
    }),
  },
}));

import { createCustomerOrder, getOrderByPublicId } from "./order.service";

interface MockBatchItem {
  _type: string;
  table?: { _?: { name?: string } };
  val?: Record<string, unknown>;
}

describe("Order Service - C1, C2, C3, C4 Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseRestaurant = {
    id: "rest-1",
    slug: "pizzaria-vila",
    status: "OPEN",
    deliveryEnabled: true,
    pickupEnabled: true,
    fixedDeliveryFee: "8.00",
    minOrderAmount: "30.00",
    estimatedTimeMin: 30,
    estimatedTimeMax: 50,
  };

  const baseProduct = {
    id: "prod-1",
    restaurantId: "rest-1",
    name: "Pizza Margherita",
    price: "45.00",
    active: true,
    optionGroups: [
      {
        id: "grp-borda",
        name: "Borda",
        minSelect: 0,
        maxSelect: 1,
        required: false,
        options: [
          {
            id: "opt-catupiry",
            restaurantId: "rest-1",
            name: "Borda Catupiry",
            price: "5.00",
            active: true,
          },
        ],
      },
    ],
  };

  const baseInput = {
    restaurantSlug: "pizzaria-vila",
    customerName: "Lucas Mendes",
    customerPhone: "11999998888",
    type: "DELIVERY" as const,
    deliveryStreet: "Rua das Palmeiras",
    deliveryNumber: "100",
    paymentMethod: "PIX" as const,
    items: [
      {
        productId: "prod-1",
        quantity: 1,
        selectedOptionIds: ["opt-catupiry"],
      },
    ],
  };

  describe("C1: Server-side Product Option Validation Integration", () => {
    it("should reject order if an option does not belong to the product", async () => {
      mockFindFirstRestaurant.mockResolvedValue(baseRestaurant);
      mockFindManyProducts.mockResolvedValue([baseProduct]);

      await expect(
        createCustomerOrder({
          ...baseInput,
          items: [
            {
              productId: "prod-1",
              quantity: 1,
              selectedOptionIds: ["opt-unrelated-id"],
            },
          ],
        })
      ).rejects.toThrow(/não pertence ao produto/);

      expect(mockBatch).not.toHaveBeenCalled();
    });

    it("should reject order if a required option group is missing", async () => {
      mockFindFirstRestaurant.mockResolvedValue(baseRestaurant);
      const productWithRequiredGroup = {
        ...baseProduct,
        optionGroups: [
          {
            id: "grp-tamanho",
            name: "Tamanho",
            minSelect: 1,
            maxSelect: 1,
            required: true,
            options: [
              {
                id: "opt-grande",
                restaurantId: "rest-1",
                name: "Grande",
                price: "0.00",
                active: true,
              },
            ],
          },
        ],
      };
      mockFindManyProducts.mockResolvedValue([productWithRequiredGroup]);

      await expect(
        createCustomerOrder({
          ...baseInput,
          items: [
            {
              productId: "prod-1",
              quantity: 1,
              selectedOptionIds: [],
            },
          ],
        })
      ).rejects.toThrow(/O grupo obrigatório 'Tamanho'/);

      expect(mockBatch).not.toHaveBeenCalled();
    });
  });

  describe("C3: Atomic batch persistence via db.batch", () => {
    it("should assemble all operations in a single db.batch transaction", async () => {
      mockFindFirstRestaurant.mockResolvedValue(baseRestaurant);
      mockFindManyProducts.mockResolvedValue([baseProduct]);
      mockFindFirstCustomer.mockResolvedValue(null);
      mockFindFirstOrder.mockResolvedValue({ orderNumber: 105 });
      mockBatch.mockResolvedValue([]);

      const result = await createCustomerOrder(baseInput);

      expect(result.orderNumber).toBe(106);
      expect(result.publicId).toMatch(/^pld_/);
      expect(mockBatch).toHaveBeenCalledTimes(1);

      const batchCalls = mockBatch.mock.calls[0][0] as MockBatchItem[];
      // Expected items in batch: customer insert, order insert, item insert, option insert, history insert, payment insert
      expect(batchCalls.length).toBeGreaterThanOrEqual(5);

      // Verify all items have pre-generated matching foreign keys
      const orderInsert = batchCalls.find((b: MockBatchItem) => b.table?._?.name === "orders" || b.val?.publicId);
      expect(orderInsert).toBeDefined();
      expect(orderInsert?.val?.orderNumber).toBe(106);
      expect(orderInsert?.val?.subtotal).toBe("50.00"); // 45 base + 5 option
      expect(orderInsert?.val?.deliveryFee).toBe("8.00");
      expect(orderInsert?.val?.total).toBe("58.00");
    });
  });

  describe("C4: Order Number Concurrency Retry", () => {
    it("should retry and succeed when orders_restaurant_order_number_idx conflict occurs", async () => {
      mockFindFirstRestaurant.mockResolvedValue(baseRestaurant);
      mockFindManyProducts.mockResolvedValue([baseProduct]);
      mockFindFirstCustomer.mockResolvedValue({ id: "cust-1", totalOrders: 2, totalSpent: "100.00" });

      // First call returns orderNumber 200, second call returns orderNumber 201
      mockFindFirstOrder
        .mockResolvedValueOnce({ orderNumber: 200 })
        .mockResolvedValueOnce({ orderNumber: 201 });

      // First batch attempt fails with unique violation code 23505
      const uniqueError = Object.assign(
        new Error('duplicate key value violates unique constraint "orders_restaurant_order_number_idx"'),
        { code: "23505" }
      );

      mockBatch
        .mockRejectedValueOnce(uniqueError)
        .mockResolvedValueOnce([]);

      const result = await createCustomerOrder(baseInput);

      expect(mockFindFirstOrder).toHaveBeenCalledTimes(2);
      expect(mockBatch).toHaveBeenCalledTimes(2);
      expect(result.orderNumber).toBe(202); // 201 + 1 on retry
    });

    it("should fail after exhausting 5 retry attempts if conflict persists", async () => {
      mockFindFirstRestaurant.mockResolvedValue(baseRestaurant);
      mockFindManyProducts.mockResolvedValue([baseProduct]);
      mockFindFirstCustomer.mockResolvedValue(null);
      mockFindFirstOrder.mockResolvedValue({ orderNumber: 300 });

      const uniqueError = Object.assign(
        new Error('duplicate key value violates unique constraint "orders_restaurant_order_number_idx"'),
        { code: "23505" }
      );

      mockBatch.mockRejectedValue(uniqueError);

      await expect(createCustomerOrder(baseInput)).rejects.toThrow(
        /duplicate key value violates unique constraint/
      );

      expect(mockBatch).toHaveBeenCalledTimes(5);
    });

    it("should fail immediately without retrying on non-concurrency database errors", async () => {
      mockFindFirstRestaurant.mockResolvedValue(baseRestaurant);
      mockFindManyProducts.mockResolvedValue([baseProduct]);
      mockFindFirstCustomer.mockResolvedValue(null);
      mockFindFirstOrder.mockResolvedValue({ orderNumber: 300 });

      const connectionError = new Error("Connection terminated unexpectedly");

      mockBatch.mockRejectedValueOnce(connectionError);

      await expect(createCustomerOrder(baseInput)).rejects.toThrow(
        "Connection terminated unexpectedly"
      );

      expect(mockBatch).toHaveBeenCalledTimes(1);
    });
  });

  describe("C2: Safe projection in getOrderByPublicId", () => {
    it("should return sanitized order stripped of platformFee and changedBy", async () => {
      mockFindFirstOrder.mockResolvedValue({
        id: "ord-999",
        publicId: "pld_test12345678",
        orderNumber: 42,
        type: "DELIVERY",
        status: "PREPARING",
        customerName: "Ana Clara",
        customerPhone: "11988884444",
        subtotal: "40.00",
        deliveryFee: "5.00",
        discount: "0.00",
        total: "45.00",
        platformFee: "0.23", // INTERNAL
        paymentMethod: "PIX",
        createdAt: new Date(),
        restaurant: {
          id: "rest-1",
          name: "Restaurante Teste",
          slug: "rest-teste",
          phone: "11900001111",
          address: "Rua A, 10",
        },
        items: [],
        statusHistory: [
          {
            id: "sh-1",
            fromStatus: null,
            toStatus: "RECEIVED",
            changedBy: "internal_user_id_123", // SENSITIVE
            note: "Pedido realizado",
            createdAt: new Date(),
          },
        ],
      });

      const order = await getOrderByPublicId("pld_test12345678");

      expect(order).not.toBeNull();
      const record = order as unknown as Record<string, unknown>;
      expect(record.platformFee).toBeUndefined();
      expect("platformFee" in record).toBe(false);

      const histRecord = order!.statusHistory[0] as unknown as Record<string, unknown>;
      expect(histRecord.changedBy).toBeUndefined();
      expect("changedBy" in histRecord).toBe(false);
    });
  });
});
