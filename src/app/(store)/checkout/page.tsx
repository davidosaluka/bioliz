import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { CheckoutPageClient } from "@/components/store/checkout-page-client";

export const metadata: Metadata = createMetadata({
  title: "Checkout",
  description:
    "Enter your delivery details and send your order via WhatsApp. No online payment — we confirm pricing, availability and delivery directly with you.",
  path: "/checkout",
});

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
