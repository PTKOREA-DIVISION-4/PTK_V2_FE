"use client";

import React from "react";
import {
  ArrowRight,
  ExternalLink,
  Link2,
} from "lucide-react";
import {
  DataLabSosBarChart,
  DataLabTrendChart,
  HorizontalDataBarChart,
  MarketingHeatmapChart,
  PressBrandCompareChart,
  PressMonthlyChart,
  PriceDiscountChart,
  VocSentimentChart,
} from "@/components/visuals/FactbookCharts";
import {
  ChannelBadge,
  ChannelGlyph,
  normalizeChannelKey,
} from "@/components/ui/ChannelBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { resolveMediaUrl } from "@/lib/api";
import {
  SECTION_LABELS,
  type ProjectBundle,
  type SlideDraft,
  type SlideReviewStatus,
} from "@/lib/types";

function getSlideStatusBadge(status: SlideReviewStatus) {
  if (status === "APPROVED") {
    return { tone: "teal" as const, label: "확정" };
  }
  if (status === "COMMENT_APPLIED") {
    return { tone: "indigo" as const, label: "AI 반영" };
  }
  return { tone: "amber" as const, label: "초안" };
}

function formatUrlHost(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.hostname.replace(/^www\./, "")} ↗`;
  } catch {
    return "출처 링크 ↗";
  }
}

function isHttpUrl(text: string): boolean {
  const t = text.trim();
  return t.startsWith("http://") || t.startsWith("https://");
}

function isRecognizedChannelLabel(text: string): boolean {
  const lower = text.trim().toLowerCase();
  return (
    lower.includes("insta") ||
    lower.includes("youtube") ||
    lower.includes("blog") ||
    lower.includes("cafe") ||
    lower.includes("dcinside") ||
    lower.includes("fmkorea") ||
    lower.includes("theqoo") ||
    lower.includes("clien") ||
    lower.includes("news") ||
    lower.includes("perplexity") ||
    lower.includes("datalab") ||
    lower.includes("블로그") ||
    lower.includes("카페") ||
    lower.includes("더쿠") ||
    lower.includes("디시") ||
    lower.includes("에펨")
  );
}

export function SlideCanvas({
  slide,
  bundle,
  compact = false,
  onSelectFact,
}: {
  slide: SlideDraft;
  bundle: ProjectBundle;
  compact?: boolean;
  onSelectFact?: (factId: string) => void;
}) {
  const statusBadge = getSlideStatusBadge(slide.review_status);

  const collabLabel = `${bundle.project.brand_name} 협업`;
  const snsAssets = slide.visual_assets.filter((a) => a.asset_type === "SNS_TOP5_CARD");
  const chartAssets = slide.visual_assets.filter((a) => a.asset_type !== "SNS_TOP5_CARD");

  const snsPostsForSlide = React.useMemo(() => {
    if (slide.slide_type === "OWN_INSTAGRAM_TOP5") {
      return bundle.sns_top_posts
        .filter(
          (p) =>
            p.owner_type === "OWN" &&
            p.platform.toUpperCase() === "INSTAGRAM" &&
            p.brand_label !== collabLabel
        )
        .slice(0, 5);
    }
    if (slide.slide_type === "OWN_YOUTUBE_TOP5") {
      return bundle.sns_top_posts
        .filter(
          (p) =>
            p.owner_type === "OWN" &&
            p.platform.toUpperCase() === "YOUTUBE" &&
            p.brand_label !== collabLabel
        )
        .slice(0, 5);
    }
    if (slide.slide_type === "OWN_SNS_TOP5") {
      return bundle.sns_top_posts
        .filter((p) => p.owner_type === "OWN" && p.brand_label !== collabLabel)
        .slice(0, 5);
    }
    if (slide.slide_type === "COMPETITOR_SNS_TOP5") {
      return bundle.sns_top_posts
        .filter((p) => p.owner_type === "COMPETITOR" && p.brand_label !== collabLabel)
        .slice(0, 5);
    }
    return [];
  }, [bundle.sns_top_posts, collabLabel, slide.slide_type]);

  const isDivider = slide.slide_type === "SECTION_DIVIDER";
  const isIndex = slide.slide_type === "INDEX";

  // Compact OverviewGrid thumbnail variants
  if (compact) {
    if (isDivider) {
      return (
        <div className="relative flex aspect-[16/9] w-full flex-col justify-between overflow-hidden rounded-[8px] border border-[#262626] bg-[#111111] p-4 text-left text-white shadow-[0_2px_8px_rgba(17,17,17,0.18)]">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#E9501F]" />
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-[#E9501F] px-2 py-0.5 text-[12px] font-bold text-white">
                {SECTION_LABELS[slide.section_code]}
              </span>
              <StatusBadge tone={statusBadge.tone}>{statusBadge.label}</StatusBadge>
            </div>
            <h4 className="line-clamp-2 text-[14px] font-extrabold leading-snug text-white">
              {slide.title}
            </h4>
            <p className="line-clamp-2 text-[12px] text-[#D4D4D4]">
              {slide.headcopy}
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-white/15 pt-1.5 text-[12px] text-[#A3A3A3] tabular-nums">
            <span>섹션 구분 페이지</span>
            <span>PART SUMMARY</span>
          </div>
        </div>
      );
    }

    return (
      <div
        className={`flex aspect-[16/9] w-full flex-col justify-between overflow-hidden rounded-[8px] border bg-white p-3.5 text-left shadow-[0_1px_3px_rgba(17,17,17,0.03)] ${
          isIndex ? "border-[#E9501F]/60 bg-[#FFFCFA]" : "border-[#E5E5E5]"
        }`}
      >
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[12px] font-bold tracking-wide text-[#E9501F]">
              {isIndex ? "INDEX 목차" : SECTION_LABELS[slide.section_code]}
            </span>
            <StatusBadge tone={statusBadge.tone}>{statusBadge.label}</StatusBadge>
          </div>
          <h4 className="line-clamp-2 text-[13px] font-bold leading-snug text-[#111111]">
            {slide.title}
          </h4>
          <p className="line-clamp-2 border-l-2 border-[#111111] pl-2 text-[12px] text-[#4A4A4A]">
            {slide.headcopy}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-1.5 text-[12px] text-[#8C8C8C] tabular-nums">
          <span>
            KPI {slide.kpi_cards.length} · 근거 {slide.bullets.length}
          </span>
          {slide.qc_flag && (
            <span className="font-semibold text-[#C26B00]">{slide.qc_flag}</span>
          )}
        </div>
      </div>
    );
  }

  // Dedicated Dark SECTION_DIVIDER Canvas
  if (isDivider) {
    return (
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="relative flex min-h-[560px] flex-col justify-between overflow-hidden rounded-[10px] border border-[#262626] bg-[#111111] p-8 text-white shadow-[0_12px_32px_-8px_rgba(17,17,17,0.35)] lg:p-10">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-[#E9501F]" />

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-[12px] font-semibold">
              <span className="rounded-[6px] bg-[#E9501F] px-2.5 py-1 font-mono text-white">
                {String(slide.slide_order).padStart(2, "0")} · SECTION DIVIDER
              </span>
              <span className="text-[#D4D4D4]">
                {bundle.project.brand_name} · {bundle.project.product_name}
              </span>
            </div>
            <StatusBadge tone={statusBadge.tone}>{statusBadge.label}</StatusBadge>
          </div>

          <div className="my-8 space-y-5 border-l-4 border-[#E9501F] pl-6">
            <p className="text-[13px] font-bold tracking-widest text-[#E9501F]">
              {SECTION_LABELS[slide.section_code]}
            </p>
            <h2 className="text-[28px] font-extrabold leading-tight tracking-tight text-white lg:text-[34px]">
              {slide.title}
            </h2>
            <p className="max-w-3xl text-[16px] font-medium leading-relaxed text-[#E5E5E5]">
              {slide.headcopy}
            </p>
          </div>

          <div className="space-y-4">
            {slide.kpi_cards.length > 0 && (
              <div className="grid gap-3 md:grid-cols-3">
                {slide.kpi_cards.map((kpi, idx) => (
                  <div
                    key={`${kpi.label}-${idx}`}
                    className="rounded-[8px] border border-white/15 bg-white/5 px-4 py-3"
                  >
                    <p className="text-[12px] font-medium text-[#A3A3A3]">{kpi.label}</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-[22px] font-extrabold tabular-nums text-white">
                        {kpi.value}
                      </span>
                      {kpi.delta && (
                        <span className="text-[12px] font-semibold text-[#F48A66]">
                          {kpi.delta}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {slide.bullets.length > 0 && (
              <div className="grid gap-2.5 md:grid-cols-3">
                {slide.bullets.map((b, idx) => (
                  <div
                    key={idx}
                    className="rounded-[8px] border border-white/10 bg-[#1C1C1C] px-3.5 py-2.5 text-[13px] leading-snug text-[#E5E5E5]"
                  >
                    {b.claim}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-[12px] text-[#A3A3A3]">
            <span>{slide.footnote ?? "PTKOREA Division 4 Factbook"}</span>
            <span className="font-mono">DIVISION 4 STANDARD</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="flex min-h-[560px] flex-col justify-between rounded-[10px] border border-[#E5E5E5] bg-white p-6 shadow-[0_6px_24px_-8px_rgba(17,17,17,0.08)] lg:p-7">
        {/* Top Slide Header */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[12px] font-semibold text-[#4A4A4A]">
              <span className="font-mono text-[12px] text-[#8C8C8C]">
                {String(slide.slide_order).padStart(2, "0")}
              </span>
              <span className="font-bold text-[#E9501F]">
                {isIndex ? "00. INDEX 목차" : SECTION_LABELS[slide.section_code]}
              </span>
              <span className="text-[#D4D4D4]">|</span>
              <span className="text-[#4A4A4A]">
                {bundle.project.brand_name} · {bundle.project.product_name}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {slide.latest_comment_status === "APPLIED" && (
                <StatusBadge tone="indigo">AI 반영</StatusBadge>
              )}
              <StatusBadge tone={statusBadge.tone}>
                {statusBadge.label}
              </StatusBadge>
            </div>
          </div>

          <h2 className="text-[21px] font-bold tracking-tight text-[#111111] lg:text-[23px]">
            {slide.title}
          </h2>

          <div
            className={`rounded-r-[8px] border-l-[3px] px-3.5 py-2.5 ${
              isIndex
                ? "border-[#E9501F] bg-[#FFF8F5]"
                : "border-[#111111] bg-[#FAFAFA]"
            }`}
          >
            <p className="text-[14px] font-semibold leading-snug text-[#111111]">
              {slide.headcopy}
            </p>
          </div>
        </div>

        {/* Middle Body */}
        <div className="my-4 flex-1 space-y-3.5">
          {slide.kpi_cards.length > 0 && (
            <div
              className={`grid gap-2.5 ${
                slide.kpi_cards.length === 2
                  ? "grid-cols-2"
                  : slide.kpi_cards.length === 3
                    ? "grid-cols-3"
                    : "grid-cols-2 lg:grid-cols-4"
              }`}
            >
              {slide.kpi_cards.map((kpi, idx) => (
                <div
                  key={`${kpi.label}-${idx}`}
                  className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2.5"
                >
                  <p className="text-[12px] font-semibold text-[#4A4A4A]">
                    {kpi.label}
                  </p>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-[20px] font-bold tracking-tight tabular-nums text-[#111111]">
                      {kpi.value}
                    </span>
                    {kpi.delta && (
                      <span
                        className={`text-[12px] font-semibold tabular-nums ${
                          kpi.delta.startsWith("-")
                            ? "text-[#DC2626]"
                            : "text-[#1F8A5B]"
                        }`}
                      >
                        {kpi.delta}
                      </span>
                    )}
                  </div>
                  {kpi.basis && (
                    <p className="mt-0.5 truncate text-[12px] text-[#737373]">
                      {kpi.basis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {snsAssets.length > 0 && (
            <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-[13px] font-bold text-[#111111]">
                  <ChannelGlyph
                    channelKey={normalizeChannelKey(
                      slide.slide_type.includes("YOUTUBE")
                        ? "youtube"
                        : slide.slide_type.includes("INSTAGRAM")
                          ? "instagram"
                          : snsPostsForSlide[0]?.platform ?? "official"
                    )}
                    size={16}
                  />
                  기간 내 공식 채널 TOP {Math.min(5, Math.max(snsAssets.length, snsPostsForSlide.length))} 인기 게시물
                </span>
                <span className="text-[12px] text-[#737373]">
                  썸네일 · 반응 지표 실증 카드 (TOP 1 강조)
                </span>
              </div>
              <div
                className={`grid gap-2.5 ${
                  snsAssets.length >= 4
                    ? "grid-cols-2 lg:grid-cols-5"
                    : snsAssets.length === 3
                      ? "grid-cols-1 md:grid-cols-3"
                      : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {snsAssets.slice(0, 5).map((asset, idx) => {
                  const matchedPost = snsPostsForSlide[idx];
                  const thumbUrl = asset.local_path
                    ? resolveMediaUrl(bundle.project.id, asset.local_path)
                    : matchedPost?.media_url;
                  const postUrl =
                    typeof asset.metadata?.post_url === "string"
                      ? asset.metadata.post_url
                      : matchedPost?.post_url;
                  const chKey = normalizeChannelKey(
                    String(asset.metadata?.platform ?? matchedPost?.platform ?? asset.title)
                  );
                  return (
                    <div
                      key={`${asset.title}-${idx}`}
                      className={`flex flex-col overflow-hidden rounded-[8px] border bg-[#FAFAFA] ${
                        idx === 0 ? "border-[#E9501F] ring-1 ring-[#E9501F]/20" : "border-[#E5E5E5]"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between px-2.5 py-1.5 text-[12px] font-bold text-white ${
                          idx === 0 ? "bg-[#E9501F]" : "bg-[#111111]"
                        }`}
                      >
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <ChannelGlyph channelKey={chKey} size={14} />
                          <span className="truncate">{asset.title}</span>
                        </span>
                        {Boolean(asset.metadata?.is_collab) && (
                          <span className="ml-1 shrink-0 rounded bg-white/20 px-1.5 py-0.5 text-[12px] leading-none">
                            협업
                          </span>
                        )}
                      </div>
                      <div className="h-24 w-full overflow-hidden border-b border-[#E5E5E5] bg-white">
                        {thumbUrl ? (
                          <img
                            src={thumbUrl}
                            alt={asset.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[12px] text-[#8C8C8C]">
                            썸네일 없음
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between space-y-1.5 p-2.5">
                        <p className="text-[12px] font-semibold leading-tight text-[#111111]">
                          {asset.caption}
                        </p>
                        {asset.annotation_text && (
                          <p className="line-clamp-2 text-[12px] leading-snug text-[#4A4A4A]">
                            {asset.annotation_text}
                          </p>
                        )}
                        {postUrl && (
                          <a
                            href={postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#E9501F] hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                            원문 보기
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className={`grid gap-4 ${
              chartAssets.length > 0 && slide.bullets.length > 0
                ? "lg:grid-cols-12"
                : "grid-cols-1"
            }`}
          >
            {chartAssets.length > 0 && (
              <div
                className={
                  slide.bullets.length > 0 ? "lg:col-span-6" : "col-span-1"
                }
              >
                {chartAssets.map((asset, idx) => (
                  <div
                    key={`${asset.asset_type}-${idx}`}
                    className="rounded-[8px] border border-[#E5E5E5] bg-white p-3.5"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[13px] font-bold text-[#111111]">
                        {asset.title}
                      </span>
                      {asset.annotation_text && (
                        <span className="rounded-[6px] bg-[#FFF3EE] px-2 py-0.5 text-[12px] font-semibold text-[#E9501F]">
                          {asset.annotation_text}
                        </span>
                      )}
                    </div>

                    {asset.asset_type === "DATALAB_TREND_CHART" && (
                      <DataLabTrendChart seriesList={bundle.datalab} metricType="SEARCH_TREND" compact />
                    )}

                    {asset.asset_type === "DATALAB_SOS_BAR" && (
                      <DataLabSosBarChart seriesList={bundle.datalab} metricType="ALL" compact />
                    )}

                    {asset.asset_type === "HORIZONTAL_BAR_CHART" && (
                      <HorizontalDataBarChart
                        items={
                          (asset.metadata?.items as Array<{
                            label: string;
                            value: number;
                            highlight?: boolean;
                          }>) ?? []
                        }
                        unit={String(asset.metadata?.unit ?? "")}
                      />
                    )}

                    {asset.asset_type === "PRICE_DISCOUNT_BAR" && (
                      <PriceDiscountChart
                        items={
                          (asset.metadata?.items as Array<{
                            label: string;
                            list_price: number;
                            sale_price: number;
                            discount_pct?: number;
                          }>) ?? []
                        }
                        unit={String(asset.metadata?.unit ?? "만원")}
                      />
                    )}

                    {asset.asset_type === "PRESS_MONTHLY_BAR" && (
                      <PressMonthlyChart
                        items={
                          (asset.metadata?.items as Array<{
                            label: string;
                            value: number;
                            highlight?: boolean;
                          }>) ?? []
                        }
                      />
                    )}

                    {asset.asset_type === "PRESS_BRAND_BAR" && (
                      <PressBrandCompareChart
                        items={
                          (asset.metadata?.items as Array<{
                            label: string;
                            value: number;
                            highlight?: boolean;
                          }>) ?? []
                        }
                      />
                    )}

                    {asset.asset_type === "MARKETING_HEATMAP" && (
                      <MarketingHeatmapChart
                        brands={(asset.metadata?.brands as string[]) ?? []}
                        rows={
                          (asset.metadata?.rows as Array<{
                            axis: string;
                            scores: Array<{ brand: string; score: number }>;
                          }>) ?? []
                        }
                      />
                    )}

                    {asset.asset_type === "CONSUMER_KBF_CHART" && (
                      <VocSentimentChart
                        positive={Number(asset.metadata?.positive ?? 60)}
                        negative={Number(asset.metadata?.negative ?? 22)}
                        neutral={Number(asset.metadata?.neutral ?? 18)}
                        compact
                      />
                    )}

                    {asset.caption && (
                      <p className="mt-2 text-[12px] text-[#737373]">
                        {asset.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {slide.bullets.length > 0 && (
              <div
                className={`space-y-2.5 ${
                  chartAssets.length > 0 ? "lg:col-span-6" : "col-span-1"
                }`}
              >
                {slide.bullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#111111]" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="text-[13px] font-medium leading-relaxed text-[#111111]">
                          {bullet.claim}
                        </p>
                        {(bullet.source_name || bullet.evidence_quote || bullet.source_url) && (
                          <div className="flex flex-wrap items-center gap-2 text-[12px]">
                            {bullet.fact_id ? (
                              <button
                                type="button"
                                onClick={() => onSelectFact?.(bullet.fact_id!)}
                                className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#E5E5E5] bg-white px-2 py-0.5 font-semibold text-[#111111] hover:border-[#111111] cursor-pointer"
                              >
                                <ChannelGlyph
                                  channelKey={normalizeChannelKey(bullet.source_name)}
                                  size={14}
                                />
                                <Link2 className="h-3 w-3 text-[#737373]" />
                                <span>{bullet.source_name ?? bullet.fact_id}</span>
                              </button>
                            ) : (
                              bullet.source_name && (
                                <ChannelBadge
                                  channel={bullet.source_name}
                                  labelOverride={bullet.source_name}
                                  compact
                                />
                              )
                            )}
                            {bullet.source_url && isHttpUrl(bullet.source_url) && (
                              <a
                                href={bullet.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-[6px] border border-[#F9C8B8] bg-[#FFF8F5] px-2 py-0.5 font-semibold text-[#E9501F] hover:bg-[#FFF0EA]"
                              >
                                <ExternalLink className="h-3 w-3" />
                                {formatUrlHost(bullet.source_url)}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {slide.table && (
            <div className="overflow-x-auto rounded-[8px] border border-[#E5E5E5]">
              <table className="w-full text-left text-[13px]">
                <thead className="border-b border-[#E5E5E5] bg-[#F5F5F5] text-[#111111]">
                  <tr>
                    {slide.table.headers.map((header, idx) => (
                      <th key={idx} className="px-3 py-2 font-bold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {slide.table.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="bg-white">
                      {row.map((cell, cIdx) => {
                        const trimmed = String(cell ?? "").trim();
                        const headerName = slide.table?.headers[cIdx] ?? "";
                        const isChannelCol =
                          headerName.includes("채널") || headerName.includes("플랫폼");
                        const isPagePillCol = isIndex && headerName.includes("페이지");

                        return (
                          <td
                            key={cIdx}
                            className={`px-3 py-2 ${
                              cIdx === 0
                                ? "font-semibold text-[#111111]"
                                : "text-[#4A4A4A]"
                            }`}
                          >
                            {isHttpUrl(trimmed) ? (
                              <a
                                href={trimmed}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-semibold text-[#E9501F] underline decoration-[#E9501F]/40 underline-offset-2 hover:text-[#111111]"
                              >
                                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                <span>{formatUrlHost(trimmed)}</span>
                              </a>
                            ) : isPagePillCol ? (
                              <span className="inline-flex rounded-[6px] bg-[#FFF3EE] px-2 py-0.5 font-mono text-[12px] font-bold text-[#E9501F]">
                                {trimmed}
                              </span>
                            ) : isChannelCol && isRecognizedChannelLabel(trimmed) ? (
                              <ChannelBadge channel={trimmed} labelOverride={trimmed} compact />
                            ) : (
                              trimmed
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {slide.as_is_to_be && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#4A4A4A]">
                    AS-IS 현황
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#8C8C8C]" />
                </div>
                <ul className="mt-2 space-y-1.5">
                  {slide.as_is_to_be.as_is_points.map((pt, idx) => (
                    <li
                      key={idx}
                      className="text-[13px] leading-relaxed text-[#111111]"
                    >
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[8px] border border-[#F5D8A8] bg-[#FFFBEB] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#C26B00]">
                    핵심 과제
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#C26B00]" />
                </div>
                <ul className="mt-2 space-y-1.5">
                  {slide.as_is_to_be.key_issues.map((pt, idx) => (
                    <li
                      key={idx}
                      className="text-[13px] font-medium leading-relaxed text-[#111111]"
                    >
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[8px] border border-[#111111] bg-white p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-bold text-[#111111]">
                    TO-BE 방향
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {slide.as_is_to_be.to_be_directions.map((pt, idx) => (
                    <li
                      key={idx}
                      className="text-[13px] font-semibold leading-relaxed text-[#111111]"
                    >
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-2.5 text-[12px] text-[#737373]">
          <span className="truncate">
            {slide.footnote ??
              `출처: ${bundle.project.brand_name} 팩트북 수집 자료 (${bundle.project.period_start} ~ ${bundle.project.period_end})`}
          </span>
          <span className="shrink-0 font-mono tabular-nums">
            PTKOREA · {bundle.project.brand_name}
          </span>
        </div>
      </div>
    </div>
  );
}
