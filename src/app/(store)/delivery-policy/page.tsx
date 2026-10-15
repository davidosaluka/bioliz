import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Delivery Policy",
  description: "Delivery policy for Bioliz Global Sport online store.",
  path: "/delivery-policy",
});

export default function DeliveryPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Delivery Policy</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          We deliver gym equipment, snooker tables, table tennis tables and
          sports gear across Nigeria. Delivery fees and timelines depend on your
          location.
        </p>

        <h2 className="text-xl font-semibold text-white">Delivery zones</h2>
        <p>
          Standard delivery zones and fees are shown at checkout. If your
          location is outside our standard zones, select “Other location” and we
          will contact you after payment with a delivery quote.
        </p>

        <h2 className="text-xl font-semibold text-white">Delivery timelines</h2>
        <p>
          Orders are typically delivered within 3–7 business days in Lagos and
          5–10 business days for other locations. Large or bulky items such as
          snooker tables may require additional handling time.
        </p>

        <h2 className="text-xl font-semibold text-white">Heavy items</h2>
        <p>
          Heavy equipment may require ground-floor access, adequate doorway
          clearance, and customer assistance for unloading. Please ensure
          someone is available to receive the delivery.
        </p>

        <h2 className="text-xl font-semibold text-white">Installation</h2>
        <p>
          We do not currently offer installation or assembly services. Assembly
          instructions are provided where applicable, and we can recommend
          third-party installers on request.
        </p>

        <h2 className="text-xl font-semibold text-white">Contact us</h2>
        <p>
          If you have questions about delivery options or need a quote for a
          location not listed at checkout, please contact us through the details
          on our website.
        </p>
      </div>
    </div>
  );
}
