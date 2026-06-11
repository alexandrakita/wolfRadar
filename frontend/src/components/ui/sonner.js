"use client";

import { Toaster as Sonner } from "sonner";

import { cn } from "@/lib/utils";

function Toaster({ className, ...props }) {
  return (
    <Sonner
      theme="dark"
      className={cn("toaster group", className)}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card group-[.toaster]:text-foreground group-[.toaster]:border-border/60 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toast]:border-accent/30",
          error: "group-[.toast]:border-destructive/30",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
