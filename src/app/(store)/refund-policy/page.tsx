import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Refund, Return & Cancellation Policy",
  description: "Refund, return and cancellation policy for Bioliz Global Sport.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">
        Refund, Return & Cancellation Policy
      </h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          We want you to be satisfied with your purchase. Please read our policy
          below.
        </p>

        <h2 className="text-xl font-semibold text-white">Cancellations</h2>
        <p>
          Orders can be cancelled before delivery only if the items have not yet
          left our warehouse. Contact us as soon as possible if you need to
          cancel.
        </p>

        <h2 className="text-xl font-semibold text-white">Returns</h2>
        <p>
          Items may be returned within 7 days of delivery if they are unused, in
          original packaging, and in the same condition you received them.
          Custom or special-order items cannot be returned unless defective.
        </p>

        <h2 className="text-xl font-semibold text-white">Refunds</h2>
        <p>
          Refunds are processed through Paystack to the original payment method
          once the returned item is received and inspected. Refund processing
          times depend on Paystack and your bank.
        </p>

        <h2 className="text-xl font-semibold text-white">Damaged or defective items</h2>
        <p>
          If your item arrives damaged or defective, please contact us within 48
          hours with photos. We will arrange a replacement or refund.
        </p>

        <h2 className="text-xl font-semibold text-white">Contact us</h2>
        <p>
          If you have questions about refunds, returns or cancellations, please
          contact us through the details on our website.
        </p>
      </div>
    </div>
  );
}
