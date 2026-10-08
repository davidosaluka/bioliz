"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Category } from "@/types";
import { ProductFilters as ProductFiltersType } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X } from "lucide-react";

export function ProductFilters({
  categories,
  filters,
}: {
  categories: Category[];
  filters: ProductFiltersType;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === undefined || value === "" || value === "false") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset to page 1 when filters change
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFilters() {
    router.push(pathname);
  }

  return (
    <div className="space-y-6 rounded-xl border border-border/50 bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white">Filters</h3>
        {searchParams.toString() && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search products..."
            defaultValue={filters.search}
            onChange={(e) => updateParam("search", e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={filters.category ?? ""}
          onValueChange={(value) => updateParam("category", value || undefined)}
        >

          <SelectTrigger id="category">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Price range (₦)</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            defaultValue={filters.minPrice}
            onChange={(e) => updateParam("minPrice", e.target.value)}
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            defaultValue={filters.maxPrice}
            onChange={(e) => updateParam("maxPrice", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sort">Sort by</Label>
        <Select
          value={filters.sort ?? "newest"}
          onValueChange={(value) => updateParam("sort", value ?? undefined)}
        >
          <SelectTrigger id="sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price_asc">Price: Low to High</SelectItem>
            <SelectItem value="price_desc">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="inStock"
          checked={filters.inStock}
          onCheckedChange={(checked) =>
            updateParam("inStock", checked === true ? "true" : undefined)
          }
        />
        <Label htmlFor="inStock" className="text-sm font-normal">
          In stock only
        </Label>
      </div>
    </div>
  );
}
