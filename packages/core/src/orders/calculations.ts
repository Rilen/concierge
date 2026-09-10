export type OrderStatus =
  | "RECEIVED"
  | "CONFIRMED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "PICKED_UP"
  | "CANCELLED";

export type OrderType = "DELIVERY" | "PICKUP";

export type PaymentMethod = "PIX" | "CREDIT_CARD" | "DEBIT_CARD" | "CASH";

/**
 * Calculates item subtotal: (unitPrice + optionsPrice) * quantity
 * Returns value rounded to 2 decimal places using exact cents arithmetic.
 */
export function calculateItemSubtotal(
  unitPrice: number,
  quantity: number,
  optionsPrice = 0
): number {
  if (quantity <= 0) return 0;
  const unitCents = Math.round(Number(unitPrice) * 100);
  const optionsCents = Math.round(Number(optionsPrice) * 100);
  const singleItemCents = unitCents + optionsCents;
  const totalCents = singleItemCents * quantity;
  return totalCents / 100;
}

/**
 * Calculates order subtotal by summing up all item subtotals using cents arithmetic.
 */
export function calculateOrderSubtotal(items: Array<{ subtotal: number }>): number {
  const sumCents = items.reduce(
    (acc, item) => acc + Math.round(Number(item.subtotal) * 100),
    0
  );
  return sumCents / 100;
}

/**
 * Calculates delivery fee based on order type.
 * For PICKUP, fee is always 0.
 */
export function calculateDeliveryFee(type: OrderType, fixedFee: number): number {
  if (type === "PICKUP") return 0;
  const feeCents = Math.max(0, Math.round(Number(fixedFee) * 100));
  return feeCents / 100;
}

/**
 * Calculates final order total: Subtotal + DeliveryFee - Discount.
 * Total cannot be negative. Uses exact cents arithmetic.
 */
export function calculateOrderTotal(
  subtotal: number,
  deliveryFee: number,
  discount = 0
): number {
  const subCents = Math.round(Number(subtotal) * 100);
  const delivCents = Math.round(Number(deliveryFee) * 100);
  const discCents = Math.round(Number(discount) * 100);
  const totalCents = Math.max(0, subCents + delivCents - discCents);
  return totalCents / 100;
}

/**
 * Calculates cash change required using exact cents arithmetic.
 */
export function calculateChange(
  total: number,
  cashGiven?: number | null
): { change: number; isValid: boolean; error?: string } {
  if (cashGiven === undefined || cashGiven === null || Number.isNaN(cashGiven)) {
    return { change: 0, isValid: false, error: "Valor entregue não informado" };
  }

  const cashCents = Math.round(Number(cashGiven) * 100);
  const totalCents = Math.round(Number(total) * 100);

  if (cashCents < totalCents) {
    return {
      change: 0,
      isValid: false,
      error: `Valor insuficiente. Faltam R$ ${((totalCents - cashCents) / 100).toFixed(2)}`,
    };
  }

  const changeCents = cashCents - totalCents;
  return { change: changeCents / 100, isValid: true };
}

/**
 * Calculates platform fee: 0.5% default platform fee (Constitution Art. 40).
 * Operates in integer cents with standard half-up rounding.
 */
export function calculatePlatformFee(total: number, feeRate = 0.005): number {
  const totalCents = Math.round(Number(total) * 100);
  const feeCents = Math.round(totalCents * feeRate);
  return feeCents / 100;
}

/**
 * Calculates loyalty points earned from order subtotal.
 */
export function calculateLoyaltyPoints(
  subtotal: number,
  pointsPerReal = 1.0
): number {
  if (subtotal <= 0) return 0;
  return Math.floor(Number(subtotal) * Number(pointsPerReal));
}

/**
 * Validates allowable state transitions for an order.
 */
export function canTransitionStatus(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
  orderType: OrderType
): boolean {
  if (currentStatus === nextStatus) return true;

  // CANCELLED cannot transition to any other status
  if (currentStatus === "CANCELLED") return false;

  // An order can be cancelled from any non-final state
  if (nextStatus === "CANCELLED") {
    return currentStatus !== "DELIVERED" && currentStatus !== "PICKED_UP";
  }

  if (orderType === "DELIVERY") {
    const validDeliveryTransitions: Record<OrderStatus, OrderStatus[]> = {
      RECEIVED: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY", "CANCELLED"],
      READY: ["OUT_FOR_DELIVERY", "CANCELLED"],
      OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
      DELIVERED: [],
      PICKED_UP: [],
      CANCELLED: [],
    };
    return validDeliveryTransitions[currentStatus]?.includes(nextStatus) ?? false;
  }

  if (orderType === "PICKUP") {
    const validPickupTransitions: Record<OrderStatus, OrderStatus[]> = {
      RECEIVED: ["CONFIRMED", "CANCELLED"],
      CONFIRMED: ["PREPARING", "CANCELLED"],
      PREPARING: ["READY", "CANCELLED"],
      READY: ["PICKED_UP", "CANCELLED"],
      OUT_FOR_DELIVERY: [],
      PICKED_UP: [],
      DELIVERED: [],
      CANCELLED: [],
    };
    return validPickupTransitions[currentStatus]?.includes(nextStatus) ?? false;
  }

  return false;
}
