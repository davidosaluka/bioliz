import { Metadata } from "next";
import { DEFAULT_TAGLINE, getStoreName } from "@/lib/site";
import { SiteSetting } from "@/types";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const defaultDescription =
  "BUILD YOUR SPACE. TRAIN HARDER. PLAY BETTER. Premium gym, snooker, table tennis and sports equipment for homes, gyms, hotels, offices and clubs in Nigeria.";

export function createMetadata({
  title,
  description = defaultDescription,
  path,
  ogImage = "/opengraph-image",
  settings,
}: {
  title?: string;
  description?: string;
  path: string;
  ogImage?: string;
  settings?: SiteSetting | null;
}): Metadata {
  const storeName = getStoreName(settings);
  const defaultTitle = `${storeName} — ${DEFAULT_TAGLINE}`;
  const fullTitle = title ? `${title} | ${storeName}` : defaultTitle;
  const url = `${siteUrl}${path}`;

  return {
    title: fullTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      type: "website",
      locale: "en_NG",
      url,
      siteName: storeName,
      title: fullTitle,
      description,
      images: ogImage,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ogImage,
    },
  };
}
