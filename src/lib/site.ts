import { SiteSetting } from "@/types";

export const DEFAULT_BRAND_NAME = "Bioliz Global Sport";
export const DEFAULT_TAGLINE = "Built for the work";
export const DEFAULT_HERO_TITLE = "BUILD YOUR SPACE. TRAIN HARDER. PLAY BETTER.";

export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "x", label: "X (Twitter)" },
  { key: "tiktok", label: "TikTok" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "youtube", label: "YouTube" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["key"];

export function getStoreName(settings?: Pick<SiteSetting, "store_name"> | null): string {
  return settings?.store_name?.trim() || DEFAULT_BRAND_NAME;
}

export function getSiteTitle(settings?: SiteSetting | null): string {
  return `${getStoreName(settings)} — ${DEFAULT_TAGLINE}`;
}

export function getSocialLinks(settings?: Pick<SiteSetting, "social_links"> | null): Record<SocialPlatform, string | undefined> {
  const links = settings?.social_links;
  if (!links || typeof links !== "object" || Array.isArray(links)) {
    return {
      instagram: undefined,
      facebook: undefined,
      x: undefined,
      tiktok: undefined,
      linkedin: undefined,
      youtube: undefined,
    };
  }

  return SOCIAL_PLATFORMS.reduce((acc, { key }) => {
    const value = (links as Record<string, unknown>)[key];
    acc[key] = typeof value === "string" && value.trim() ? value.trim() : undefined;
    return acc;
  }, {} as Record<SocialPlatform, string | undefined>);
}

export function getActiveSocialLinks(settings?: Pick<SiteSetting, "social_links"> | null): { platform: SocialPlatform; label: string; url: string }[] {
  const links = getSocialLinks(settings);
  const result: { platform: SocialPlatform; label: string; url: string }[] = [];

  SOCIAL_PLATFORMS.forEach(({ key, label }) => {
    const url = links[key];
    if (url) {
      result.push({ platform: key, label, url });
    }
  });

  return result;
}
