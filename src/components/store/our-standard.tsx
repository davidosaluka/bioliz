import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function OurStandard() {
  return (
    <section
      id="story"
      className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8 lg:py-32"
    >
      <div>
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
          Our standard
        </p>
        <h2 className="text-4xl font-black uppercase leading-[0.95] tracking-[-0.06em] sm:text-5xl">
          No shortcuts.
          <br />
          <span className="text-primary">No excuses.</span>
        </h2>
        <p className="mt-6 max-w-sm text-sm leading-6 text-muted-foreground">
          We supply equipment that handles real Nigerian gyms, hotels, clubs and
          home setups. Built for daily use, bulk orders and serious training.
        </p>
        <Link
          href="/about"
          className="mt-8 inline-flex items-center gap-3 text-xs font-black uppercase tracking-[0.15em] text-foreground hover:text-primary"
        >
          Read our story <ArrowRight size={15} />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-card p-6 sm:p-8">
          <p className="text-4xl font-black text-primary">01</p>
          <p className="mt-16 text-sm font-bold uppercase tracking-[0.12em]">
            Tested under pressure
          </p>
        </div>
        <div className="mt-8 rounded-2xl border border-primary/30 bg-primary p-6 text-primary-foreground sm:p-8">
          <p className="text-4xl font-black">02</p>
          <p className="mt-16 text-sm font-bold uppercase tracking-[0.12em]">
            Made to outlast trends
          </p>
        </div>
      </div>
    </section>
  );
}
