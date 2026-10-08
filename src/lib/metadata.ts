import { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const defaultTitle = "Bioliz Global Sport — Built for the work";
const defaultDescription =
  "BUILD YOUR SPACE. TRAIN HARDER. PLAY BETTER. Premium gym, snooker, table tennis and sports equipment for homes, gyms, hotels, offices and clubs in Nigeria.";

export function createMetadata({
  title,
  description = defaultDescription,
  path,
  ogImage = "/opengraph-image",
}: {
  title?: string;
  description?: string;
  path: string;
  ogImage?: string;
}): Metadata {
  const fullTitle = title ? `${title} | Bioliz Global Sport` : defaultTitle;
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
      siteName: "Bioliz Global Sport",
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
