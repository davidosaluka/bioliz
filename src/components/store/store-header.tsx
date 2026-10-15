"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X, Dumbbell } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/about", label: "Our Standard" },
  { href: "/contact", label: "Contact" },
];

export function StoreHeader() {
  const [open, setOpen] = useState(false);
  const itemCount = useCart((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  return (
    <header className="relative z-20 border-b border-white/10 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Bioliz Global Sport home">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Dumbbell size={18} strokeWidth={2.5} />
          </span>
          <span className="text-sm font-black uppercase tracking-[0.18em] text-foreground">
            Bioliz<span className="text-primary">.</span>
          </span>
        </Link>

        <nav
          className="hidden items-center gap-8 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground md:flex"
          aria-label="Main navigation"
        >
          <Link className="text-foreground transition-colors hover:text-primary" href="/">
            Home
          </Link>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            className="relative flex size-10 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition hover:border-primary hover:text-primary"
            aria-label={`Shopping bag, ${itemCount} items`}
          >
            <ShoppingCart size={17} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={open ? "Close main menu" : "Open main menu"}
                  aria-expanded={open}
                  className="flex size-10 items-center justify-center rounded-full border border-white/10 md:hidden"
                >
                  {open ? <X size={18} /> : <Menu size={18} />}
                </Button>
              }
            />
            <SheetContent side="right" className="w-72 bg-card">
              <div className="flex flex-col gap-5 border-t border-white/10 px-5 py-6 text-xs font-bold uppercase tracking-[0.14em]">
                <Link
                  href="/"
                  onClick={() => setOpen(false)}
                  className="text-foreground hover:text-primary"
                >
                  Home
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

/*
================================================================================
PREVIOUS STORE HEADER (commented out for easy revert)
================================================================================
"use client";

import Link from "next/link";
import { ShoppingCart, Menu, X } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/quote", label: "Request Quote" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function StoreHeader() {
  const [open, setOpen] = useState(false);
  const itemCount = useCart((state) =>
    state.items.reduce((acc, item) => acc + item.quantity, 0)
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-white">
            BIOLIZ
          </span>
          <span className="hidden text-sm font-medium text-primary sm:inline">
            GLOBAL SPORT
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              }
            />
            <SheetContent side="right" className="w-72 bg-card">
              <div className="flex flex-col gap-6 pt-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-lg font-medium text-foreground hover:text-primary"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
================================================================================
*/
