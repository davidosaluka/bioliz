import { createClient } from "@/lib/supabase/server";
import {
  Category,
  DeliveryZone,
  Product,
  ProductWithVariants,
  SiteSetting,
} from "@/types";

export async function getSiteSettings(): Promise<SiteSetting | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("getSiteSettings error:", error.message);
    return null;
  }

  return data;
}

export async function getDeliveryZones(): Promise<DeliveryZone[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getDeliveryZones error:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("getCategories error:", error.message);
    return [];
  }

  return data ?? [];
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

export type ProductFilters = {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  limit?: number;
};

export async function getProducts(
  filters: ProductFilters = {}
): Promise<{ products: ProductWithVariants[]; count: number }> {
  const supabase = await createClient();
  const limit = filters.limit ?? 24;
  const page = filters.page ?? 1;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("products")
    .select("*, category:categories(*), variants:product_variants(*)", { count: "exact" })
    .eq("is_active", true);

  if (filters.category) {
    query = query.eq("category.slug", filters.category);
  }

  if (filters.search) {
    const term = filters.search.trim();
    query = query.or(`name.ilike.%${term}%,short_description.ilike.%${term}%`);
  }

  if (filters.inStock) {
    // Products are in stock if stock tracking is disabled, the parent product
    // has stock, or at least one active variant has stock.
    query = query.or(
      "track_stock.eq.false,stock_quantity.gt.0,variants.stock_quantity.gt.0"
    );
  }

  if (
    (filters.minPrice !== undefined && filters.minPrice > 0) ||
    (filters.maxPrice !== undefined && filters.maxPrice > 0)
  ) {
    // Price-on-request items have no price and should not match price filters.
    query = query.eq("price_on_request", false);
  }

  if (filters.minPrice !== undefined && filters.minPrice > 0) {
    query = query.gte("price", filters.minPrice);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice > 0) {
    query = query.lte("price", filters.maxPrice);
  }

  if (filters.sort === "price_asc") {
    query = query.order("price", { ascending: true, nullsFirst: false });
  } else if (filters.sort === "price_desc") {
    query = query.order("price", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error("getProducts error:", error.message);
    return { products: [], count: 0 };
  }

  return { products: (data ?? []) as unknown as ProductWithVariants[], count: count ?? 0 };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductWithVariants[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), variants:product_variants(*)")
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getFeaturedProducts error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProductWithVariants[];
}

export async function getProductBySlug(
  slug: string
): Promise<ProductWithVariants | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(*), variants:product_variants(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;

  return {
    ...(data as unknown as Product),
    category: data.category as unknown as Category | null,
    variants: (data.variants ?? []) as unknown as ProductWithVariants["variants"],
  };
}

export async function getRelatedProducts(
  product: Product,
  limit = 4
): Promise<ProductWithVariants[]> {
  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select("*, category:categories(*), variants:product_variants(*)")
    .eq("is_active", true)
    .neq("id", product.id);

  if (product.category_id) {
    query = query.or(`category_id.eq.${product.category_id},is_featured.eq.true`);
  } else {
    query = query.eq("is_featured", true);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRelatedProducts error:", error.message);
    return [];
  }

  return (data ?? []) as unknown as ProductWithVariants[];
}
