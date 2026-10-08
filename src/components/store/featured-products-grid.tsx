"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import { ProductWithCategory } from "@/types";
import { formatCurrency } from "@/lib/format";

const productTones = [
  "from-zinc-800 via-zinc-950 to-orange-950/60",
  "from-orange-950 via-zinc-900 to-zinc-950",
  "from-zinc-700 via-zinc-950 to-zinc-950",
  "from-zinc-800 via-zinc-950 to-zinc-900",
  "from-orange-950/80 via-zinc-900 to-zinc-950",
  "from-zinc-700 via-zinc-900 to-zinc-950",
];

const productTags = ["Best seller", "New drop", "Popular", "Trending", "Hot", "Top pick"];

function getStockBadge(product: ProductWithCategory) {
  const isOutOfStock = product.track_stock && product.stock_quantity <= 0;
  const isLowStock =
    product.track_stock &&
    product.stock_quantity > 0 &&
    product.stock_quantity <= 3;

  if (isOutOfStock) return { text: "Out of stock", className: "bg-muted text-muted-foreground" };
  if (isLowStock) return { text: "Low stock", className: "bg-primary text-primary-foreground" };
  return null;
}

export function FeaturedProductsGrid({
  products,
}: {
  products: ProductWithCategory[];
}) {
  return (
    <section id="shop" className="border-y border-white/10 bg-card/35">
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              The essentials
            </p>
            <h2 className="text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">
              Train with intent.
            </h2>
          </div>
          <Link
            href="/shop"
            className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-primary sm:flex"
          >
            All products <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => {
            const tone = productTones[index % productTones.length];
            const tag = productTags[index % productTags.length];
            const coverImage = product.images?.[0] ?? "/placeholder.svg";
            const stockBadge = getStockBadge(product);
            const watermark = product.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 4);

            return (
              <article key={product.id} className="group">
                <Link href={`/product/${product.slug}`}>
                  <div
                    className={`relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br ${tone}`}
                  >
                    <div
                      className="absolute inset-0 opacity-30"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 70% 35%, rgba(255,90,31,.5), transparent 28%), linear-gradient(135deg, transparent 42%, rgba(255,255,255,.06) 43%, transparent 44%)",
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                      <Image
                        src={coverImage}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-contain p-6 opacity-90 transition duration-500 group-hover:scale-105"
                      />
                    </div>
                    <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-primary-foreground">
                      {tag}
                    </span>
                    {stockBadge && (
                      <span
                        className={`absolute right-4 top-4 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] ${stockBadge.className}`}
                      >
                        {stockBadge.text}
                      </span>
                    )}
                    <button
                      className="absolute right-4 top-12 flex size-9 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-primary"
                      aria-label={`Add ${product.name} to wishlist`}
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart size={15} />
                    </button>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="-rotate-12 text-5xl font-black italic tracking-[-0.1em] text-white/10">
                        {watermark}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/60">
                        Bioliz / 2026
                      </span>
                      <Sparkles size={15} className="text-primary" />
                    </div>
                  </div>
                </Link>
                <div className="flex items-start justify-between gap-4 pt-4">
                  <div>
                    <h3 className="font-bold text-foreground">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {product.category?.name ?? "Equipment"}
                    </p>
                  </div>
                  <div className="text-right">
                    {product.price_on_request || product.price === null ? (
                      <span className="text-xs font-bold text-muted-foreground">
                        On request
                      </span>
                    ) : (
                      <>
                        <p className="font-bold text-foreground">
                          {formatCurrency(product.price)}
                        </p>
                        {product.compare_at_price && (
                          <p className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.compare_at_price)}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
