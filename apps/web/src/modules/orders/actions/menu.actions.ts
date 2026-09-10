"use server";

import { revalidatePath } from "next/cache";
import { requireRestaurantRole } from "@/lib/auth-guard";
import {
  createCategorySchema,
  updateCategorySchema,
  createProductSchema,
  updateProductSchema,
  createOptionGroupSchema,
  updateOptionGroupSchema,
  configurePizzaFlavorsSchema,
  createOptionSchema,
} from "@/domain/validators";
import {
  createCategory,
  updateCategory,
  createProduct,
  updateProduct,
  createOptionGroup,
  updateOptionGroup,
  configurePizzaFlavors,
  createOption,
} from "@/services/menu.service";

export async function createCategoryAction(restaurantId: string, rawInput: unknown) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = createCategorySchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const category = await createCategory(restaurantId, parsed.data, user.id);
    revalidatePath("/gestao/cardapio");
    revalidatePath("/gestao/categorias");
    return { success: true, category };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateCategoryAction(
  restaurantId: string,
  categoryId: string,
  rawInput: unknown
) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = updateCategorySchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const updated = await updateCategory(restaurantId, categoryId, parsed.data, user.id);
    revalidatePath("/gestao/cardapio");
    revalidatePath("/gestao/categorias");
    return { success: true, category: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createProductAction(restaurantId: string, rawInput: unknown) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = createProductSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const product = await createProduct(restaurantId, parsed.data, user.id);
    revalidatePath("/gestao/cardapio");
    revalidatePath("/gestao/produtos");
    return { success: true, product };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateProductAction(
  restaurantId: string,
  productId: string,
  rawInput: unknown
) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = updateProductSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const updated = await updateProduct(restaurantId, productId, parsed.data, user.id);
    revalidatePath("/gestao/cardapio");
    revalidatePath("/gestao/produtos");
    return { success: true, product: updated };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createOptionGroupAction(restaurantId: string, rawInput: unknown) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = createOptionGroupSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const group = await createOptionGroup(restaurantId, parsed.data, user.id);
    revalidatePath("/gestao/cardapio");
    return { success: true, group };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function createOptionAction(restaurantId: string, rawInput: unknown) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = createOptionSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const option = await createOption(restaurantId, parsed.data, user.id);
    revalidatePath("/gestao/cardapio");
    return { success: true, option };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function configurePizzaFlavorsAction(restaurantId: string, rawInput: unknown) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = configurePizzaFlavorsSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const group = await configurePizzaFlavors(
      restaurantId,
      parsed.data.productId,
      parsed.data.maxFlavors,
      user.id
    );
    revalidatePath("/gestao/cardapio");
    return { success: true, group };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

export async function updateOptionGroupAction(
  restaurantId: string,
  groupId: string,
  rawInput: unknown
) {
  const { user } = await requireRestaurantRole(restaurantId, ["GERENTE"]);
  const parsed = updateOptionGroupSchema.safeParse(rawInput);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Dados inválidos." };
  }

  try {
    const group = await updateOptionGroup(restaurantId, groupId, parsed.data, user.id);
    revalidatePath("/gestao/cardapio");
    return { success: true, group };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
