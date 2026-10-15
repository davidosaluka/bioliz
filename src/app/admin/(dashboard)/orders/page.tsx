"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getOrdersAdmin, OrderFilters } from "@/actions/orders-admin";
import { OrderStatus } from "@/types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const fulfilmentStatuses: (OrderStatus | "all")[] = [
  "all",
  "paid",
  "processing",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "refunded",
];

const paymentStatuses = ["all", "pending", "paid", "failed", "expired", "refunded"];

export default function AdminOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = (searchParams.get("status") as OrderStatus | "all") || "all";
  const paymentStatus = searchParams.get("paymentStatus") || "all";
  const needsAttention = searchParams.get("needsAttention") === "true";
  const includePendingExpired =
    searchParams.get("includePendingExpired") === "true";

  const [orders, setOrders] = useState<Awaited<ReturnType<typeof getOrdersAdmin>>>([]);
  const [loading, setLoading] = useState(true);

  const filters: OrderFilters = useMemo(
    () => ({
      status,
      paymentStatus,
      needsAttention,
      includePendingExpired,
    }),
    [status, paymentStatus, needsAttention, includePendingExpired]
  );

  useEffect(() => {
    getOrdersAdmin(filters).then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, [filters]);

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === null || value === "all" || value === "false") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/admin/orders?${params.toString()}`);
  }

  function paymentStatusBadge(status: string) {
    const variants: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      paid: "bg-green-500/10 text-green-500",
      failed: "bg-destructive/10 text-destructive",
      expired: "bg-muted text-muted-foreground",
      refunded: "bg-blue-500/10 text-blue-500",
    };
    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${variants[status] ?? "bg-muted text-muted-foreground"}`}
      >
        {status}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="grid gap-4 sm:grid-cols-3 lg:flex-1">
          <div className="space-y-2">
            <Label htmlFor="statusFilter">Fulfilment status</Label>
            <Select
              value={status}
              onValueChange={(value) => updateParam("status", value)}
            >
              <SelectTrigger id="statusFilter">
                <SelectValue>
                  {status === "all" ? "All statuses" : status}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {fulfilmentStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All statuses" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentStatusFilter">Payment status</Label>
            <Select
              value={paymentStatus}
              onValueChange={(value) => updateParam("paymentStatus", value)}
            >
              <SelectTrigger id="paymentStatusFilter">
                <SelectValue>
                  {paymentStatus === "all" ? "All payments" : paymentStatus}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All payments" : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Switch
              id="needsAttention"
              checked={needsAttention}
              onCheckedChange={(checked) =>
                updateParam("needsAttention", checked ? "true" : null)
              }
            />
            <Label htmlFor="needsAttention">Needs attention</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="includePendingExpired"
              checked={includePendingExpired}
              onCheckedChange={(checked) =>
                updateParam("includePendingExpired", checked ? "true" : null)
              }
            />
            <Label htmlFor="includePendingExpired">Show pending/expired</Label>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium text-white">
                    {order.order_number}
                    {order.needs_attention && (
                      <Badge variant="destructive" className="ml-2">
                        Attention
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className="text-white">{order.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_phone}
                    </p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.created_at
                      ? new Date(order.created_at).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-white">
                    {formatCurrency(order.total ?? 0)}
                  </TableCell>
                  <TableCell>
                    {paymentStatusBadge(order.payment_status)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{order.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
