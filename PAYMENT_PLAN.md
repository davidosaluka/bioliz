# ADDENDUM PLAN: Full Paystack Checkout (replaces WhatsApp checkout)

> **Instructions to the AI agent:** This plan modifies the existing store built from `BUILD_PLAN.md` (Next.js + TypeScript + Tailwind + Supabase). **Start with Phase 0 (audit)** and adapt table, file and function names below to what actually exists in the codebase. Complete each phase's acceptance criteria before moving on. Commit after each phase. Build and test entirely in **Paystack test mode** until the go-live phase.

---

## 1. What Changes

**Before:** Checkout → save order → redirect to WhatsApp → payment agreed in chat.
**After:** Checkout → save order as `pending_payment` → redirect to Paystack hosted checkout → customer pays → webhook confirms payment → order becomes `paid`, stock is reduced, emails are sent → customer lands on a confirmation and receipt page.

WhatsApp stays only as a **secondary contact option**: an "Ask about this on WhatsApp" button on product pages, the contact page, and the floating button. It is no longer part of checkout.

---

## 2. Decisions Already Made

| Topic | Decision |
|---|---|
| Gateway | **Paystack** (hosted checkout via `transaction/initialize`, redirect flow) |
| Methods | Card, bank transfer, USSD (all enabled in the Paystack dashboard; no custom card form, so no PCI burden on us) |
| Payment amount | **Full payment only.** No deposits or part-payments |
| Currency | NGN. Amounts sent to Paystack in **kobo** (`Math.round(total * 100)`) |
| Price on request products | **Cannot be added to cart.** They show "Request a Quote / Ask on WhatsApp" instead |
| Delivery | Admin-managed **delivery zones with fees**, plus an "Other location: delivery quoted after payment" option |
| Installation / assembly | Not offered. Show an informational note only |
| Customer accounts | **Guest checkout only.** Order lookup by order number + email or phone |
| Emails | Customer confirmation and vendor alert via **Resend** |
| Refunds | Processed manually by the vendor in the Paystack dashboard, then marked `refunded` in our admin |
| Stock | Reduced **only after confirmed payment**. Unpaid orders auto-expire after **30 minutes** |
| Invoices | Simple printable receipt page. No VAT calculation |
| Fees | Paystack's processing fee is absorbed by the vendor (deducted from settlement). Do not add a surcharge |

---

## 3. Important Notes and Constraints

1. **Paystack live mode requires business verification and a settlement account.** Build and test in test mode now. Keys: use `sk_test_...` / `pk_test_...` until verification is complete, then swap to `sk_live_...` / `pk_live_...` via environment variables only.
2. **Resend email needs a verified domain to email customers.** Without a verified sending domain, Resend only delivers to the account owner's own address. A free `*.netlify.app` or `*.vercel.app` domain cannot be verified. Until the client has a custom domain: (a) Paystack automatically emails its own payment receipt to the customer, which covers the basics, and (b) the vendor alert can go to the vendor's own email. Make the `from` address an environment variable (`EMAIL_FROM`) and make email sending fail gracefully (log, never break the order).
3. **A public URL is needed for webhooks.** For local testing use a tunnel (ngrok or Cloudflare Tunnel). Test and live modes have **separate webhook URLs** configured in the Paystack dashboard.
4. **Customers must provide an email address**, because Paystack requires one to initialise a transaction. Make `email` a required checkout field.
5. **Large-ticket items** (snooker tables, treadmills) may exceed card limits for some customers' banks. Keep **bank transfer** enabled and show a short hint at checkout: "Paying a large amount? Choose Bank Transfer."
6. Paystack/compliance teams commonly expect clear business policy pages before approving a live account. Add the policy pages in Phase 7.
7. Never trust browser redirects as proof of payment. **Only the webhook or a server-side `verify` call confirms payment.**

---

## 4. Database Changes (new migrations)

> Postgres cannot use a newly added enum value in the same transaction that adds it. Put `ALTER TYPE ... ADD VALUE` statements in their **own migration file**, before any migration that uses them.

### 4.1 Order status values
Extend `order_status` with: `pending_payment`, `paid`, `processing`, `out_for_delivery`, `delivered`, `expired`, `refunded`. Keep `cancelled`. Existing legacy values (`new`, `contacted`, `confirmed`, `completed`) may remain for old rows but are no longer selectable in the admin UI for new orders. Set the default for new orders to `pending_payment`.

### 4.2 New columns on `orders`
```sql
alter table orders
  add column customer_email text,
  add column delivery_zone_id uuid,
  add column delivery_zone_name text,            -- snapshot
  add column delivery_fee numeric(12,2) default 0,
  add column delivery_quote_pending boolean default false,
  add column total numeric(12,2),                -- subtotal + delivery_fee
  add column payment_status text not null default 'pending',  -- pending | paid | failed | expired | refunded
  add column paid_at timestamptz,
  add column expires_at timestamptz,             -- created_at + 30 minutes
  add column public_token uuid not null default gen_random_uuid(),  -- unguessable link for the customer
  add column needs_attention boolean default false,
  add column attention_reason text,
  add column stock_deducted boolean default false,
  add column customer_email_sent boolean default false,
  add column vendor_email_sent boolean default false;
create index on orders (status, expires_at);
```
Remove `has_price_on_request` usage from checkout (price-on-request items can no longer be in an order). Make `customer_email` required for new orders at the application and validator level.

### 4.3 `delivery_zones`
```sql
create table delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,                       -- e.g. "Lagos Island", "Lagos Mainland"
  description text,                         -- e.g. "Ikoyi, VI, Lekki Phase 1"
  fee numeric(12,2) not null default 0,
  quote_after_payment boolean default false,-- the "Other location" option; fee is 0 and flagged
  is_active boolean default true,
  sort_order int default 0
);
```
Seed: Lagos Island, Lagos Mainland, Ajah/Lekki-Epe corridor (placeholder fees), and one `quote_after_payment` zone named "Other location (delivery quoted after payment)". **Fees are `[CLIENT INPUT]`**; the vendor edits them in the admin.

### 4.4 `payments` and `webhook_events`
```sql
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  reference text not null unique,           -- we use the order_number as the Paystack reference
  provider text default 'paystack',
  amount numeric(12,2) not null,            -- in naira
  currency text default 'NGN',
  status text not null default 'pending',   -- pending | success | failed | abandoned
  channel text,                             -- card | bank_transfer | ussd ...
  paystack_transaction_id text,
  authorization_url text,
  raw jsonb,                                -- last verified payload
  paid_at timestamptz,
  created_at timestamptz default now()
);

create table webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text default 'paystack',
  event_key text not null unique,           -- e.g. "<event>:<data.id or reference>" for idempotency
  event_type text,
  payload jsonb,
  processed_at timestamptz default now()
);
```

### 4.5 RLS
Enable RLS on both new tables and `delivery_zones`:
- `delivery_zones`: public SELECT where `is_active`; admin ALL.
- `payments`, `webhook_events`: **no public access**; admin SELECT only. Written only by server code using the service-role key.
- `orders` / `order_items` stay admin-only. Customers read their own order **only through server code** that checks `public_token` or the order-number + email/phone lookup.

### 4.6 Postgres functions (transactional, `security definer`, executable only by service role)
1. `mark_order_paid(p_order_id uuid, p_reference text, p_amount numeric, p_channel text, p_txn_id text, p_raw jsonb)`:
   - Lock the order row (`for update`). If `payment_status = 'paid'`, return (idempotent).
   - Update the `payments` row to `success`; set the order's `payment_status = 'paid'`, `status = 'paid'`, `paid_at`.
   - Attempt stock deduction for every `order_items` row (variant stock if `variant_id` is set, otherwise product stock; skip when `track_stock = false`). Use `update ... set stock_quantity = stock_quantity - qty where id = ... and stock_quantity >= qty`.
   - If **any** line cannot be fully deducted: roll back only the stock part for that order (or deduct what is possible, but be consistent), set `needs_attention = true` with `attention_reason = 'Insufficient stock after payment: refund or restock'`. The order stays `paid`. Never silently drop a paid order.
   - Set `stock_deducted = true` when fully deducted.
2. `expire_unpaid_orders()`: marks `pending_payment` orders where `expires_at < now()` as `expired` (payment_status `expired`). See Phase 6 for the Paystack re-check.
3. `restore_order_stock(p_order_id uuid)`: adds stock back if `stock_deducted = true`, then sets `stock_deducted = false`. Used when a paid order is cancelled or refunded.

Add `pg_cron` (available on Supabase free tier) to run `expire_unpaid_orders()` every 10 minutes. If `pg_cron` is unavailable, use a GitHub Actions scheduled workflow calling a secured `/api/cron/expire-orders` route (`Authorization: Bearer $CRON_SECRET`).

---

## 5. Environment Variables (add to `.env.example`)

```
PAYSTACK_SECRET_KEY=            # sk_test_... now, sk_live_... later. SERVER ONLY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=# only needed if popup is used later; redirect flow does not need it
RESEND_API_KEY=
EMAIL_FROM=                     # e.g. "Store Name <orders@yourdomain.com>" once domain verified
VENDOR_NOTIFY_EMAIL=            # vendor alert recipient
CRON_SECRET=
NEXT_PUBLIC_SITE_URL=           # used for the Paystack callback URL
```
The secret key must never be logged, committed, or exposed to the browser.

---

## 6. Core Payment Logic

### 6.1 `createOrder` server action (modify existing)
1. Validate input with zod: name, **email**, phone (Nigerian format), delivery address/area, delivery zone id, optional notes, honeypot.
2. Re-fetch every cart product/variant from the DB. Reject: inactive, out of stock, insufficient quantity, or `price_on_request` items (return a clear error naming the item).
3. Fetch the selected delivery zone from the DB (never trust a fee sent from the client). Compute `subtotal`, `delivery_fee`, `total = subtotal + delivery_fee`. If the zone has `quote_after_payment`, `delivery_fee = 0` and `delivery_quote_pending = true`.
4. Generate `order_number` (existing format). Insert `orders` (`status = 'pending_payment'`, `expires_at = now() + 30 min`) and `order_items` with snapshots. Insert a `payments` row (`reference = order_number`, `status = 'pending'`).
5. Call Paystack **Initialize Transaction** (`POST https://api.paystack.co/transaction/initialize`, `Authorization: Bearer <secret>`) with:
   - `email`, `amount` (kobo, integer), `currency: "NGN"`, `reference: order_number`
   - `callback_url: ${SITE_URL}/order/${order_number}?token=${public_token}`
   - `metadata: { order_id, order_number, customer_name, phone }`
6. Save `authorization_url` on the payment row. Return `{ authorizationUrl }`. The client **redirects** to it (`window.location.href`) and clears the cart only after the redirect is triggered (or, safer, clears it when the confirmation page loads with a paid status; see below).
7. If Paystack initialise fails: mark the order `failed`/`expired`, return a friendly error, and do not leave a dangling pending order. Never expose Paystack error internals to the customer.

Rate limit this action (existing limiter) and keep the honeypot.

### 6.2 Callback / confirmation page `/order/[orderNumber]?token=...`
- Server-side: look up the order by `order_number` **and** `public_token`. Wrong token → 404.
- If the order is still `pending_payment`, call Paystack **Verify** (`GET /transaction/verify/:reference`). If `data.status === 'success'` and the amount and currency match the order total, call `mark_order_paid`. This makes the page correct even if the webhook is delayed. (Same function as the webhook, so it is idempotent.)
- Render states: **Paid** (receipt summary, "what happens next", delivery note, print button), **Pending** (bank transfer awaiting confirmation: auto-refresh/poll every 5 seconds for up to 2 minutes with a "Check status" button), **Failed/Abandoned** (a "Try payment again" button that re-uses the stored `authorization_url` or re-initialises if expired, if the order has not expired), **Expired** (explain and link back to the shop).
- Clear the local cart when the status is `paid`.

### 6.3 Webhook `/api/webhooks/paystack` (POST)
1. Read the **raw body** (do not parse before verifying). Compute `HMAC SHA512(rawBody, PAYSTACK_SECRET_KEY)` and compare to the `x-paystack-signature` header using a **timing-safe comparison**. Invalid → `401`, no processing.
2. Parse JSON. Build `event_key`; insert into `webhook_events`. On unique-violation (duplicate delivery) → return `200` immediately.
3. Handle `charge.success`: find the order by `data.reference`. **Verify** `data.amount === order.total * 100` (kobo) and `data.currency === 'NGN'`. On mismatch → set `needs_attention = true` with a reason, do not mark paid, log it, still return `200`.
4. If valid, optionally confirm with the Verify API, then call `mark_order_paid`. This must also work for an order already `expired` (customer paid late via bank transfer): mark it paid, attempt stock deduction, and flag `needs_attention` if stock is short.
5. Handle `charge.failed` (if sent) and refund events (`refund.processed`) by updating `payments`/order status where relevant. Unknown events: store and return `200`.
6. After a successful payment, trigger emails (section 6.5). Respond `200` quickly; keep heavy work minimal. Email failures must not cause a non-200 response.
7. Add a route-level config so the body is not parsed/modified by the framework.

### 6.4 Guest order lookup `/order/track`
Form: order number + (email **or** phone). Server-side match, with rate limiting and a generic "not found" message (do not reveal whether an order number exists). On success, redirect to the order page with its token. Link to this page from the footer and confirmation emails.

### 6.5 Emails (Resend)
- **Customer, order confirmed:** order number, items, subtotal, delivery fee (or "Delivery will be quoted by our team"), total, delivery address, link to the order page, store contact info.
- **Vendor, new paid order:** order number, customer details, items, total, delivery zone, a flag if `delivery_quote_pending` or `needs_attention`, link to the admin order, and a `wa.me` link to message the customer.
- Use simple, mobile-friendly HTML templates. Use the `customer_email_sent` / `vendor_email_sent` flags so retried webhooks never send duplicates.

---

## 7. Storefront Changes

- **Product page / cards:** `price_on_request` products show **"Request a Quote"** (links to `/quote`) and **"Ask on WhatsApp"**; the Add to Cart button is hidden.
- **Cart:** on load, purge any cart lines for products that are now `price_on_request`, inactive, or out of stock, with a visible notice. Remove the old "price on request" note.
- **Checkout page:** fields: name, **email**, phone, delivery zone selector (shows fee), delivery address, notes. Order summary with subtotal, delivery fee, total. Primary button: **"Pay ₦X,XXX,XXX"**. Show secure-payment text ("Payments are processed securely by Paystack. We never see your card details."), accepted methods, and the bank-transfer hint for large amounts. If the zone is "Other location", show: "We'll contact you after payment with the delivery cost."
- Remove all WhatsApp-redirect checkout code. Keep `lib/whatsapp.ts` for the secondary buttons only (update its tests).
- **Copy updates:** replace "Shop Now Via Our Check Out Page / get in touch for pricing" language with copy appropriate to online ordering; update the "How it works" section (Browse → Pay securely online → We confirm and deliver). Keep WhatsApp mentioned as "Questions? Chat with us."
- **Policy pages:** `/terms`, `/privacy`, `/refund-policy` (returns, cancellations, refunds), `/delivery-policy` (delivery zones, timelines, heavy items, no installation service). Draft sensible placeholder text and mark `[CLIENT TO REVIEW]`. Link in the footer and on the checkout page ("By paying you agree to our Terms").
- **Receipt:** printable receipt view (print stylesheet) on the order page. No VAT line.

---

## 8. Admin Dashboard Changes

- **Orders list:** columns for order number, customer, total, **payment status badge**, **fulfilment status**, date. Filters: payment status, fulfilment status, "Needs attention". Default view hides `pending_payment`/`expired` (with a toggle to show them).
- **Order detail:** customer info, items, subtotal, delivery fee/zone, total, payment info (reference, channel, paid time, Paystack transaction ID), a "Needs attention" banner with its reason, `wa.me` and `tel:` buttons to contact the customer, admin notes.
- **Fulfilment workflow** (only for `paid` orders): `paid → processing → out_for_delivery → delivered`. Cancel and Refund actions with a confirm dialog:
  - **Cancel/Refund a paid order:** prompt "Did you refund the customer in Paystack?" and "Return items to stock?" (calls `restore_order_stock` if yes). Set status `refunded` or `cancelled` accordingly. Show a link/instruction to open the transaction in the Paystack dashboard.
- **Delivery zones page:** add, edit fees, reorder, enable/disable, mark one as "quote after payment".
- **Dashboard overview:** add paid-order count and revenue (paid orders only, today / 7 days / 30 days), a "Needs attention" count, and the low-stock list. Show a visible **"TEST MODE"** banner in admin when `PAYSTACK_SECRET_KEY` starts with `sk_test`.
- **Settings:** keep WhatsApp number, store details and email. Remove anything about WhatsApp checkout.
- **Payments log (read-only):** list of payments with status and reference for reconciliation.
- Revalidate storefront pages after stock changes (existing mechanism).

---

## 9. Expiry and Reconciliation

- Scheduled job (every 10 minutes) targets orders with `status = 'pending_payment'` and `expires_at < now()`.
- **Before expiring**, for each such order call Paystack Verify (server-side job/route). If it succeeded (for example a late bank transfer), run `mark_order_paid`; otherwise mark `expired`. Implement this as a secured API route (`/api/cron/reconcile`) invoked by the scheduler, and keep the SQL `expire_unpaid_orders()` as the final fallback for cleanup.
- Daily reconciliation view in admin: any `paid` order lacking a `success` payment row, or any `success` payment on a non-paid order, is surfaced under "Needs attention".

---

## 10. Security Checklist

- Verify the webhook signature with a timing-safe compare on the raw body. Reject otherwise.
- Verify amount and currency against the order total before marking paid.
- Idempotency: unique `webhook_events.event_key`, unique `payments.reference`, `mark_order_paid` is safe to call twice.
- Never mark paid based on the redirect/callback query alone. Always verify with Paystack.
- Prices and delivery fees are always computed server-side from the DB.
- Customer order pages require the unguessable `public_token`. Tracking has rate limiting and generic errors.
- Secrets only in server env. Add a check that `PAYSTACK_SECRET_KEY` never appears in client bundles (search the build output).
- Log payment events with order number only. Do not log full card data (we never receive it), secret keys, or full payloads containing personal data beyond what's needed.
- Keep the security headers/CSP compatible with the redirect to `checkout.paystack.com` (a full-page redirect needs no CSP changes; if the inline popup is added later, allow `js.paystack.co` and `checkout.paystack.com`).

---

## 11. Phased Build Plan with Acceptance Criteria

### Phase 0: Audit and prep
- Read the existing code. List the files and functions that must change (checkout, `createOrder`, `whatsapp.ts` usage, order statuses, admin orders, product/cart components).
- Human tasks (list them for the human): create a Paystack account, enable Card, Bank Transfer and USSD, copy test keys, create a Resend account, configure env vars.
- **Accept:** a written change list exists, and test keys are present in `.env.local`.

### Phase 1: Database
- Write the migrations in section 4 (enum additions in their own file), the three Postgres functions, RLS, delivery zone seed, and the `pg_cron` job.
- **Accept:** migrations apply cleanly on a fresh DB and on the existing one. Calling `mark_order_paid` twice on the same order deducts stock once. An anon client cannot read `payments` or `webhook_events`.

### Phase 2: Cart, price-on-request and checkout UI
- Implement the storefront changes in section 7 (excluding payment calls): the email field, delivery zone selector, totals, and price-on-request handling.
- **Accept:** price-on-request items cannot be added to the cart. The checkout shows the correct delivery fee and total. The "Other location" option shows the quote-after-payment message.

### Phase 3: Initialise payment and confirmation page
- Modify `createOrder`, integrate Paystack initialise, build the redirect, the `/order/[orderNumber]` page (verify call, all states), and the retry flow.
- **Accept:** in test mode, clicking Pay opens Paystack checkout with the correct amount. A successful test payment returns to the confirmation page showing **Paid**. Tampering with the amount, fee, or items in the browser has no effect on what is charged. An abandoned payment shows a retry option.

### Phase 4: Webhook and payment processing
- Build `/api/webhooks/paystack` per section 6.3 and wire `mark_order_paid`. Test with a tunnel and the test-mode webhook URL.
- **Accept:** a payment with the browser closed immediately after paying still results in a `paid` order and reduced stock via the webhook alone. Replaying the same webhook does nothing the second time. A request with a bad signature gets `401`. An amount mismatch flags the order and does not mark it paid. Two buyers paying for the last unit result in one clean order and one `needs_attention` order.

### Phase 5: Emails and guest tracking
- Implement Resend templates, the idempotent send flags, `/order/track`, and the printable receipt.
- **Accept:** a paid test order produces exactly one customer email and one vendor email even if the webhook is delivered twice. A failure to send does not break payment processing. The tracking page works with order number + email, and with order number + phone, and rejects wrong combinations generically.

### Phase 6: Admin updates, expiry and reconciliation
- Implement the admin changes in section 8 and the expiry/reconcile jobs in section 9.
- **Accept:** an unpaid order older than 30 minutes becomes `expired`, **except** one whose payment actually succeeded, which becomes `paid`. Cancelling/refunding a paid order with "return to stock" restores stock exactly once. The admin shows the TEST MODE banner in test mode. The vendor can change delivery zone fees and see them at checkout immediately.

### Phase 7: Policies, copy and polish
- Add the policy pages, update marketing copy, footer links, order and error states. Re-run Lighthouse on the checkout and product pages.
- **Accept:** no remaining references to WhatsApp checkout. All policy pages are linked from the footer and the checkout. Lighthouse mobile score is 85 or higher on home and product pages.

### Phase 8: Full test pass (test mode)
Run every scenario below using Paystack's documented test cards and test bank-transfer simulation (see Paystack docs; do not hardcode card numbers from memory):

1. Successful card payment. 2. Declined card. 3. Abandoned payment (close the tab). 4. Bank transfer paid late (after the order page shows pending). 5. Webhook delivered twice. 6. Invalid webhook signature. 7. Amount mismatch. 8. Last item bought by two customers. 9. Order expiry after 30 minutes. 10. Late payment on an expired order. 11. Refund flow in admin with and without stock return. 12. "Other location" delivery quoted after payment. 13. Guest tracking with right and wrong details. 14. Mobile (360 px) and slow 4G run-through.

- **Accept:** all 14 scenarios behave as described, with no unhandled errors in the logs.

### Phase 9: Go-live
- Human tasks: complete Paystack business verification and add the settlement account; confirm the account-name rules with Paystack support; enable the needed payment channels in live mode; set the **live webhook URL** in the Paystack dashboard; add the live keys to the host's environment variables; verify the Resend domain if a custom domain exists.
- Agent tasks: confirm that no test keys remain in production env, remove the TEST MODE banner automatically (key-prefix based), and run a real low-value payment (for example ₦100 product) end to end, then refund it from the Paystack dashboard and verify the admin refund flow.
- Write a one-page **vendor guide** (updating the existing one): how to read payment statuses, fulfil orders, handle "Needs attention", set delivery fees, refund via Paystack and mark the order refunded, and where to see settlements in the Paystack dashboard.
- **Accept:** a real live payment is received, the order shows `paid`, stock reduces, both emails (or Paystack's receipt plus the vendor alert) arrive, and the refund flow works.

---

## 12. Inputs Needed from the Client `[CLIENT INPUT]`

- Paystack business verification documents and a settlement bank account (see the account-name rules)
- Delivery zones and fees, and typical delivery timelines
- Vendor email for order alerts
- Refund, return and cancellation policy wording (or approval of the placeholder text)
- A custom domain (strongly recommended, for customer emails and credibility)
- Confirmation of any per-transaction limits they want to communicate for large items
