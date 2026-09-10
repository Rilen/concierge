import { z } from "zod";

// ==========================================
// RESTAURANT SCHEMAS
// ==========================================

export const createRestaurantSchema = z.object({
  name: z.string().min(2, "Nome do restaurante deve ter pelo menos 2 caracteres").max(100),
  slug: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug deve conter apenas letras minúsculas, números e traços"),
  phone: z.string().min(8, "Telefone inválido").max(20),
  address: z.string().min(5, "Endereço completo é obrigatório").max(200),
  openingHours: z.string().min(3).max(100).default("18:00 às 23:00"),
  status: z.enum(["OPEN", "CLOSED", "PAUSED"]).default("CLOSED"),
  estimatedTimeMin: z.coerce.number().int().min(5).max(180).default(20),
  estimatedTimeMax: z.coerce.number().int().min(5).max(240).default(45),
  deliveryEnabled: z.boolean().default(true),
  pickupEnabled: z.boolean().default(true),
  fixedDeliveryFee: z.coerce.number().min(0).max(999).default(7.0),
  minOrderAmount: z.coerce.number().min(0).max(999).default(0.0),
});

export const updateRestaurantSchema = createRestaurantSchema.partial();

// ==========================================
// CATEGORY SCHEMAS
// ==========================================

export const createCategorySchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório").max(50),
  description: z.string().max(200).optional().nullable(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

export const updateCategorySchema = createCategorySchema.partial();

// ==========================================
// PRODUCT SCHEMAS
// ==========================================

export const createProductSchema = z.object({
  categoryId: z.string().min(1, "Categoria inválida"),
  name: z.string().min(1, "Nome do produto é obrigatório").max(100),
  description: z.string().max(500).optional().nullable(),
  price: z.coerce.number().min(0.01, "Preço deve ser maior que zero"),
  imageUrl: z.string().url("URL de imagem inválida").optional().nullable().or(z.literal("")),
  active: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const updateProductSchema = createProductSchema.partial();

// ==========================================
// PRODUCT OPTION GROUPS & OPTIONS
// ==========================================

export const createOptionGroupSchema = z.object({
  productId: z.string().min(1, "Produto inválido"),
  name: z.string().min(1, "Nome do grupo é obrigatório").max(50),
  minSelect: z.coerce.number().int().min(0).default(0),
  maxSelect: z.coerce.number().int().min(1).default(1),
  required: z.boolean().default(false),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const updateOptionGroupSchema = createOptionGroupSchema.partial().omit({ productId: true });

export const configurePizzaFlavorsSchema = z.object({
  productId: z.string().min(1, "Produto inválido"),
  maxFlavors: z.coerce
    .number()
    .int("Quantidade de sabores deve ser um número inteiro")
    .min(1, "Mínimo de 1 sabor")
    .max(4, "Máximo de 4 sabores"),
});

export const createOptionSchema = z.object({
  optionGroupId: z.string().min(1, "Grupo de opções inválido"),
  name: z.string().min(1, "Nome da opção é obrigatório").max(50),
  price: z.coerce.number().min(0).default(0),
  active: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

// ==========================================
// CHECKOUT / ORDER SCHEMAS
// ==========================================

export const checkoutItemOptionSchema = z.object({
  optionId: z.string().min(1),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Produto inválido"),
  quantity: z.coerce.number().int().min(1, "Quantidade mínima é 1").max(50),
  notes: z.string().max(250).optional().nullable(),
  selectedOptionIds: z.array(z.string().min(1)).default([]),
});

export const createOrderSchema = z
  .object({
    restaurantSlug: z.string().min(1),
    customerName: z.string().min(2, "Informe seu nome (mínimo 2 caracteres)").max(100),
    customerPhone: z.string().min(8, "Informe um telefone válido para contato").max(20),
    type: z.enum(["DELIVERY", "PICKUP"]),
    // Delivery fields (validated in superRefine if type === 'DELIVERY')
    deliveryStreet: z.string().max(120).optional().nullable(),
    deliveryNumber: z.string().max(20).optional().nullable(),
    deliveryComplement: z.string().max(60).optional().nullable(),
    deliveryNeighborhood: z.string().max(80).optional().nullable(),
    deliveryPostalCode: z.string().max(15).optional().nullable(),
    deliveryReference: z.string().max(120).optional().nullable(),

    // Payment details
    paymentMethod: z.enum(["PIX", "CREDIT_CARD", "DEBIT_CARD", "CASH"]),
    changeFor: z.coerce.number().min(0).optional().nullable(),
    notes: z.string().max(300).optional().nullable(),

    // Items
    items: z.array(checkoutItemSchema).min(1, "O carrinho deve ter pelo menos um item"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "DELIVERY") {
      if (!data.deliveryStreet || data.deliveryStreet.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rua é obrigatória para entrega",
          path: ["deliveryStreet"],
        });
      }
      if (!data.deliveryNumber || data.deliveryNumber.trim().length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Número é obrigatório para entrega",
          path: ["deliveryNumber"],
        });
      }
      if (!data.deliveryNeighborhood || data.deliveryNeighborhood.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Bairro é obrigatório para entrega",
          path: ["deliveryNeighborhood"],
        });
      }
    }
  });

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "RECEIVED",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "PICKED_UP",
    "CANCELLED",
  ]),
  note: z.string().max(250).optional(),
});
