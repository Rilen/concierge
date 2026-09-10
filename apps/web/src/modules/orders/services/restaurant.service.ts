import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { logAudit } from "@/lib/auth-guard";

export async function getRestaurantBySlug(slug: string) {
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(schema.restaurants.slug, slug),
    with: {
      settings: true,
      paymentSettings: true,
    },
  });

  return restaurant || null;
}

export async function getRestaurantById(id: string) {
  const restaurant = await db.query.restaurants.findFirst({
    where: eq(schema.restaurants.id, id),
    with: {
      settings: true,
      paymentSettings: true,
    },
  });

  return restaurant || null;
}

export async function listAllRestaurants() {
  return await db.query.restaurants.findMany({
    orderBy: [desc(schema.restaurants.createdAt)],
  });
}

export async function createRestaurant(
  data: {
    name: string;
    slug: string;
    phone: string;
    address: string;
    openingHours?: string;
    status?: "OPEN" | "CLOSED" | "PAUSED";
    estimatedTimeMin?: number;
    estimatedTimeMax?: number;
    deliveryEnabled?: boolean;
    pickupEnabled?: boolean;
    fixedDeliveryFee?: number;
    minOrderAmount?: number;
  },
  userId: string
) {
  const [restaurant] = await db
    .insert(schema.restaurants)
    .values({
      name: data.name,
      slug: data.slug.toLowerCase().trim(),
      phone: data.phone,
      address: data.address,
      openingHours: data.openingHours || "18:00 às 23:00",
      status: data.status || "CLOSED",
      estimatedTimeMin: data.estimatedTimeMin ?? 20,
      estimatedTimeMax: data.estimatedTimeMax ?? 45,
      deliveryEnabled: data.deliveryEnabled ?? true,
      pickupEnabled: data.pickupEnabled ?? true,
      fixedDeliveryFee: (data.fixedDeliveryFee ?? 7.0).toFixed(2),
      minOrderAmount: (data.minOrderAmount ?? 0.0).toFixed(2),
    })
    .returning();

  // Create default operational and payment settings
  await db.insert(schema.restaurantSettings).values({
    restaurantId: restaurant.id,
    loyaltyPointsPerReal: "1.00",
    loyaltyRedemptionValue: "0.05",
    autoAcceptOrders: false,
    soundNotifications: true,
  });

  await db.insert(schema.paymentSettings).values({
    restaurantId: restaurant.id,
    acceptsPix: true,
    acceptsCredit: true,
    acceptsDebit: true,
    acceptsCash: true,
  });

  await logAudit({
    restaurantId: restaurant.id,
    userId,
    action: "CREATE_RESTAURANT",
    entity: "restaurants",
    entityId: restaurant.id,
    metadata: { name: restaurant.name, slug: restaurant.slug },
  });

  return restaurant;
}

export async function updateRestaurant(
  restaurantId: string,
  data: Partial<{
    name: string;
    slug: string;
    phone: string;
    address: string;
    openingHours: string;
    status: "OPEN" | "CLOSED" | "PAUSED";
    estimatedTimeMin: number;
    estimatedTimeMax: number;
    deliveryEnabled: boolean;
    pickupEnabled: boolean;
    fixedDeliveryFee: number;
    minOrderAmount: number;
  }>,
  userId: string
) {
  const valuesToUpdate: Record<string, unknown> = {};

  if (data.name !== undefined) valuesToUpdate.name = data.name;
  if (data.slug !== undefined) valuesToUpdate.slug = data.slug.toLowerCase().trim();
  if (data.phone !== undefined) valuesToUpdate.phone = data.phone;
  if (data.address !== undefined) valuesToUpdate.address = data.address;
  if (data.openingHours !== undefined) valuesToUpdate.openingHours = data.openingHours;
  if (data.status !== undefined) valuesToUpdate.status = data.status;
  if (data.estimatedTimeMin !== undefined) valuesToUpdate.estimatedTimeMin = data.estimatedTimeMin;
  if (data.estimatedTimeMax !== undefined) valuesToUpdate.estimatedTimeMax = data.estimatedTimeMax;
  if (data.deliveryEnabled !== undefined) valuesToUpdate.deliveryEnabled = data.deliveryEnabled;
  if (data.pickupEnabled !== undefined) valuesToUpdate.pickupEnabled = data.pickupEnabled;
  if (data.fixedDeliveryFee !== undefined) valuesToUpdate.fixedDeliveryFee = data.fixedDeliveryFee.toFixed(2);
  if (data.minOrderAmount !== undefined) valuesToUpdate.minOrderAmount = data.minOrderAmount.toFixed(2);
  valuesToUpdate.updatedAt = new Date();

  const [updated] = await db
    .update(schema.restaurants)
    .set(valuesToUpdate)
    .where(eq(schema.restaurants.id, restaurantId))
    .returning();

  await logAudit({
    restaurantId,
    userId,
    action: "UPDATE_RESTAURANT",
    entity: "restaurants",
    entityId: restaurantId,
    metadata: data,
  });

  return updated;
}
