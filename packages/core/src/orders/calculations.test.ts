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
} from "./calculations.js";

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
    it("should calculate correct change when cash given is sufficient", () => {
      const result = calculateChange(45.5, 50.0);
      expect(result.isValid).toBe(true);
      expect(result.change).toBe(4.5);
    });

    it("should return error when cash given is less than total", () => {
      const result = calculateChange(50.0, 40.0);
      expect(result.isValid).toBe(false);
      expect(result.change).toBe(0);
      expect(result.error).toBeDefined();
    });

    it("should return error when cash given is not provided", () => {
      const result = calculateChange(50.0, null);
      expect(result.isValid).toBe(false);
      expect(result.change).toBe(0);
    });
  });

  describe("calculatePlatformFee", () => {
    it("should calculate 0.5% default platform fee correctly", () => {
      // 100.00 * 0.005 = 0.50
      expect(calculatePlatformFee(100.0)).toBe(0.5);
      // 45.90 * 0.005 = 0.2295 -> 0.23
      expect(calculatePlatformFee(45.9)).toBe(0.23);
    });
  });

  describe("calculateLoyaltyPoints", () => {
    it("should calculate points based on subtotal (1 point per R$)", () => {
      expect(calculateLoyaltyPoints(49.9)).toBe(49);
      expect(calculateLoyaltyPoints(0)).toBe(0);
    });
  });

  describe("canTransitionStatus", () => {
    it("should allow legitimate delivery progression", () => {
      expect(canTransitionStatus("RECEIVED", "CONFIRMED", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("CONFIRMED", "PREPARING", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("PREPARING", "READY", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("READY", "OUT_FOR_DELIVERY", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("OUT_FOR_DELIVERY", "DELIVERED", "DELIVERY")).toBe(true);
    });

    it("should forbid skipping steps or invalid transitions in delivery", () => {
      expect(canTransitionStatus("RECEIVED", "DELIVERED", "DELIVERY")).toBe(false);
      expect(canTransitionStatus("DELIVERED", "CONFIRMED", "DELIVERY")).toBe(false);
      expect(canTransitionStatus("CANCELLED", "CONFIRMED", "DELIVERY")).toBe(false);
    });

    it("should allow legitimate pickup progression", () => {
      expect(canTransitionStatus("RECEIVED", "CONFIRMED", "PICKUP")).toBe(true);
      expect(canTransitionStatus("READY", "PICKED_UP", "PICKUP")).toBe(true);
      expect(canTransitionStatus("READY", "OUT_FOR_DELIVERY", "PICKUP")).toBe(false);
    });

    it("should allow cancellation from active states", () => {
      expect(canTransitionStatus("RECEIVED", "CANCELLED", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("PREPARING", "CANCELLED", "DELIVERY")).toBe(true);
      expect(canTransitionStatus("DELIVERED", "CANCELLED", "DELIVERY")).toBe(false);
    });
  });
});
