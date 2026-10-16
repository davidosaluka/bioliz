"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductWithVariants } from "@/types";
import { useCart } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/format";
import { buildProductWhatsAppMessage } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, MessageCircle, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

export function ProductActions({
  product,
  productUrl,
  whatsappNumber,
}: {
  product: ProductWithVariants;
  productUrl: string;
  whatsappNumber?: string | null;
}) {
  const router = useRouter();
  const addItem = useCart((state) => state.addItem);

  const activeVariants = product.variants?.filter((v) => v.is_active ?? false) ?? [];

  const [variantId, setVariantId] = useState<string>(() => {
    return activeVariants[0]?.id ?? "";
  });
  const [quantity, setQuantity] = useState(1);

  const selectedVariant = activeVariants.find((v) => v.id === variantId);
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.stock_quantity;
  const trackStock = product.track_stock ?? false;
  const isOutOfStock = trackStock && effectiveStock <= 0;
  const isLowStock =
    trackStock && !isOutOfStock && effectiveStock > 0 && effectiveStock <= 3;
  const isPriceOnRequest = product.price_on_request || effectivePrice === null;

  function handleAddToCart() {
    if (isOutOfStock) {
      toast.error("This item is out of stock");
      return;
    }

    if (activeVariants.length > 0 && !selectedVariant) {
      toast.error("Please select a variant");
      return;
    }

    const finalVariantId = selectedVariant?.id;
    const maxStock = trackStock ? effectiveStock : Infinity;

    if (quantity > maxStock) {
      toast.error(`Only ${effectiveStock} available`);
      return;
    }

    addItem({
      productId: product.id,
      variantId: finalVariantId,
      quantity,
    });

    toast.success("Added to cart", {
      action: {
        label: "View cart",
        onClick: () => router.push("/cart"),
      },
    });
  }

  function handleAskOnWhatsApp() {
    if (!whatsappNumber) return;
    const url = buildProductWhatsAppMessage(whatsappNumber, product.name, productUrl);
    window.open(url, "_blank");
  }

  function handleRequestQuote() {
    router.push("/quote");
  }

  return (
    <div className="space-y-6">
      {activeVariants.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="variant">Variant</Label>
          <Select value={variantId} onValueChange={(value) => setVariantId(value ?? "")}>
            <SelectTrigger id="variant">
              <SelectValue placeholder="Choose an option">
                {selectedVariant ? (
                  <>
                    {selectedVariant.label}
                    {selectedVariant.price !== null && (
                      <span className="ml-2 text-muted-foreground">
                        – {formatCurrency(selectedVariant.price)}
                      </span>
                    )}
                  </>
                ) : (
                  "Choose an option"
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {activeVariants.map((variant) => (
                <SelectItem key={variant.id} value={variant.id}>
                  {variant.label}
                  {variant.price !== null && (
                    <span className="ml-2 text-muted-foreground">
                      – {formatCurrency(variant.price)}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(isOutOfStock || isLowStock) && (
        <div className="flex flex-wrap gap-2">
          {isOutOfStock && <Badge variant="secondary">Out of stock</Badge>}
          {isLowStock && <Badge variant="secondary">Low stock</Badge>}
        </div>
      )}

      <div className="space-y-2">
        <Label>Quantity</Label>
        <div className="flex w-fit items-center rounded-lg border border-border/50">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm font-medium" aria-live="polite">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => q + 1)}
            disabled={trackStock && quantity >= effectiveStock}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        {isPriceOnRequest ? (
          <>
            <Button
              size="lg"
              className="flex-1 bg-primary text-primary-foreground hover:bg-brand-dark"
              onClick={handleRequestQuote}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Request a Quote
            </Button>
            {whatsappNumber && (
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-white/20 hover:bg-white/5"
                onClick={handleAskOnWhatsApp}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Ask on WhatsApp
              </Button>
            )}
          </>
        ) : (
          <>
            <Button
              size="lg"
              className="flex-1 bg-primary text-primary-foreground hover:bg-brand-dark"
              onClick={handleAddToCart}
              disabled={isOutOfStock || (activeVariants.length > 0 && !selectedVariant)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isOutOfStock ? "Out of stock" : "Add to cart"}
            </Button>
            {whatsappNumber && (
              <Button
                size="lg"
                variant="outline"
                className="flex-1 border-white/20 hover:bg-white/5"
                onClick={handleAskOnWhatsApp}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Ask on WhatsApp
              </Button>
            )}
          </>
        )}
      </div>

      {!isPriceOnRequest && effectivePrice !== null && (
        <p className="text-sm text-muted-foreground">
          Estimated total:{" "}
          <span className="font-semibold text-white">
            {formatCurrency(effectivePrice * quantity)}
          </span>
        </p>
      )}
    </div>
  );
}
