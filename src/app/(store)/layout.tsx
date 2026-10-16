import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { FloatingWhatsApp } from "@/components/store/floating-whatsapp";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { JsonLd } from "@/components/store/json-ld";
import { getSiteSettings } from "@/lib/data";
import { getStoreName, getActiveSocialLinks } from "@/lib/site";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();
  const storeName = getStoreName(settings);
  const whatsappNumber = settings?.whatsapp_number;
  const phoneNumber = settings?.phone_number;
  const socialLinks = getActiveSocialLinks(settings);

  const sameAs = [
    whatsappNumber ? `https://wa.me/${whatsappNumber}` : undefined,
    ...socialLinks.map((link) => link.url),
  ].filter((url): url is string => Boolean(url));

  return (
    <div className="flex min-h-full flex-col">
      <AnnouncementBar />
      <StoreHeader settings={settings} />
      <main className="flex-1">{children}</main>
      <StoreFooter settings={settings} />
      <FloatingWhatsApp whatsappNumber={whatsappNumber} />
      <JsonLd
        type="Organization"
        data={{
          name: storeName,
          url: siteUrl,
          logo: `${siteUrl}/icon.svg`,
          sameAs,
          contactPoint: phoneNumber
            ? {
                "@type": "ContactPoint",
                telephone: `+${phoneNumber}`,
                contactType: "sales",
                areaServed: "NG",
                availableLanguage: "English",
              }
            : undefined,
        }}
      />
    </div>
  );
}
