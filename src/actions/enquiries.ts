"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { quoteSchema } from "@/lib/validators";

const enquiryRateLimit = new Map<string, { count: number; resetAt: number }>();

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const limit = 5;

  const entry = enquiryRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    enquiryRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

export async function submitEnquiry(formData: FormData) {
  const ip = await getClientIp();
  if (isRateLimited(ip)) {
    return { success: false, error: "Too many enquiries. Please try again later." };
  }

  const raw = {
    name: formData.get("name") as string,
    phone: formData.get("phone") as string,
    organisation: (formData.get("organisation") as string) || undefined,
    buyerType: (formData.get("buyerType") as string) || undefined,
    message: formData.get("message") as string,
  };

  const validated = quoteSchema.safeParse(raw);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues.map((e) => e.message).join(". "),
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("enquiries").insert({
    name: validated.data.name,
    phone: validated.data.phone,
    organisation: validated.data.organisation,
    buyer_type: validated.data.buyerType,
    message: validated.data.message,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getEnquiriesAdmin() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("enquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateEnquiryStatus(id: string, status: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("enquiries")
    .update({ status })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
