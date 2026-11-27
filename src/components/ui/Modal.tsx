"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  maxWidthClass = "max-w-2xl",
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/35" onClick={onClose} />
      <div
        className={`relative z-10 w-full ${maxWidthClass} bg-white rounded-[12px] border border-[#E5E5E5] shadow-xl overflow-hidden flex flex-col max-h-[88vh]`}
      >
        <div className="px-6 py-4 bg-white border-b border-[#E5E5E5] flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[17px] font-semibold text-[#111111]">{title}</h2>
            {description && (
              <p className="text-xs text-[#8C8C8C] mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[#8C8C8C] hover:text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white">{children}</div>
        {footer && (
          <div className="px-6 py-3.5 border-t border-[#E5E5E5] bg-[#FAFAFA] flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
