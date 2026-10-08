import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";

export function HeroSection() {
  return (
    <section
      id="top"
      className="relative isolate min-h-[620px] border-b border-white/10 lg:min-h-[720px]"
    >
      <div className="absolute inset-0 -z-10">
        <Image
          src="/hero-gym-equipment.png"
          alt="Premium gym equipment"
          fill
          priority
          className="object-cover opacity-80"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/85 to-background/15" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/25" />

      <div className="mx-auto flex min-h-[620px] max-w-7xl items-end px-5 pb-16 pt-20 lg:min-h-[720px] lg:items-center lg:px-8 lg:pb-0">
        <div className="max-w-xl">
          <div className="mb-6 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            <span className="h-px w-8 bg-primary" />
            Equipment for the relentless
          </div>
          <h1 className="max-w-2xl text-balance text-6xl font-black uppercase leading-[0.88] tracking-[-0.07em] sm:text-7xl lg:text-8xl">
            Build your
            <br />
            <span className="text-primary">space.</span>
            <br />
            Train harder.
          </h1>
          <p className="mt-7 max-w-md text-sm leading-6 text-muted-foreground">
            Premium gym, snooker, table tennis and sports equipment for homes,
            gyms, hotels, offices and clubs across Nigeria.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-3 rounded-full bg-primary px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-primary-foreground transition hover:bg-primary/85"
            >
              Shop the collection <ArrowRight size={15} />
            </Link>
            <Link
              href="/quote"
              className="inline-flex items-center gap-3 rounded-full border border-white/20 px-6 py-3.5 text-xs font-black uppercase tracking-[0.12em] text-foreground transition hover:border-primary hover:text-primary"
            >
              Request a quote <ChevronRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-7 right-5 hidden items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground lg:flex">
        <span className="size-2 rounded-full bg-primary" />
        Scroll to explore <ArrowRight size={14} />
      </div>
    </section>
  );
}
