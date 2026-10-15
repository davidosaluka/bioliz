"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function getDeliveryZonesAdmin() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("delivery_zones")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertDeliveryZone(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const id = formData.get("id") as string | null;
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const fee = Number(formData.get("fee") ?? 0);
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") === "true";

  if (!name) {
    return { success: false, error: "Name is required" };
  }

  if (!Number.isFinite(fee) || fee < 0) {
    return { success: false, error: "Delivery fee must be 0 or more" };
  }

  const payload = {
    name,
    description,
    fee,
    sort_order: sortOrder,
    is_active: isActive,
    quote_after_payment: false,
  };

  if (id) {
    const { error } = await admin
      .from("delivery_zones")
      .update(payload)
      .eq("id", id);
    if (error) return { success: false, error: error.message };
  } else {
    const { error } = await admin.from("delivery_zones").insert(payload);
    if (error) return { success: false, error: error.message };
  }

  revalidatePath("/admin/delivery-zones");
  revalidatePath("/checkout");
  return { success: true };
}

export async function deleteDeliveryZone(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("delivery_zones").delete().eq("id", id);
  if (error) return { success: false, error: error.message };

  revalidatePath("/admin/delivery-zones");
  revalidatePath("/checkout");
  return { success: true };
}
