# Bioliz Global Sport

Ecommerce storefront for gym equipment, snooker tables, table tennis, sports and recreational equipment. Built with Next.js, Tailwind CSS, shadcn/ui and Supabase.

## Features

- Product catalogue with search, filters and sorting
- Cart persisted to localStorage
- Paystack online checkout (cards, bank transfer, USSD)
- Mobile-first admin dashboard
- Product, category, order and enquiry management
- Client-side image compression

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the local Supabase stack (requires Docker):

```bash
npx supabase start
```

3. Apply migrations and seed data:

```bash
npx supabase db reset
```

4. Create the first admin user:

```bash
node scripts/create-admin.js
```

5. Copy `.env.example` to `.env.local` and fill in the values from `npx supabase status`.

6. Start the Next.js dev server:

```bash
npm run dev
```

## Remote Supabase Project

1. Create a new project at https://supabase.com.
2. Go to the SQL Editor and run the migration file in `supabase/migrations/`.
3. Go to Storage → Buckets and create a public bucket named `product-images`.
4. Set storage policies to allow public read and admin-only write/delete.
5. Create a user in Authentication with email `biolizadmin@biolizglobalsport.com` and password `password`, then insert their UUID into the `admins` table.
6. Copy the project URL, anon key and service role key into `.env.local`.

## Deploy to Netlify

1. Push the code to a GitHub repository.
2. In Netlify, click **Add new site** → **Import an existing project** and select the repo.
3. Set the build command to `npm run build` and publish directory to `.next`.
4. Add the environment variables from `.env.example` in Site settings → Environment variables.
5. Deploy.
6. Update `NEXT_PUBLIC_SITE_URL` to the production URL and redeploy.
7. In GitHub, add a repository variable `SITE_URL` with the production URL so the keep-alive workflow can ping `/api/health`.

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server only) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (server only) |
| `RESEND_API_KEY` | Resend API key (server only) |
| `EMAIL_FROM` | Sender address for order emails |
| `VENDOR_NOTIFY_EMAIL` | Vendor alert email address |
| `CRON_SECRET` | Secret for the expiry cron endpoint |

## Admin Login

Default admin credentials:

- Email: `biolizadmin@biolizglobalsport.com`
- Password: `password`

Change these immediately after first login.

## Vendor Guide

See `VENDOR_GUIDE.md` for instructions on adding products, handling orders and changing settings.
