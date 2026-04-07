import { describe, expect, it } from "vitest";
import {
  isValidAge,
  isValidEmail,
  isValidPassword,
} from "../src/validators.js";

describe("isValidEmail", () => {
  it("should return true for a basic email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
  });
  it("should return true for an email with dots and tags", () => {
    expect(isValidEmail("user.name+tag@domain.co")).toBe(true);
  });
  it("should return false for a string without @", () => {
    expect(isValidEmail("invalid")).toBe(false);
  });
  it("should return false when local part is missing", () => {
    expect(isValidEmail("@domain.com")).toBe(false);
  });
  it("should return false when domain is missing", () => {
    expect(isValidEmail("user@")).toBe(false);
  });
  it("should return false for empty string", () => {
    expect(isValidEmail("")).toBe(false);
  });
  it("should return false for null", () => {
    expect(isValidEmail(null)).toBe(false);
  });
});

describe("isValidPassword", () => {
  it("should be valid when all rules satisfied", () => {
    expect(isValidPassword("Passw0rd!")).toEqual({ valid: true, errors: [] });
  });
  it("should be invalid with multiple errors when too short", () => {
    const r = isValidPassword("short");
    expect(r.valid).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
  it("should report missing uppercase", () => {
    const r = isValidPassword("alllowercase1!");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Must contain an uppercase letter");
  });
  it("should report missing lowercase", () => {
    const r = isValidPassword("ALLUPPERCASE1!");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Must contain a lowercase letter");
  });
  it("should report missing digit", () => {
    const r = isValidPassword("NoDigits!here");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Must contain a digit");
  });
  it("should report missing special", () => {
    const r = isValidPassword("NoSpecial1here");
    expect(r.valid).toBe(false);
    expect(r.errors).toContain("Must contain a special character");
  });
  it("should be invalid for empty string", () => {
    expect(isValidPassword("").valid).toBe(false);
  });
  it("should be invalid for null", () => {
    expect(isValidPassword(null).valid).toBe(false);
  });
});

describe("isValidAge", () => {
  it("should accept 25", () => {
    expect(isValidAge(25)).toBe(true);
  });
  it("should accept 0", () => {
    expect(isValidAge(0)).toBe(true);
  });
  it("should accept 150", () => {
    expect(isValidAge(150)).toBe(true);
  });
  it("should reject 151", () => {
    expect(isValidAge(151)).toBe(false);
  });
  it("should reject -1", () => {
    expect(isValidAge(-1)).toBe(false);
  });
  it("should reject non-integers", () => {
    expect(isValidAge(25.5)).toBe(false);
  });
  it("should reject strings", () => {
    expect(isValidAge("25")).toBe(false);
  });
  it("should reject null", () => {
    expect(isValidAge(null)).toBe(false);
  });
});
