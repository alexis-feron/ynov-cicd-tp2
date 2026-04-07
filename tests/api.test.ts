import { beforeEach, describe, expect, it } from "vitest";
import { app, resetOrders } from "../src/app.js";

async function post(path: string, body: unknown) {
  return app.request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function get(path: string) {
  return app.request(path);
}

const validBody = {
  items: [{ name: "Pizza", price: 12.5, quantity: 2 }],
  distance: 5,
  weight: 1,
  hour: 15,
  dayOfWeek: 2,
};

beforeEach(() => {
  resetOrders();
});

describe("POST /orders/simulate", () => {
  it("should return 200 with price detail for a valid order", async () => {
    const res = await post("/orders/simulate", validBody);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("subtotal");
  });
  it("should apply discount when valid promo is given", async () => {
    const res = await post("/orders/simulate", {
      ...validBody,
      promoCode: "BIENVENUE20",
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.discount).toBeGreaterThan(0);
  });
  it("should return 400 when promo expired", async () => {
    const res = await post("/orders/simulate", {
      ...validBody,
      promoCode: "EXPIRED",
    });
    expect(res.status).toBe(400);
  });
  it("should return 400 when cart is empty", async () => {
    const res = await post("/orders/simulate", { ...validBody, items: [] });
    expect(res.status).toBe(400);
  });
  it("should return 400 when out of zone", async () => {
    const res = await post("/orders/simulate", { ...validBody, distance: 15 });
    expect(res.status).toBe(400);
  });
  it("should return 400 when closed", async () => {
    const res = await post("/orders/simulate", { ...validBody, hour: 23 });
    expect(res.status).toBe(400);
  });
  it("should apply surge on Friday night", async () => {
    const res = await post("/orders/simulate", {
      ...validBody,
      hour: 20,
      dayOfWeek: 5,
    });
    const data = await res.json();
    expect(data.surge).toBe(1.8);
  });
});

describe("POST /orders", () => {
  it("should return 201 and an id for a valid order", async () => {
    const res = await post("/orders", validBody);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty("id");
  });
  it("should make the order retrievable", async () => {
    const res = await post("/orders", validBody);
    const created = await res.json();
    const get1 = await get(`/orders/${created.id}`);
    expect(get1.status).toBe(200);
  });
  it("should give different IDs to two orders", async () => {
    const a = await (await post("/orders", validBody)).json();
    const b = await (await post("/orders", validBody)).json();
    expect(a.id).not.toBe(b.id);
  });
  it("should return 400 for an invalid order", async () => {
    const res = await post("/orders", { ...validBody, items: [] });
    expect(res.status).toBe(400);
  });
  it("should not register an invalid order", async () => {
    await post("/orders", { ...validBody, items: [] });
    const res = await get("/orders/1");
    expect(res.status).toBe(404);
  });
});

describe("GET /orders/:id", () => {
  it("should return the order when id exists", async () => {
    const created = await (await post("/orders", validBody)).json();
    const res = await get(`/orders/${created.id}`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toBe(created.id);
  });
  it("should return 404 when id does not exist", async () => {
    const res = await get("/orders/999");
    expect(res.status).toBe(404);
  });
  it("should return a structured order", async () => {
    const created = await (await post("/orders", validBody)).json();
    const res = await get(`/orders/${created.id}`);
    const data = await res.json();
    expect(data).toHaveProperty("subtotal");
    expect(data).toHaveProperty("total");
    expect(data).toHaveProperty("items");
  });
});

describe("POST /promo/validate", () => {
  it("should validate a valid code", async () => {
    const res = await post("/promo/validate", {
      promoCode: "BIENVENUE20",
      subtotal: 50,
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.valid).toBe(true);
  });
  it("should return 400 for an expired code", async () => {
    const res = await post("/promo/validate", {
      promoCode: "EXPIRED",
      subtotal: 50,
    });
    expect(res.status).toBe(400);
  });
  it("should return 400 when below min order", async () => {
    const res = await post("/promo/validate", {
      promoCode: "BIENVENUE20",
      subtotal: 5,
    });
    expect(res.status).toBe(400);
  });
  it("should return 404 for an unknown code", async () => {
    const res = await post("/promo/validate", {
      promoCode: "UNKNOWN",
      subtotal: 50,
    });
    expect(res.status).toBe(404);
  });
  it("should return 400 when no code is provided", async () => {
    const res = await post("/promo/validate", { subtotal: 50 });
    expect(res.status).toBe(400);
  });
});
