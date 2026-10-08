import Link from "next/link";
import Image from "next/image";
import { ProductWithVariants } from "@/types";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

function getEffectiveStock(product: ProductWithVariants): number {
  const activeVariants = product.variants?.filter((v) => v.is_active ?? false);
  if (activeVariants && activeVariants.length > 0) {
    return activeVariants.reduce((sum, v) => sum + (v.stock_quantity ?? 0), 0);
  }
  return product.stock_quantity ?? 0;
}

export function ProductCard({ product }: { product: ProductWithVariants }) {
  const coverImage = product.images?.[0] ?? "/placeholder.svg";
  const activeVariants = product.variants?.filter((v) => v.is_active ?? false);
  const hasVariants = activeVariants && activeVariants.length > 0;
  const effectiveStock = getEffectiveStock(product);

  const allVariantsOutOfStock =
    hasVariants && activeVariants.every((v) => (v.stock_quantity ?? 0) <= 0);
  const isOutOfStock =
    product.track_stock &&
    (allVariantsOutOfStock || (!hasVariants && effectiveStock <= 0));
  const isLowStock =
    product.track_stock &&
    !isOutOfStock &&
    !hasVariants &&
    effectiveStock > 0 &&
    effectiveStock <= 3;

  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <Card className="overflow-hidden border-border/50 bg-card transition-shadow hover:shadow-lg hover:shadow-primary/5">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <Image
            src={coverImage}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          {product.is_featured && (
            <Badge className="absolute left-2 top-2 bg-primary text-primary-foreground">
              Featured
            </Badge>
          )}
          {isOutOfStock && (
            <Badge variant="secondary" className="absolute right-2 top-2">
              Out of stock
            </Badge>
          )}
          {isLowStock && !isOutOfStock && (
            <Badge variant="secondary" className="absolute right-2 top-2">
              Low stock
            </Badge>
          )}
          {hasVariants && !isOutOfStock && (
            <Badge variant="secondary" className="absolute right-2 top-2">
              Select options
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-primary">
            {product.category?.name ?? "Equipment"}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold text-foreground">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {product.short_description}
          </p>
          <div className="mt-3 flex items-center gap-2">
            {product.price_on_request || product.price === null ? (
              <span className="text-sm font-semibold text-muted-foreground">
                Price on request
              </span>
            ) : (
              <>
                <span className="text-lg font-bold text-white">
                  {formatCurrency(product.price)}
                </span>
                {product.compare_at_price && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatCurrency(product.compare_at_price)}
                  </span>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
