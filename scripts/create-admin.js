/**
 * Create the first admin user for Bioliz Global Sport.
 *
 * WARNING: This script uses the Supabase service-role key and creates a user
 * with full admin privileges. Run it only once in a secure environment.
 *
 * Required environment variables:
 *   ADMIN_EMAIL              - Email address for the first admin
 *   ADMIN_PASSWORD           - Strong password (min 12 chars, mixed case, digit, symbol)
 *   NEXT_PUBLIC_SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service-role key
 *
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='Str0ng!Pass' \
 *     SUPABASE_SERVICE_ROLE_KEY=xxx NEXT_PUBLIC_SUPABASE_URL=xxx \
 *     node scripts/create-admin.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");

function getEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function validatePassword(password) {
  if (password.length < 12) return "Password must be at least 12 characters";
  if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain a digit";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain a symbol";
  return null;
}

const EMAIL = getEnv("ADMIN_EMAIL");
const PASSWORD = getEnv("ADMIN_PASSWORD");
const URL = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = getEnv("SUPABASE_SERVICE_ROLE_KEY");

const passwordError = validatePassword(PASSWORD);
if (passwordError) {
  console.error(`Invalid ADMIN_PASSWORD: ${passwordError}`);
  process.exit(1);
}

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
