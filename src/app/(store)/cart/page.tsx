import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { CartPageClient } from "@/components/store/cart-page-client";

export const metadata: Metadata = createMetadata({
  title: "Shopping Cart",
  description:
    "Review your selected gym equipment, snooker tables, table tennis and sports gear before checkout. Delivery available across Nigeria.",
  path: "/cart",
});

export default function CartPage() {
  return <CartPageClient />;
}
