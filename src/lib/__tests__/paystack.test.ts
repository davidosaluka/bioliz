import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { verifyPaystackPayment } from "@/lib/paystack";

describe("verifyPaystackPayment", () => {
  const originalSecret = process.env.PAYSTACK_SECRET_KEY;
  const secret = "test_secret_key";

  beforeAll(() => {
    process.env.PAYSTACK_SECRET_KEY = secret;
  });

  afterAll(() => {
    process.env.PAYSTACK_SECRET_KEY = originalSecret;
  });

  it("returns parsed data on success", async () => {
    const mockResponse = {
      status: true,
      message: "Verification successful",
      data: {
        id: 123,
        status: "success",
        reference: "REF-123",
        amount: 50000,
        currency: "NGN",
        channel: "card",
        paid_at: "2026-10-08T12:00:00.000Z",
        metadata: {},
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    } as Response);

    const result = await verifyPaystackPayment("REF-123");
    expect(result.status).toBe(true);
    expect(result.data?.reference).toBe("REF-123");
  });

  it("throws on non-2xx response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ status: false, message: "Too many requests" }),
    } as Response);

    await expect(verifyPaystackPayment("REF-123")).rejects.toThrow("Paystack verify returned 429");
  });

  it("throws when secret is missing", async () => {
    const original = process.env.PAYSTACK_SECRET_KEY;
    process.env.PAYSTACK_SECRET_KEY = "";

    await expect(verifyPaystackPayment("REF-123")).rejects.toThrow(
      "PAYSTACK_SECRET_KEY is not configured"
    );

    process.env.PAYSTACK_SECRET_KEY = original;
  });
});
