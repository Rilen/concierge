import { describe, it, expect } from "vitest";
import {
  calculateItemSubtotal,
  calculateOrderSubtotal,
  calculateDeliveryFee,
  calculateOrderTotal,
  calculateChange,
  calculatePlatformFee,
  calculateLoyaltyPoints,
  canTransitionStatus,
} from "./calculations";

describe("Domain Order Calculations", () => {
  describe("calculateItemSubtotal", () => {
    it("should calculate base price times quantity", () => {
      expect(calculateItemSubtotal(29.9, 2)).toBe(59.8);
    });

    it("should include option prices in item subtotal", () => {
      // 29.90 + 4.50 (bacon) + 3.00 (queijo) = 37.40 * 2 = 74.80
      expect(calculateItemSubtotal(29.9, 2, 7.5)).toBe(74.8);
    });

    it("should return 0 when quantity is zero or negative", () => {
      expect(calculateItemSubtotal(29.9, 0)).toBe(0);
      expect(calculateItemSubtotal(29.9, -1)).toBe(0);
    });
  });

  describe("calculateOrderSubtotal", () => {
    it("should sum subtotals of all items accurately", () => {
      const items = [{ subtotal: 59.8 }, { subtotal: 15.5 }, { subtotal: 9.0 }];
      expect(calculateOrderSubtotal(items)).toBe(84.3);
    });

    it("should handle empty items array", () => {
      expect(calculateOrderSubtotal([])).toBe(0);
    });
  });

  describe("calculateDeliveryFee", () => {
    it("should apply fixed fee for DELIVERY", () => {
      expect(calculateDeliveryFee("DELIVERY", 7.0)).toBe(7.0);
    });

    it("should return 0 for PICKUP", () => {
      expect(calculateDeliveryFee("PICKUP", 7.0)).toBe(0);
    });
  });

  describe("calculateOrderTotal", () => {
    it("should sum subtotal, delivery fee and subtract discount", () => {
      expect(calculateOrderTotal(50.0, 7.0, 5.0)).toBe(52.0);
    });

    it("should not allow negative total", () => {
      expect(calculateOrderTotal(10.0, 0, 20.0)).toBe(0);
    });
  });

  describe("calculateChange", () => {
    it("should compute exact change when cash exceeds total", () => {
      const result = calculateChange(47.0, 50.0);
      expect(result.isValid).toBe(true);
      expect(result.change).toBe(3.0);
    });

    it("should return change 0 when exact amount is provided", () => {
      const result = calculateChange(47.0, 47.0);
      expect(result.isValid).toBe(true);
      expect(result.change).toBe(0);
    });

    it("should return error when cash is insufficient", () => {
      const result = calculateChange(47.0, 40.0);
      expect(result.isValid).toBe(false);
      expect(result.change).toBe(0);
      expect(result.error).toContain("Valor insuficiente");
    });
  });

  describe("calculatePlatformFee", () => {
    it("should calculate 0.5% Paladar fee on order total", () => {
      // 30000 * 0.005 = 150
      expect(calculatePlatformFee(30000)).toBe(150);
      // 49.90 * 0.005 = 0.2495 -> 0.25
      expect(calculatePlatformFee(49.9)).toBe(0.25);
    });
  });

  describe("calculateLoyaltyPoints", () => {
    it("should compute 1 point per 1 Real by default", () => {
      expect(calculateLoyaltyPoints(49.9)).toBe(49);
      expect(calculateLoyaltyPoints(100.0)).toBe(100);
    });

    it("should support custom rates (e.g. 1 point every 10 Reais = 0.1 rate)", () => {
      expect(calculateLoyaltyPoints(95.0, 0.1)).toBe(9);
    });
  });

  describe("canTransitionStatus", () => {
    it("should allow valid DELIVERY state flow", () => {
      expect(canTransitionStatus("RECEIVED", "CONFIRMED", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("CONFIRMED", "PREPARING", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("PREPARING", "READY", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("READY", "OUT_FOR_DELIVERY", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY")).toBe(true);
    });

    it("should reject invalid DELIVERY jumps", () => {
      expect(canTransitionStatus("RECEIVED", "DELIVERED", "DELIVERY")).toBe(false);
      expect(canTransitionStatus("CONFIRMED", "OUT_FOR_DELIVERY", "DELIVERY")).toBe(false);
    });

    it("should allow valid PICKUP state flow (READY -> PICKED_UP)", () => {
      expect(canTransitionStatus("READY", "PICKED_UP", "PICKUP")).toBe(true);
      // OUT_FOR_DELIVERY is not valid for pickup
      expect(canTransitionStatus("READY", "OUT_FOR_DELIVERY", "PICKUP")).toBe(false);
    });

    it("should allow cancellation before delivery/pickup", () => {
      expect(canTransitionStatus("RECEIVED", "CANCELLED", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("PREPARING", "CANCELLED", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("DELIVERED", "CANCELLED", "DELIVERY")).toBe(false);
      expect(canTransitionStatus("PICKED_UP", "CANCELLED", "PICKUP")).toBe(false);
    });
  });
});
