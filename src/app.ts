/**
 * Configuration de l'application Hono : routes + middleware.
 *
 * IMPORTANT : ce fichier ne demarre PAS le serveur. Il exporte uniquement
 * l'instance Hono pour pouvoir etre importee par les tests d'integration
 * (qui utilisent app.request() sans listener TCP) et par src/server.ts
 * (qui se charge du listen reel).
 */
import { Hono } from "hono";
import {
  applyPromoCode,
  calculateOrderTotal,
  promoCodes,
  type Item,
} from "./pricing.js";

/** Commande persistee en memoire (pas de DB pour ce TP). */
type Order = {
  id: string;
  items: Item[];
  distance: number;
  weight: number;
  promoCode?: string | null;
  hour: number;
  dayOfWeek: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  surge: number;
  total: number;
};

// Stockage in-memory des commandes. Reinitialise par resetOrders() entre tests.
const orders = new Map<string, Order>();
let nextId = 1;

/** Vide le store + reinitialise le compteur d'id. Utilise par les tests. */
export function resetOrders(): void {
  orders.clear();
  nextId = 1;
}

export const app = new Hono();

/**
 * POST /orders/simulate
 * Calcule le detail du prix sans persister. Utile pour afficher
 * un recap au client avant validation finale.
 */
app.post("/orders/simulate", async (c) => {
  try {
    const body = await c.req.json();
    const { items, distance, weight, promoCode, hour, dayOfWeek } = body;
    const result = calculateOrderTotal(
      items,
      distance,
      weight,
      promoCode ?? null,
      hour,
      dayOfWeek,
    );
    return c.json(result, 200);
  } catch (e) {
    // Toute erreur metier (cart vide, hors zone, ferme, promo invalide...) -> 400.
    return c.json({ error: (e as Error).message }, 400);
  }
});

/**
 * POST /orders
 * Comme /simulate, mais persiste la commande et lui assigne un id.
 * Si le calcul echoue, AUCUNE commande n'est enregistree (verifie par les tests).
 */
app.post("/orders", async (c) => {
  try {
    const body = await c.req.json();
    const { items, distance, weight, promoCode, hour, dayOfWeek } = body;
    // On calcule AVANT d'incrementer nextId : si throw, pas d'id consomme.
    const result = calculateOrderTotal(
      items,
      distance,
      weight,
      promoCode ?? null,
      hour,
      dayOfWeek,
    );
    const id = String(nextId++);
    const order: Order = {
      id,
      items,
      distance,
      weight,
      promoCode: promoCode ?? null,
      hour,
      dayOfWeek,
      ...result,
    };
    orders.set(id, order);
    return c.json(order, 201);
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

/**
 * GET /orders/:id
 * Recupere une commande par son id. 404 si inconnue.
 */
app.get("/orders/:id", (c) => {
  const id = c.req.param("id");
  const order = orders.get(id);
  if (!order) return c.json({ error: "Order not found" }, 404);
  return c.json(order, 200);
});

/**
 * POST /promo/validate
 * Valide un code promo + renvoie le nouveau total. Ne modifie rien.
 *
 * Codes de retour distincts par cas pour faciliter le frontend :
 *   - 200 : valide
 *   - 400 : code reconnu mais inapplicable (expire / sous min) OU body manquant
 *   - 404 : code totalement inconnu
 */
app.post("/promo/validate", async (c) => {
  try {
    const body = await c.req.json();
    const { promoCode, subtotal } = body;
    if (promoCode === undefined || promoCode === null || promoCode === "") {
      return c.json({ error: "promoCode is required" }, 400);
    }
    // On distingue "inconnu" (404) de "invalide" (400) -> check explicite.
    const exists = promoCodes.find((p) => p.code === promoCode);
    if (!exists) {
      return c.json({ error: "Unknown promo code" }, 404);
    }
    const result = applyPromoCode(subtotal, promoCode, promoCodes);
    if (!result.valid) {
      return c.json({ error: result.reason, valid: false }, 400);
    }
    return c.json(
      { valid: true, discount: result.discount, newTotal: result.newTotal },
      200,
    );
  } catch (e) {
    return c.json({ error: (e as Error).message }, 400);
  }
});

export default app;
