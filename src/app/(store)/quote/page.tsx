import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { QuotePageClient } from "@/components/store/quote-page-client";

export const metadata: Metadata = createMetadata({
  title: "Request a Quote",
  description:
    "Get a custom quote for gym equipment, snooker tables, table tennis and sports gear for your home, gym, hotel, office or club in Nigeria.",
  path: "/quote",
});

export default function QuotePage() {
  return <QuotePageClient />;
}
