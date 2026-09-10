import { z } from "zod";

export const createOrderDraftToolSchema = z.object({
  restaurantSlug: z.string().describe("Slug identificador do restaurante"),
  orderType: z.enum(["DELIVERY", "PICKUP"]).describe("Modalidade: DELIVERY ou PICKUP"),
  items: z.array(
    z.object({
      productId: z.string().describe("ID do produto"),
      quantity: z.number().int().min(1).describe("Quantidade do item"),
      selectedOptionIds: z.array(z.string()).default([]).describe("Lista de IDs de opções selecionadas"),
      notes: z.string().optional().describe("Observações do item"),
    })
  ).min(1).describe("Lista de itens a serem incluídos no pedido"),
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

export const createOrderDraftToolDefinition = {
  name: "create_order_draft",
  description: "Cria e valida um rascunho de pedido delivery ou retirada, calculando valores oficiais com base no cardápio",
  parameters: createOrderDraftToolSchema,
};
