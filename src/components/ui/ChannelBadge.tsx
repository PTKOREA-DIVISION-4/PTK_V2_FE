"use client";

import React from "react";
import { Globe, Newspaper } from "lucide-react";

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
  iconSrc?: string;
}

export const CHANNEL_META: Record<ChannelKey, ChannelMeta> = {
  instagram: {
    key: "instagram",
    label: "Instagram",
    bg: "#FDF2F8",
    border: "#FBCFE8",
    text: "#9D174D",
    iconSrc: "/icons/channels/instagram.png",
  },
  youtube: {
    key: "youtube",
    label: "YouTube",
    bg: "#FEF2F2",
    border: "#FECACA",
    text: "#B91C1C",
    iconSrc: "/icons/channels/youtube.png",
  },
  naver_blog: {
    key: "naver_blog",
    label: "네이버 블로그",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#047857",
    iconSrc: "/icons/channels/naver_blog.png",
  },
  naver_cafe: {
    key: "naver_cafe",
    label: "네이버 카페",
    bg: "#F0FDF4",
    border: "#BBF7D0",
    text: "#15803D",
    iconSrc: "/icons/channels/naver_cafe.png",
  },
  naver_datalab: {
    key: "naver_datalab",
    label: "데이터랩",
    bg: "#ECFDF5",
    border: "#A7F3D0",
    text: "#065F46",
    iconSrc: "/icons/channels/naver_datalab.png",
  },
  dcinside: {
    key: "dcinside",
    label: "디시인사이드",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
    iconSrc: "/icons/channels/dcinside.png",
  },
  fmkorea: {
    key: "fmkorea",
    label: "에펨코리아",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1E40AF",
    iconSrc: "/icons/channels/fmkorea.png",
  },
  theqoo: {
    key: "theqoo",
    label: "더쿠",
    bg: "#F5F3FF",
    border: "#DDD6FE",
    text: "#6D28D9",
    iconSrc: "/icons/channels/theqoo.png",
  },
  clien: {
    key: "clien",
    label: "클리앙",
    bg: "#F0FDFA",
    border: "#99F6E4",
    text: "#0F766E",
    iconSrc: "/icons/channels/clien.png",
  },
  news_press: {
    key: "news_press",
    label: "언론 보도",
    bg: "#F5F5F5",
    border: "#D4D4D4",
    text: "#111111",
  },
  perplexity_research: {
    key: "perplexity_research",
    label: "리서치",
    bg: "#ECFEFF",
    border: "#A5F3FC",
    text: "#0E7490",
    iconSrc: "/icons/channels/perplexity_research.png",
  },
  official: {
    key: "official",
    label: "공식 채널",
    bg: "#FFF3EE",
    border: "#F9C8B8",
    text: "#C2410C",
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
  const meta = CHANNEL_META[channelKey];
  if (meta.iconSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={meta.iconSrc}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-[4px] object-contain"
      />
    );
  }
  if (channelKey === "news_press") {
    return <Newspaper style={{ width: size, height: size }} className="shrink-0 text-[#111111]" aria-hidden="true" />;
  }
  return <Globe style={{ width: size, height: size }} className="shrink-0 text-[#E9501F]" aria-hidden="true" />;
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
      className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[6px] border px-2 py-1 text-[12px] font-semibold leading-none"
      style={{
        backgroundColor: meta.bg,
        borderColor: meta.border,
        color: meta.text,
      }}
      title={displayLabel}
    >
      <ChannelGlyph channelKey={key} size={compact ? 14 : 16} />
      <span className="whitespace-nowrap">{displayLabel}</span>
    </span>
  );
}
