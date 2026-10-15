"use client";

import { useState, useCallback, useRef } from "react";
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

function useDebouncedCallback(
  callback: (value: string) => void,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    (value: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(value);
      }, delay);
    },
    [callback, delay]
  );
}

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

  const [search, setSearch] = useState(() => filters.search ?? "");
  const [minPrice, setMinPrice] = useState(() => filters.minPrice?.toString() ?? "");
  const [maxPrice, setMaxPrice] = useState(() => filters.maxPrice?.toString() ?? "");

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

  const debouncedUpdateSearch = useDebouncedCallback(
    (value: string) => updateParam("search", value || undefined),
    300
  );

  const debouncedUpdateMinPrice = useDebouncedCallback(
    (value: string) => updateParam("minPrice", value || undefined),
    500
  );

  const debouncedUpdateMaxPrice = useDebouncedCallback(
    (value: string) => updateParam("maxPrice", value || undefined),
    500
  );

  function clearFilters() {
    setSearch("");
    setMinPrice("");
    setMaxPrice("");
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
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              debouncedUpdateSearch(e.target.value);
            }}
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
            <SelectValue placeholder="All categories">
              {filters.category
                ? categories.find((c) => c.slug === filters.category)?.name ??
                  "All categories"
                : "All categories"}
            </SelectValue>
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
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              debouncedUpdateMinPrice(e.target.value);
            }}
            aria-label="Minimum price"
          />
          <span className="text-muted-foreground">-</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              debouncedUpdateMaxPrice(e.target.value);
            }}
            aria-label="Maximum price"
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
            <SelectValue>
              {(
                {
                  newest: "Newest",
                  price_asc: "Price: Low to High",
                  price_desc: "Price: High to Low",
                } as const
              )[filters.sort ?? "newest"]}
            </SelectValue>
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
