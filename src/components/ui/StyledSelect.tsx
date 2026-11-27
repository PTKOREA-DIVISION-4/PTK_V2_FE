"use client";

import React from "react";
import { ChevronDown } from "lucide-react";

interface StyledSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export function StyledSelect({
  wrapperClassName = "",
  className = "",
  children,
  ...rest
}: StyledSelectProps) {
  return (
    <div className={`relative inline-flex shrink-0 items-center ${wrapperClassName}`}>
      <select
        className={`h-9 w-full appearance-none rounded-[8px] border border-[#D4D4D4] bg-white pl-3 pr-8 text-[13px] font-medium text-[#111111] transition-colors hover:border-[#8C8C8C] focus:border-[#111111] focus:outline-none cursor-pointer ${className}`}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4A4A4A]" />
    </div>
  );
}
