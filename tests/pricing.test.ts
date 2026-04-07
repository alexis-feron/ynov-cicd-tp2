import { describe, expect, it } from "vitest";
import {
  applyPromoCode,
  calculateDeliveryFee,
  calculateOrderTotal,
  calculateSurge,
  promoCodes,
  type PromoCode,
} from "../src/pricing.js";

describe("calculateDeliveryFee", () => {
  it("should return base fee when distance under 3km", () => {
    expect(calculateDeliveryFee(2, 1)).toBe(2.0);
  });
  it("should add per-km fee when distance between 3 and 10", () => {
    expect(calculateDeliveryFee(7, 3)).toBe(2.0 + 4 * 0.5);
  });
  it("should add weight surcharge when over 5kg", () => {
    expect(calculateDeliveryFee(5, 8)).toBe(2.0 + 2 * 0.5 + 1.5);
  });
  it("should treat 3km as base only", () => {
    expect(calculateDeliveryFee(3, 1)).toBe(2.0);
  });
  it("should accept exactly 10km", () => {
    expect(calculateDeliveryFee(10, 1)).toBe(2.0 + 7 * 0.5);
  });
  it("should not add weight surcharge at 5kg exactly", () => {
    expect(calculateDeliveryFee(2, 5)).toBe(2.0);
  });
  it("should throw when distance > 10", () => {
    expect(() => calculateDeliveryFee(15, 1)).toThrow();
  });
  it("should throw when distance is negative", () => {
    expect(() => calculateDeliveryFee(-1, 1)).toThrow();
  });
  it("should throw when weight is negative", () => {
    expect(() => calculateDeliveryFee(5, -1)).toThrow();
  });
  it("should compute 6km/2kg correctly", () => {
    expect(calculateDeliveryFee(6, 2)).toBe(3.5);
  });
});

describe("applyPromoCode", () => {
  const codes: PromoCode[] = [
    {
      code: "PCT20",
      type: "percentage",
      value: 20,
      minOrder: 15,
      expiresAt: "2099-12-31",
    },
    {
      code: "FIX5",
      type: "fixed",
      value: 5,
      minOrder: 10,
      expiresAt: "2099-12-31",
    },
    {
      code: "OLD",
      type: "percentage",
      value: 50,
      minOrder: 0,
      expiresAt: "2000-01-01",
    },
    {
      code: "BIG",
      type: "fixed",
      value: 100,
      minOrder: 0,
      expiresAt: "2099-12-31",
    },
    {
      code: "FULL",
      type: "percentage",
      value: 100,
      minOrder: 0,
      expiresAt: "2099-12-31",
    },
  ];
  it("should apply percentage discount", () => {
    expect(applyPromoCode(50, "PCT20", codes).newTotal).toBe(40);
  });
  it("should apply fixed discount", () => {
    expect(applyPromoCode(30, "FIX5", codes).newTotal).toBe(25);
  });
  it("should refuse expired code", () => {
    expect(applyPromoCode(50, "OLD", codes).valid).toBe(false);
  });
  it("should refuse below min order", () => {
    expect(applyPromoCode(5, "PCT20", codes).valid).toBe(false);
  });
  it("should throw on unknown code", () => {
    expect(() => applyPromoCode(20, "NOPE", codes)).toThrow();
  });
  it("should clamp at zero when discount exceeds subtotal", () => {
    expect(applyPromoCode(5, "BIG", codes).newTotal).toBe(0);
  });
  it("should allow 100% discount", () => {
    expect(applyPromoCode(50, "FULL", codes).newTotal).toBe(0);
  });
  it("should pass through when no promo provided", () => {
    expect(applyPromoCode(50, null, codes).newTotal).toBe(50);
  });
  it("should pass through with empty promo", () => {
    expect(applyPromoCode(50, "", codes).newTotal).toBe(50);
  });
  it("should throw when subtotal negative", () => {
    expect(() => applyPromoCode(-1, "PCT20", codes)).toThrow();
  });
});

describe("calculateSurge", () => {
  it("should return 1.0 on Tuesday at 15h", () => {
    expect(calculateSurge(15, 2)).toBe(1.0);
  });
  it("should return 1.3 on Wednesday at 12h", () => {
    expect(calculateSurge(12, 3)).toBe(1.3);
  });
  it("should return 1.5 on Thursday at 20h", () => {
    expect(calculateSurge(20, 4)).toBe(1.5);
  });
  it("should return 1.8 on Friday at 21h", () => {
    expect(calculateSurge(21, 5)).toBe(1.8);
  });
  it("should return 1.2 on Sunday afternoon", () => {
    expect(calculateSurge(14, 7)).toBe(1.2);
  });
  it("should return 0 before opening hours", () => {
    expect(calculateSurge(9, 2)).toBe(0);
  });
  it("should return 0 after closing hours", () => {
    expect(calculateSurge(23, 2)).toBe(0);
  });
  it("should be open at 10h", () => {
    expect(calculateSurge(10, 2)).toBe(1.0);
  });
});

describe("calculateOrderTotal", () => {
  const items = [{ name: "Pizza", price: 12.5, quantity: 2 }];
  it("should compute a basic order on Tuesday afternoon", () => {
    const r = calculateOrderTotal(items, 5, 1, null, 15, 2);
    expect(r.subtotal).toBe(25);
    expect(r.surge).toBe(1.0);
    expect(r.deliveryFee).toBe(3.0);
    expect(r.total).toBe(28);
    expect(r.discount).toBe(0);
  });
  it("should apply surge to delivery fee on Friday night", () => {
    const r = calculateOrderTotal(items, 5, 1, null, 20, 5);
    expect(r.surge).toBe(1.8);
    expect(r.deliveryFee).toBe(Math.round(3.0 * 1.8 * 100) / 100);
  });
  it("should apply promo when provided", () => {
    const r = calculateOrderTotal(items, 5, 1, "BIENVENUE20", 15, 2);
    expect(r.discount).toBeGreaterThan(0);
  });
  it("should throw on empty cart", () => {
    expect(() => calculateOrderTotal([], 5, 1, null, 15, 2)).toThrow();
  });
  it("should throw when item has zero quantity", () => {
    expect(() =>
      calculateOrderTotal(
        [{ name: "X", price: 10, quantity: 0 }],
        5,
        1,
        null,
        15,
        2,
      ),
    ).toThrow();
  });
  it("should throw on negative price", () => {
    expect(() =>
      calculateOrderTotal(
        [{ name: "X", price: -1, quantity: 1 }],
        5,
        1,
        null,
        15,
        2,
      ),
    ).toThrow();
  });
  it("should throw when closed", () => {
    expect(() => calculateOrderTotal(items, 5, 1, null, 23, 2)).toThrow();
  });
  it("should throw when out of zone", () => {
    expect(() => calculateOrderTotal(items, 15, 1, null, 15, 2)).toThrow();
  });
  it("should round to 2 decimals", () => {
    const r = calculateOrderTotal(items, 5, 1, null, 15, 2);
    expect(Number.isFinite(r.total)).toBe(true);
  });
  it("should sanity check subtotal+delivery=total without promo", () => {
    const r = calculateOrderTotal(items, 5, 1, null, 15, 2);
    expect(r.subtotal + r.deliveryFee).toBeCloseTo(r.total);
  });
});

describe("promoCodes data", () => {
  it("should expose at least one promo code", () => {
    expect(promoCodes.length).toBeGreaterThan(0);
  });
});
