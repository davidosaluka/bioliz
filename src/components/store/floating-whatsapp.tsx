"use client";

import { MessageCircle } from "lucide-react";

export function FloatingWhatsApp({
  whatsappNumber,
}: {
  whatsappNumber?: string | null;
}) {
  if (!whatsappNumber) return null;

  const message = encodeURIComponent(
    "Hello! I have a question about your products."
  );

  return (
    <a
      href={`https://wa.me/${whatsappNumber}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7 fill-current" />
    </a>
  );
}
