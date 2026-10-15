"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { formatCurrency, formatPhoneNumber } from "@/lib/format";
import { refreshOrderStatus, reinitializePayment } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Printer,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type OrderItem = {
  id: string;
  product_name: string;
  variant_label: string | null;
  unit_price: number | null;
  quantity: number;
};

type Payment = {
  reference: string;
  status: string;
  channel: string | null;
  paid_at: string | null;
  authorization_url: string | null;
};

type OrderView = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_location: string;
  delivery_zone_name: string | null;
  delivery_fee: number | null;
  delivery_quote_pending: boolean | null;
  subtotal: number;
  total: number | null;
  paid_at: string | null;
  expires_at: string | null;
  needs_attention: boolean | null;
  attention_reason: string | null;
  items: OrderItem[];
  payment: Payment[];
};

export function OrderConfirmationClient({ order }: { order: OrderView }) {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [currentOrder, setCurrentOrder] = useState<OrderView>(order);
  const [retrying, setRetrying] = useState(false);
  const [polling, setPolling] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const payment = currentOrder.payment?.length
    ? currentOrder.payment.sort(
        (a, b) =>
          new Date(b.paid_at ?? 0).getTime() - new Date(a.paid_at ?? 0).getTime()
      )[0]
    : undefined;

  // Clear cart once the order is paid.
  useEffect(() => {
    if (currentOrder.status === "paid") {
      clearCart();
    }
  }, [currentOrder.status, clearCart]);

  // Auto-poll while pending (max 2 minutes).
  useEffect(() => {
    if (currentOrder.status !== "pending_payment") return;

    let attempts = 0;
    const maxAttempts = 24; // 24 * 5s = 120s
    const interval = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(interval);
        return;
      }

      setPolling(true);
      const result = await refreshOrderStatus(currentOrder.order_number, token);
      setPolling(false);

      if (result.success && result.order) {
        setCurrentOrder(result.order as unknown as OrderView);
        if (result.order.status !== "pending_payment") {
          clearInterval(interval);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentOrder.order_number, currentOrder.status, token]);

  async function handleRetry() {
    setRetrying(true);
    const result = await reinitializePayment(currentOrder.order_number, token);
    setRetrying(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not retry payment");
      return;
    }

    if (!result.authorizationUrl) {
      toast.error("Could not retry payment");
      return;
    }

    window.location.href = result.authorizationUrl;
  }

  async function handleVerify() {
    setVerifying(true);
    const result = await refreshOrderStatus(currentOrder.order_number, token);
    setVerifying(false);

    if (!result.success) {
      toast.error(result.error ?? "Could not verify payment");
      return;
    }

    setCurrentOrder(result.order as unknown as OrderView);
    if (result.order.status === "paid") {
      toast.success("Payment confirmed");
    } else {
      toast.info("Payment not confirmed yet. Please wait or try again.");
    }
  }

  function handlePrint() {
    window.print();
  }

  const isPaid = currentOrder.status === "paid";
  const isPending = currentOrder.status === "pending_payment";
  const isExpired = currentOrder.status === "expired";
  const isCancelled = currentOrder.status === "cancelled";
  const isFailed =
    currentOrder.payment_status === "failed" ||
    currentOrder.payment_status === "expired";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 print:py-4">
      <Card className="border-border/50 bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            {isPaid ? (
              <CheckCircle className="h-8 w-8 text-primary" />
            ) : isPending ? (
              <Clock className="h-8 w-8 text-yellow-500" />
            ) : (
              <XCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle className="mt-4 text-2xl text-white">
            {isPaid
              ? "Payment Confirmed"
              : isPending
              ? "Awaiting Payment"
              : isExpired
              ? "Order Expired"
              : isCancelled
              ? "Order Cancelled"
              : "Payment Failed"}
          </CardTitle>
          <p className="text-muted-foreground">
            Order number: {" "}
            <span className="font-semibold text-white">
              {currentOrder.order_number}
            </span>
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {currentOrder.needs_attention && (
            <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="font-semibold">Needs attention</p>
                <p>{currentOrder.attention_reason ?? "Please contact us."}</p>
              </div>
            </div>
          )}

          {isPaid && (
            <div className="rounded-lg bg-primary/10 p-4 text-center text-sm text-primary">
              <p className="font-semibold">Thank you for your payment!</p>
              <p>
                We will confirm your order and arrange delivery. A receipt has
                been sent to your email.
              </p>
            </div>
          )}

          {isPending && (
            <div className="rounded-lg bg-yellow-500/10 p-4 text-sm text-yellow-500">
              <p className="font-semibold">Payment pending</p>
              <p>
                If you have already paid, we are waiting for Paystack to confirm
                it. This page will update automatically.
                {polling && " Checking now..."}
              </p>
            </div>
          )}

          {isExpired && (
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>
                This order has expired. Please return to the shop and place a
                new order.
              </p>
            </div>
          )}

          {isFailed && (
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>We could not confirm payment for this order.</p>
            </div>
          )}

          {isCancelled && (
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>This order has been cancelled.</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <p className="text-white">
              <span className="text-muted-foreground">Name:</span>{" "}
              {currentOrder.customer_name}
            </p>
            <p className="text-white">
              <span className="text-muted-foreground">Email:</span>{" "}
              {currentOrder.customer_email}
            </p>
            <p className="text-white">
              <span className="text-muted-foreground">Phone:</span>{" "}
              {formatPhoneNumber(currentOrder.customer_phone)}
            </p>
            <p className="text-white">
              <span className="text-muted-foreground">Delivery address:</span>{" "}
              {currentOrder.delivery_location}
            </p>
            {currentOrder.delivery_zone_name && (
              <p className="text-white">
                <span className="text-muted-foreground">Delivery zone:</span>{" "}
                {currentOrder.delivery_zone_name}
                {currentOrder.delivery_quote_pending && (
                  <Badge variant="outline" className="ml-2">
                    Quoted after payment
                  </Badge>
                )}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold text-white">Items</h3>
            {currentOrder.items.map((item) => (
              <div
                key={item.id}
                className="flex justify-between text-sm"
              >
                <div>
                  <p className="font-medium text-white">
                    {item.product_name}
                    {item.variant_label && ` (${item.variant_label})`}
                  </p>
                  <p className="text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <p className="text-white">
                  {formatCurrency((item.unit_price ?? 0) * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-white">{formatCurrency(currentOrder.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-white">
                {currentOrder.delivery_quote_pending
                  ? "Quoted after payment"
                  : formatCurrency(currentOrder.delivery_fee)}
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span className="text-white">Total</span>
              <span className="text-white">{formatCurrency(currentOrder.total)}</span>
            </div>
          </div>

          {payment?.paid_at && (
            <div className="text-xs text-muted-foreground">
              Paid on {new Date(payment.paid_at).toLocaleString()}
              {payment.channel && <> via {payment.channel}</>}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-4 print:hidden sm:flex-row">
            {isPaid ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 hover:bg-white/5"
                  onClick={handlePrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print receipt
                </Button>
                <Link href="/shop" className="flex-1">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-brand-dark">
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Continue shopping
                  </Button>
                </Link>
              </>
            ) : isPending ? (
              <>
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-brand-dark"
                  onClick={handleVerify}
                  disabled={verifying || polling}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${verifying || polling ? "animate-spin" : ""}`}
                  />
                  {verifying || polling ? "Checking..." : "Confirm payment"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 hover:bg-white/5"
                  onClick={handleRetry}
                  disabled={retrying}
                >
                  {retrying ? "Starting..." : "Try payment again"}
                </Button>
                <Link href="/shop" className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/5"
                  >
                    Back to shop
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/shop" className="flex-1">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-brand-dark">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue shopping
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
