import { describe, it, expect } from "vitest";
import { buildWhatsAppMessage, buildOrderMessage } from "@/lib/whatsapp";
import { CheckoutFormData } from "@/types";

const customer: CheckoutFormData = {
  name: "Ada Obi",
  email: "ada@example.com",
  phone: "08031234567",
  deliveryZoneId: "00000000-0000-0000-0000-000000000000",
  deliveryAddress: "Lekki Phase 1, Lagos",
  notes: "Need delivery before Friday",
};

describe("buildOrderMessage", () => {
  it("includes order number and customer details", () => {
    const message = buildOrderMessage(
      "GE-260502-4F7K",
      [],
      customer,
      0,
      false
    );
    expect(message).toContain("GE-260502-4F7K");
    expect(message).toContain("Ada Obi");
    expect(message).toContain("Lekki Phase 1, Lagos");
  });

  it("formats priced items with line totals", () => {
    const message = buildOrderMessage(
      "GE-260502-4F7K",
      [
        {
          name: "Olympic Spin Bike",
          variantLabel: "Black",
          quantity: 2,
          unitPrice: 450000,
          priceOnRequest: false,
        },
      ],
      customer,
      900000,
      false
    );
    expect(message).toContain("Olympic Spin Bike (Black)");
    expect(message).toContain("₦450,000");
    expect(message).toContain("₦900,000");
  });

  it("shows price on request for flagged items", () => {
    const message = buildOrderMessage(
      "GE-260502-4F7K",
      [
        {
          name: "7ft Snooker Table",
          variantLabel: null,
          quantity: 1,
          unitPrice: null,
          priceOnRequest: true,
        },
      ],
      customer,
      0,
      true
    );
    expect(message).toContain("Price on request");
    expect(message).toContain("Some items are price on request");
  });

  it("truncates item list when cart is very long", () => {
    const items = Array.from({ length: 12 }, (_, i) => ({
      name: `Item ${i + 1}`,
      variantLabel: null,
      quantity: 1,
      unitPrice: 1000,
      priceOnRequest: false,
    }));

    const message = buildOrderMessage("GE-260502-4F7K", items, customer, 12000, false);
    expect(message).toContain("…and 2 more items");
  });

  it("keeps message under 1500 characters", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      name: `Very long product name number ${i + 1} with extra text`,
      variantLabel: null,
      quantity: 1,
      unitPrice: 100000,
      priceOnRequest: false,
    }));

    const message = buildOrderMessage("GE-260502-4F7K", items, customer, 100000, false);
    expect(message.length).toBeLessThanOrEqual(1500);
  });
});

describe("buildWhatsAppMessage", () => {
  it("normalizes phone numbers starting with 0", () => {
    const url = buildWhatsAppMessage(
      "08031234567",
      "GE-260502-4F7K",
      [],
      customer,
      0,
      false
    );
    expect(url).toContain("wa.me/2348031234567");
    expect(url).toContain(encodeURIComponent("GE-260502-4F7K"));
  });

  it("uses number with +234 prefix as-is", () => {
    const url = buildWhatsAppMessage(
      "+2348031234567",
      "GE-260502-4F7K",
      [],
      customer,
      0,
      false
    );
    expect(url).toContain("wa.me/2348031234567");
  });
});
