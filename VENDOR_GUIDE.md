# Bioliz Global Sport — Vendor Guide

## 1. Logging into the admin dashboard

1. Go to `https://your-site.netlify.app/admin/login`
2. Enter your admin email and password
3. Default credentials (change these after first login):
   - Email: `biolizadmin@biolizglobalsport.com`
   - Password: `password`

## 2. Adding a new product

1. From the dashboard, click **Products** in the top menu
2. Click **Add Product**
3. Fill in:
   - **Product Name** — required
   - **Slug** — auto-generates from the name; you can edit it
   - **Category** — pick from the dropdown
   - **Short Description** — shown on product cards
   - **Full Description** — shown on the product page
   - **Price** — leave empty and turn on **Price on request** if price is negotiated
   - **Stock Quantity** — set to 0 if out of stock
   - **Track stock** — turn off if the item is always available
4. Upload images: click the file input, select one or more images. The first image becomes the cover.
5. (Optional) Add variants such as size or colour under **Variants**
6. (Optional) Add specifications under **Specifications**
7. Click **Create Product**
8. The product appears on the storefront within about a minute

## 3. Marking stock in or out

### Option A: Edit the product
1. Go to **Products**, click **Edit** on the product
2. Change **Stock Quantity** or turn **Track stock** on/off
3. Click **Update Product**

### Option B: Hide a product
1. Go to **Products**, click **Edit**
2. Turn **Active** off
3. Click **Update Product**

## 4. Handling orders

1. Go to **Orders**
2. Click **View** on an order
3. The order page shows:
   - Customer details
   - Items, subtotal, delivery fee and total paid
   - Payment reference, channel and Paystack transaction ID
   - A link to open the transaction in the Paystack dashboard
4. Use the **Fulfilment status** dropdown to move the order through:
   - **Paid** → payment confirmed
   - **Processing** → you are preparing the order
   - **Out for delivery** → on its way to the customer
   - **Delivered** → order complete
5. If a customer asks to cancel or you need to refund:
   - Click **Cancel or Refund**
   - Refund the customer in the Paystack dashboard first
   - Choose whether to return items to stock
   - Mark the order as **Refunded** or **Cancelled**
6. If an order shows **Needs attention**, review the reason and contact the customer or issue a refund via Paystack.

## 5. Managing delivery zones and fees

1. Go to **Delivery** in the admin menu
2. Edit an existing zone or click **Add Zone**
3. Set the name, areas covered, fee and sort order
4. Turn **Quote after payment** on for locations where you want to call the customer with a delivery cost after they pay
5. Click **Create** or **Update**
6. New fees appear at checkout immediately

## 6. Reading payment statuses

- **Pending** — customer has not paid yet; order expires after 30 minutes
- **Paid** — Paystack has confirmed the payment
- **Failed** — Paystack reported a failed payment attempt
- **Expired** — the 30-minute payment window passed without payment
- **Refunded** — you refunded the customer in Paystack and marked it here

## 7. Changing the WhatsApp number

1. Go to **Settings**
2. Update **WhatsApp Number** in international format, e.g. `2348143309703`
3. Click **Test** to open a WhatsApp chat and confirm it works
4. Click **Save Settings**
5. WhatsApp is now used only for the “Ask on WhatsApp” contact buttons

## 8. Managing enquiries

1. Go to **Enquiries**
2. Read the message and click the customer's phone number to call or message them
3. Change the **Status** to **Handled** when you have responded

## 9. Go-live checklist

Before switching to live payments:

1. Complete Paystack business verification and add a settlement bank account
2. Enable Card, Bank Transfer and USSD in live mode on Paystack
3. Replace `PAYSTACK_SECRET_KEY` and `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` with live keys in your host's environment variables
4. Set the **live webhook URL** in the Paystack dashboard to `https://your-site.netlify.app/api/webhooks/paystack`
5. Verify your custom domain in Resend (if you have one) for customer emails
6. Update `VENDOR_NOTIFY_EMAIL` to the address that should receive order alerts
7. Confirm `NEXT_PUBLIC_SITE_URL` matches your production domain
8. Run a real low-value payment end to end, then refund it from the Paystack dashboard and verify the admin refund flow

## 10. Tips

- **Images:** upload from your phone; they are compressed automatically
- **Out of stock:** customers cannot add out-of-stock items to the cart
- **Price on request:** use this for large items like snooker tables. These products show “Request a Quote” instead of “Add to cart”
- **TEST MODE banner:** when Paystack is in test mode, the admin dashboard shows a visible TEST MODE banner
- **Help:** if something breaks, contact your developer with the order number or product name
