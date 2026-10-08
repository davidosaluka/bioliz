import { StoreHeader } from "@/components/store/store-header";
import { StoreFooter } from "@/components/store/store-footer";
import { FloatingWhatsApp } from "@/components/store/floating-whatsapp";
import { AnnouncementBar } from "@/components/store/announcement-bar";
import { JsonLd } from "@/components/store/json-ld";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function StoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-full flex-col">
      <AnnouncementBar />
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
      <FloatingWhatsApp />
      <JsonLd
        type="Organization"
        data={{
          name: "Bioliz Global Sport",
          url: siteUrl,
          logo: `${siteUrl}/icon.svg`,
          sameAs: ["https://wa.me/2348143309703"],
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+234-814-330-9703",
            contactType: "sales",
            areaServed: "NG",
            availableLanguage: "English",
          },
        }}
      />
    </div>
  );
}
