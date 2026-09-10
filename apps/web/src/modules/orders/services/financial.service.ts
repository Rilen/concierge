import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, gte, lte, ne } from "drizzle-orm";

export async function getFinancialSummary(restaurantId: string, targetDate?: Date) {
  const date = targetDate || new Date();
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all orders today for this restaurant (excluding cancelled)
  const todayOrders = await db.query.orders.findMany({
    where: and(
      eq(schema.orders.restaurantId, restaurantId),
      gte(schema.orders.createdAt, startOfDay),
      lte(schema.orders.createdAt, endOfDay),
      ne(schema.orders.status, "CANCELLED")
    ),
  });

  const totalOrders = todayOrders.length;
  const totalRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const averageTicket = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

  // Active operational statuses
  const inPreparation = todayOrders.filter((o) => o.status === "PREPARING").length;
  const inDelivery = todayOrders.filter((o) => o.status === "OUT_FOR_DELIVERY").length;

  // Payment Breakdown
  const paymentBreakdown = {
    PIX: 0,
    CREDIT_CARD: 0,
    DEBIT_CARD: 0,
    CASH: 0,
  };

  for (const o of todayOrders) {
    const method = o.paymentMethod as keyof typeof paymentBreakdown;
    if (paymentBreakdown[method] !== undefined) {
      paymentBreakdown[method] += Number(o.total);
    }
  }

  // Round payment breakdown
  Object.keys(paymentBreakdown).forEach((k) => {
    const key = k as keyof typeof paymentBreakdown;
    paymentBreakdown[key] = Math.round(paymentBreakdown[key] * 100) / 100;
  });

  const platformFeeTotal = Math.round(totalRevenue * 0.005 * 100) / 100;

  return {
    date: startOfDay.toISOString().split("T")[0],
    totalOrders,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    averageTicket,
    inPreparation,
    inDelivery,
    paymentBreakdown,
    platformFeeTotal,
  };
}
