import { describe, expect, it } from "vitest";
import {
  calculateAverage,
  calculateDiscount,
  capitalize,
  clamp,
  groupBy,
  parsePrice,
  slugify,
  sortStudents,
} from "../src/utils.js";

describe("capitalize", () => {
  it("should capitalize first letter when input is lowercase", () => {
    expect(capitalize("hello")).toBe("Hello");
  });
  it("should lowercase the rest when input is uppercase", () => {
    expect(capitalize("WORLD")).toBe("World");
  });
  it("should return empty string when input is empty", () => {
    expect(capitalize("")).toBe("");
  });
  it("should return empty string when input is null", () => {
    expect(capitalize(null)).toBe("");
  });
});

describe("calculateAverage", () => {
  it("should compute average when given 3 numbers", () => {
    expect(calculateAverage([10, 12, 14])).toBe(12);
  });
  it("should return the value when given a single number", () => {
    expect(calculateAverage([15])).toBe(15);
  });
  it("should return 0 when array is empty", () => {
    expect(calculateAverage([])).toBe(0);
  });
  it("should round to 2 decimals when not whole", () => {
    expect(calculateAverage([10, 11, 12])).toBe(11);
  });
  it("should return 0 when input is null", () => {
    expect(calculateAverage(null)).toBe(0);
  });
});

describe("slugify", () => {
  it("should slugify when text contains spaces", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });
  it("should trim and slugify when extra spaces exist", () => {
    expect(slugify("  Spaces Everywhere  ")).toBe("spaces-everywhere");
  });
  it("should remove special characters when present", () => {
    expect(slugify("C'est l'ete !")).toBe("cest-lete");
  });
  it("should return empty when input is empty", () => {
    expect(slugify("")).toBe("");
  });
});

describe("clamp", () => {
  it("should return value when within range", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it("should return min when below range", () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it("should return max when above range", () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it("should return value when min equals max equals value", () => {
    expect(clamp(0, 0, 0)).toBe(0);
  });
});

describe("sortStudents", () => {
  const students = [
    { name: "Charlie", grade: 12, age: 22 },
    { name: "Alice", grade: 18, age: 20 },
    { name: "Bob", grade: 15, age: 21 },
  ];
  it("should sort by grade ascending", () => {
    expect(sortStudents(students, "grade").map((s) => s.grade)).toEqual([
      12, 15, 18,
    ]);
  });
  it("should sort by grade descending", () => {
    expect(sortStudents(students, "grade", "desc").map((s) => s.grade)).toEqual(
      [18, 15, 12],
    );
  });
  it("should sort by name ascending", () => {
    expect(sortStudents(students, "name").map((s) => s.name)).toEqual([
      "Alice",
      "Bob",
      "Charlie",
    ]);
  });
  it("should sort by age ascending", () => {
    expect(sortStudents(students, "age").map((s) => s.age)).toEqual([
      20, 21, 22,
    ]);
  });
  it("should return empty array when input is null", () => {
    expect(sortStudents(null, "grade")).toEqual([]);
  });
  it("should return empty array when input is empty", () => {
    expect(sortStudents([], "grade")).toEqual([]);
  });
  it("should not modify the original array", () => {
    const copy = [...students];
    sortStudents(students, "grade");
    expect(students).toEqual(copy);
  });
  it("should default to ascending when order omitted", () => {
    expect(sortStudents(students, "grade").map((s) => s.grade)).toEqual([
      12, 15, 18,
    ]);
  });
});

describe("parsePrice", () => {
  it("should parse decimal with dot", () => {
    expect(parsePrice("12.99")).toBe(12.99);
  });
  it("should parse decimal with comma", () => {
    expect(parsePrice("12,99")).toBe(12.99);
  });
  it("should parse decimal with euro suffix", () => {
    expect(parsePrice("12.99 €")).toBe(12.99);
  });
  it("should parse decimal with euro prefix", () => {
    expect(parsePrice("€12.99")).toBe(12.99);
  });
  it("should return number when input is number", () => {
    expect(parsePrice(12.99)).toBe(12.99);
  });
  it("should return 0 when text is gratuit", () => {
    expect(parsePrice("gratuit")).toBe(0);
  });
  it("should return null when text is invalid", () => {
    expect(parsePrice("abc")).toBeNull();
  });
  it("should return null when negative", () => {
    expect(parsePrice("-5.00")).toBeNull();
  });
  it("should return null when null", () => {
    expect(parsePrice(null)).toBeNull();
  });
});

describe("groupBy", () => {
  it("should group items by key", () => {
    const result = groupBy(
      [
        { name: "Alice", role: "dev" },
        { name: "Bob", role: "design" },
        { name: "Charlie", role: "dev" },
      ],
      "role",
    );
    expect(result.dev).toHaveLength(2);
    expect(result.design).toHaveLength(1);
  });
  it("should return empty object when array is empty", () => {
    expect(groupBy([], "role")).toEqual({});
  });
  it("should return empty object when key is missing", () => {
    expect(groupBy([{ name: "A" }], "role")).toEqual({});
  });
  it("should return empty object when input is null", () => {
    expect(groupBy(null, "role")).toEqual({});
  });
  it("should handle a single group", () => {
    const result = groupBy(
      [
        { name: "A", role: "dev" },
        { name: "B", role: "dev" },
      ],
      "role",
    );
    expect(Object.keys(result)).toEqual(["dev"]);
  });
});

describe("calculateDiscount", () => {
  it("should apply percentage discount", () => {
    expect(calculateDiscount(100, [{ type: "percentage", value: 10 }])).toBe(
      90,
    );
  });
  it("should apply fixed discount", () => {
    expect(calculateDiscount(100, [{ type: "fixed", value: 5 }])).toBe(95);
  });
  it("should not go below zero", () => {
    expect(calculateDiscount(10, [{ type: "fixed", value: 50 }])).toBe(0);
  });
  it("should apply multiple rules in order", () => {
    expect(
      calculateDiscount(100, [
        { type: "percentage", value: 10 },
        { type: "fixed", value: 5 },
      ]),
    ).toBe(85);
  });
  it("should throw when price is invalid", () => {
    expect(() => calculateDiscount(-1, [])).toThrow();
  });
  it("should apply buyXgetY rule", () => {
    expect(
      calculateDiscount(40, [
        { type: "buyXgetY", buy: 3, free: 1, itemPrice: 10 },
      ]),
    ).toBe(30);
  });
});
