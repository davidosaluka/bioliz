"use client";

import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="border-b border-white/10 bg-primary px-5 py-2 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-primary-foreground">
      Pay securely online with Paystack{" "}
      <span className="mx-2 text-primary-foreground/50">/</span> WhatsApp us for bulk pricing
    </div>
  );
}
