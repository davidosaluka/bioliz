"use client";

import { useState } from "react";
import { submitEnquiry } from "@/actions/enquiries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const buyerTypes = [
  "home",
  "gym",
  "hotel",
  "office",
  "club",
  "other",
];

export function QuotePageClient() {
  const [pending, setPending] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    organisation: "",
    buyerType: "",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const payload = new FormData();
    payload.set("name", formData.name);
    payload.set("phone", formData.phone);
    payload.set("organisation", formData.organisation);
    payload.set("buyerType", formData.buyerType);
    payload.set("message", formData.message);

    const result = await submitEnquiry(payload);
    setPending(false);

    if (!result.success) {
      toast.error(result.error ?? "Failed to submit enquiry");
      return;
    }

    toast.success("Enquiry submitted. We'll contact you soon.");
    setFormData({
      name: "",
      phone: "",
      organisation: "",
      buyerType: "",
      message: "",
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Request a Quote</h1>
      <p className="mt-2 text-muted-foreground">
        Tell us what you need for your gym, hotel, office or club. We&apos;ll get back
        to you on WhatsApp.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="organisation">Organisation (optional)</Label>
            <Input
              id="organisation"
              value={formData.organisation}
              onChange={(e) =>
                setFormData({ ...formData, organisation: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="buyerType">Buyer Type</Label>
            <Select
              value={formData.buyerType}
              onValueChange={(value) =>
                setFormData({ ...formData, buyerType: value ?? "" })
              }
            >
              <SelectTrigger id="buyerType">
                <SelectValue placeholder="Select buyer type">
                  {formData.buyerType
                    ? formData.buyerType.charAt(0).toUpperCase() +
                      formData.buyerType.slice(1)
                    : "Select buyer type"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {buyerTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            rows={5}
            required
            value={formData.message}
            onChange={(e) =>
              setFormData({ ...formData, message: e.target.value })
            }
            placeholder="Describe the equipment, quantities and any delivery requirements..."
          />
        </div>

        <Button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-brand-dark"
          disabled={pending}
        >
          {pending ? "Submitting..." : "Request Quote"}
        </Button>
      </form>
    </div>
  );
}
