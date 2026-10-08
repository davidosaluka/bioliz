import { Database, Tables, Enums } from "@/lib/supabase/database.types";

export type { Database, Tables, Enums };

export type Category = Tables<"categories">;
export type Product = Tables<"products">;
export type ProductVariant = Tables<"product_variants">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Enquiry = Tables<"enquiries">;
export type SiteSetting = Tables<"site_settings">;
export type DeliveryZone = Tables<"delivery_zones">;
export type Payment = Tables<"payments">;
export type WebhookEvent = Tables<"webhook_events">;
export type OrderStatus = Enums<"order_status">;

export type CartItem = {
  productId: string;
  variantId?: string;
  quantity: number;
};

export type ProductWithCategory = Product & {
  category: Category | null;
};

export type ProductWithVariants = Product & {
  variants: ProductVariant[];
  category: Category | null;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};

export type CheckoutFormData = {
  name: string;
  email: string;
  phone: string;
  deliveryZoneId: string;
  deliveryAddress: string;
  notes?: string;
  honeypot?: string;
};

export type QuoteFormData = {
  name: string;
  phone: string;
  organisation?: string;
  buyerType?: string;
  message: string;
};
