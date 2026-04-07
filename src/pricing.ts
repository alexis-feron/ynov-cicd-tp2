/**
 * Moteur de tarification d'une plateforme de livraison.
 *
 * Compose 4 etapes pour calculer le prix final d'une commande :
 *   subtotal (items) -> promo -> delivery fee -> surge -> total
 *
 * Toutes les fonctions throw sur entrees invalides plutot que de renvoyer
 * des valeurs silencieusement fausses : un bug ici = de l'argent perdu.
 */

/** Article d'une commande. */
export type Item = { name: string; price: number; quantity: number };

/** Code promo stocke en memoire (en prod : DB). */
export type PromoCode = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  expiresAt: string; // format ISO YYYY-MM-DD
};

/**
 * Catalogue de codes promo en memoire.
 * EXPIRED est volontairement expire pour les tests/cas limites.
 */
export const promoCodes: PromoCode[] = [
  {
    code: "BIENVENUE20",
    type: "percentage",
    value: 20,
    minOrder: 15.0,
    expiresAt: "2026-12-31",
  },
  {
    code: "FIXE5",
    type: "fixed",
    value: 5,
    minOrder: 10.0,
    expiresAt: "2026-12-31",
  },
  {
    code: "EXPIRED",
    type: "percentage",
    value: 50,
    minOrder: 0,
    expiresAt: "2020-01-01",
  },
];

/**
 * Calcule les frais de livraison en fonction de la distance et du poids.
 *
 * Regles :
 *   - Base : 2.00€
 *   - 0-3 km   : inclus dans la base
 *   - 3-10 km  : +0.50€/km au-dela de 3 km
 *   - > 10 km  : refuse (throw)
 *   - > 5 kg   : +1.50€ de supplement
 */
export function calculateDeliveryFee(distance: number, weight: number): number {
  if (typeof distance !== "number" || typeof weight !== "number") {
    throw new Error("Invalid input");
  }
  if (distance < 0 || weight < 0) throw new Error("Negative value");
  if (distance > 10) throw new Error("Out of zone");
  let fee = 2.0;
  if (distance > 3) {
    fee += (distance - 3) * 0.5;
  }
  if (weight > 5) fee += 1.5;
  return Math.round(fee * 100) / 100;
}

/**
 * Resultat de l'application d'un code promo.
 * valid=false : code reconnu mais non applicable (expire, sous min, etc.).
 */
export type PromoResult = {
  valid: boolean;
  discount: number;
  newTotal: number;
  reason?: string;
};

/**
 * Applique un code promo a un sous-total.
 *
 * - Pas de code (null/"") : pass-through valide, discount = 0.
 * - Code inconnu          : throw (erreur appelant).
 * - Code expire / sous min : valid=false avec une raison.
 * - Le total ne descend jamais sous 0.
 */
export function applyPromoCode(
  subtotal: number,
  promoCode: string | null | undefined,
  codes: PromoCode[],
): PromoResult {
  if (typeof subtotal !== "number" || subtotal < 0) {
    throw new Error("Invalid subtotal");
  }
  if (!promoCode) {
    return { valid: true, discount: 0, newTotal: subtotal };
  }
  const code = codes.find((c) => c.code === promoCode);
  if (!code) {
    throw new Error("Unknown promo code");
  }
  // Comparaison de dates au jour pres : un code expirant aujourd'hui est encore valide.
  const now = new Date();
  const expiry = new Date(code.expiresAt);
  if (expiry < new Date(now.toISOString().slice(0, 10))) {
    return { valid: false, discount: 0, newTotal: subtotal, reason: "expired" };
  }
  if (subtotal < code.minOrder) {
    return {
      valid: false,
      discount: 0,
      newTotal: subtotal,
      reason: "below minimum order",
    };
  }
  let discount = 0;
  if (code.type === "percentage") {
    discount = subtotal * (code.value / 100);
  } else if (code.type === "fixed") {
    discount = code.value;
  }
  let newTotal = subtotal - discount;
  // Clamp a 0 : un code "fixed" superieur au subtotal ne genere pas un total negatif.
  if (newTotal < 0) {
    discount = subtotal;
    newTotal = 0;
  }
  return {
    valid: true,
    discount: Math.round(discount * 100) / 100,
    newTotal: Math.round(newTotal * 100) / 100,
  };
}

/**
 * Multiplicateur de prix selon l'heure et le jour (surge pricing).
 *
 * dayOfWeek : 1=Lundi ... 7=Dimanche
 *
 * Retourne 0 hors heures d'ouverture (avant 10h ou apres 22h) :
 * l'appelant doit interpreter 0 comme "ferme" et refuser la commande.
 */
export function calculateSurge(hour: number, dayOfWeek: number): number {
  if (typeof hour !== "number" || typeof dayOfWeek !== "number") {
    throw new Error("Invalid input");
  }
  // Hors heures d'ouverture : ferme.
  if (hour < 10 || hour >= 22) return 0;
  // Dimanche : tarif unique toute la journee.
  if (dayOfWeek === 7) return 1.2;
  // Lundi-Jeudi : creneaux dejeuner / diner / normal.
  if (dayOfWeek >= 1 && dayOfWeek <= 4) {
    if (hour >= 12 && hour < 13.5) return 1.3;
    if (hour >= 19 && hour < 21) return 1.5;
    return 1.0;
  }
  // Vendredi-Samedi : creneau "weekend soir" + creneaux semaine.
  if (dayOfWeek === 5 || dayOfWeek === 6) {
    if (hour >= 19 && hour < 22) return 1.8;
    if (hour >= 12 && hour < 13.5) return 1.3;
    if (hour >= 19 && hour < 21) return 1.5;
    return 1.0;
  }
  return 1.0;
}

/** Detail du calcul d'une commande. */
export type OrderTotal = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  surge: number;
  total: number;
};

/**
 * Fonction principale : assemble subtotal, promo, delivery, surge -> total.
 *
 * Le surge multiplie UNIQUEMENT les frais de livraison, pas le subtotal
 * (regle metier : on majore la livraison en heures de pointe, pas la nourriture).
 */
export function calculateOrderTotal(
  items: Item[],
  distance: number,
  weight: number,
  promoCode: string | null | undefined,
  hour: number,
  dayOfWeek: number,
): OrderTotal {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Empty cart");
  }
  // 1) Subtotal : somme price * quantity, avec validation par item.
  let subtotal = 0;
  for (const item of items) {
    if (
      !item ||
      typeof item.price !== "number" ||
      typeof item.quantity !== "number"
    ) {
      throw new Error("Invalid item");
    }
    if (item.price < 0 || item.quantity < 0) throw new Error("Invalid item");
    if (item.quantity === 0) throw new Error("Invalid item quantity");
    subtotal += item.price * item.quantity;
  }
  // 2) Surge : 0 = ferme, on refuse la commande tot pour eviter les calculs inutiles.
  const surge = calculateSurge(hour, dayOfWeek);
  if (surge === 0) throw new Error("Closed");
  // 3) Promo : peut etre invalide (expire/min), on remonte la raison.
  const promo = applyPromoCode(subtotal, promoCode, promoCodes);
  if (!promo.valid) throw new Error(promo.reason || "invalid promo");
  // 4) Livraison : base * surge.
  const baseDelivery = calculateDeliveryFee(distance, weight);
  const deliveryFee = Math.round(baseDelivery * surge * 100) / 100;
  // 5) Total final.
  const discounted = subtotal - promo.discount;
  const total = Math.round((discounted + deliveryFee) * 100) / 100;
  return {
    subtotal: Math.round(subtotal * 100) / 100,
    discount: promo.discount,
    deliveryFee,
    surge,
    total,
  };
}
