import { z } from "zod";
import { prisma } from "@concierge/database";
import {
  validateOrder,
  calculateOrderTotals,
  OrderType,
  PaymentMethod,
  type VerifiedOrderItem,
} from "@concierge/core/orders";

export const createOrderDraftToolSchema = z.object({
  restaurantSlug: z.string().describe("Slug identificador do restaurante"),
  orderType: z.enum(["DELIVERY", "PICKUP"]).describe("Modalidade: DELIVERY ou PICKUP"),
  items: z
    .array(
      z.object({
        productId: z.string().describe("ID do produto"),
        quantity: z.number().int().min(1).describe("Quantidade do item"),
        selectedOptionIds: z
          .array(z.string())
          .default([])
          .describe("Lista de IDs de opções selecionadas"),
        notes: z.string().optional().describe("Observações do item"),
      })
    )
    .min(1)
    .describe("Lista de itens a serem incluídos no pedido"),
  deliveryAddress: z
    .object({
      street: z.string(),
      number: z.string(),
      neighborhood: z.string(),
      complement: z.string().optional(),
    })
    .optional()
    .describe("Endereço de entrega caso a modalidade seja DELIVERY"),
});

export type CreateOrderDraftParams = z.infer<typeof createOrderDraftToolSchema>;

export interface DraftItemOption {
  groupName: string;
  optionName: string;
  price: string;
}

export interface DraftItem {
  productId: string;
  productName: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
  notes?: string | null;
  options: DraftItemOption[];
}

export interface DraftRestaurant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  address: string;
  logoUrl?: string | null;
}

export interface DraftFinancial {
  subtotal: string;
  deliveryFee: string;
  discount: string;
  total: string;
}

export interface OrderDraft {
  draftId: string;
  restaurant: DraftRestaurant;
  items: DraftItem[];
  financial: DraftFinancial;
  orderType: OrderType;
  estimatedMinutes: number | null;
  paymentMethods: PaymentMethod[];
  deliveryAddress?: {
    street: string;
    number: string;
    neighborhood: string;
    complement?: string | null;
  } | null;
  notes?: string | null;
}

export interface DraftError {
  error: string;
}

export type CreateOrderDraftResult = OrderDraft | DraftError;

export const createOrderDraftToolDefinition = {
  name: "create_order_draft",
  description:
    "Cria e valida um rascunho de pedido delivery ou retirada, calculando valores oficiais com base no cardápio.",
  parameters: createOrderDraftToolSchema,
};

function verifiedItemToDraftItem(item: VerifiedOrderItem): DraftItem {
  return {
    productId: item.productId,
    productName: item.productName,
    unitPrice: item.unitPrice.toFixed(2),
    quantity: item.quantity,
    subtotal: item.subtotal.toFixed(2),
    notes: item.notes ?? null,
    options: item.options.map((opt) => ({
      groupName: opt.groupName,
      optionName: opt.optionName,
      price: opt.price.toFixed(2),
    })),
  };
}

export async function executeCreateOrderDraft(
  params: CreateOrderDraftParams
): Promise<CreateOrderDraftResult> {
  const restaurant = await prisma.restaurant.findFirst({
    where: { slug: params.restaurantSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      address: true,
      logoUrl: true,
      status: true,
      deliveryEnabled: true,
      pickupEnabled: true,
      fixedDeliveryFee: true,
      minOrderAmount: true,
      commissionRate: true,
      estimatedTimeMin: true,
      estimatedTimeMax: true,
    },
  });

  if (!restaurant) {
    return { error: "Restaurante não encontrado." };
  }

  if (restaurant.status !== "OPEN") {
    return {
      error: "O restaurante está temporariamente fechado para novos pedidos.",
    };
  }

  if (params.orderType === "DELIVERY" && !restaurant.deliveryEnabled) {
    return { error: "Entrega temporariamente desativada para este estabelecimento." };
  }

  if (params.orderType === "PICKUP" && !restaurant.pickupEnabled) {
    return { error: "Retirada no local temporariamente desativada para este estabelecimento." };
  }

  if (params.orderType === "DELIVERY" && !params.deliveryAddress) {
    return {
      error: "Endereço de entrega é obrigatório para pedidos delivery.",
    };
  }

  const productIds = Array.from(new Set(params.items.map((i) => i.productId)));

  const dbProducts = await prisma.product.findMany({
    where: {
      restaurantId: restaurant.id,
      active: true,
      id: { in: productIds },
    },
    include: {
      optionGroups: {
        include: {
          options: true,
        },
      },
    },
  });

  const domainProducts = dbProducts.map((p) => ({
    id: p.id,
    restaurantId: p.restaurantId,
    name: p.name,
    active: p.active,
    price: Number(p.price),
    optionGroups: p.optionGroups.map((g) => ({
      id: g.id,
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      required: g.required,
      options: g.options.map((o) => ({
        id: o.id,
        name: o.name,
        price: Number(o.price),
        active: o.active,
        restaurantId: o.restaurantId,
      })),
    })),
  }));

  const validation = validateOrder(
    domainProducts,
    params.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      selectedOptionIds: i.selectedOptionIds,
      notes: i.notes ?? null,
    })),
    restaurant.id
  );

  if (!validation.isValid) {
    return {
      error: validation.error || "Validação do pedido falhou.",
    };
  }

  const totals = calculateOrderTotals(
    validation.items,
    params.orderType,
    Number(restaurant.fixedDeliveryFee),
    0,
    Number(restaurant.commissionRate)
  );

  const minOrder = Number(restaurant.minOrderAmount);
  if (minOrder > 0 && totals.subtotal < minOrder) {
    return {
      error: `O pedido mínimo para este restaurante é de R$ ${minOrder.toFixed(2)}.`,
    };
  }

  const draft: OrderDraft = {
    draftId: `draft_${crypto.randomUUID()}`,
    restaurant: {
      id: restaurant.id,
      name: restaurant.name,
      slug: restaurant.slug,
      phone: restaurant.phone,
      address: restaurant.address,
      logoUrl: restaurant.logoUrl,
    },
    items: validation.items.map(verifiedItemToDraftItem),
    financial: {
      subtotal: totals.subtotal.toFixed(2),
      deliveryFee: totals.deliveryFee.toFixed(2),
      discount: totals.discount.toFixed(2),
      total: totals.total.toFixed(2),
    },
    orderType: params.orderType,
    estimatedMinutes:
      params.orderType === "DELIVERY"
        ? restaurant.estimatedTimeMax
        : restaurant.estimatedTimeMin,
    paymentMethods: ["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"],
    deliveryAddress: params.deliveryAddress
      ? {
          street: params.deliveryAddress.street,
          number: params.deliveryAddress.number,
          neighborhood: params.deliveryAddress.neighborhood,
          complement: params.deliveryAddress.complement ?? null,
        }
      : null,
  };

  return draft;
}
