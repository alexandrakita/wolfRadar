import { LoginBrandMark } from "@/components/login-brand-mark";

const STATS = [
  { v: "10K+", l: "Tickers" },
  { v: "120+", l: "Filters" },
  { v: "Live", l: "Quotes" },
];

export function LoginMarketingAside() {
  return (
    <section className="hidden lg:block">
      <LoginBrandMark size="desktop" />
      <h1 className="mt-10 text-5xl font-bold leading-tight tracking-tight">
        Screen the market.
        <br />
        <span
          className="bg-clip-text text-transparent"
          style={{ backgroundImage: "var(--gradient-primary)" }}
        >
          Find the signal.
        </span>
      </h1>
      <p className="mt-5 max-w-md text-base text-muted-foreground">
        Real-time filters, watchlists, and analytics across thousands of equities — all in one beautifully fast
        dashboard.
      </p>
      <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
        {STATS.map((s) => (
          <div key={s.l} className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur">
            <div className="text-xl font-semibold">{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
