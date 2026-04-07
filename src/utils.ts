/**
 * Fonctions utilitaires generales (formatage, tri, parsing, regroupement).
 * Toutes les fonctions sont pures : pas d'effet de bord, sortie deterministe.
 */

/**
 * Met la premiere lettre en majuscule, le reste en minuscule.
 * Retourne "" pour toute entree non-string ou vide (defensive programming).
 */
export function capitalize(str: unknown): string {
  if (typeof str !== "string" || str.length === 0) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Calcule la moyenne d'un tableau de nombres, arrondie a 2 decimales.
 * Retourne 0 pour null/undefined/tableau vide (evite NaN).
 */
export function calculateAverage(numbers: number[] | null | undefined): number {
  if (!numbers || !Array.isArray(numbers) || numbers.length === 0) return 0;
  const sum = numbers.reduce((a, b) => a + b, 0);
  // Arrondi a 2 decimales : x100, round, /100.
  return Math.round((sum / numbers.length) * 100) / 100;
}

/**
 * Transforme un texte en slug URL-safe.
 * Exemple : "C'est l'ete !" -> "cest-lete"
 */
export function slugify(text: unknown): string {
  if (typeof text !== "string") return "";
  return text
    .toLowerCase()
    .trim()
    // Supprime tout ce qui n'est pas alphanum, espace ou tiret.
    .replace(/[^a-z0-9\s-]/g, "")
    // Espaces -> tirets.
    .replace(/\s+/g, "-")
    // Tirets multiples consecutifs -> un seul.
    .replace(/-+/g, "-")
    // Supprime tirets en debut/fin.
    .replace(/^-+|-+$/g, "");
}

/**
 * Limite une valeur entre min et max (inclusifs).
 */
export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export type Student = { name: string; grade: number; age: number };

/**
 * Trie un tableau d'etudiants par champ et ordre.
 * IMPORTANT : ne modifie jamais le tableau original (clone via spread).
 * Developpee en TDD : voir tests/utils.test.ts > sortStudents.
 */
export function sortStudents(
  students: Student[] | null | undefined,
  sortBy: "name" | "grade" | "age",
  order: "asc" | "desc" = "asc",
): Student[] {
  if (!students || students.length === 0) return [];
  const copy = [...students];
  copy.sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (av < bv) return order === "asc" ? -1 : 1;
    if (av > bv) return order === "asc" ? 1 : -1;
    return 0;
  });
  return copy;
}

/**
 * Convertit un prix sous differents formats en nombre.
 * Accepte : "12.99", "12,99", "12.99 €", "€12.99", 12.99, "gratuit".
 * Retourne null pour toute entree invalide ou negative.
 */
export function parsePrice(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    if (input < 0 || isNaN(input)) return null;
    return input;
  }
  if (typeof input !== "string") return null;
  const trimmed = input.trim().toLowerCase();
  // Cas special : "gratuit" -> 0.
  if (trimmed === "gratuit") return 0;
  // Normalise : enleve symboles monetaires/espaces, vire la virgule decimale.
  const cleaned = trimmed.replace(/[€$£\s]/g, "").replace(",", ".");
  // Verifie le format numerique strict.
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const num = parseFloat(cleaned);
  if (isNaN(num) || num < 0) return null;
  return num;
}

/**
 * Regroupe un tableau d'objets par la valeur d'une cle.
 * Les elements sans la cle sont ignores (pas de bucket "undefined").
 */
export function groupBy<T extends Record<string, unknown>>(
  array: T[] | null | undefined,
  key: string,
): Record<string, T[]> {
  if (!array || !Array.isArray(array)) return {};
  return array.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key]);
    if (item[key] === undefined) return acc;
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

/**
 * Regle de reduction unitaire applicable par calculateDiscount.
 * - percentage : reduction en pourcentage du total courant.
 * - fixed      : reduction d'un montant fixe.
 * - buyXgetY   : N articles offerts a itemPrice (logique simplifiee).
 */
export type DiscountRule =
  | { type: "percentage"; value: number }
  | { type: "fixed"; value: number }
  | { type: "buyXgetY"; buy: number; free: number; itemPrice: number };

/**
 * Applique une liste de regles de reduction dans l'ordre.
 * Le total ne descend jamais sous 0 (clamp apres chaque regle).
 * Throw sur entrees invalides (price negatif, regle inconnue, etc.).
 */
export function calculateDiscount(
  price: number,
  discountRules: DiscountRule[],
): number {
  if (typeof price !== "number" || price < 0) {
    throw new Error("Invalid price");
  }
  if (!Array.isArray(discountRules)) {
    throw new Error("Invalid discount rules");
  }
  let result = price;
  for (const rule of discountRules) {
    if (!rule || typeof rule !== "object") throw new Error("Invalid rule");
    if (rule.type === "percentage") {
      result -= result * (rule.value / 100);
    } else if (rule.type === "fixed") {
      result -= rule.value;
    } else if (rule.type === "buyXgetY") {
      // Logique simplifiee : on retire free * itemPrice du total.
      result -= rule.free * rule.itemPrice;
    } else {
      throw new Error("Unknown rule type");
    }
    // Clamp a 0 apres chaque regle (jamais de total negatif).
    if (result < 0) result = 0;
  }
  return Math.round(result * 100) / 100;
}
