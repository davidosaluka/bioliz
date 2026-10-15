import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { CheckoutPageClient } from "@/components/store/checkout-page-client";

export const metadata: Metadata = createMetadata({
  title: "Checkout",
  description:
    "Enter your delivery details and pay securely online with Paystack. We confirm pricing, availability and delivery across Nigeria.",
  path: "/checkout",
});

export default function CheckoutPage() {
  return <CheckoutPageClient />;
}
