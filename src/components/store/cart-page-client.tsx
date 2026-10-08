"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { Product, ProductVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { toast } from "sonner";

type CartProduct = Product & {
  variants: ProductVariant[];
};

export function CartPageClient() {
  const router = useRouter();
  const { items, removeItem, updateQuantity, clearCart } = useCart();
  const [products, setProducts] = useState<Record<string, CartProduct>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      if (items.length === 0) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*, variants:product_variants(*)")
        .in(
          "id",
          items.map((i) => i.productId)
        )
        .eq("is_active", true);

      if (error) {
        toast.error("Failed to load cart items");
        setLoading(false);
        return;
      }

      const map: Record<string, CartProduct> = {};
      data?.forEach((product) => {
        map[product.id] = product as unknown as CartProduct;
      });

      // Purge unavailable items and clamp quantities to available stock.
      const removedNames: string[] = [];
      const clampedNames: string[] = [];
      for (const item of items) {
        const product = map[item.productId];
        if (!product) {
          removedNames.push("An unavailable item");
          removeItem(item.productId, item.variantId);
          continue;
        }

        const variant = item.variantId
          ? product.variants.find((v) => v.id === item.variantId)
          : undefined;
        const unitPrice = variant?.price ?? product.price;
        const priceOnRequest = product.price_on_request || unitPrice === null;
        const effectiveStock = variant
          ? variant.stock_quantity
          : product.stock_quantity;
        const outOfStock =
          product.track_stock && effectiveStock <= 0;
        const inactiveVariant = variant && variant.is_active === false;

        if (priceOnRequest || outOfStock || inactiveVariant) {
          removedNames.push(product.name);
          removeItem(item.productId, item.variantId);
          continue;
        }

        if (
          product.track_stock &&
          effectiveStock > 0 &&
          item.quantity > effectiveStock
        ) {
          updateQuantity(item.productId, item.variantId, effectiveStock);
          clampedNames.push(`${product.name} (max ${effectiveStock})`);
        }
      }

      if (removedNames.length > 0) {
        toast.error(
          `Removed unavailable items: ${removedNames.join(", ")}`,
          { duration: 6000 }
        );
      }

      if (clampedNames.length > 0) {
        toast.info(
          `Adjusted quantity: ${clampedNames.join(", ")}`,
          { duration: 6000 }
        );
      }

      setProducts(map);
      setLoading(false);
    }

    fetchProducts();
  }, [items, removeItem, updateQuantity]);

  const cartDetails = useMemo(() => {
    return items
      .map((item) => {
        const product = products[item.productId];
        if (!product) return null;

        const variant = item.variantId
          ? product.variants.find((v) => v.id === item.variantId)
          : undefined;

        const unitPrice = variant?.price ?? product.price;
        const priceOnRequest = product.price_on_request || unitPrice === null;
        const maxStock = product.track_stock
          ? variant
            ? variant.stock_quantity
            : product.stock_quantity
          : Infinity;

        return {
          item,
          product,
          variant,
          unitPrice,
          priceOnRequest,
          maxStock,
          lineTotal: priceOnRequest ? 0 : (unitPrice ?? 0) * item.quantity,
        };
      })
      .filter(Boolean);
  }, [items, products]);

  const subtotal = cartDetails.reduce(
    (sum, detail) => sum + (detail?.lineTotal ?? 0),
    0
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
        <p className="mt-4 text-muted-foreground">Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-6 text-3xl font-bold text-white">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Browse our products and add items to your cart.
        </p>
        <Link href="/shop">
          <Button className="mt-6 bg-primary text-primary-foreground hover:bg-brand-dark">
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {cartDetails.map((detail) => {
            if (!detail) return null;
            const { item, product, variant, unitPrice, priceOnRequest, maxStock } =
              detail;
            const coverImage = product.images?.[0] ?? "/placeholder.svg";

            return (
              <div
                key={`${item.productId}:${item.variantId ?? "_"}`}
                className="flex gap-4 rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={coverImage}
                    alt={`${product.name} product image`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link
                      href={`/product/${product.slug}`}
                      className="font-semibold text-white hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    {variant && (
                      <p className="text-sm text-muted-foreground">
                        {variant.label}
                      </p>
                    )}
                    <p className="mt-1 text-sm">
                      {priceOnRequest ? (
                        <span className="text-muted-foreground">
                          Price on request
                        </span>
                      ) : (
                        <span className="font-medium text-white">
                          {formatCurrency(unitPrice ?? 0)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-border/50">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.variantId,
                            item.quantity + 1
                          )
                        }
                        disabled={item.quantity >= maxStock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => removeItem(item.productId, item.variantId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-lg font-semibold text-white">Order Summary</h2>
          <Separator className="my-4" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-white">
              {formatCurrency(subtotal)}
            </span>
          </div>
          <Separator className="my-4" />
          <Button
            className="w-full bg-primary text-primary-foreground hover:bg-brand-dark"
            onClick={() => router.push("/checkout")}
          >
            Checkout
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            className="mt-2 w-full text-muted-foreground"
            onClick={clearCart}
          >
            Clear cart
          </Button>
        </div>
      </div>
    </div>
  );
}
