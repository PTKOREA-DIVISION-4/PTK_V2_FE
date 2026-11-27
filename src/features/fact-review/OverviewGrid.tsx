"use client";

import React, { useMemo, useState } from "react";
import { CheckCheck, Layers } from "lucide-react";
import { SlideCanvas } from "@/features/fact-review/SlideCanvas";
import { useToast } from "@/components/ui/ToastProvider";
import { useFactbookStore } from "@/lib/store";
import {
  SECTION_LABELS,
  type ProjectBundle,
  type SectionCode,
  type SlideDraft,
  type SlideReviewStatus,
} from "@/lib/types";

const SECTION_ORDER: SectionCode[] = [
  "0_OVERVIEW",
  "1_OWN",
  "2_MARKET",
  "3_COMPETITOR",
  "4_CONSUMER",
  "5_SUMMARY_CONCLUSION",
];

export function OverviewGrid({
  bundle,
  onOpenSlide,
}: {
  bundle: ProjectBundle;
  onOpenSlide: (slideId: string) => void;
}) {
  const { updateSlide, approveSectionSlides, switchSummarySplit } =
    useFactbookStore();
  const { pushToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<SlideReviewStatus | "ALL">(
    "ALL"
  );

  const sortedSlides = useMemo(
    () => [...bundle.slides].sort((a, b) => a.slide_order - b.slide_order),
    [bundle.slides]
  );

  const filteredSlides = useMemo(() => {
    if (statusFilter === "ALL") return sortedSlides;
    return sortedSlides.filter((s) => s.review_status === statusFilter);
  }, [sortedSlides, statusFilter]);

  const counts = useMemo(
    () => ({
      ALL: sortedSlides.length,
      NEEDS_REVIEW: sortedSlides.filter(
        (s) => s.review_status === "NEEDS_REVIEW"
      ).length,
      COMMENT_APPLIED: sortedSlides.filter(
        (s) => s.review_status === "COMMENT_APPLIED"
      ).length,
      APPROVED: sortedSlides.filter((s) => s.review_status === "APPROVED")
        .length,
    }),
    [sortedSlides]
  );

  const handleApproveAllVisible = async () => {
    const targets = filteredSlides.filter((s) => s.review_status !== "APPROVED");
    await Promise.all(
      targets.map((s) =>
        updateSlide(bundle.project.id, s.id, { review_status: "APPROVED" })
      )
    );
    pushToast({
      tone: "success",
      title: `${targets.length}개 장표를 일괄 확정했습니다.`,
    });
  };

  return (
    <div className="min-h-[calc(100vh-84px)] bg-[#F5F5F5] px-6 pb-14">
      <div className="sticky top-[84px] z-20 -mx-6 mb-5 border-b border-[#E5E5E5] bg-[#F5F5F5]/95 px-6 py-2.5 backdrop-blur-xs">
        <div className="mx-auto flex max-w-[1640px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { key: "ALL", label: "전체" },
                { key: "NEEDS_REVIEW", label: "초안·검토 필요" },
                { key: "COMMENT_APPLIED", label: "AI 반영" },
                { key: "APPROVED", label: "확정" },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setStatusFilter(item.key)}
                className={`h-8 shrink-0 whitespace-nowrap rounded-[8px] px-3 text-xs font-medium transition-colors cursor-pointer ${
                  statusFilter === item.key
                    ? "bg-[#111111] text-white"
                    : "border border-[#D4D4D4] bg-white text-[#4A4A4A] hover:text-[#111111]"
                }`}
              >
                {item.label} ({counts[item.key]})
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-[8px] border border-[#D4D4D4] bg-white p-0.5">
              {(["SPLIT_2", "SPLIT_4"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    switchSummarySplit(bundle.project.id, mode);
                    pushToast({
                      tone: "info",
                      title: `5. 현황 요약을 ${mode === "SPLIT_2" ? "2장" : "4장"} 분할로 전환했습니다.`,
                    });
                  }}
                  className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                    bundle.project.summary_split_mode === mode
                      ? "bg-[#111111] text-white"
                      : "text-[#4A4A4A] hover:text-[#111111]"
                  }`}
                >
                  {mode === "SPLIT_2" ? "요약 2장" : "요약 4장"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleApproveAllVisible}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#111111] px-3 text-xs font-medium text-white hover:bg-[#262626] cursor-pointer"
            >
              <CheckCheck className="h-3.5 w-3.5 shrink-0" />
              모두 확정
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1640px]">
        {filteredSlides.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#E5E5E5] bg-white py-16 text-center">
            <Layers className="h-7 w-7 text-[#8C8C8C]" />
            <p className="mt-2.5 text-sm font-medium text-[#4A4A4A]">
              해당 상태의 장표가 없습니다.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            {SECTION_ORDER.map((sec) => {
              const slidesInSec = filteredSlides.filter(
                (s) => s.section_code === sec
              );
              if (slidesInSec.length === 0) return null;

              return (
                <section key={sec} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[13px] font-semibold text-[#111111]">
                        {SECTION_LABELS[sec]}
                      </h3>
                      <span className="text-xs tabular-nums text-[#8C8C8C]">
                        {slidesInSec.length}장
                      </span>
                    </div>

                    {slidesInSec.some((s) => s.review_status !== "APPROVED") && (
                      <button
                        type="button"
                        onClick={async () => {
                          const cnt = await approveSectionSlides(
                            bundle.project.id,
                            sec
                          );
                          pushToast({
                            tone: "success",
                            title: `${SECTION_LABELS[sec]} ${cnt}개 장표를 확정했습니다.`,
                          });
                        }}
                        className="h-7 rounded-[8px] border border-[#D4D4D4] bg-white px-2.5 text-[11px] font-medium text-[#111111] hover:bg-[#FAFAFA] cursor-pointer"
                      >
                        섹션 일괄 확정
                      </button>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {slidesInSec.map((slide: SlideDraft) => (
                      <div key={slide.id} className="group flex flex-col">
                        <button
                          type="button"
                          onClick={() => onOpenSlide(slide.id)}
                          className="transition-transform group-hover:-translate-y-0.5 cursor-pointer"
                        >
                          <SlideCanvas slide={slide} bundle={bundle} compact />
                        </button>

                        <div className="flex items-center gap-2 px-0.5 pt-2 text-[12px]">
                          <span className="font-mono text-[11px] tabular-nums text-[#8C8C8C]">
                            {slide.slide_order}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenSlide(slide.id)}
                            className="min-w-0 flex-1 truncate text-left font-medium text-[#111111] hover:underline cursor-pointer"
                          >
                            {slide.title}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              updateSlide(bundle.project.id, slide.id, {
                                review_status:
                                  slide.review_status === "APPROVED"
                                    ? "NEEDS_REVIEW"
                                    : "APPROVED",
                              })
                            }
                            className={`shrink-0 text-[11px] font-medium cursor-pointer ${
                              slide.review_status === "APPROVED"
                                ? "text-[#1F8A5B]"
                                : slide.review_status === "COMMENT_APPLIED"
                                  ? "text-[#E9501F]"
                                  : "text-[#8C8C8C] hover:text-[#111111]"
                            }`}
                          >
                            {slide.review_status === "APPROVED"
                              ? "확정"
                              : slide.review_status === "COMMENT_APPLIED"
                                ? "AI반영"
                                : "확정하기"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
