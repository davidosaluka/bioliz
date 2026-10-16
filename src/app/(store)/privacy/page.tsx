import { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/data";
import { getStoreName } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = getStoreName(settings);
  return createMetadata({
    title: "Privacy Policy",
    description: `Privacy policy for ${storeName} online store.`,
    path: "/privacy",
    settings,
  });
}

export default async function PrivacyPage() {
  const settings = await getSiteSettings();
  const storeName = getStoreName(settings);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          {storeName} respects your privacy. This policy explains what
          information we collect, how we use it, and how we protect it.
        </p>

        <h2 className="text-xl font-semibold text-white">Information we collect</h2>
        <p>
          When you place an order, we collect your name, email address, phone
          number, delivery address and order details. Payment information is
          handled securely by Paystack and is never stored on our servers.
        </p>

        <h2 className="text-xl font-semibold text-white">How we use your information</h2>
        <p>
          We use your information to process and deliver your order, contact
          you about delivery, send order confirmations, and respond to your
          enquiries. We do not sell or share your personal information with
          third parties for marketing purposes.
        </p>

        <h2 className="text-xl font-semibold text-white">Data security</h2>
        <p>
          We implement reasonable security measures to protect your data.
          However, no method of transmission over the internet is completely
          secure, and we cannot guarantee absolute security.
        </p>

        <h2 className="text-xl font-semibold text-white">Your rights</h2>
        <p>
          You may contact us to request access to, correction of, or deletion
          of your personal information, subject to legal and operational
          requirements.
        </p>

        <h2 className="text-xl font-semibold text-white">Contact us</h2>
        <p>
          If you have questions about this privacy policy or how we handle your
          data, please contact us through the details on our website.
        </p>
      </div>
    </div>
  );
}
