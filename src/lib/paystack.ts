"use server";

const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string | null;
    metadata: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export async function verifyPaystackPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new Error("PAYSTACK_SECRET_KEY is not configured");
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    // Avoid Next.js fetch cache for payment verification.
    cache: "no-store",
  });

  return (await res.json()) as PaystackVerifyResponse;
}
