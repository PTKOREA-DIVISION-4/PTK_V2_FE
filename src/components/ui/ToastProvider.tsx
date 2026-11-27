"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

interface ToastItem {
  id: string;
  tone: "success" | "info" | "warning" | "error";
  title: string;
  description?: string;
}

interface ToastContextValue {
  pushToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3400);
  }, []);

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 w-80 pointer-events-none">
        {toasts.map((t) => {
          const icon =
            t.tone === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-[#1F8A5B] shrink-0 mt-0.5" />
            ) : t.tone === "error" ? (
              <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0 mt-0.5" />
            ) : t.tone === "warning" ? (
              <Info className="h-4 w-4 text-[#C26B00] shrink-0 mt-0.5" />
            ) : (
              <Info className="h-4 w-4 text-[#111111] shrink-0 mt-0.5" />
            );
          return (
            <div
              key={t.id}
              className="pointer-events-auto bg-white border border-[#D4D4D4] rounded-[10px] shadow-md px-4 py-3 flex items-start gap-3"
            >
              {icon}
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-[#111111]">{t.title}</p>
                {t.description && (
                  <p className="text-xs text-[#4A4A4A] mt-0.5">{t.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(t.id)}
                className="text-[#8C8C8C] hover:text-[#111111] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
