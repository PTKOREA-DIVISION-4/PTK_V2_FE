"use client";

import React from "react";
import { FactbookProvider } from "@/lib/store";
import { ToastProvider } from "@/components/ui/ToastProvider";

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <FactbookProvider>{children}</FactbookProvider>
    </ToastProvider>
  );
}
