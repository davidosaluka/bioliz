import { Suspense } from "react";
import { Metadata } from "next";
import { getCategories, getProducts, ProductFilters } from "@/lib/data";
import { createMetadata } from "@/lib/metadata";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductFilters as ProductFiltersComponent } from "@/components/store/product-filters";
import { ProductGridSkeleton } from "@/components/store/product-skeletons";
import { Pagination } from "@/components/store/pagination";
import { BreadcrumbJsonLd } from "@/components/store/json-ld";

type SearchParams = {
  search?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  sort?: string;
  page?: string;
};

export const metadata: Metadata = createMetadata({
  title: "Shop Gym & Sports Equipment",
  description:
    "Browse gym equipment, snooker tables, table tennis tables, sports and recreational equipment in Nigeria. Filter by category, price and availability.",
  path: "/shop",
});

function parseFilters(searchParams: SearchParams): ProductFilters {
  return {
    search: searchParams.search,
    category: searchParams.category,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    inStock: searchParams.inStock === "true",
    sort:
      searchParams.sort === "price_asc" ||
      searchParams.sort === "price_desc" ||
      searchParams.sort === "newest"
        ? searchParams.sort
        : "newest",
    page: searchParams.page ? Number(searchParams.page) : 1,
    limit: 24,
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const [categories, { products, count }] = await Promise.all([
    getCategories(),
    getProducts(filters),
  ]);

  const totalPages = Math.ceil((count ?? 0) / (filters.limit ?? 24));

  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
        ]}
      />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">Shop</h1>
      <p className="mt-2 text-muted-foreground">
        Browse our range of gym and sports equipment.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <ProductFiltersComponent
            categories={categories}
            filters={filters}
          />
        </aside>

        <div className="lg:col-span-3">
          <Suspense fallback={<ProductGridSkeleton />}>
            <ProductGrid products={products} />
          </Suspense>

          {totalPages > 1 && (
            <div className="mt-10">
              <Pagination currentPage={filters.page ?? 1} totalPages={totalPages} />
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
