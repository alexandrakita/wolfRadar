"use client";

import { Toaster } from "@/components/ui/sonner";

/** Client root wrapper — mounts global toast container (bidmanager ToastContainer equivalent). */
export function RootLayoutClient({ children }) {
  return (
    <>
      {children}
      <Toaster position="top-right" closeButton richColors duration={5000} />
    </>
  );
}
