import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { getProductBySlug, getRelatedProducts, getSiteSettings } from "@/lib/data";
import { createMetadata } from "@/lib/metadata";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGrid } from "@/components/store/product-grid";
import { ProductActions } from "@/components/store/product-actions";
import { JsonLd, BreadcrumbJsonLd } from "@/components/store/json-ld";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };

  const priceText = product.price_on_request
    ? "Price on request"
    : `₦${Number(product.price).toLocaleString()}`;

  return createMetadata({
    title: `Buy ${product.name} in Nigeria`,
    description:
      product.short_description ??
      product.description ??
      `Shop ${product.name} at Bioliz Global Sport. ${priceText}. Delivery across Nigeria.`,
    path: `/product/${product.slug}`,
    ogImage: product.images?.[0] ?? "/opengraph-image",
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);

  if (!product) notFound();

  const related = await getRelatedProducts(product);
  const coverImage = product.images?.[0] ?? "/placeholder.svg";
  const isOutOfStock =
    product.track_stock && (product.stock_quantity ?? 0) <= 0;
  const isLowStock =
    product.track_stock &&
    (product.stock_quantity ?? 0) > 0 &&
    (product.stock_quantity ?? 0) <= 3;

  const productUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/product/${product.slug}`;

  const breadcrumbItems = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
  ];
  if (product.category) {
    breadcrumbItems.push({
      name: product.category.name,
      path: `/category/${product.category.slug}`,
    });
  }
  breadcrumbItems.push({
    name: product.name,
    path: `/product/${product.slug}`,
  });

  return (
    <>
      <JsonLd
        type="Product"
        data={{
          name: product.name,
          image: coverImage,
          description: product.short_description ?? product.description,
          offers: product.price_on_request
            ? undefined
            : {
                priceCurrency: "NGN",
                price: product.price?.toString(),
                availability: isOutOfStock
                  ? "https://schema.org/OutOfStock"
                  : "https://schema.org/InStock",
              },
        }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-2xl border border-border/50 bg-muted">
              <Image
                src={coverImage}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            {product.images && product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-lg border border-border/50 bg-muted"
                  >
                    <Image
                      src={image}
                      alt={`${product.name} image ${index + 2}`}
                      fill
                      sizes="(max-width: 1024px) 25vw, 12vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <p className="text-sm font-medium text-primary">
              {product.category?.name ?? "Equipment"}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              {product.name}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {product.price_on_request || product.price === null ? (
                <span className="text-2xl font-bold text-muted-foreground">
                  Price on request
                </span>
              ) : (
                <>
                  <span className="text-3xl font-bold text-white">
                    {formatCurrency(product.price)}
                  </span>
                  {product.compare_at_price && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatCurrency(product.compare_at_price)}
                    </span>
                  )}
                </>
              )}
              {isOutOfStock && <Badge variant="secondary">Out of stock</Badge>}
              {isLowStock && <Badge variant="secondary">Low stock</Badge>}
            </div>

            {product.short_description && (
              <p className="mt-4 text-muted-foreground">
                {product.short_description}
              </p>
            )}

            <Separator className="my-6" />

            <ProductActions
              product={product}
              productUrl={productUrl}
              whatsappNumber={settings?.whatsapp_number}
            />

            {product.description && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-white">Description</h2>
                <p className="mt-2 whitespace-pre-line text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}

            {product.specs && Object.keys(product.specs).length > 0 && (
              <div className="mt-8">
                <h2 className="text-lg font-semibold text-white">Specifications</h2>
                <dl className="mt-2 divide-y divide-border/50 rounded-lg border border-border/50">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between px-4 py-3 text-sm"
                    >
                      <dt className="text-muted-foreground">{key}</dt>
                      <dd className="font-medium text-foreground">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-white">Related Products</h2>
            <div className="mt-6">
              <ProductGrid products={related} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
