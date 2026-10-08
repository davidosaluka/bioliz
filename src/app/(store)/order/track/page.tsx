"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { trackOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrackOrderPage() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await trackOrder(formData);
    setPending(false);

    if (!result.success) {
      setError(result.error ?? "Could not find order");
      return;
    }

    // `trackOrder` redirects on success, but in case it doesn't:
    if (result.redirectUrl) {
      router.push(result.redirectUrl);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8">
      <Card className="border-border/50 bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Track your order</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderNumber">Order number</Label>
              <Input
                id="orderNumber"
                name="orderNumber"
                placeholder="GE-261003-ABCD"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone">Email or phone number</Label>
              <Input
                id="emailOrPhone"
                name="emailOrPhone"
                placeholder="you@example.com or 0803 123 4567"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-brand-dark"
              disabled={pending}
            >
              {pending ? "Finding order..." : "Find order"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Paid online? Your order number was shown on the confirmation page and
            sent to your email.
          </p>
          <p className="mt-4 text-center text-sm">
            <Link href="/shop" className="text-primary hover:underline">
              Continue shopping
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
