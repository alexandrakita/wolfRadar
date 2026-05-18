import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginBrandMark } from "@/components/login-brand-mark";

export function LoginFormCard({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}) {
  return (
    <section className="mx-auto w-full max-w-md">
      <div
        className="rounded-3xl border border-border/60 p-8 backdrop-blur-xl"
        style={{
          background: "var(--gradient-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <div className="mb-8 lg:hidden">
          <LoginBrandMark size="mobile" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
        <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your dashboard.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              className="h-11"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a className="text-xs text-muted-foreground hover:text-foreground" href="#">
                Forgot?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="h-11"
            />
          </div>
          <Button
            type="submit"
            className="h-11 w-full rounded-xl text-base font-medium text-primary-foreground hover:opacity-95"
            style={{
              background: "var(--gradient-primary)",
              boxShadow: "var(--shadow-glow)",
            }}
          >
            Sign in
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link href="/" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </section>
  );
}
