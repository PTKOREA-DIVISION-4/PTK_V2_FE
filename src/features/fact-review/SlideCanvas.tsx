"use client";

import React from "react";
import {
  ArrowRight,
  ExternalLink,
  Instagram,
  Link2,
  Youtube,
} from "lucide-react";
import {
  DataLabSosBarChart,
  DataLabTrendChart,
  HorizontalDataBarChart,
  VocSentimentChart,
} from "@/components/visuals/FactbookCharts";
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

  if (compact) {
    return (
      <div className="flex aspect-[16/9] w-full flex-col justify-between overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white p-3.5 text-left shadow-[0_1px_3px_rgba(17,17,17,0.03)]">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold tracking-wide text-[#E9501F]">
              {SECTION_LABELS[slide.section_code]}
            </span>
            <StatusBadge tone={statusBadge.tone}>{statusBadge.label}</StatusBadge>
          </div>
          <h4 className="line-clamp-2 text-[12px] font-bold leading-snug text-[#111111]">
            {slide.title}
          </h4>
          <p className="line-clamp-2 border-l-2 border-[#111111] pl-2 text-[10px] text-[#4A4A4A]">
            {slide.headcopy}
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-1.5 text-[10px] text-[#8C8C8C] tabular-nums">
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

  return (
    <div className="mx-auto w-full max-w-[1100px]">
      <div className="flex min-h-[560px] flex-col justify-between rounded-[10px] border border-[#E5E5E5] bg-white p-6 shadow-[0_6px_24px_-8px_rgba(17,17,17,0.08)] lg:p-7">
        {/* Top Slide Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#4A4A4A]">
              <span className="font-mono text-[10px] text-[#8C8C8C]">
                {String(slide.slide_order).padStart(2, "0")}
              </span>
              <span className="text-[#E9501F]">
                {SECTION_LABELS[slide.section_code]}
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

          <h2 className="text-[19px] font-bold tracking-tight text-[#111111]">
            {slide.title}
          </h2>

          <div className="rounded-r-[8px] border-l-[3px] border-[#111111] bg-[#FAFAFA] px-3 py-2">
            <p className="text-[13px] font-semibold leading-snug text-[#111111]">
              {slide.headcopy}
            </p>
          </div>
        </div>

        {/* Middle Body */}
        <div className="my-3.5 flex-1 space-y-3">
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
                  className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2"
                >
                  <p className="text-[11px] font-medium text-[#4A4A4A]">
                    {kpi.label}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-[17px] font-bold tracking-tight tabular-nums text-[#111111]">
                      {kpi.value}
                    </span>
                    {kpi.delta && (
                      <span
                        className={`text-[10px] font-semibold tabular-nums ${
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
                    <p className="mt-0.5 truncate text-[10px] text-[#8C8C8C]">
                      {kpi.basis}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {snsAssets.length > 0 && (
            <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-3">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#111111]">
                  기간 내 공식 채널 TOP {Math.min(5, Math.max(snsAssets.length, snsPostsForSlide.length))} 인기 게시물
                </span>
                <span className="text-[10px] text-[#8C8C8C]">
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
                  return (
                    <div
                      key={`${asset.title}-${idx}`}
                      className={`flex flex-col overflow-hidden rounded-[8px] border bg-[#FAFAFA] ${
                        idx === 0 ? "border-[#E9501F] ring-1 ring-[#E9501F]/20" : "border-[#E5E5E5]"
                      }`}
                    >
                      <div
                        className={`flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold text-white ${
                          idx === 0 ? "bg-[#E9501F]" : "bg-[#111111]"
                        }`}
                      >
                        <span className="inline-flex min-w-0 items-center gap-1">
                          {asset.title.toUpperCase().includes("YOUTUBE") ||
                          matchedPost?.platform === "YOUTUBE" ? (
                            <Youtube className="h-3 w-3 shrink-0" />
                          ) : asset.title.toUpperCase().includes("INSTAGRAM") ||
                            matchedPost?.platform === "INSTAGRAM" ? (
                            <Instagram className="h-3 w-3 shrink-0" />
                          ) : null}
                          <span className="truncate">{asset.title}</span>
                        </span>
                        {Boolean(asset.metadata?.is_collab) && (
                          <span className="ml-1 shrink-0 rounded bg-white/20 px-1 py-0.2 text-[9px]">
                            협업
                          </span>
                        )}
                      </div>
                      <div className="h-24 w-full overflow-hidden bg-white border-b border-[#E5E5E5]">
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
                          <div className="flex h-full items-center justify-center text-[10px] text-[#8C8C8C]">
                            썸네일 없음
                          </div>
                        )}
                      </div>
                      <div className="flex flex-1 flex-col justify-between p-2 space-y-1">
                        <p className="text-[10px] font-semibold leading-tight text-[#111111]">
                          {asset.caption}
                        </p>
                        {asset.annotation_text && (
                          <p className="line-clamp-2 text-[10px] leading-snug text-[#4A4A4A]">
                            {asset.annotation_text}
                          </p>
                        )}
                        {postUrl && (
                          <a
                            href={postUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-0.5 text-[10px] text-[#8C8C8C] hover:text-[#111111]"
                          >
                            <ExternalLink className="h-2.5 w-2.5" />
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
                    className="rounded-[8px] border border-[#E5E5E5] bg-white p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[#111111]">
                        {asset.title}
                      </span>
                      {asset.annotation_text && (
                        <span className="rounded-[6px] bg-[#FFF3EE] px-2 py-0.5 text-[10px] font-semibold text-[#E9501F]">
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

                    {asset.asset_type === "CONSUMER_KBF_CHART" && (
                      <VocSentimentChart
                        positive={Number(asset.metadata?.positive ?? 60)}
                        negative={Number(asset.metadata?.negative ?? 22)}
                        neutral={Number(asset.metadata?.neutral ?? 18)}
                        compact
                      />
                    )}

                    {asset.caption && (
                      <p className="mt-1.5 text-[10px] text-[#8C8C8C]">
                        {asset.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {slide.bullets.length > 0 && (
              <div
                className={`space-y-2 ${
                  chartAssets.length > 0 ? "lg:col-span-6" : "col-span-1"
                }`}
              >
                {slide.bullets.map((bullet, idx) => (
                  <div
                    key={idx}
                    className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] px-3 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#111111]" />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs font-medium leading-relaxed text-[#111111]">
                          {bullet.claim}
                        </p>
                        {(bullet.source_name || bullet.evidence_quote) && (
                          <div className="flex flex-wrap items-center gap-2 text-[10px]">
                            {bullet.fact_id ? (
                              <button
                                type="button"
                                onClick={() => onSelectFact?.(bullet.fact_id!)}
                                className="inline-flex items-center gap-1 rounded-[6px] border border-[#E5E5E5] bg-[#F5F5F5] px-1.5 py-0.5 font-semibold text-[#111111] hover:border-[#111111] cursor-pointer"
                              >
                                <Link2 className="h-2.5 w-2.5" />
                                근거: {bullet.source_name ?? bullet.fact_id}
                              </button>
                            ) : (
                              bullet.source_name && (
                                <span className="rounded-[6px] bg-[#F5F5F5] px-1.5 py-0.5 font-medium text-[#4A4A4A]">
                                  출처: {bullet.source_name}
                                </span>
                              )
                            )}
                            {bullet.source_url && (
                              <a
                                href={bullet.source_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-0.5 text-[#8C8C8C] hover:text-[#111111]"
                              >
                                <ExternalLink className="h-2.5 w-2.5" />
                                링크
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
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E5E5E5] bg-[#F5F5F5] text-[#4A4A4A]">
                  <tr>
                    {slide.table.headers.map((header, idx) => (
                      <th key={idx} className="px-3 py-2 font-semibold">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {slide.table.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="bg-white">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className={`px-3 py-2 ${
                            cIdx === 0
                              ? "font-semibold text-[#111111]"
                              : "text-[#4A4A4A]"
                          }`}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {slide.as_is_to_be && (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#4A4A4A]">
                    AS-IS 현황
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#8C8C8C]" />
                </div>
                <ul className="mt-2 space-y-1.5">
                  {slide.as_is_to_be.as_is_points.map((pt, idx) => (
                    <li
                      key={idx}
                      className="text-xs leading-relaxed text-[#111111]"
                    >
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[8px] border border-[#F5D8A8] bg-[#FFFBEB] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#C26B00]">
                    핵심 과제
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#C26B00]" />
                </div>
                <ul className="mt-2 space-y-1.5">
                  {slide.as_is_to_be.key_issues.map((pt, idx) => (
                    <li
                      key={idx}
                      className="text-xs font-medium leading-relaxed text-[#111111]"
                    >
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[8px] border border-[#111111] bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#111111]">
                    TO-BE 방향
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {slide.as_is_to_be.to_be_directions.map((pt, idx) => (
                    <li
                      key={idx}
                      className="text-xs font-semibold leading-relaxed text-[#111111]"
                    >
                      • {pt}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-2 text-[10px] text-[#8C8C8C]">
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
