import { describe, it, expect, beforeAll, afterAll } from "vitest";
import crypto from "crypto";
import { verifySignature } from "../route";

describe("verifySignature", () => {
  const originalSecret = process.env.PAYSTACK_SECRET_KEY;
  const secret = "test_secret_key";

  beforeAll(() => {
    process.env.PAYSTACK_SECRET_KEY = secret;
  });

  afterAll(() => {
    process.env.PAYSTACK_SECRET_KEY = originalSecret;
  });

  it("returns true for a valid HMAC-SHA512 signature", () => {
    const rawBody = JSON.stringify({ event: "charge.success", data: { reference: "REF-123" } });
    const signature = crypto.createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");

    expect(verifySignature(rawBody, signature)).toBe(true);
  });

  it("returns false for an invalid signature", () => {
    const rawBody = JSON.stringify({ event: "charge.success", data: { reference: "REF-123" } });
    const signature = crypto.createHmac("sha512", "wrong_secret").update(rawBody, "utf8").digest("hex");

    expect(verifySignature(rawBody, signature)).toBe(false);
  });

  it("returns false when signature is missing", () => {
    const rawBody = JSON.stringify({ event: "charge.success" });
    expect(verifySignature(rawBody, null)).toBe(false);
  });

  it("returns false when secret is missing", () => {
    const original = process.env.PAYSTACK_SECRET_KEY;
    process.env.PAYSTACK_SECRET_KEY = "";
    const rawBody = JSON.stringify({ event: "charge.success" });
    const signature = "abc123";

    expect(verifySignature(rawBody, signature)).toBe(false);
    process.env.PAYSTACK_SECRET_KEY = original;
  });

  it("returns false for a tampered body", () => {
    const rawBody = JSON.stringify({ event: "charge.success", data: { reference: "REF-123" } });
    const signature = crypto.createHmac("sha512", secret).update(rawBody, "utf8").digest("hex");
    const tamperedBody = rawBody.replace("REF-123", "REF-999");

    expect(verifySignature(tamperedBody, signature)).toBe(false);
  });
});
