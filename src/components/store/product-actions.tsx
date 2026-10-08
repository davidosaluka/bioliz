"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductWithVariants } from "@/types";
import { useCart } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/format";
import { buildProductWhatsAppMessage } from "@/lib/whatsapp";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
  const [variantId, setVariantId] = useState<string>("");
  const [quantity, setQuantity] = useState(1);

  const activeVariants = product.variants?.filter((v) => v.is_active ?? false) ?? [];
  const selectedVariant = activeVariants.find((v) => v.id === variantId);
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveStock = selectedVariant
    ? selectedVariant.stock_quantity
    : product.stock_quantity;
  const trackStock = product.track_stock ?? false;
  const isOutOfStock = trackStock && effectiveStock <= 0;
  const isPriceOnRequest = product.price_on_request || effectivePrice === null;

  function handleAddToCart() {
    if (isOutOfStock) {
      toast.error("This item is out of stock");
      return;
    }

    const finalVariantId = selectedVariant ? selectedVariant.id : undefined;
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
    const number = whatsappNumber ?? "2348143309703";
    const url = buildProductWhatsAppMessage(number, product.name, productUrl);
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
              <SelectValue placeholder="Choose an option" />
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

      <div className="space-y-2">
        <Label>Quantity</Label>
        <div className="flex w-fit items-center rounded-lg border border-border/50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-12 text-center text-sm font-medium">{quantity}</span>
          <Button
            variant="ghost"
            size="icon"
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
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/5"
              onClick={handleAskOnWhatsApp}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Ask on WhatsApp
            </Button>
          </>
        ) : (
          <>
            <Button
              size="lg"
              className="flex-1 bg-primary text-primary-foreground hover:bg-brand-dark"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              {isOutOfStock ? "Out of stock" : "Add to cart"}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="flex-1 border-white/20 hover:bg-white/5"
              onClick={handleAskOnWhatsApp}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              Ask on WhatsApp
            </Button>
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
