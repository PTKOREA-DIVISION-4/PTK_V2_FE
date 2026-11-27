"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface AsyncActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg";
  loadingText?: string;
  onAction?: () => Promise<unknown> | void;
  isLoading?: boolean;
}

export function AsyncActionButton({
  variant = "primary",
  size = "md",
  loadingText,
  onAction,
  isLoading: externalLoading,
  children,
  className = "",
  disabled,
  onClick,
  ...rest
}: AsyncActionButtonProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const busy = Boolean(externalLoading ?? internalLoading);

  const variantCls = {
    primary:
      "bg-[#111111] text-white hover:bg-[#262626] border border-[#111111]",
    dark: "bg-[#111111] text-white hover:bg-[#262626] border border-[#111111]",
    secondary:
      "bg-white text-[#111111] hover:bg-[#F5F5F5] border border-[#D4D4D4]",
    ghost:
      "bg-transparent text-[#4A4A4A] hover:bg-[#F5F5F5] hover:text-[#111111] border border-transparent",
    danger:
      "bg-white text-[#DC2626] hover:bg-[#FEF2F2] border border-[#FECACA]",
  }[variant];

  const sizeCls = {
    sm: "h-8 px-3 text-xs rounded-[8px] gap-1.5",
    md: "h-9 px-3.5 text-[13px] rounded-[8px] gap-1.5",
    lg: "h-10 px-4.5 text-[13px] rounded-[8px] gap-2",
  }[size];

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (busy || disabled) return;
    if (onClick) onClick(e);
    if (onAction) {
      try {
        setInternalLoading(true);
        await onAction();
      } finally {
        setInternalLoading(false);
      }
    }
  };

  return (
    <button
      type={rest.type || "button"}
      disabled={busy || disabled}
      onClick={handleClick}
      className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium transition-colors cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${variantCls} ${sizeCls} ${className}`}
      {...rest}
    >
      {busy ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>{loadingText ?? children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
