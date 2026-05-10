import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Stockpillar" },
      { name: "description", content: "Sign in to your Stockpillar stock screener account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/" });
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-10 px-6 py-12 lg:grid-cols-2">
        {/* Brand panel */}
        <section className="hidden lg:block">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-semibold tracking-tight">
              Stock<span className="text-accent">pillar</span>
            </span>
          </div>
          <h1 className="mt-10 text-5xl font-bold leading-tight tracking-tight">
            Screen the market.
            <br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              Find the signal.
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base text-muted-foreground">
            Real-time filters, watchlists, and analytics across thousands of equities — all in one beautifully fast dashboard.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              { v: "10K+", l: "Tickers" },
              { v: "120+", l: "Filters" },
              { v: "Live", l: "Quotes" },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur">
                <div className="text-xl font-semibold">{s.v}</div>
                <div className="text-xs text-muted-foreground">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Card */}
        <section className="mx-auto w-full max-w-md">
          <div
            className="rounded-3xl border border-border/60 p-8 backdrop-blur-xl"
            style={{ background: "var(--gradient-card)", boxShadow: "var(--shadow-card)" }}
          >
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "var(--gradient-primary)" }}>
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Stockpillar</span>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your dashboard.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <a className="text-xs text-muted-foreground hover:text-foreground" href="#">Forgot?</a>
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
              </div>
              <Button
                type="submit"
                className="h-11 w-full rounded-xl text-base font-medium text-primary-foreground hover:opacity-95"
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              New here? <Link to="/" className="text-accent hover:underline">Create an account</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
