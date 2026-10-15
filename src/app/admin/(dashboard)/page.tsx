import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  ClipboardList,
  TrendingUp,
  Bell,
} from "lucide-react";

async function getDashboardStats() {
  await requireAdmin();
  const admin = createAdminClient();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    paidOrdersToday,
    paidOrders7Days,
    paidOrders30Days,
    revenueToday,
    revenue7Days,
    revenue30Days,
    needsAttention,
    lowStock,
    outOfStock,
    latestOrders,
  ] = await Promise.all([
    admin
      .from("orders")
      .select("id", { count: "exact" })
      .eq("status", "paid")
      .gte("paid_at", todayStart.toISOString()),
    admin
      .from("orders")
      .select("id", { count: "exact" })
      .eq("status", "paid")
      .gte("paid_at", sevenDaysAgo.toISOString()),
    admin
      .from("orders")
      .select("id", { count: "exact" })
      .eq("status", "paid")
      .gte("paid_at", thirtyDaysAgo.toISOString()),
    admin
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("paid_at", todayStart.toISOString()),
    admin
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("paid_at", sevenDaysAgo.toISOString()),
    admin
      .from("orders")
      .select("total")
      .eq("status", "paid")
      .gte("paid_at", thirtyDaysAgo.toISOString()),
    admin
      .from("orders")
      .select("id", { count: "exact" })
      .eq("needs_attention", true),
    admin
      .from("products")
      .select("id", { count: "exact" })
      .eq("track_stock", true)
      .gt("stock_quantity", 0)
      .lte("stock_quantity", 3)
      .eq("is_active", true),
    admin
      .from("products")
      .select("id", { count: "exact" })
      .eq("track_stock", true)
      .lte("stock_quantity", 0)
      .eq("is_active", true),
    admin
      .from("orders")
      .select("*")
      .not("status", "in", "(pending_payment,expired)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const sum = (rows: { total: number | null }[]) =>
    rows.reduce((acc, row) => acc + (row.total ?? 0), 0);

  return {
    paidOrdersTodayCount: paidOrdersToday.count ?? 0,
    paidOrders7DaysCount: paidOrders7Days.count ?? 0,
    paidOrders30DaysCount: paidOrders30Days.count ?? 0,
    revenueToday: sum(revenueToday.data ?? []),
    revenue7Days: sum(revenue7Days.data ?? []),
    revenue30Days: sum(revenue30Days.data ?? []),
    needsAttentionCount: needsAttention.count ?? 0,
    lowStockCount: lowStock.count ?? 0,
    outOfStockCount: outOfStock.count ?? 0,
    latestOrders: latestOrders.data ?? [],
  };
}

export default async function AdminOverviewPage() {
  const stats = await getDashboardStats();
  const isTestMode = process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_test");

  const cards = [
    {
      title: "Paid Orders (7d)",
      value: stats.paidOrders7DaysCount,
      icon: ClipboardList,
      href: "/admin/orders?paymentStatus=paid",
    },
    {
      title: "Revenue (7d)",
      value: `₦${stats.revenue7Days.toLocaleString()}`,
      icon: TrendingUp,
      href: "/admin/orders?paymentStatus=paid",
    },
    {
      title: "Needs Attention",
      value: stats.needsAttentionCount,
      icon: Bell,
      href: "/admin/orders?needsAttention=true",
    },
    {
      title: "Low Stock",
      value: stats.lowStockCount,
      icon: AlertTriangle,
      href: "/admin/products?stock=low",
    },
    {
      title: "Out of Stock",
      value: stats.outOfStockCount,
      icon: Package,
      href: "/admin/products?stock=out",
    },
  ];

  return (
    <div className="space-y-8">
      {isTestMode && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm text-yellow-500">
          <p className="font-semibold">TEST MODE</p>
          <p>
            Paystack is using test keys. No real money is being charged. Switch
            to live keys in production.
          </p>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your store</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} href={card.href}>
            <Card className="border-border/50 bg-card transition-colors hover:border-primary/30">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{card.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Revenue today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              ₦{stats.revenueToday.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Revenue last 30 days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              ₦{stats.revenue30Days.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50 bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Paid orders today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">
              {stats.paidOrdersTodayCount}
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white">Latest Orders</h2>
        {stats.latestOrders.length === 0 ? (
          <p className="mt-4 text-muted-foreground">No orders yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {stats.latestOrders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`}>
                <Card className="border-border/50 bg-card transition-colors hover:border-primary/30">
                  <CardContent className="flex flex-col justify-between gap-2 py-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-semibold text-white">
                        {order.order_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name} • {order.customer_phone}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {order.status}
                      </span>
                      <span className="text-sm text-white">
                        ₦{Number(order.total ?? 0).toLocaleString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
