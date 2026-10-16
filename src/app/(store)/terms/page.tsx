import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/data";
import { getStoreName } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = getStoreName(settings);
  return createMetadata({
    title: "Terms of Service",
    description: `Terms of service for ${storeName} online store.`,
    path: "/terms",
    settings,
  });
}

export default async function TermsPage() {
  const settings = await getSiteSettings();
  const storeName = getStoreName(settings);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Terms of Service</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          Welcome to {storeName}. These terms govern your use of our
          website and the purchase of products from our store.
        </p>

        <h2 className="text-xl font-semibold text-white">Orders and payment</h2>
        <p>
          All prices are listed in Nigerian Naira (₦). Payment is processed
          securely through Paystack. Your order is confirmed only after we
          receive successful payment notification from Paystack.
        </p>

        <h2 className="text-xl font-semibold text-white">Pricing and availability</h2>
        <p>
          We do our best to keep product information, pricing and stock status
          accurate. In the unlikely event that an item becomes unavailable after
          payment, we will contact you to arrange a refund or replacement.
        </p>

        <h2 className="text-xl font-semibold text-white">Delivery</h2>
        <p>
          Delivery fees are based on the zone you select at checkout. For
          locations outside our standard zones, we will contact you after
          payment with a delivery quote. Heavy items such as snooker tables may
          require special handling.
        </p>

        <h2 className="text-xl font-semibold text-white">Limitation of liability</h2>
        <p>
          {storeName} shall not be liable for any indirect, incidental
          or consequential damages arising from the use of our products or
          website beyond the amount paid for the relevant order.
        </p>

        <h2 className="text-xl font-semibold text-white">Contact us</h2>
        <p>
          If you have questions about these terms, please contact us through the
          details on our website.
        </p>
      </div>
    </div>
  );
}
