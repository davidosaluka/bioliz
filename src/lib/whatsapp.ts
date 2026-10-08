import { formatCurrency, normalizeWhatsAppNumber } from "./format";
import { CheckoutFormData } from "@/types";

type WhatsAppCartItem = {
  name: string;
  variantLabel?: string | null;
  quantity: number;
  unitPrice: number | null;
  priceOnRequest: boolean;
};

export function buildWhatsAppMessage(
  phone: string,
  orderNumber: string,
  items: WhatsAppCartItem[],
  customer: CheckoutFormData,
  subtotal: number,
  hasPriceOnRequest: boolean
) {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  const message = buildOrderMessage(orderNumber, items, customer, subtotal, hasPriceOnRequest);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${encodedMessage}`;
}

export function buildOrderMessage(
  orderNumber: string,
  items: WhatsAppCartItem[],
  customer: CheckoutFormData,
  subtotal: number,
  hasPriceOnRequest: boolean
) {
  const lines: string[] = [];
  lines.push("Hello! I'd like to place an order. 🏋️");
  lines.push("");
  lines.push(`*Order No:* ${orderNumber}`);
  lines.push("");
  lines.push("*Items:*");

  const maxItems = 10;
  const displayedItems = items.slice(0, maxItems);
  const hiddenCount = Math.max(0, items.length - maxItems);

  displayedItems.forEach((item, index) => {
    const itemName = [item.name, item.variantLabel].filter(Boolean).join(" (");
    const displayName = item.variantLabel ? `${itemName})` : itemName;

    if (item.priceOnRequest || item.unitPrice === null) {
      lines.push(`${index + 1}. ${displayName} x${item.quantity} – Price on request`);
    } else {
      const lineTotal = item.unitPrice * item.quantity;
      lines.push(
        `${index + 1}. ${displayName} x${item.quantity} – ${formatCurrency(
          item.unitPrice
        )} each = ${formatCurrency(lineTotal)}`
      );
    }
  });

  if (hiddenCount > 0) {
    lines.push(`…and ${hiddenCount} more item${hiddenCount === 1 ? "" : "s"} (see order no.)`);
  }

  lines.push("");
  lines.push(`*Subtotal (priced items):* ${formatCurrency(subtotal)}`);
  if (hasPriceOnRequest) {
    lines.push("_Note: Some items are price on request._");
  }
  lines.push("");
  lines.push(`*Name:* ${customer.name}`);
  lines.push(`*Phone:* ${customer.phone}`);
  lines.push(`*Delivery location:* ${customer.deliveryAddress}`);
  if (customer.notes) {
    lines.push(`*Notes:* ${customer.notes}`);
  }
  lines.push("");
  lines.push("Please confirm availability, final pricing and delivery cost. Thank you!");

  let message = lines.join("\n");

  // Keep message under ~1,500 characters
  if (message.length > 1500) {
    message = message.slice(0, 1470) + "\n…(truncated)";
  }

  return message;
}

export function buildProductWhatsAppMessage(
  phone: string,
  productName: string,
  productUrl: string
) {
  const normalizedPhone = normalizeWhatsAppNumber(phone);
  const message = `Hello! I'm interested in ${productName}.\n\nProduct link: ${productUrl}\n\nIs this available and what is the current price?`;
  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(message)}`;
}
