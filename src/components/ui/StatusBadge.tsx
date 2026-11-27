"use client";

import React from "react";

type BadgeTone =
  | "teal"
  | "amber"
  | "coral"
  | "slate"
  | "obsidian"
  | "indigo";

const TONE_CLASSES: Record<BadgeTone, string> = {
  teal: "bg-[#F0FAF5] text-[#1F8A5B] border-[#BBE5D0]",
  amber: "bg-[#FFFBEB] text-[#C26B00] border-[#F5D8A8]",
  coral: "bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]",
  slate: "bg-[#F5F5F5] text-[#4A4A4A] border-[#E5E5E5]",
  obsidian: "bg-[#111111] text-white border-[#111111]",
  indigo: "bg-[#FFF3EE] text-[#E9501F] border-[#F9C8B8]",
};

export function StatusBadge({
  tone = "slate",
  dot = false,
  children,
  className = "",
}: {
  tone?: BadgeTone;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const dotColor = {
    teal: "bg-[#1F8A5B]",
    amber: "bg-[#C26B00]",
    coral: "bg-[#DC2626]",
    slate: "bg-[#8C8C8C]",
    obsidian: "bg-white",
    indigo: "bg-[#E9501F]",
  }[tone];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[6px] border px-2 py-1 text-[11px] leading-none font-medium ${TONE_CLASSES[tone]} ${className}`}
    >
      {dot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />}
      {children}
    </span>
  );
}
