"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { productWithVariantsSchema, productVariantSchema } from "@/lib/validators";
import { slugify } from "@/lib/format";

export async function getProductsAdmin() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("*, category:categories(name), variants:product_variants(*)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProductAdmin(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("products")
    .select("*, category:categories(*), variants:product_variants(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function upsertProduct(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const imagesJson = formData.get("images") as string;
  const specsJson = formData.get("specs") as string;
  const variantsJson = formData.get("variants") as string;

  const raw = {
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name") as string,
    slug: (formData.get("slug") as string) || undefined,
    categoryId: (formData.get("categoryId") as string) || undefined,
    shortDescription: (formData.get("shortDescription") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    price: (formData.get("price") as string)
      ? Number(formData.get("price"))
      : undefined,
    compareAtPrice: (formData.get("compareAtPrice") as string)
      ? Number(formData.get("compareAtPrice"))
      : undefined,
    priceOnRequest: formData.get("priceOnRequest") === "true",
    stockQuantity: Number(formData.get("stockQuantity") || 0),
    trackStock: formData.get("trackStock") === "true",
    images: imagesJson ? JSON.parse(imagesJson) : [],
    specs: specsJson ? JSON.parse(specsJson) : {},
    isFeatured: formData.get("isFeatured") === "true",
    isActive: formData.get("isActive") === "true",
  };

  if (!raw.slug) {
    raw.slug = slugify(raw.name);
  }

  const validated = productWithVariantsSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((e) => e.message).join(". "),
    };
  }

  const payload = {
    name: validated.data.name,
    slug: validated.data.slug,
    category_id: validated.data.categoryId || null,
    short_description: validated.data.shortDescription,
    description: validated.data.description,
    price: validated.data.price ?? null,
    compare_at_price: validated.data.compareAtPrice ?? null,
    price_on_request: validated.data.priceOnRequest,
    stock_quantity: validated.data.stockQuantity,
    track_stock: validated.data.trackStock,
    images: validated.data.images,
    specs: validated.data.specs,
    is_featured: validated.data.isFeatured,
    is_active: validated.data.isActive,
  };

  let productId = raw.id;

  if (productId) {
    const { error } = await admin
      .from("products")
      .update(payload)
      .eq("id", productId);

    if (error) return { success: false, error: error.message };
  } else {
    const { data, error } = await admin
      .from("products")
      .insert(payload)
      .select("id")
      .single();

    if (error || !data) return { success: false, error: error?.message };
    productId = data.id;
  }

  // Sync variants
  const rawVariants: unknown[] = variantsJson ? JSON.parse(variantsJson) : [];
  const variantsValidation = productVariantSchema.array().safeParse(rawVariants);
  if (!variantsValidation.success) {
    return {
      success: false,
      error: variantsValidation.error.issues.map((e) => e.message).join(". "),
    };
  }

  const variants = variantsValidation.data;

  // Delete variants not in the list
  const { data: existingVariants } = await admin
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  const incomingIds = new Set(variants.filter((v) => v.id).map((v) => v.id!));
  const toDelete =
    existingVariants?.filter((v) => !incomingIds.has(v.id)).map((v) => v.id) ??
    [];

  if (toDelete.length > 0) {
    await admin.from("product_variants").delete().in("id", toDelete);
  }

  for (const variant of variants) {
    const variantPayload = {
      product_id: productId,
      label: variant.label,
      price: variant.price ?? null,
      stock_quantity: variant.stockQuantity,
      is_active: variant.isActive,
    };

    if (variant.id) {
      await admin
        .from("product_variants")
        .update(variantPayload)
        .eq("id", variant.id);
    } else {
      await admin.from("product_variants").insert(variantPayload);
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  revalidatePath(`/product/${payload.slug}`);

  return { success: true, id: productId };
}

export async function deleteProduct(id: string) {
  await requireAdmin();
  const admin = createAdminClient();

  // Soft delete by setting is_active false to preserve order history
  const { error } = await admin
    .from("products")
    .update({ is_active: false })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true };
}

export async function toggleProductActive(id: string, isActive: boolean) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true };
}

export async function updateProductStock(id: string, stockQuantity: number) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("products")
    .update({ stock_quantity: stockQuantity })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/shop");

  return { success: true };
}
