"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, LogOut, X } from "lucide-react";

import { SIDEBAR_NAV_ITEMS } from "@/constants/navigation";
import { cn } from "@/lib/utils";

function NavItems({ pathname, collapsed, onNavigate }) {
  return SIDEBAR_NAV_ITEMS.map((item) => {
    const isInternal = item.url.startsWith("/");
    const active =
      isInternal &&
      (item.url === "/"
        ? pathname === "/"
        : pathname === item.url ||
          pathname.startsWith(`${item.url}/`));

    const Cmp = isInternal ? Link : "a";
    const linkProps = isInternal ? { href: item.url } : { href: item.url };

    return (
      <Cmp
        key={item.title}
        {...linkProps}
        {...(isInternal && onNavigate ? { onClick: onNavigate } : {})}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
          active
            ? "text-primary-foreground"
            : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
        )}
        style={
          active
            ? {
                background: "var(--gradient-primary)",
                boxShadow: "var(--shadow-glow)",
              }
            : undefined
        }
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && (
          <span className="truncate">{item.title}</span>
        )}
      </Cmp>
    );
  });
}

/** Shared chrome: logo row + footer */
function SidebarFooter({ collapsed, onLinkClick }) {
  return (
    <div className="border-t border-border/60 p-3">
      <Link
        href="/login"
        onClick={onLinkClick}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary/60 hover:text-foreground"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {!collapsed && <span>Sign out</span>}
      </Link>
    </div>
  );
}

export function AppSidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}) {
  const pathname = usePathname();
  const closeMobile = () => onMobileClose?.();

  const asideChromeClass =
    "flex h-full shrink-0 flex-col border-r border-border/60 bg-card/40 backdrop-blur-xl transition-all duration-300";

  return (
    <>
      {/* Mobile: slide-over + backdrop */}
      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[100] bg-black/50 md:hidden"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <aside
            aria-modal="true"
            role="dialog"
            aria-label="Navigation menu"
            className={cn(
              asideChromeClass,
              "fixed left-0 top-0 z-[101] h-dvh max-h-[100dvh] w-[min(19rem,calc(100vw-3rem))] shadow-xl md:hidden",
            )}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-5">
              <Link
                href="/"
                onClick={closeMobile}
                className="flex flex-1 items-center gap-2 overflow-hidden min-w-0"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                  aria-hidden
                >
                  WR
                </div>
                <span className="truncate text-lg font-semibold tracking-tight">
                  Wolf<span className="text-accent">Radar</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={closeMobile}
                aria-label="Close menu"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6">
              <NavItems
                pathname={pathname}
                collapsed={false}
                onNavigate={closeMobile}
              />
            </nav>
            <SidebarFooter collapsed={false} onLinkClick={closeMobile} />
          </aside>
        </>
      ) : null}

      {/* Desktop */}
      <aside
        className={cn(
          asideChromeClass,
          "sticky top-0 hidden h-screen md:flex md:flex-col",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-5">
          <Link href="/" className="flex min-w-0 items-center gap-2 overflow-hidden">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
              aria-hidden
            >
              WR
            </div>
            {!collapsed && (
              <span className="truncate text-lg font-semibold tracking-tight">
                Wolf<span className="text-accent">Radar</span>
              </span>
            )}
          </Link>
          <button
            type="button"
            onClick={onToggle}
            aria-label="Toggle sidebar width"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-background/40 text-muted-foreground transition hover:text-foreground"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                collapsed && "rotate-180",
              )}
            />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          <NavItems pathname={pathname} collapsed={collapsed} />
        </nav>
        <SidebarFooter collapsed={collapsed} />
      </aside>
    </>
  );
}
