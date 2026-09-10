"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantRole } from "@/lib/auth-guard";
import { createOrderSchema, updateOrderStatusSchema } from "@/domain/validators";
import { createCustomerOrder, updateOrderStatus } from "@/services/order.service";
import { OrderStatus } from "@/domain/orders/calculations";

export async function createOrderAction(rawInput: unknown) {
  const parsed = createOrderSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados do pedido inválidos.",
    };
  }

  try {
    const result = await createCustomerOrder(parsed.data);
    return {
      success: true,
      publicId: result.publicId,
      orderNumber: result.orderNumber,
    };
  } catch (error) {
    console.error("Erro ao criar pedido:", error);
    return {
      success: false,
      error: (error as Error).message || "Falha ao processar pedido.",
    };
  }
}

export async function updateOrderStatusAction(
  restaurantId: string,
  rawInput: unknown
) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE", "PEDIDOS"]);
  const parsed = updateOrderStatusSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados inválidos.",
    };
  }

  try {
    const updated = await updateOrderStatus({
      restaurantId,
      orderId: parsed.data.orderId,
      nextStatus: parsed.data.nextStatus as OrderStatus,
      userId: user.id,
      note: parsed.data.note,
    });

    revalidatePath("/pedidos");
    revalidatePath("/gestao/pedidos");
    revalidatePath(`/pedido/${updated.publicId}`);

    return { success: true, order: updated };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message || "Falha ao atualizar status do pedido.",
    };
  }
}
