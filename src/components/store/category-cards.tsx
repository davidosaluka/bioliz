import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Category } from "@/types";

const categoryIcons = ["01", "02", "03", "04", "05", "06"];

export function CategoryCards({ categories }: { categories: Category[] }) {
  const displayCategories = categories.slice(0, 6);

  return (
    <section id="categories" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            Shop by movement
          </p>
          <h2 className="text-3xl font-black uppercase tracking-[-0.05em] sm:text-4xl">
            Built for your
            <br />
            next personal best.
          </h2>
        </div>
        <Link
          href="/shop"
          className="hidden items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-muted-foreground hover:text-primary sm:flex"
        >
          View all <ArrowRight size={14} />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {displayCategories.map((category, index) => (
          <Link
            key={category.id}
            href={`/category/${category.slug}`}
            className={`group relative min-h-64 overflow-hidden rounded-2xl border border-white/10 bg-card p-6 transition hover:-translate-y-1 hover:border-primary/60 ${
              index === 1 ? "md:translate-y-8" : ""
            }`}
          >
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-primary/10 blur-3xl transition group-hover:bg-primary/25" />
            <span className="relative text-[10px] font-bold text-primary">
              {categoryIcons[index] ?? String(index + 1).padStart(2, "0")}
            </span>
            <div className="relative mt-28 flex items-end justify-between">
              <div>
                <h3 className="text-xl font-black uppercase tracking-[-0.04em]">
                  {category.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {category.description ?? "Explore equipment"}
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-full border border-white/15 transition group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
