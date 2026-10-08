import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatCurrency, formatPhoneNumber } from "@/lib/format";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const from = process.env.EMAIL_FROM ?? "Bioliz Global Sport <noreply@biolizglobalsport.com>";
const vendorEmail = process.env.VENDOR_NOTIFY_EMAIL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

type EmailOrderItem = {
  product_name: string;
  variant_label: string | null;
  unit_price: number | null;
  quantity: number;
};

type EmailOrder = {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  delivery_location: string;
  delivery_zone_name: string | null;
  delivery_fee: number | null;
  delivery_quote_pending: boolean | null;
  subtotal: number;
  total: number | null;
  items: EmailOrderItem[];
  public_token: string;
};

function orderUrl(order: EmailOrder) {
  return `${siteUrl}/order/${order.order_number}?token=${order.public_token}`;
}

function itemList(items: EmailOrderItem[]) {
  return items
    .map((item) => {
      const name = [item.product_name, item.variant_label]
        .filter(Boolean)
        .join(" (");
      const suffix = item.variant_label ? ")" : "";
      const lineTotal = (item.unit_price ?? 0) * item.quantity;
      return `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;">${name}${suffix}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #e5e5e5;text-align:right;">${formatCurrency(lineTotal)}</td>
      </tr>`;
    })
    .join("");
}

function baseTemplate(title: string, body: string) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="100%" max-width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px;background:#111827;color:#ffffff;text-align:center;">
                <h1 style="margin:0;font-size:20px;">BIOLIZ GLOBAL SPORT</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#1f2937;font-size:14px;line-height:1.6;">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;color:#6b7280;font-size:12px;text-align:center;">
                &copy; ${new Date().getFullYear()} Bioliz Global Sport. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendCustomerOrderConfirmation(order: EmailOrder) {
  if (!resend || !order.customer_email) return { success: false };

  const deliveryText = order.delivery_quote_pending
    ? "Delivery cost will be quoted by our team after payment."
    : formatCurrency(order.delivery_fee ?? 0);

  const body = `
    <h2 style="margin-top:0;">Thank you for your order, ${order.customer_name}!</h2>
    <p>Your payment has been received and your order is being processed.</p>
    <p><strong>Order number:</strong> ${order.order_number}</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <thead>
        <tr style="border-bottom:2px solid #e5e5e5;">
          <th align="left" style="padding:8px 0;">Item</th>
          <th align="center" style="padding:8px 0;">Qty</th>
          <th align="right" style="padding:8px 0;">Total</th>
        </tr>
      </thead>
      <tbody>${itemList(order.items)}</tbody>
    </table>
    <p><strong>Subtotal:</strong> ${formatCurrency(order.subtotal)}</p>
    <p><strong>Delivery:</strong> ${deliveryText}</p>
    <p style="font-size:16px;"><strong>Total paid:</strong> ${formatCurrency(order.total ?? 0)}</p>
    <p><strong>Delivery address:</strong><br/>${order.delivery_location}</p>
    <p><strong>Phone:</strong> ${formatPhoneNumber(order.customer_phone)}</p>
    <p style="margin-top:24px;">
      <a href="${orderUrl(order)}" style="display:inline-block;padding:12px 24px;background:#ff5a1f;color:#ffffff;text-decoration:none;border-radius:6px;">View order status</a>
    </p>
    <p style="margin-top:24px;font-size:12px;color:#6b7280;">
      Questions? Reply to this email or chat with us on WhatsApp.
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from,
      to: order.customer_email,
      subject: `Order confirmed: ${order.order_number}`,
      html: baseTemplate("Order Confirmed", body),
    });
    return { success: !result.error, error: result.error };
  } catch (err) {
    console.error("sendCustomerOrderConfirmation error:", err);
    return { success: false };
  }
}

export async function sendVendorOrderAlert(order: EmailOrder) {
  if (!resend || !vendorEmail) return { success: false };

  const total = order.total ?? 0;
  const deliveryText = order.delivery_quote_pending
    ? "Other location — quote delivery after payment"
    : `${order.delivery_zone_name ?? "Unknown zone"} (${formatCurrency(order.delivery_fee ?? 0)})`;

  const waNumber = order.customer_phone.replace(/\D/g, "");
  const waLink = `https://wa.me/${waNumber}`;

  const body = `
    <h2 style="margin-top:0;">New paid order</h2>
    <p><strong>Order number:</strong> ${order.order_number}</p>
    <p><strong>Customer:</strong> ${order.customer_name}<br/>
    <strong>Email:</strong> ${order.customer_email ?? "—"}<br/>
    <strong>Phone:</strong> ${formatPhoneNumber(order.customer_phone)}<br/>
    <a href="${waLink}">Message on WhatsApp</a> | 
    <a href="tel:${order.customer_phone}">Call customer</a></p>
    <p><strong>Delivery:</strong> ${order.delivery_location}<br/>
    <strong>Zone:</strong> ${deliveryText}</p>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0;">
      <thead>
        <tr style="border-bottom:2px solid #e5e5e5;">
          <th align="left" style="padding:8px 0;">Item</th>
          <th align="center" style="padding:8px 0;">Qty</th>
          <th align="right" style="padding:8px 0;">Total</th>
        </tr>
      </thead>
      <tbody>${itemList(order.items)}</tbody>
    </table>
    <p style="font-size:16px;"><strong>Total paid:</strong> ${formatCurrency(total)}</p>
    <p style="margin-top:24px;">
      <a href="${siteUrl}/admin/orders" style="display:inline-block;padding:12px 24px;background:#111827;color:#ffffff;text-decoration:none;border-radius:6px;">Open in admin</a>
    </p>
  `;

  try {
    const result = await resend.emails.send({
      from,
      to: vendorEmail,
      subject: `New paid order: ${order.order_number}`,
      html: baseTemplate("New Paid Order", body),
    });
    return { success: !result.error, error: result.error };
  } catch (err) {
    console.error("sendVendorOrderAlert error:", err);
    return { success: false };
  }
}

export async function sendOrderEmails(orderId: string) {
  const admin = createAdminClient();

  // Atomically claim the customer email slot to avoid duplicate sends.
  const { data: customerOrder } = await admin
    .from("orders")
    .update({ customer_email_sent: true })
    .eq("id", orderId)
    .eq("customer_email_sent", false)
    .select("*, items:order_items(*)")
    .single();

  if (customerOrder) {
    const customerResult = await sendCustomerOrderConfirmation(
      customerOrder as EmailOrder
    );
    if (!customerResult.success) {
      // Roll back so a later retry can attempt again.
      await admin
        .from("orders")
        .update({ customer_email_sent: false })
        .eq("id", orderId);
    }
  }

  // Atomically claim the vendor email slot.
  const { data: vendorOrder } = await admin
    .from("orders")
    .update({ vendor_email_sent: true })
    .eq("id", orderId)
    .eq("vendor_email_sent", false)
    .select("*, items:order_items(*)")
    .single();

  if (vendorOrder) {
    const vendorResult = await sendVendorOrderAlert(vendorOrder as EmailOrder);
    if (!vendorResult.success) {
      await admin
        .from("orders")
        .update({ vendor_email_sent: false })
        .eq("id", orderId);
    }
  }
}
