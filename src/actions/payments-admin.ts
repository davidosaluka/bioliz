"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";

export async function getPaymentsAdmin() {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("payments")
    .select("*, order:orders(order_number, customer_name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}
