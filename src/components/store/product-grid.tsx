import { ProductWithVariants } from "@/types";
import { ProductCard } from "./product-card";

export function ProductGrid({ products }: { products: ProductWithVariants[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 bg-card p-12 text-center">
        <p className="text-lg font-medium text-foreground">No products found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try another category or search term, or ask us on WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
