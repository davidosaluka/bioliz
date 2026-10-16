import { z } from "zod";

function isValidNigerianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return (
    (digits.startsWith("0") && digits.length === 11) ||
    (digits.startsWith("234") && digits.length === 13)
  );
}

export const cartItemSchema = z.object({
  productId: z.string().uuid("Invalid product"),
  variantId: z.string().uuid("Invalid variant").optional(),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

export const cartSchema = z.array(cartItemSchema).min(1, "Your cart is empty");

export const checkoutSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().refine(isValidNigerianPhone, "Enter a valid Nigerian phone number"),
  deliveryZoneId: z.string().uuid("Choose a delivery zone"),
  deliveryAddress: z.string().min(5, "Delivery address is too short"),
  notes: z.string().optional(),
  honeypot: z.string().max(0, "Bot detected").optional(),
});

export const quoteSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().refine(isValidNigerianPhone, "Enter a valid Nigerian phone number"),
  organisation: z.string().optional(),
  buyerType: z.string().optional(),
  message: z.string().min(10, "Please tell us more about your needs"),
});

const optionalUrl = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((val) => {
    if (!val) return true;
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  }, "Enter a valid URL");

export const siteSettingsSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  whatsappNumber: z
    .string()
    .refine(isValidNigerianPhone, "Enter a valid Nigerian WhatsApp number"),
  phoneNumber: z
    .string()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || isValidNigerianPhone(val), "Enter a valid Nigerian phone number"),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  address: z.string().optional(),
  businessHours: z.string().optional(),
  heroTitle: z.string().min(1, "Hero title is required"),
  heroSubtitle: z.string().optional(),
  socialInstagram: optionalUrl,
  socialFacebook: optionalUrl,
  socialX: optionalUrl,
  socialTiktok: optionalUrl,
  socialLinkedin: optionalUrl,
  socialYoutube: optionalUrl,
});

export const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional().or(z.literal("")),
  sortOrder: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
});

function isValidProductImageUrl(url: string): boolean {
  if (!url) return true;
  const siteUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!siteUrl) return true; // Validation skipped if env is unavailable during build/tests
  const publicUrlPrefix = `${siteUrl.replace(/\/$/, "")}/storage/v1/object/public/product-images/`;
  return url.startsWith(publicUrlPrefix) || url.startsWith("https://placehold.co/");
}

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  categoryId: z.string().uuid("Category is required").optional().or(z.literal("")),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or more").optional(),
  compareAtPrice: z.coerce.number().min(0).optional().or(z.literal(undefined)),
  priceOnRequest: z.boolean().default(false),
  stockQuantity: z.coerce.number().min(0).default(0),
  trackStock: z.boolean().default(true),
  images: z
    .array(z.string())
    .default([])
    .refine(
      (urls) => urls.every(isValidProductImageUrl),
      "Product images must be uploaded to the product-images storage bucket"
    ),
  specs: z.record(z.string(), z.string()).default({}),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const productVariantSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1, "Variant label is required"),
  price: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.coerce.number().min(0, "Variant price must be 0 or more").optional()
  ),
  stockQuantity: z.coerce.number().int().min(0, "Variant stock must be 0 or more").default(0),
  isActive: z.boolean().default(true),
});

export const productWithVariantsSchema = productSchema.refine(
  (data) => {
    if (data.priceOnRequest) return true;
    return data.price !== undefined && data.price !== null;
  },
  { message: "Price is required when not price on request", path: ["price"] }
);
