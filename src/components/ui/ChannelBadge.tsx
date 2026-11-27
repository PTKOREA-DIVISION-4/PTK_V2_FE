"use client";

import React from "react";

export type ChannelKey =
  | "instagram"
  | "youtube"
  | "naver_blog"
  | "naver_cafe"
  | "naver_datalab"
  | "dcinside"
  | "fmkorea"
  | "theqoo"
  | "clien"
  | "news_press"
  | "perplexity_research"
  | "official";

interface ChannelMeta {
  key: ChannelKey;
  label: string;
  bg: string;
  border: string;
  text: string;
  glyph: string;
}

export const CHANNEL_META: Record<ChannelKey, ChannelMeta> = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    bg: "#FDF2F8",
    border: "#FBCFE8",
    text: "#9D174D",
    glyph: "IG",
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    bg: "#FEF2F2",
    border: "#FECACA",
    text: "#B91C1C",
    glyph: "YT",
  },
  naver_blog: {
    key: "naver_blog",
    label: "네이버 블로그",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#047857",
    glyph: "B",
  },
  naver_cafe: {
    key: "naver_cafe",
    label: "네이버 카페",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    text: "#15803D",
    glyph: "C",
  },
  naver_datalab: {
    key: "naver_datalab",
    label: "데이터랩",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#065F46",
    glyph: "N",
  },
  dcinside: {
    key: "dcinside",
    label: "디시인사이드",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
    glyph: "DC",
  },
  fmkorea: {
    key: "fmkorea",
    label: "에펨코리아",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1E40AF",
    glyph: "FM",
  },
  theqoo: {
    key: "theqoo",
    label: "더쿠",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    text: "#6D28D9",
    glyph: "Q",
  },
  clien: {
    key: "clien",
    label: "클리앙",
    bg: "#F0FDFA",
    border: "#99F6E4",
    text: "#0F766E",
    glyph: "CL",
  },
  news_press: {
    key: "news_press",
    label: "언론 보도",
    bg: "#F5F5F5",
    border: "#D4D4D4",
    text: "#111111",
    glyph: "NWS",
  },
  perplexity_research: {
    key: "perplexity_research",
    label: "리서치",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    text: "#0E7490",
    glyph: "AI",
  },
  official: {
    key: "official",
    label: "공식 채널",
    bg: "#FFF3EE",
    border: "#F9C8B8",
    text: "#C2410C",
    glyph: "OFF",
  },
};

export function normalizeChannelKey(raw?: string | null): ChannelKey {
  const v = (raw ?? "").trim().toLowerCase();
  if (v.includes("insta") || v === "ig") return "instagram";
  if (v.includes("youtube") || v === "yt" || v.includes("shorts")) return "youtube";
  if (v.includes("blog") || v.includes("블로그")) return "naver_blog";
  if (v.includes("cafe") || v.includes("카페")) return "naver_cafe";
  if (v.includes("datalab") || v.includes("데이터랩") || v === "naver") return "naver_datalab";
  if (v.includes("dcinside") || v.includes("디시")) return "dcinside";
  if (v.includes("fmkorea") || v.includes("에펨")) return "fmkorea";
  if (v.includes("theqoo") || v.includes("더쿠")) return "theqoo";
  if (v.includes("clien") || v.includes("클리앙")) return "clien";
  if (v.includes("news") || v.includes("press") || v.includes("언론") || v.includes("보도")) return "news_press";
  if (v.includes("perplexity") || v.includes("research") || v.includes("리서치")) return "perplexity_research";
  return "official";
}

export function ChannelGlyph({ channelKey, size = 16 }: { channelKey: ChannelKey; size?: number }) {
  if (channelKey === "instagram") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
        <defs>
          <linearGradient id="igGrad" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#F58529" />
            <stop offset="50%" stopColor="#DD2A7B" />
            <stop offset="100%" stopColor="#8134AF" />
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="url(#igGrad)" />
        <rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="2.8" fill="none" stroke="#FFFFFF" strokeWidth="1.8" />
        <circle cx="15.8" cy="8.2" r="1" fill="#FFFFFF" />
      </svg>
    );
  }
  if (channelKey === "youtube") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
        <rect x="1.5" y="4" width="21" height="16" rx="4.5" fill="#DC2626" />
        <polygon points="10,8.5 16.5,12 10,15.5" fill="#FFFFFF" />
      </svg>
    );
  }
  const colorMap: Record<ChannelKey, string> = {
    instagram: "#DD2A7B",
    youtube: "#DC2626",
    naver_blog: "#03C75A",
    naver_cafe: "#029E47",
    naver_datalab: "#03C75A",
    dcinside: "#1D4ED8",
    fmkorea: "#2563EB",
    theqoo: "#7C3AED",
    clien: "#0F766E",
    news_press: "#111111",
    perplexity_research: "#0E7490",
    official: "#E9501F",
  };
  const glyph = CHANNEL_META[channelKey].glyph;
  const fs = glyph.length >= 3 ? 7 : glyph.length === 2 ? 9 : 11;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill={colorMap[channelKey]} />
      <text
        x="12"
        y="12.5"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FFFFFF"
        fontSize={fs}
        fontWeight="800"
        fontFamily="Pretendard, sans-serif"
      >
        {glyph}
      </text>
    </svg>
  );
}

export function ChannelBadge({
  channel,
  labelOverride,
  compact = false,
}: {
  channel?: string | null;
  labelOverride?: string;
  compact?: boolean;
}) {
  const key = normalizeChannelKey(channel);
  const meta = CHANNEL_META[key];
  const displayLabel = labelOverride ?? meta.label;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[6px] border px-2 py-0.5 text-[12px] font-semibold leading-none"
      style={{
        backgroundColor: meta.bg,
        borderColor: meta.border,
        color: meta.text,
      }}
      title={displayLabel}
    >
      <ChannelGlyph channelKey={key} size={compact ? 14 : 15} />
      <span>{displayLabel}</span>
    </span>
  );
}
