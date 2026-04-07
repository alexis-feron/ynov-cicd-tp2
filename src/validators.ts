/**
 * Validateurs de donnees utilisateur.
 * Chaque fonction est defensive : accepte unknown et ne throw jamais.
 */

/**
 * Valide un email : doit contenir un local part, un @ et un domaine avec un point.
 * Volontairement permissif (pas de RFC 5322 complet).
 */
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string" || email.length === 0) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export type PasswordValidation = { valid: boolean; errors: string[] };

/**
 * Valide un mot de passe selon 5 regles :
 * - >= 8 caracteres
 * - 1 majuscule, 1 minuscule, 1 chiffre, 1 special (!@#$%^&*)
 * Retourne TOUTES les erreurs, pas seulement la premiere (UX-friendly).
 */
export function isValidPassword(password: unknown): PasswordValidation {
  const errors: string[] = [];
  // Cas null/empty : on retourne toutes les erreurs d'un coup.
  if (typeof password !== "string" || password.length === 0) {
    return {
      valid: false,
      errors: [
        "Password is required",
        "Must be at least 8 characters",
        "Must contain an uppercase letter",
        "Must contain a lowercase letter",
        "Must contain a digit",
        "Must contain a special character",
      ],
    };
  }
  if (password.length < 8) errors.push("Must be at least 8 characters");
  if (!/[A-Z]/.test(password)) errors.push("Must contain an uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Must contain a lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain a digit");
  if (!/[!@#$%^&*]/.test(password))
    errors.push("Must contain a special character");
  return { valid: errors.length === 0, errors };
}

/**
 * Valide un age : entier entre 0 et 150 inclus.
 * Refuse les strings ("25") et les decimaux (25.5).
 */
export function isValidAge(age: unknown): boolean {
  if (typeof age !== "number") return false;
  if (!Number.isInteger(age)) return false;
  if (age < 0 || age > 150) return false;
  return true;
}
