import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPhoneNumber,
  normalizeNigerianPhone,
  slugify,
  generateOrderNumber,
} from "@/lib/format";

describe("formatCurrency", () => {
  it("formats a number as Nigerian Naira", () => {
    expect(formatCurrency(1000)).toContain("₦");
    expect(formatCurrency(1000)).toContain("1,000");
  });

  it("returns ₦0 for null or undefined", () => {
    expect(formatCurrency(null)).toBe("₦0");
    expect(formatCurrency(undefined)).toBe("₦0");
  });
});

describe("formatPhoneNumber", () => {
  it("formats Nigerian numbers starting with 0", () => {
    expect(formatPhoneNumber("08031234567")).toBe("0803 123 4567");
  });

  it("formats Nigerian numbers starting with 234", () => {
    expect(formatPhoneNumber("2348031234567")).toBe("+234 803 123 4567");
  });

  it("falls back to the original value for invalid numbers", () => {
    expect(formatPhoneNumber("123")).toBe("123");
  });
});

describe("normalizeNigerianPhone", () => {
  it("converts local 0-prefixed numbers to 234 format", () => {
    expect(normalizeNigerianPhone("08031234567")).toBe("2348031234567");
  });

  it("keeps 234-prefixed numbers as-is", () => {
    expect(normalizeNigerianPhone("2348031234567")).toBe("2348031234567");
  });

  it("strips the + prefix", () => {
    expect(normalizeNigerianPhone("+2348031234567")).toBe("2348031234567");
  });

  it("returns digits for unexpected input", () => {
    expect(normalizeNigerianPhone("123")).toBe("123");
  });
});

describe("slugify", () => {
  it("converts text to a URL-friendly slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("removes special characters", () => {
    expect(slugify("Sports & Fitness!")).toBe("sports-fitness");
  });

  it("collapses multiple hyphens", () => {
    expect(slugify("Hello   World")).toBe("hello-world");
  });
});

describe("generateOrderNumber", () => {
  it("returns a string matching the expected prefix pattern", () => {
    const orderNumber = generateOrderNumber();
    expect(orderNumber).toMatch(/^GE-\d{6}-[A-Z0-9]{4}$/);
  });

  it("generates different values on successive calls", () => {
    const a = generateOrderNumber();
    const b = generateOrderNumber();
    expect(a).not.toBe(b);
  });
});
