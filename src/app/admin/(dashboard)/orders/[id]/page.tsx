"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getOrderAdmin,
  updateOrderStatus,
  cancelOrRefundOrder,
} from "@/actions/orders-admin";
import { formatCurrency, formatPhoneNumber } from "@/lib/format";
import { OrderItem, OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { MessageCircle, Phone, ExternalLink, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const fulfilmentStatuses: OrderStatus[] = [
  "paid",
  "processing",
  "out_for_delivery",
  "delivered",
];

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<Awaited<ReturnType<typeof getOrderAdmin>>>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState("");
  const [returnStock, setReturnStock] = useState(true);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundType, setRefundType] = useState<"cancelled" | "refunded">("refunded");

  useEffect(() => {
    getOrderAdmin(id).then((data) => {
      setOrder(data);
      setAdminNotes(data?.admin_notes ?? "");
      setLoading(false);
    });
  }, [id]);

  async function handleStatusChange(newStatus: OrderStatus) {
    const result = await updateOrderStatus(id, newStatus, adminNotes);
    if (!result.success) {
      toast.error(result.error ?? "Failed to update status");
      return;
    }
    toast.success(`Status updated to ${newStatus}`);
    const updated = await getOrderAdmin(id);
    setOrder(updated);
  }

  async function handleCancelOrRefund() {
    const result = await cancelOrRefundOrder(id, refundType, {
      returnStock,
      adminNotes,
    });
    if (!result.success) {
      toast.error(result.error ?? "Failed to update order");
      return;
    }
    toast.success(`Order marked as ${refundType}`);
    setRefundDialogOpen(false);
    const updated = await getOrderAdmin(id);
    setOrder(updated);
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading order...</p>;
  }

  if (!order) {
    return <p className="text-muted-foreground">Order not found.</p>;
  }

  const payment = Array.isArray(order.payment)
    ? order.payment.sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      )[0]
    : order.payment;
  const isPaid = order.status === "paid";
  const isFulfilling =
    isPaid ||
    order.status === "processing" ||
    order.status === "out_for_delivery" ||
    order.status === "delivered";

  const paystackDashboardUrl = payment?.paystack_transaction_id
    ? `https://dashboard.paystack.com/#/transactions/${payment.paystack_transaction_id}`
    : "https://dashboard.paystack.com/#/transactions";

  const whatsappUrl = `https://wa.me/${order.customer_phone.replace(/\D/g, "")}`;
  const phoneUrl = `tel:${order.customer_phone}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{order.order_number}</h1>
          <p className="text-muted-foreground">
            {order.created_at
              ? new Date(order.created_at).toLocaleString()
              : "—"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {order.status}
          </Badge>
          <Badge variant="outline" className="text-sm">
            {order.payment_status}
          </Badge>
          {order.needs_attention && (
            <Badge variant="destructive" className="text-sm">
              Needs attention
            </Badge>
          )}
        </div>
      </div>

      {order.needs_attention && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-semibold">Needs attention</p>
            <p>{order.attention_reason ?? "Please review this order."}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-white">Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.items?.map((item: OrderItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 p-3"
                >
                  <div>
                    <p className="font-medium text-white">{item.product_name}</p>
                    {item.variant_label && (
                      <p className="text-sm text-muted-foreground">
                        {item.variant_label}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-white">
                      {formatCurrency((item.unit_price ?? 0) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-white">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="text-white">
                  {order.delivery_quote_pending
                    ? "Quoted after payment"
                    : formatCurrency(order.delivery_fee ?? 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white">Total</span>
                <span className="text-lg font-bold text-white">
                  {formatCurrency(order.total ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-white">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-white">
                <span className="text-muted-foreground">Name:</span>{" "}
                {order.customer_name}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Email:</span>{" "}
                {order.customer_email ?? "—"}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Phone:</span>{" "}
                {formatPhoneNumber(order.customer_phone)}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Delivery address:</span>{" "}
                {order.delivery_location}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Delivery zone:</span>{" "}
                {order.delivery_zone_name ?? "—"}
                {order.delivery_quote_pending && (
                  <Badge variant="outline" className="ml-2">
                    Quoted after payment
                  </Badge>
                )}
              </p>
              {order.notes && (
                <p className="text-white">
                  <span className="text-muted-foreground">Notes:</span>{" "}
                  {order.notes}
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-primary text-primary-foreground hover:bg-brand-dark">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </Button>
                </a>
                <a href={phoneUrl}>
                  <Button variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-white">Payment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-white">
                <span className="text-muted-foreground">Reference:</span>{" "}
                {payment?.reference ?? "—"}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Status:</span>{" "}
                {payment?.status ?? "—"}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Channel:</span>{" "}
                {payment?.channel ?? "—"}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Paid at:</span>{" "}
                {payment?.paid_at
                  ? new Date(payment.paid_at).toLocaleString()
                  : "—"}
              </p>
              <p className="text-white">
                <span className="text-muted-foreground">Transaction ID:</span>{" "}
                {payment?.paystack_transaction_id ?? "—"}
              </p>
              <a
                href={paystackDashboardUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="mt-2">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in Paystack
                </Button>
              </a>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="text-white">Update Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isFulfilling ? (
                <>
                  <div className="space-y-2">
                    <Label>Fulfilment status</Label>
                    <Select
                      value={order.status}
                      onValueChange={(value) =>
                        value && handleStatusChange(value as OrderStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue>{order.status}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {fulfilmentStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
                    <DialogTrigger
                      render={
                        <Button variant="destructive" className="w-full">
                          Cancel or Refund
                        </Button>
                      }
                    />
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel or refund order</DialogTitle>
                        <DialogDescription>
                          Did you already refund the customer in the Paystack
                          dashboard?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Action</Label>
                          <Select
                            value={refundType}
                            onValueChange={(value) =>
                              setRefundType(value as "cancelled" | "refunded")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue>
                                {refundType === "refunded"
                                  ? "Refunded"
                                  : "Cancelled"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="refunded">Refunded</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="returnStock"
                            checked={returnStock}
                            onCheckedChange={setReturnStock}
                          />
                          <Label htmlFor="returnStock">
                            Return items to stock
                          </Label>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Refund the customer in Paystack first, then mark the
                          order here.
                        </p>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setRefundDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleCancelOrRefund}>
                          Confirm
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Fulfilment actions are only available for paid orders.
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this order"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
