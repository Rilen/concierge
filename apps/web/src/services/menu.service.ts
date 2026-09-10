import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { logAudit } from "@/lib/auth-guard";

// ==========================================
// CATEGORIES
// ==========================================

export async function getCategoriesByRestaurant(restaurantId: string) {
  return await db.query.categories.findMany({
    where: and(
      eq(schema.categories.restaurantId, restaurantId),
      eq(schema.categories.active, true)
    ),
    orderBy: [asc(schema.categories.displayOrder), asc(schema.categories.name)],
  });
}

export async function getAllCategoriesByRestaurant(restaurantId: string) {
  return await db.query.categories.findMany({
    where: eq(schema.categories.restaurantId, restaurantId),
    orderBy: [asc(schema.categories.displayOrder), asc(schema.categories.name)],
  });
}

export async function createCategory(
  restaurantId: string,
  data: { name: string; description?: string | null; displayOrder?: number; active?: boolean },
  userId: string
) {
  const [category] = await db
    .insert(schema.categories)
    .values({
      restaurantId,
      name: data.name,
      description: data.description || null,
      displayOrder: data.displayOrder ?? 0,
      active: data.active ?? true,
    })
    .returning();

  await logAudit({
    restaurantId,
    userId,
    action: "CREATE_CATEGORY",
    entity: "categories",
    entityId: category.id,
    metadata: { name: category.name },
  });

  return category;
}

export async function updateCategory(
  restaurantId: string,
  categoryId: string,
  data: Partial<{ name: string; description: string | null; displayOrder: number; active: boolean }>,
  userId: string
) {
  const valuesToUpdate: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) valuesToUpdate.name = data.name;
  if (data.description !== undefined) valuesToUpdate.description = data.description;
  if (data.displayOrder !== undefined) valuesToUpdate.displayOrder = data.displayOrder;
  if (data.active !== undefined) valuesToUpdate.active = data.active;

  const [updated] = await db
    .update(schema.categories)
    .set(valuesToUpdate)
    .where(
      and(
        eq(schema.categories.id, categoryId),
        eq(schema.categories.restaurantId, restaurantId)
      )
    )
    .returning();

  await logAudit({
    restaurantId,
    userId,
    action: "UPDATE_CATEGORY",
    entity: "categories",
    entityId: categoryId,
    metadata: data,
  });

  return updated;
}

// ==========================================
// PRODUCTS
// ==========================================

export async function getFullMenuByRestaurant(restaurantId: string) {
  return await db.query.categories.findMany({
    where: and(
      eq(schema.categories.restaurantId, restaurantId),
      eq(schema.categories.active, true)
    ),
    orderBy: [asc(schema.categories.displayOrder)],
    with: {
      products: {
        where: eq(schema.products.active, true),
        orderBy: [asc(schema.products.displayOrder)],
        with: {
          optionGroups: {
            orderBy: [asc(schema.productOptionGroups.displayOrder)],
            with: {
              options: {
                where: eq(schema.productOptions.active, true),
                orderBy: [asc(schema.productOptions.displayOrder)],
              },
            },
          },
        },
      },
    },
  });
}

export async function getProductById(productId: string, restaurantId?: string) {
  const whereClause = restaurantId
    ? and(eq(schema.products.id, productId), eq(schema.products.restaurantId, restaurantId))
    : eq(schema.products.id, productId);

  return await db.query.products.findFirst({
    where: whereClause,
    with: {
      category: true,
      optionGroups: {
        orderBy: [asc(schema.productOptionGroups.displayOrder)],
        with: {
          options: {
            where: eq(schema.productOptions.active, true),
            orderBy: [asc(schema.productOptions.displayOrder)],
          },
        },
      },
    },
  });
}

export async function createProduct(
  restaurantId: string,
  data: {
    categoryId: string;
    name: string;
    description?: string | null;
    price: number;
    imageUrl?: string | null;
    active?: boolean;
    displayOrder?: number;
  },
  userId: string
) {
  const [product] = await db
    .insert(schema.products)
    .values({
      restaurantId,
      categoryId: data.categoryId,
      name: data.name,
      description: data.description || null,
      price: data.price.toFixed(2),
      imageUrl: data.imageUrl || null,
      active: data.active ?? true,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();

  await logAudit({
    restaurantId,
    userId,
    action: "CREATE_PRODUCT",
    entity: "products",
    entityId: product.id,
    metadata: { name: product.name, price: data.price },
  });

  return product;
}

export async function updateProduct(
  restaurantId: string,
  productId: string,
  data: Partial<{
    categoryId: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    active: boolean;
    displayOrder: number;
  }>,
  userId: string
) {
  const valuesToUpdate: Record<string, unknown> = { updatedAt: new Date() };
  if (data.categoryId !== undefined) valuesToUpdate.categoryId = data.categoryId;
  if (data.name !== undefined) valuesToUpdate.name = data.name;
  if (data.description !== undefined) valuesToUpdate.description = data.description;
  if (data.price !== undefined) valuesToUpdate.price = data.price.toFixed(2);
  if (data.imageUrl !== undefined) valuesToUpdate.imageUrl = data.imageUrl;
  if (data.active !== undefined) valuesToUpdate.active = data.active;
  if (data.displayOrder !== undefined) valuesToUpdate.displayOrder = data.displayOrder;

  const [updated] = await db
    .update(schema.products)
    .set(valuesToUpdate)
    .where(
      and(
        eq(schema.products.id, productId),
        eq(schema.products.restaurantId, restaurantId)
      )
    )
    .returning();

  await logAudit({
    restaurantId,
    userId,
    action: "UPDATE_PRODUCT",
    entity: "products",
    entityId: productId,
    metadata: data,
  });

  return updated;
}

// ==========================================
// OPTION GROUPS & OPTIONS
// ==========================================

export async function createOptionGroup(
  restaurantId: string,
  data: {
    productId: string;
    name: string;
    minSelect?: number;
    maxSelect?: number;
    required?: boolean;
    displayOrder?: number;
  },
  userId: string
) {
  const [group] = await db
    .insert(schema.productOptionGroups)
    .values({
      restaurantId,
      productId: data.productId,
      name: data.name,
      minSelect: data.minSelect ?? 0,
      maxSelect: data.maxSelect ?? 1,
      required: data.required ?? false,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();

  await logAudit({
    restaurantId,
    userId,
    action: "CREATE_OPTION_GROUP",
    entity: "product_option_groups",
    entityId: group.id,
    metadata: { name: group.name, productId: data.productId },
  });

  return group;
}

export async function updateOptionGroup(
  restaurantId: string,
  groupId: string,
  data: Partial<{
    name: string;
    minSelect: number;
    maxSelect: number;
    required: boolean;
    displayOrder: number;
  }>,
  userId: string
) {
  const valuesToUpdate: Record<string, unknown> = { updatedAt: new Date() };
  if (data.name !== undefined) valuesToUpdate.name = data.name;
  if (data.minSelect !== undefined) valuesToUpdate.minSelect = data.minSelect;
  if (data.maxSelect !== undefined) valuesToUpdate.maxSelect = data.maxSelect;
  if (data.required !== undefined) valuesToUpdate.required = data.required;
  if (data.displayOrder !== undefined) valuesToUpdate.displayOrder = data.displayOrder;

  const [updated] = await db
    .update(schema.productOptionGroups)
    .set(valuesToUpdate)
    .where(
      and(
        eq(schema.productOptionGroups.id, groupId),
        eq(schema.productOptionGroups.restaurantId, restaurantId)
      )
    )
    .returning();

  await logAudit({
    restaurantId,
    userId,
    action: "UPDATE_OPTION_GROUP",
    entity: "product_option_groups",
    entityId: groupId,
    metadata: data,
  });

  return updated;
}

export async function configurePizzaFlavors(
  restaurantId: string,
  productId: string,
  maxFlavors: number,
  userId: string
) {
  const product = await db.query.products.findFirst({
    where: and(
      eq(schema.products.id, productId),
      eq(schema.products.restaurantId, restaurantId)
    ),
    with: {
      optionGroups: {
        with: {
          options: true,
        },
      },
    },
  });

  if (!product) {
    throw new Error("Produto não encontrado ou não pertence a este estabelecimento.");
  }

  const flavorGroups = product.optionGroups.filter((g) =>
    g.name.toLowerCase().includes("sabor")
  );

  let targetGroup = flavorGroups[0];

  if (!targetGroup) {
    const [created] = await db
      .insert(schema.productOptionGroups)
      .values({
        restaurantId,
        productId,
        name: "Sabores",
        minSelect: 1,
        maxSelect: maxFlavors,
        required: true,
        displayOrder: 0,
      })
      .returning();
    targetGroup = { ...created, options: [] };
  } else {
    const [updated] = await db
      .update(schema.productOptionGroups)
      .set({
        name: "Sabores",
        minSelect: 1,
        maxSelect: maxFlavors,
        required: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(schema.productOptionGroups.id, targetGroup.id),
          eq(schema.productOptionGroups.restaurantId, restaurantId)
        )
      )
      .returning();
    targetGroup = { ...targetGroup, ...updated };

    if (flavorGroups.length > 1) {
      for (let i = 1; i < flavorGroups.length; i++) {
        const extraGroup = flavorGroups[i];
        for (const opt of extraGroup.options) {
          const alreadyInTarget = targetGroup.options.some(
            (o) => o.name.toLowerCase().trim() === opt.name.toLowerCase().trim()
          );
          if (!alreadyInTarget) {
            await db.insert(schema.productOptions).values({
              restaurantId,
              optionGroupId: targetGroup.id,
              name: opt.name,
              price: opt.price,
              active: opt.active,
              displayOrder: opt.displayOrder,
            });
          }
        }
        await db
          .delete(schema.productOptionGroups)
          .where(
            and(
              eq(schema.productOptionGroups.id, extraGroup.id),
              eq(schema.productOptionGroups.restaurantId, restaurantId)
            )
          );
      }
    }
  }

  await logAudit({
    restaurantId,
    userId,
    action: "CONFIGURE_PIZZA_FLAVORS",
    entity: "product_option_groups",
    entityId: targetGroup.id,
    metadata: { productId, maxFlavors },
  });

  return targetGroup;
}

export async function createOption(
  restaurantId: string,
  data: {
    optionGroupId: string;
    name: string;
    price?: number;
    active?: boolean;
    displayOrder?: number;
  },
  userId: string
) {
  const [option] = await db
    .insert(schema.productOptions)
    .values({
      restaurantId,
      optionGroupId: data.optionGroupId,
      name: data.name,
      price: (data.price ?? 0).toFixed(2),
      active: data.active ?? true,
      displayOrder: data.displayOrder ?? 0,
    })
    .returning();

  await logAudit({
    restaurantId,
    userId,
    action: "CREATE_OPTION",
    entity: "product_options",
    entityId: option.id,
    metadata: { name: option.name, price: data.price },
  });

  return option;
}
