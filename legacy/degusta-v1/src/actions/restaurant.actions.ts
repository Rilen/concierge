"use server";

import { revalidatePath } from "next/cache";
import { requireMaster, requireRestaurantRole } from "@/lib/auth-guard";
import { createRestaurantSchema, updateRestaurantSchema } from "@/domain/validators";
import { createRestaurant, updateRestaurant } from "@/services/restaurant.service";

export async function createRestaurantAction(rawInput: unknown) {
  const master = await requireMaster();
  const parsed = createRestaurantSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados inválidos.",
    };
  }

  try {
    const restaurant = await createRestaurant(parsed.data, master.id);
    revalidatePath("/admin/restaurantes");
    return { success: true, restaurantId: restaurant.id };
  } catch (error) {
    console.error("Erro ao criar restaurante:", error);
    return { success: false, error: (error as Error).message || "Falha ao criar restaurante." };
  }
}

export async function updateRestaurantAction(restaurantId: string, rawInput: unknown) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = updateRestaurantSchema.safeParse(rawInput);

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message || "Dados inválidos.",
    };
  }

  try {
    const updated = await updateRestaurant(restaurantId, parsed.data, user.id);
    revalidatePath(`/gestao/configuracoes`);
    revalidatePath(`/r/${updated.slug}`);
    return { success: true, restaurant: updated };
  } catch (error) {
    console.error("Erro ao atualizar restaurante:", error);
    return { success: false, error: (error as Error).message || "Falha ao atualizar restaurante." };
  }
}
