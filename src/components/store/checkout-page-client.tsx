"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart-store";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import { createOrder } from "@/actions/orders";
import { DeliveryZone, Product, ProductVariant } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type CartProduct = Product & {
  variants: ProductVariant[];
};

export function CheckoutPageClient() {
  const { items, removeItem, updateQuantity } = useCart();
  const [products, setProducts] = useState<Record<string, CartProduct>>({});
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    deliveryZoneId: "",
    deliveryAddress: "",
    notes: "",
    honeypot: "",
  });

  useEffect(() => {
    async function fetchData() {
      if (items.length === 0) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const [productsResult, zonesResult] = await Promise.all([
        supabase
          .from("products")
          .select("*, variants:product_variants(*)")
          .in(
            "id",
            items.map((i) => i.productId)
          )
          .eq("is_active", true),
        supabase
          .from("delivery_zones")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);

      if (productsResult.error || zonesResult.error) {
        toast.error("Failed to load checkout");
        setLoading(false);
        return;
      }

      const map: Record<string, CartProduct> = {};
      productsResult.data?.forEach((product) => {
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
        const outOfStock = product.track_stock && effectiveStock <= 0;
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
      setDeliveryZones(zonesResult.data ?? []);
      setLoading(false);
    }

    fetchData();
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

        return {
          item,
          product,
          variant,
          unitPrice,
          priceOnRequest,
          lineTotal: priceOnRequest ? 0 : (unitPrice ?? 0) * item.quantity,
        };
      })
      .filter(Boolean);
  }, [items, products]);

  const subtotal = cartDetails.reduce(
    (sum, detail) => sum + (detail?.lineTotal ?? 0),
    0
  );

  const selectedZone = deliveryZones.find((z) => z.id === formData.deliveryZoneId);
  const deliveryFee = selectedZone?.fee ?? 0;
  const total = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    if (!selectedZone) {
      toast.error("Choose a delivery zone");
      return;
    }

    setSubmitting(true);
    const result = await createOrder(
      items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      formData
    );
    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to start payment");
      return;
    }

    if (!result.authorizationUrl) {
      toast.error("Failed to start payment");
      return;
    }

    // Cart is intentionally NOT cleared here. It is cleared on the order
    // confirmation page once payment is verified, so the user does not lose
    // their cart if the redirect fails.
    window.location.href = result.authorizationUrl;
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">Checkout</h1>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white">Your cart is empty</h1>
        <Link href="/shop">
          <Button className="mt-6 bg-primary text-primary-foreground hover:bg-brand-dark">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <form onSubmit={handleSubmit} className="space-y-5 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0803 123 4567"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryZone">Delivery zone</Label>
            <Select
              value={formData.deliveryZoneId}
              onValueChange={(value) =>
                setFormData({ ...formData, deliveryZoneId: value ?? "" })
              }
            >
              <SelectTrigger id="deliveryZone">
                <SelectValue placeholder="Choose a delivery zone">
                  {selectedZone
                    ? `${selectedZone.name} — ${formatCurrency(selectedZone.fee ?? 0)}`
                    : "Choose a delivery zone"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {deliveryZones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name} — {formatCurrency(zone.fee ?? 0)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">Detailed delivery address</Label>
            <Textarea
              id="deliveryAddress"
              placeholder="Street address, landmark, estate..."
              required
              value={formData.deliveryAddress}
              onChange={(e) =>
                setFormData({ ...formData, deliveryAddress: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Delivery timing, special requests..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Honeypot */}
          <div className="hidden">
            <Input
              tabIndex={-1}
              autoComplete="off"
              value={formData.honeypot}
              onChange={(e) =>
                setFormData({ ...formData, honeypot: e.target.value })
              }
            />
          </div>

          <div className="rounded-lg border border-border/50 bg-card p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
              <p>
                Payments are processed securely by Paystack. We never see your card
                details. By paying you agree to our{" "}
                <Link href="/terms" className="text-primary hover:underline">
                  Terms
                </Link>
                ,{" "}
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/refund-policy"
                  className="text-primary hover:underline"
                >
                  Refund Policy
                </Link>
                .
              </p>
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full bg-primary text-primary-foreground hover:bg-brand-dark sm:w-auto"
            disabled={submitting}
          >
            <CreditCard className="mr-2 h-5 w-5" />
            {submitting ? "Starting payment..." : `Pay ${formatCurrency(total)}`}
          </Button>
        </form>

        <div className="h-fit rounded-xl border border-border/50 bg-card p-6">
          <h2 className="text-lg font-semibold text-white">Order Summary</h2>
          <Separator className="my-4" />
          <div className="space-y-3">
            {cartDetails.map((detail) => {
              if (!detail) return null;
              const { product, variant, item, unitPrice } = detail;
              return (
                <div key={`${item.productId}:${item.variantId ?? "_"}`} className="text-sm">
                  <p className="font-medium text-white">
                    {product.name}
                    {variant && ` (${variant.label})`}
                  </p>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Qty {item.quantity}</span>
                    <span>{formatCurrency((unitPrice ?? 0) * item.quantity)}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium text-white">{formatCurrency(subtotal)}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="font-medium text-white">{formatCurrency(deliveryFee)}</span>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total</span>
            <span className="text-lg font-bold text-white">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="mt-4 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <p className="font-medium text-white">Paying a large amount?</p>
            <p>Choose Bank Transfer on Paystack for higher limits.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
