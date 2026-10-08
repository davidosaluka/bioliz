"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

// Simple in-memory rate limiter for admin login. Replace with Redis for
// multi-instance deployments.
const loginRateLimit = new Map<string, { count: number; resetAt: number }>();

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headersList.get("x-real-ip") ?? "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const limit = 5;

  const entry = loginRateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    loginRateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > limit;
}

export async function login(formData: FormData) {
  const ip = await getClientIp();
  if (isRateLimited(ip)) {
    return { error: "Too many login attempts. Please try again later." };
  }

  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !signInData.user) {
    return { error: error?.message ?? "Login failed" };
  }

  // Verify the signed-in user is in the admins allow-list.
  const { data: adminData, error: adminError } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", signInData.user.id)
    .maybeSingle();

  if (adminError || !adminData) {
    await supabase.auth.signOut();
    return { error: "You are not authorized to access the admin dashboard" };
  }

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function getAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (!admin) return null;

  return user;
}
