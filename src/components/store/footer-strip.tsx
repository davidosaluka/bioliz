export function FooterStrip() {
  return (
    <footer className="border-t border-white/10 px-5 py-8 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>© {new Date().getFullYear()} Bioliz Global Sport</span>
        <span>Train hard. Play better. Repeat.</span>
        <span>Built for the work.</span>
      </div>
    </footer>
  );
}
