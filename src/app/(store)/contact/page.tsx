import { Metadata } from "next";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { BreadcrumbJsonLd } from "@/components/store/json-ld";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";

export const metadata: Metadata = createMetadata({
  title: "Contact Bioliz Global Sport",
  description:
    "Contact Bioliz Global Sport for gym equipment, snooker tables, table tennis and sports equipment in Lagos and across Nigeria. WhatsApp, email or call us.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Contact", path: "/contact" },
        ]}
      />
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black uppercase tracking-[-0.05em] text-white">
          Contact Us
        </h1>
      <p className="mt-4 text-muted-foreground">
        Ready to build your space? Reach out for pricing, availability and delivery
        anywhere in Nigeria.
      </p>

      <div className="mt-8 grid gap-4">
        <a
          href="https://wa.me/2348143309703"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5 transition hover:border-primary/60"
        >
          <MessageCircle className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">WhatsApp</p>
            <p className="font-bold text-foreground">+234 814 330 9703</p>
          </div>
        </a>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5">
          <Mail className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-bold text-foreground">info@biolizglobalsport.com</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="font-bold text-foreground">Lagos, Nigeria</p>
          </div>
        </div>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-black uppercase tracking-[-0.04em] text-white">
          Business hours
        </h2>
        <p className="mt-2 text-muted-foreground">
          Monday – Saturday: 9:00 AM – 6:00 PM WAT
        </p>
      </div>

      <div className="mt-8">
        <Link
          href="/quote"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/85"
        >
          Request a bulk quote
        </Link>
      </div>
    </div>
    </>
  );
}
