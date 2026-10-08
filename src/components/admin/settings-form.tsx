"use client";

import { useState } from "react";
import { updateSettings } from "@/actions/settings";
import { normalizeNigerianPhone } from "@/lib/format";
import { SiteSetting } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";

export function SettingsForm({
  initialSettings,
}: {
  initialSettings: SiteSetting | null;
}) {
  const [pending, setPending] = useState(false);
  const [formData, setFormData] = useState({
    storeName: initialSettings?.store_name ?? "",
    whatsappNumber: initialSettings?.whatsapp_number ?? "",
    contactEmail: initialSettings?.contact_email ?? "",
    address: initialSettings?.address ?? "",
    heroTitle: initialSettings?.hero_title ?? "",
    heroSubtitle: initialSettings?.hero_subtitle ?? "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const payload = new FormData();
    payload.set("storeName", formData.storeName);
    payload.set("whatsappNumber", formData.whatsappNumber);
    payload.set("contactEmail", formData.contactEmail);
    payload.set("address", formData.address);
    payload.set("heroTitle", formData.heroTitle);
    payload.set("heroSubtitle", formData.heroSubtitle);

    const result = await updateSettings(payload);
    setPending(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to update settings");
      return;
    }

    toast.success("Settings updated");
  }

  const testWhatsAppUrl = `https://wa.me/${normalizeNigerianPhone(formData.whatsappNumber)}`;

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader>
        <CardTitle className="text-white">Store Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={formData.storeName}
              onChange={(e) =>
                setFormData({ ...formData, storeName: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
            <div className="flex gap-2">
              <Input
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) =>
                  setFormData({ ...formData, whatsappNumber: e.target.value })
                }
                placeholder="2348012345678"
                required
                className="flex-1"
              />
              <a
                href={testWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button type="button" variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Test
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              International format, digits only. Example: 2348143309703
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData({ ...formData, contactEmail: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroTitle">Hero Title</Label>
            <Input
              id="heroTitle"
              value={formData.heroTitle}
              onChange={(e) =>
                setFormData({ ...formData, heroTitle: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
            <Textarea
              id="heroSubtitle"
              value={formData.heroSubtitle}
              onChange={(e) =>
                setFormData({ ...formData, heroSubtitle: e.target.value })
              }
            />
          </div>

          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-brand-dark"
            disabled={pending}
          >
            {pending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
