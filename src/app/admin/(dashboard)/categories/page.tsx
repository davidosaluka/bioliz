"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCategoriesAdmin, upsertCategory, deleteCategory } from "@/actions/categories";
import { Category } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    isActive: true,
  });

  useEffect(() => {
    getCategoriesAdmin().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  }, []);

  function startEdit(category: Category) {
    setEditing(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description ?? "",
      sortOrder: category.sort_order ?? 0,
      isActive: category.is_active ?? true,
    });
  }

  function resetForm() {
    setEditing(null);
    setFormData({ name: "", slug: "", description: "", sortOrder: 0, isActive: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = new FormData();
    if (editing) payload.set("id", editing.id);
    payload.set("name", formData.name);
    payload.set("slug", formData.slug);
    payload.set("description", formData.description);
    payload.set("sortOrder", String(formData.sortOrder));
    payload.set("isActive", String(formData.isActive));

    const result = await upsertCategory(payload);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save category");
      return;
    }

    toast.success(editing ? "Category updated" : "Category created");
    resetForm();
    const updated = await getCategoriesAdmin();
    setCategories(updated);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    const result = await deleteCategory(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete category");
      return;
    }
    toast.success("Category deleted");
    setCategories(categories.filter((c) => c.id !== id));
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Categories</h1>
        <p className="text-muted-foreground">Manage product categories</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border/50 bg-card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={formData.sortOrder}
              onChange={(e) =>
                setFormData({ ...formData, sortOrder: Number(e.target.value) })
              }
            />
          </div>
          <div className="flex items-center gap-2 pt-8">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isActive: checked })
              }
            />
            <Label htmlFor="isActive">Active</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-brand-dark"
          >
            {editing ? "Update Category" : "Create Category"}
          </Button>
          {editing && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          )}
        </div>
      </form>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium text-white">
                  {category.name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {category.slug}
                </TableCell>
                <TableCell>{category.sort_order}</TableCell>
                <TableCell>
                  {category.is_active ? "Active" : "Hidden"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => startEdit(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
