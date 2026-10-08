import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase.from("products").select("slug, updated_at").eq("is_active", true),
    supabase.from("categories").select("slug, created_at").eq("is_active", true),
  ]);

  const routes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date() },
    { url: `${siteUrl}/shop`, lastModified: new Date() },
    { url: `${siteUrl}/quote`, lastModified: new Date() },
    { url: `${siteUrl}/about`, lastModified: new Date() },
    { url: `${siteUrl}/contact`, lastModified: new Date() },
  ];

  products?.forEach((product) => {
    routes.push({
      url: `${siteUrl}/product/${product.slug}`,
      lastModified: product.updated_at ?? new Date(),
    });
  });

  categories?.forEach((category) => {
    routes.push({
      url: `${siteUrl}/category/${category.slug}`,
      lastModified: category.created_at ?? new Date(),
    });
  });

  return routes;
}
