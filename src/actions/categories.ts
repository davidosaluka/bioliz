"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { categorySchema } from "@/lib/validators";
import { slugify } from "@/lib/format";

export async function getCategoriesAdmin() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertCategory(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const raw = {
    id: (formData.get("id") as string) || undefined,
    name: formData.get("name") as string,
    slug: formData.get("slug") as string,
    description: (formData.get("description") as string) || undefined,
    imageUrl: (formData.get("imageUrl") as string) || undefined,
    sortOrder: Number(formData.get("sortOrder") || 0),
    isActive: formData.get("isActive") === "true",
  };

  if (!raw.slug) {
    raw.slug = slugify(raw.name);
  }

  const validated = categorySchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((e) => e.message).join(". "),
    };
  }

  const payload = {
    name: validated.data.name,
    slug: validated.data.slug,
    description: validated.data.description,
    image_url: validated.data.imageUrl,
    sort_order: validated.data.sortOrder,
    is_active: validated.data.isActive,
  };

  if (raw.id) {
    const { error } = await admin
      .from("categories")
      .update(payload)
      .eq("id", raw.id);

    if (error) {
      return { success: false, error: error.message };
    }
  } else {
    const { error } = await admin.from("categories").insert(payload);
    if (error) {
      return { success: false, error: error.message };
    }
  }

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true };
}

export async function deleteCategory(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("categories").delete().eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/shop");
  revalidatePath("/");

  return { success: true };
}
