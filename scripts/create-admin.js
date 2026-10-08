/**
 * Create the first admin user for Bioliz Global Sport.
 *
 * Usage:
 *   node scripts/create-admin.js
 *
 * Environment variables:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Defaults to the local Supabase stack credentials if env vars are not set.
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");

const EMAIL = process.env.ADMIN_EMAIL ?? "biolizadmin@biolizglobalsport.com";
const PASSWORD = process.env.ADMIN_PASSWORD ?? "password";

const URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.VibIuxi9YrLUueaQVZtS5cMWqFKjD4-TRcDiXgc3yvY";

async function main() {
  const admin = createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: existing } = await admin
    .from("admins")
    .select("user_id")
    .limit(1)
    .maybeSingle();

  if (existing) {
    console.log("Admin user already exists.");
    return;
  }

  const { data: user, error: signUpError } = await admin.auth.admin.createUser({
    email: EMAIL,
    password: PASSWORD,
    email_confirm: true,
  });

  if (signUpError || !user.user) {
    console.error("Failed to create user:", signUpError?.message);
    process.exit(1);
  }

  const { error: insertError } = await admin
    .from("admins")
    .insert({ user_id: user.user.id });

  if (insertError) {
    console.error("Failed to add user to admins table:", insertError.message);
    process.exit(1);
  }

  console.log(`Admin created: ${EMAIL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
