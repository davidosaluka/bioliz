import { getCategories, getFeaturedProducts } from "@/lib/data";
import { HeroSection } from "@/components/store/hero-section";
import { CategoryCards } from "@/components/store/category-cards";
import { FeaturedProductsGrid } from "@/components/store/featured-products-grid";
import { OurStandard } from "@/components/store/our-standard";
import { ShoppingBag, CreditCard, Truck } from "lucide-react";

export default async function HomePage() {
  const [categories, featured] = await Promise.all([
    getCategories(),
    getFeaturedProducts(6),
  ]);

  return (
    <>
      <HeroSection />
      <CategoryCards categories={categories} />
      <FeaturedProductsGrid products={featured} />

      <section className="border-y border-border/50 bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            How It Works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-white">1. Browse</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Find the equipment you need from our catalogue.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <CreditCard className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-white">2. Pay securely online</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Checkout with Paystack by card, bank transfer or USSD.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-white">3. We confirm and deliver</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We confirm your order and arrange delivery to your address.
              </p>
            </div>
          </div>
        </div>
      </section>

      <OurStandard />
    </>
  );
}

/*
================================================================================
PREVIOUS BIOLIZ HOMEPAGE (commented out for easy revert)
================================================================================
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCategories, getFeaturedProducts, getSiteSettings } from "@/lib/data";
import { ProductGrid } from "@/components/store/product-grid";
import { ArrowRight, MessageCircle, ShoppingBag, Truck } from "lucide-react";

const supplyTo = [
  "Home Gyms",
  "Commercial Gyms",
  "Hotels",
  "Offices",
  "Clubs",
  "Game Rooms",
];

export default async function HomePage() {
  const [settings, categories, featured] = await Promise.all([
    getSiteSettings(),
    getCategories(),
    getFeaturedProducts(8),
  ]);

  return (
    <>
      <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            {settings?.hero_title ?? "BUILD YOUR SPACE."}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            {settings?.hero_subtitle ??
              "Gym equipment, snooker tables, table tennis, sports and recreational gear for homes, gyms, hotels, offices and clubs across Nigeria."}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/shop">
              <Button
                size="lg"
                className="min-w-[180px] bg-primary text-primary-foreground hover:bg-brand-dark"
              >
                Shop Now
              </Button>
            </Link>
            <Link href="/quote">
              <Button
                size="lg"
                variant="outline"
                className="min-w-[180px] border-white/20 hover:bg-white/5"
              >
                Request a Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Shop by Category
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group relative overflow-hidden rounded-xl border border-border/50 bg-background p-6 transition-colors hover:border-primary/30"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Featured Products
            </h2>
            <Link
              href="/shop"
              className="text-sm font-medium text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="mt-8">
            <ProductGrid products={featured} />
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            Who We Supply
          </h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {supplyTo.map((item) => (
              <span
                key={item}
                className="rounded-full border border-border/50 bg-background px-5 py-2 text-sm font-medium text-muted-foreground"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">
            How It Works
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-flex mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-white">1. Browse</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Find the equipment you need from our catalogue.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-flex mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-white">2. Checkout</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add to cart and send your order via WhatsApp.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-flex mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-white">3. Chat With Us</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We confirm pricing, availability and delivery on WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
================================================================================
*/
