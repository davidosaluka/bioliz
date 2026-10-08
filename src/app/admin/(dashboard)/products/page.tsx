import Link from "next/link";
import Image from "next/image";
import { getProductsAdmin } from "@/actions/products";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";

export default async function AdminProductsPage() {
  const products = await getProductsAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <p className="text-muted-foreground">Manage your product catalogue</p>
        </div>
        <Link href="/admin/products/new">
          <Button className="bg-primary text-primary-foreground hover:bg-brand-dark">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No products yet.
                </TableCell>
              </TableRow>
            )}
            {products.map((product) => {
              const coverImage = product.images?.[0] ?? "/placeholder.svg";
              const activeVariants = product.variants?.filter(
                (v) => v.is_active ?? false
              );
              const hasVariants = activeVariants && activeVariants.length > 0;
              const effectiveStock = hasVariants
                ? activeVariants.reduce(
                    (sum, v) => sum + (v.stock_quantity ?? 0),
                    0
                  )
                : product.stock_quantity;
              const allVariantsOutOfStock =
                hasVariants &&
                activeVariants.every((v) => (v.stock_quantity ?? 0) <= 0);
              const isOutOfStock =
                product.track_stock &&
                (allVariantsOutOfStock ||
                  (!hasVariants && (effectiveStock ?? 0) <= 0));
              return (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                        <Image
                          src={coverImage}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-white">{product.name}</p>
                        {product.is_featured && (
                          <Badge className="mt-0.5 bg-primary text-[10px] text-primary-foreground">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.category?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    {product.price_on_request || product.price === null ? (
                      <span className="text-muted-foreground">On request</span>
                    ) : (
                      <span className="text-white">
                        {formatCurrency(product.price)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        isOutOfStock ? "text-destructive" : "text-white"
                      }
                    >
                      {product.track_stock ? effectiveStock : "∞"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {product.is_active ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Hidden</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
