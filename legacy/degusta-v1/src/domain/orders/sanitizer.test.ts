import { describe, it, expect } from "vitest";
import { sanitizePublicOrder } from "./sanitizer";

describe("C2 - Public Order Projection Sanitizer", () => {
  const mockDbOrder = {
    id: "ord-123",
    publicId: "pld_secure_xyz789",
    orderNumber: 101,
    restaurantId: "rest-uuid-1",
    customerId: "cust-uuid-1",
    customerName: "Maria Silva",
    customerPhone: "11988887777",
    type: "DELIVERY",
    status: "CONFIRMED",
    deliveryStreet: "Rua das Flores",
    deliveryNumber: "123",
    deliveryComplement: "Apto 42",
    deliveryNeighborhood: "Centro",
    deliveryPostalCode: "01234-000",
    deliveryReference: "Próximo à padaria",
    subtotal: "45.00",
    deliveryFee: "7.00",
    discount: "0.00",
    total: "52.00",
    platformFee: "0.26", // SENSITIVE INTERNAL MARGIN FIELD
    paymentMethod: "PIX",
    changeFor: null,
    notes: "Sem cebola por favor",
    estimatedMinutes: 40,
    createdAt: new Date("2026-09-09T12:00:00Z"),
    updatedAt: new Date("2026-09-09T12:05:00Z"),
    restaurant: {
      id: "rest-uuid-1",
      name: "Hamburgueria do Bairro",
      slug: "hamburgueria-bairro",
      phone: "11977776666",
      address: "Av Principal, 500",
      logoUrl: "https://example.com/logo.png",
      internalNotes: "VIP client", // SENSITIVE INTERNAL FIELD
      pixKey: "pix@secret.com", // SENSITIVE INTERNAL FIELD
    },
    items: [
      {
        id: "item-1",
        orderId: "ord-123",
        productId: "prod-1",
        productName: "X-Burger Artesanal",
        unitPrice: "35.00",
        quantity: 1,
        subtotal: "45.00",
        notes: "Ponto da carne: bem passado",
        options: [
          {
            id: "opt-item-1",
            orderItemId: "item-1",
            productOptionId: "opt-1",
            groupName: "Adicionais",
            optionName: "Bacon crocante",
            price: "10.00",
          },
        ],
      },
    ],
    statusHistory: [
      {
        id: "hist-1",
        orderId: "ord-123",
        fromStatus: null,
        toStatus: "RECEIVED",
        changedBy: "CLIENT", // INTERNAL FIELD
        note: "Pedido realizado",
        createdAt: new Date("2026-09-09T12:00:00Z"),
      },
      {
        id: "hist-2",
        orderId: "ord-123",
        fromStatus: "RECEIVED",
        toStatus: "CONFIRMED",
        changedBy: "operator_user_id_456", // SENSITIVE OPERATOR USER ID
        note: "Aceito pela cozinha",
        createdAt: new Date("2026-09-09T12:02:00Z"),
      },
    ],
  };

  it("should never expose platformFee to the public projection", () => {
    const sanitized = sanitizePublicOrder(mockDbOrder);
    expect(sanitized).not.toBeNull();
    const record = sanitized as unknown as Record<string, unknown>;
    expect(record.platformFee).toBeUndefined();
    expect("platformFee" in record).toBe(false);
  });

  it("should never expose changedBy or operator identifiers in status history", () => {
    const sanitized = sanitizePublicOrder(mockDbOrder);
    expect(sanitized).not.toBeNull();
    expect(sanitized?.statusHistory).toHaveLength(2);

    for (const historyEntry of sanitized!.statusHistory) {
      const histRecord = historyEntry as unknown as Record<string, unknown>;
      expect(histRecord.changedBy).toBeUndefined();
      expect("changedBy" in historyEntry).toBe(false);
    }
  });

  it("should never expose internal customerId or internal restaurant metadata", () => {
    const sanitized = sanitizePublicOrder(mockDbOrder);
    const record = sanitized as unknown as Record<string, unknown>;
    expect(record.customerId).toBeUndefined();
    expect("customerId" in record).toBe(false);

    const restRecord = sanitized?.restaurant as unknown as Record<string, unknown>;
    expect(restRecord.internalNotes).toBeUndefined();
    expect(restRecord.pixKey).toBeUndefined();
  });

  it("should faithfully preserve all public tracking attributes", () => {
    const sanitized = sanitizePublicOrder(mockDbOrder);
    expect(sanitized).toEqual({
      id: "ord-123",
      publicId: "pld_secure_xyz789",
      orderNumber: 101,
      type: "DELIVERY",
      status: "CONFIRMED",
      customerName: "Maria Silva",
      customerPhone: "11988887777",
      deliveryStreet: "Rua das Flores",
      deliveryNumber: "123",
      deliveryComplement: "Apto 42",
      deliveryNeighborhood: "Centro",
      deliveryReference: "Próximo à padaria",
      subtotal: "45.00",
      deliveryFee: "7.00",
      discount: "0.00",
      total: "52.00",
      paymentMethod: "PIX",
      changeFor: null,
      notes: "Sem cebola por favor",
      estimatedMinutes: 40,
      createdAt: mockDbOrder.createdAt,
      restaurant: {
        id: "rest-uuid-1",
        name: "Hamburgueria do Bairro",
        slug: "hamburgueria-bairro",
        phone: "11977776666",
        address: "Av Principal, 500",
        logoUrl: "https://example.com/logo.png",
      },
      items: [
        {
          id: "item-1",
          productName: "X-Burger Artesanal",
          unitPrice: "35.00",
          quantity: 1,
          subtotal: "45.00",
          notes: "Ponto da carne: bem passado",
          options: [
            {
              id: "opt-item-1",
              groupName: "Adicionais",
              optionName: "Bacon crocante",
              price: "10.00",
            },
          ],
        },
      ],
      statusHistory: [
        {
          id: "hist-1",
          fromStatus: null,
          toStatus: "RECEIVED",
          note: "Pedido realizado",
          createdAt: mockDbOrder.statusHistory[0].createdAt,
        },
        {
          id: "hist-2",
          fromStatus: "RECEIVED",
          toStatus: "CONFIRMED",
          note: "Aceito pela cozinha",
          createdAt: mockDbOrder.statusHistory[1].createdAt,
        },
      ],
    });
  });

  it("should safely return null for nullish order inputs", () => {
    expect(sanitizePublicOrder(null)).toBeNull();
    expect(sanitizePublicOrder(undefined)).toBeNull();
  });
});
