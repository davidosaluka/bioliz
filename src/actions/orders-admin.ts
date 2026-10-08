"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { OrderStatus } from "@/types";

const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ["contacted", "confirmed", "completed", "cancelled"],
  contacted: ["confirmed", "completed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: ["cancelled"],
  cancelled: [],
  pending_payment: ["cancelled"],
  paid: ["processing", "out_for_delivery", "delivered", "refunded"],
  processing: ["out_for_delivery", "delivered", "refunded"],
  out_for_delivery: ["delivered", "refunded"],
  delivered: ["refunded"],
  expired: [],
  refunded: [],
};

export type OrderFilters = {
  status?: OrderStatus | "all";
  paymentStatus?: string | "all";
  needsAttention?: boolean;
  includePendingExpired?: boolean;
};

export async function getOrdersAdmin(filters: OrderFilters = {}) {
  await requireAdmin();
  const admin = createAdminClient();
  let query = admin
    .from("orders")
    .select("*, payment:payments(*)")
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }

  if (filters.paymentStatus && filters.paymentStatus !== "all") {
    query = query.eq("payment_status", filters.paymentStatus);
  }

  if (filters.needsAttention) {
    query = query.eq("needs_attention", true);
  }

  if (!filters.includePendingExpired) {
    query = query.not("status", "in", "(pending_payment,expired)");
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getOrderAdmin(id: string) {
  await requireAdmin();
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .select("*, items:order_items(*), payment:payments(*)")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function updateOrderStatus(
  id: string,
  newStatus: OrderStatus,
  adminNotes?: string
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("status, payment_status, items:order_items(product_id, variant_id, quantity)")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found" };
  }

  const allowed = VALID_STATUS_TRANSITIONS[order.status] ?? [];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Cannot change status from ${order.status} to ${newStatus}`,
    };
  }

  const updatePayload: { status: OrderStatus; admin_notes?: string } = {
    status: newStatus,
  };
  if (adminNotes !== undefined) {
    updatePayload.admin_notes = adminNotes;
  }

  const { error } = await admin
    .from("orders")
    .update(updatePayload)
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");

  return { success: true };
}

export async function cancelOrRefundOrder(
  id: string,
  newStatus: "cancelled" | "refunded",
  options: { returnStock?: boolean; adminNotes?: string }
) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: order, error: orderError } = await admin
    .from("orders")
    .select("status, payment_status, stock_deducted, items:order_items(product_id, variant_id, quantity)")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found" };
  }

  if (order.status !== "paid") {
    return { success: false, error: "Only paid orders can be cancelled or refunded" };
  }

  if (options.returnStock && order.stock_deducted) {
    await admin.rpc("restore_order_stock", { p_order_id: id });
  }

  const { error } = await admin
    .from("orders")
    .update({
      status: newStatus,
      payment_status: newStatus === "refunded" ? "refunded" : order.payment_status,
      admin_notes: options.adminNotes,
    })
    .eq("id", id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
  revalidatePath("/shop");

  return { success: true };
}
