"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { siteSettingsSchema } from "@/lib/validators";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return digits;
}

export async function updateSettings(formData: FormData) {
  await requireAdmin();
  const admin = createAdminClient();

  const raw = {
    storeName: formData.get("storeName") as string,
    whatsappNumber: formData.get("whatsappNumber") as string,
    phoneNumber: (formData.get("phoneNumber") as string) || undefined,
    contactEmail: (formData.get("contactEmail") as string) || undefined,
    address: (formData.get("address") as string) || undefined,
    businessHours: (formData.get("businessHours") as string) || undefined,
    heroTitle: formData.get("heroTitle") as string,
    heroSubtitle: (formData.get("heroSubtitle") as string) || undefined,
    socialInstagram: (formData.get("socialInstagram") as string) || undefined,
    socialFacebook: (formData.get("socialFacebook") as string) || undefined,
    socialX: (formData.get("socialX") as string) || undefined,
    socialTiktok: (formData.get("socialTiktok") as string) || undefined,
    socialLinkedin: (formData.get("socialLinkedin") as string) || undefined,
    socialYoutube: (formData.get("socialYoutube") as string) || undefined,
  };

  const validated = siteSettingsSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((e) => e.message).join(". "),
    };
  }

  const socialLinks = {
    instagram: validated.data.socialInstagram?.trim() || undefined,
    facebook: validated.data.socialFacebook?.trim() || undefined,
    x: validated.data.socialX?.trim() || undefined,
    tiktok: validated.data.socialTiktok?.trim() || undefined,
    linkedin: validated.data.socialLinkedin?.trim() || undefined,
    youtube: validated.data.socialYoutube?.trim() || undefined,
  };

  const { error } = await admin
    .from("site_settings")
    .update({
      store_name: validated.data.storeName,
      whatsapp_number: normalizePhone(validated.data.whatsappNumber),
      phone_number: validated.data.phoneNumber
        ? normalizePhone(validated.data.phoneNumber)
        : null,
      contact_email: validated.data.contactEmail || null,
      address: validated.data.address || null,
      business_hours: validated.data.businessHours || null,
      hero_title: validated.data.heroTitle,
      hero_subtitle: validated.data.heroSubtitle || null,
      social_links: socialLinks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings", "layout");

  return { success: true };
}
