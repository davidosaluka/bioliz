"use client";

import { useEffect, useState } from "react";
import {
  getDeliveryZonesAdmin,
  upsertDeliveryZone,
  deleteDeliveryZone,
} from "@/actions/delivery-zones";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<Awaited<ReturnType<typeof getDeliveryZonesAdmin>>>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    fee: "",
    sortOrder: "0",
    isActive: true,
    quoteAfterPayment: false,
  });

  useEffect(() => {
    loadZones();
  }, []);

  async function loadZones() {
    setLoading(true);
    const data = await getDeliveryZonesAdmin();
    setZones(data);
    setLoading(false);
  }

  function startEdit(zone: (typeof zones)[number]) {
    setEditing(zone.id);
    setFormData({
      name: zone.name,
      description: zone.description ?? "",
      fee: String(zone.fee ?? 0),
      sortOrder: String(zone.sort_order ?? 0),
      isActive: zone.is_active ?? true,
      quoteAfterPayment: zone.quote_after_payment ?? false,
    });
  }

  function resetForm() {
    setEditing(null);
    setFormData({
      name: "",
      description: "",
      fee: "",
      sortOrder: "0",
      isActive: true,
      quoteAfterPayment: false,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = new FormData();
    if (editing) payload.set("id", editing);
    payload.set("name", formData.name);
    payload.set("description", formData.description);
    payload.set("fee", formData.fee);
    payload.set("sortOrder", formData.sortOrder);
    payload.set("isActive", String(formData.isActive));
    payload.set("quoteAfterPayment", String(formData.quoteAfterPayment));

    const result = await upsertDeliveryZone(payload);
    if (!result.success) {
      toast.error(result.error ?? "Failed to save zone");
      return;
    }

    toast.success(editing ? "Zone updated" : "Zone created");
    resetForm();
    await loadZones();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this delivery zone?")) return;
    const result = await deleteDeliveryZone(id);
    if (!result.success) {
      toast.error(result.error ?? "Failed to delete zone");
      return;
    }
    toast.success("Zone deleted");
    await loadZones();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Delivery Zones</h1>
        <p className="text-muted-foreground">Set delivery fees and areas</p>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="text-white">
            {editing ? "Edit Zone" : "Add Zone"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
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
              <Label htmlFor="fee">Fee (₦)</Label>
              <Input
                id="fee"
                type="number"
                min={0}
                step="0.01"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                disabled={formData.quoteAfterPayment}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description / Areas covered</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="quoteAfterPayment"
                  checked={formData.quoteAfterPayment}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, quoteAfterPayment: checked })
                  }
                />
                <Label htmlFor="quoteAfterPayment">Quote after payment</Label>
              </div>
            </div>
            <div className="flex gap-2 sm:col-span-2">
              <Button type="submit">{editing ? "Update" : "Create"}</Button>
              {editing && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border/50 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : (
              zones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell className="font-medium text-white">
                    {zone.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {zone.description}
                  </TableCell>
                  <TableCell>
                    {zone.quote_after_payment
                      ? "Quoted after payment"
                      : formatCurrency(zone.fee ?? 0)}
                  </TableCell>
                  <TableCell>{zone.sort_order}</TableCell>
                  <TableCell>{zone.is_active ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEdit(zone)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(zone.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
