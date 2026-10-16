import { Metadata } from "next";
import Link from "next/link";
import { createMetadata } from "@/lib/metadata";
import { getSiteSettings } from "@/lib/data";
import { BreadcrumbJsonLd } from "@/components/store/json-ld";
import { Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { formatPhoneNumber } from "@/lib/format";
import { getStoreName, getActiveSocialLinks } from "@/lib/site";
import { SocialIcons } from "@/components/store/social-icons";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const storeName = getStoreName(settings);
  return createMetadata({
    title: `Contact ${storeName}`,
    description:
      `Contact ${storeName} for gym equipment, snooker tables, table tennis and sports equipment in Lagos and across Nigeria. WhatsApp, email or call us.`,
    path: "/contact",
    settings,
  });
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const whatsappNumber = settings?.whatsapp_number;
  const phoneNumber = settings?.phone_number;
  const email = settings?.contact_email;
  const address = settings?.address;
  const businessHours = settings?.business_hours;
  const socialLinks = getActiveSocialLinks(settings);

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
        {whatsappNumber && (
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5 transition hover:border-primary/60"
          >
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">WhatsApp</p>
              <p className="font-bold text-foreground">{formatPhoneNumber(whatsappNumber)}</p>
            </div>
          </a>
        )}

        {phoneNumber && (
          <a
            href={`tel:${phoneNumber}`}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5 transition hover:border-primary/60"
          >
            <MessageCircle className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-bold text-foreground">{formatPhoneNumber(phoneNumber)}</p>
            </div>
          </a>
        )}

        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5 transition hover:border-primary/60"
          >
            <Mail className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-bold text-foreground">{email}</p>
            </div>
          </a>
        )}

        {address && (
          <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-card p-5">
            <MapPin className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              <p className="font-bold text-foreground">{address}</p>
            </div>
          </div>
        )}
      </div>

      {businessHours && (
        <div className="mt-10">
          <h2 className="text-xl font-black uppercase tracking-[-0.04em] text-white">
            Business hours
          </h2>
          <p className="mt-2 flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 text-primary" />
            {businessHours}
          </p>
        </div>
      )}

      {socialLinks.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-black uppercase tracking-[-0.04em] text-white">
            Follow us
          </h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <SocialIcons links={socialLinks} />
          </div>
        </div>
      )}

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
