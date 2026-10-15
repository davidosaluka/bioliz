"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category, ProductWithVariants } from "@/types";
import { upsertProduct, deleteProduct } from "@/actions/products";
import { slugify } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ImageUploader } from "./image-uploader";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

export function ProductForm({
  product,
  categories,
}: {
  product?: ProductWithVariants | null;
  categories: Category[];
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const [formData, setFormData] = useState({
    id: product?.id ?? "",
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    categoryId: product?.category_id ?? "",
    shortDescription: product?.short_description ?? "",
    description: product?.description ?? "",
    price: product?.price ?? "",
    compareAtPrice: product?.compare_at_price ?? "",
    priceOnRequest: product?.price_on_request ?? false,
    stockQuantity: product?.stock_quantity ?? 0,
    trackStock: product?.track_stock ?? true,
    images: product?.images ?? [],
    specs: product?.specs ? (product.specs as Record<string, string>) : {},
    isFeatured: product?.is_featured ?? false,
    isActive: product?.is_active ?? true,
  });

  const [variants, setVariants] = useState<
    {
      id?: string;
      label: string;
      price: string;
      stockQuantity: number;
      isActive: boolean;
    }[]
  >(
    product?.variants?.map((v) => ({
      id: v.id,
      label: v.label,
      price: v.price?.toString() ?? "",
      stockQuantity: v.stock_quantity,
      isActive: v.is_active ?? true,
    })) ?? []
  );

  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const payload = new FormData();
    if (formData.id) payload.set("id", formData.id);
    payload.set("name", formData.name);
    payload.set("slug", formData.slug || slugify(formData.name));
    payload.set("categoryId", formData.categoryId);
    payload.set("shortDescription", formData.shortDescription);
    payload.set("description", formData.description);
    payload.set("price", formData.priceOnRequest ? "" : String(formData.price));
    payload.set("compareAtPrice", String(formData.compareAtPrice));
    payload.set("priceOnRequest", String(formData.priceOnRequest));
    payload.set("stockQuantity", String(formData.stockQuantity));
    payload.set("trackStock", String(formData.trackStock));
    payload.set("images", JSON.stringify(formData.images));
    payload.set("specs", JSON.stringify(formData.specs));
    payload.set("isFeatured", String(formData.isFeatured));
    payload.set("isActive", String(formData.isActive));
    payload.set(
      "variants",
      JSON.stringify(
        variants.map((v) => ({
          ...v,
          price: v.price ? Number(v.price) : null,
        }))
      )
    );

    const result = await upsertProduct(payload);
    setPending(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to save product");
      return;
    }

    toast.success(product ? "Product updated" : "Product created");
    router.push("/admin/products");
  }

  async function handleDelete() {
    if (!product?.id) return;
    if (!confirm("Hide this product from the store?")) return;

    const result = await deleteProduct(product.id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to hide product");
      return;
    }

    toast.success("Product hidden");
    router.push("/admin/products");
  }

  const selectedCategory = categories.find((c) => c.id === formData.categoryId);

  function addSpec() {
    if (!specKey.trim() || !specValue.trim()) return;
    setFormData({
      ...formData,
      specs: { ...formData.specs, [specKey.trim()]: specValue.trim() },
    });
    setSpecKey("");
    setSpecValue("");
  }

  function removeSpec(key: string) {
    const updated = { ...formData.specs };
    delete updated[key];
    setFormData({ ...formData, specs: updated });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  name: e.target.value,
                  slug: formData.slug || slugify(e.target.value),
                })
              }
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) =>
                  setFormData({ ...formData, categoryId: value ?? "" })
                }
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category">
                    {selectedCategory ? selectedCategory.name : "Select category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) =>
                setFormData({ ...formData, shortDescription: e.target.value })
              }
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={6}
            />
          </div>

          <ImageUploader
            images={formData.images}
            onChange={(images) => setFormData({ ...formData, images })}
          />

          <Separator />

          <div>
            <h3 className="font-semibold text-white">Variants</h3>
            <p className="text-sm text-muted-foreground">
              Optional size, colour or model options.
            </p>
            <div className="mt-3 space-y-3">
              {variants.map((variant, index) => (
                <div
                  key={variant.id || index}
                  className="grid gap-2 rounded-lg border border-border/50 p-3 sm:grid-cols-4"
                >
                  <Input
                    placeholder="Label e.g. 7ft / Green"
                    value={variant.label}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[index].label = e.target.value;
                      setVariants(updated);
                    }}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Price"
                    value={variant.price}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[index].price = e.target.value;
                      setVariants(updated);
                    }}
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Stock"
                    value={variant.stockQuantity}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[index].stockQuantity = Math.max(
                        0,
                        Number(e.target.value) || 0
                      );
                      setVariants(updated);
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={variant.isActive}
                      onCheckedChange={(checked) => {
                        const updated = [...variants];
                        updated[index].isActive = checked;
                        setVariants(updated);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setVariants(variants.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setVariants([
                    ...variants,
                    { label: "", price: "", stockQuantity: 0, isActive: true },
                  ])
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold text-white">Specifications</h3>
            <div className="mt-3 flex gap-2">
              <Input
                placeholder="Key e.g. Dimensions"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
              />
              <Input
                placeholder="Value e.g. 7ft"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
              />
              <Button type="button" onClick={addSpec}>
                Add
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {Object.entries(formData.specs).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2"
                >
                  <span className="text-sm">
                    <span className="font-medium text-white">{key}:</span>{" "}
                    <span className="text-muted-foreground">{value}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSpec(key)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="font-semibold text-white">Pricing & Stock</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="priceOnRequest">Price on request</Label>
                <Switch
                  id="priceOnRequest"
                  checked={formData.priceOnRequest}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, priceOnRequest: checked })
                  }
                />
              </div>

              {!formData.priceOnRequest && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (₦)</Label>
                    <Input
                      id="price"
                      type="number"
                      min={0}
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="compareAtPrice">Compare-at Price (₦)</Label>
                    <Input
                      id="compareAtPrice"
                      type="number"
                      min={0}
                      value={formData.compareAtPrice}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          compareAtPrice: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  min={0}
                  value={formData.stockQuantity}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stockQuantity: Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="trackStock">Track stock</Label>
                <Switch
                  id="trackStock"
                  checked={formData.trackStock}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, trackStock: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/50 bg-card p-5">
            <h3 className="font-semibold text-white">Visibility</h3>
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">Active</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isFeatured">Featured</Label>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isFeatured: checked })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-brand-dark"
              disabled={pending}
            >
              {pending ? "Saving..." : product ? "Update Product" : "Create Product"}
            </Button>
            {product && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDelete}
              >
                Hide Product
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
