"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { siteSettingsSchema } from "@/lib/validators";

export async function updateSettings(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const raw = {
    storeName: formData.get("storeName") as string,
    whatsappNumber: formData.get("whatsappNumber") as string,
    contactEmail: (formData.get("contactEmail") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    heroTitle: formData.get("heroTitle") as string,
    heroSubtitle: (formData.get("heroSubtitle") as string) || undefined,
  };

  const validated = siteSettingsSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((e) => e.message).join(". "),
    };
  }

  // Normalize WhatsApp number
  let digits = validated.data.whatsappNumber.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);

  const { error } = await admin
    .from("site_settings")
    .update({
      store_name: validated.data.storeName,
      whatsapp_number: digits,
      contact_email: validated.data.contactEmail,
      address: validated.data.address,
      hero_title: validated.data.heroTitle,
      hero_subtitle: validated.data.heroSubtitle,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/admin/settings");

  return { success: true };
}
