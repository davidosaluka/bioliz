"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPaymentsAdmin } from "@/actions/payments-admin";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function PaymentsLogPage() {
  const [payments, setPayments] = useState<Awaited<ReturnType<typeof getPaymentsAdmin>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPaymentsAdmin().then((data) => {
      setPayments(data);
      setLoading(false);
    });
  }, []);

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500",
      success: "bg-green-500/10 text-green-500",
      failed: "bg-destructive/10 text-destructive",
      refunded: "bg-blue-500/10 text-blue-500",
    };
    return (
      <Badge className={styles[status] ?? "bg-muted text-muted-foreground"}>
        {status}
      </Badge>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Payments Log</h1>
        <p className="text-muted-foreground">
          Read-only payment records for reconciliation
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No payments yet.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => {
                const order = Array.isArray(payment.order)
                  ? payment.order[0]
                  : payment.order;
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-white">
                      {payment.reference}
                    </TableCell>
                    <TableCell>
                      {order ? (
                        <Link
                          href={`/admin/orders/${payment.order_id}`}
                          className="text-primary hover:underline"
                        >
                          {order.order_number}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {order?.customer_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-white">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.channel ?? "—"}
                    </TableCell>
                    <TableCell>{statusBadge(payment.status)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
