"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, CheckCheck, ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  RightInspector,
  type InspectorTab,
} from "@/features/fact-review/RightInspector";
import { SlideCanvas } from "@/features/fact-review/SlideCanvas";
import { SlideGenerationMonitor } from "@/features/fact-review/SlideGenerationMonitor";
import { useFactbookStore } from "@/lib/store";
import {
  SECTION_LABELS,
  type ProjectBundle,
  type SectionCode,
  type SlideDraft,
  type SummarySplitMode,
} from "@/lib/types";

const SECTION_ORDER: SectionCode[] = [
  "0_OVERVIEW",
  "1_OWN",
  "2_MARKET",
  "3_COMPETITOR",
  "4_CONSUMER",
  "5_SUMMARY_CONCLUSION",
];

export function FactReviewStudio({
  bundle,
  selectedSlideId,
  onSelectSlide,
  onGoToExport,
  onGoToCollection,
}: {
  bundle: ProjectBundle;
  selectedSlideId: string;
  onSelectSlide: (slideId: string) => void;
  onGoToExport: () => void;
  onGoToCollection: () => void;
}) {
  const {
    updateSlide,
    switchSummarySplit,
    approveSectionSlides,
    generateSlides,
  } = useFactbookStore();
  const { pushToast } = useToast();

  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("EDIT");
  const [focusedFactId, setFocusedFactId] = useState<string | null>(null);

  const sortedSlides = useMemo(
    () => [...bundle.slides].sort((a, b) => a.slide_order - b.slide_order),
    [bundle.slides]
  );

  const currentIdx = Math.max(
    0,
    sortedSlides.findIndex((s) => s.id === selectedSlideId)
  );
  const currentSlide: SlideDraft | undefined =
    sortedSlides[currentIdx] ?? sortedSlides[0];

  useEffect(() => {
    if (
      sortedSlides.length > 0 &&
      !sortedSlides.some((s) => s.id === selectedSlideId)
    ) {
      onSelectSlide(sortedSlides[0].id);
    }
  }, [sortedSlides, selectedSlideId, onSelectSlide]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && currentIdx > 0) {
        e.preventDefault();
        onSelectSlide(sortedSlides[currentIdx - 1].id);
      } else if (
        e.key === "ArrowRight" &&
        currentIdx < sortedSlides.length - 1
      ) {
        e.preventDefault();
        onSelectSlide(sortedSlides[currentIdx + 1].id);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIdx, sortedSlides, onSelectSlide]);

  const approvedCount = sortedSlides.filter(
    (s) => s.review_status === "APPROVED"
  ).length;
  const unapprovedCount = sortedSlides.length - approvedCount;

  const groupedSlides = useMemo(() => {
    const map = new Map<SectionCode, SlideDraft[]>();
    SECTION_ORDER.forEach((sec) => map.set(sec, []));
    sortedSlides.forEach((sl) => {
      const list = map.get(sl.section_code) ?? [];
      list.push(sl);
      map.set(sl.section_code, list);
    });
    return map;
  }, [sortedSlides]);

  const handleSplitSwitch = (mode: SummarySplitMode) => {
    if (bundle.project.summary_split_mode === mode) return;
    switchSummarySplit(bundle.project.id, mode);
    pushToast({
      tone: "info",
      title: `5. 현황 요약 분할을 '${mode === "SPLIT_2" ? "2장 요약" : "4장 요약"}'으로 전환했습니다.`,
    });
  };

  const handleApproveAndNext = () => {
    if (!currentSlide) return;
    updateSlide(bundle.project.id, currentSlide.id, {
      review_status: "APPROVED",
    });

    const nextSlide = sortedSlides[currentIdx + 1];
    if (nextSlide) {
      onSelectSlide(nextSlide.id);
      pushToast({
        tone: "success",
        title: `슬라이드 ${currentSlide.slide_order} 확정 → 다음 장표`,
      });
    } else {
      pushToast({
        tone: "success",
        title: "마지막 장표까지 확정 완료! 사전 QC · 출력으로 이동합니다.",
      });
      onGoToExport();
    }
  };

  const isGeneratingSlides =
    bundle.slide_gen_job?.status === "RUNNING" ||
    bundle.slide_gen_job?.status === "PENDING";

  const handleSelectFact = (factId: string) => {
    setFocusedFactId(factId);
    setInspectorTab("EVIDENCE");
  };

  if (sortedSlides.length === 0 || !currentSlide) {
    if (isGeneratingSlides && bundle.slide_gen_job) {
      return (
        <div className="min-h-[calc(100vh-84px)] overflow-y-auto bg-[#F5F5F5]">
          <SlideGenerationMonitor
            job={bundle.slide_gen_job}
            slideCount={0}
            mode="full"
          />
        </div>
      );
    }

    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[12px] border border-[#E5E5E5] bg-white text-[#111111]">
          <Layers className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-[17px] font-bold text-[#111111]">
          아직 생성된 슬라이드 초안이 없습니다
        </h2>
        <p className="mt-1.5 text-[13px] text-[#4A4A4A]">
          먼저 자료·수집 풀에서 승인된 자료를 확인하거나, 바로 0~5장 초안을 생성해 보세요.
        </p>
        <div className="mt-5 flex items-center gap-2">
          <button
            type="button"
            onClick={onGoToCollection}
            className="h-9 rounded-[8px] border border-[#D4D4D4] bg-white px-4 text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
          >
            자료·수집 풀 보기
          </button>
          <AsyncActionButton
            variant="primary"
            size="md"
            loadingText="슬라이드 초안 생성 중..."
            onAction={async () => {
              await generateSlides(
                bundle.project.id,
                bundle.project.summary_split_mode
              );
            }}
          >
            장표 초안 생성하기
          </AsyncActionButton>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 bg-[#F5F5F5] lg:h-[calc(100vh-84px)] lg:grid-cols-[224px_minmax(0,1fr)_356px]">
      {/* LEFT THUMBNAIL STRIP */}
      <aside className="border-b border-[#E5E5E5] bg-white px-2.5 py-2.5 lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="space-y-3 pb-4">
          {SECTION_ORDER.map((sec) => {
            const secSlides = groupedSlides.get(sec) ?? [];
            const secUnapproved = secSlides.filter(
              (s) => s.review_status !== "APPROVED"
            ).length;

            return (
              <div key={sec}>
                <div className="mb-1.5 flex items-center justify-between px-0.5">
                  <span className="text-[11px] font-medium text-[#8C8C8C]">
                    {SECTION_LABELS[sec]}
                  </span>
                  {secSlides.length > 0 && secUnapproved > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const cnt = approveSectionSlides(bundle.project.id, sec);
                        pushToast({
                          tone: "success",
                          title: `${SECTION_LABELS[sec]} ${cnt}개 장표 일괄 확정`,
                        });
                      }}
                      className="inline-flex items-center gap-0.5 text-[10px] font-medium text-[#4A4A4A] hover:text-[#111111] cursor-pointer"
                      title="섹션 전체 확정"
                    >
                      <CheckCheck className="h-3 w-3" />
                      확정
                    </button>
                  )}
                </div>

                {sec === "5_SUMMARY_CONCLUSION" && (
                  <div className="mb-2 grid grid-cols-2 rounded-[8px] border border-[#D4D4D4] bg-[#F5F5F5] p-0.5">
                    {(["SPLIT_2", "SPLIT_4"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleSplitSwitch(mode)}
                        className={`rounded-[6px] py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                          bundle.project.summary_split_mode === mode
                            ? "bg-white text-[#111111] shadow-2xs"
                            : "text-[#4A4A4A]"
                        }`}
                      >
                        {mode === "SPLIT_2" ? "요약 2장" : "요약 4장"}
                      </button>
                    ))}
                  </div>
                )}

                {secSlides.length === 0 ? (
                  <div className="rounded-[8px] border border-dashed border-[#F5D8A8] bg-[#FFFBEB] px-2 py-1.5 text-[11px] text-[#C26B00]">
                    장표 누락
                  </div>
                ) : (
                  secSlides.map((sl) => {
                    const active = sl.id === currentSlide.id;
                    const stateCls =
                      sl.review_status === "APPROVED"
                        ? "border-[#BBE5D0] text-[#1F8A5B]"
                        : sl.review_status === "COMMENT_APPLIED"
                          ? "border-[#F9C8B8] text-[#E9501F]"
                          : "border-[#E5E5E5] text-[#4A4A4A]";
                    const stateLabel =
                      sl.review_status === "APPROVED"
                        ? "확정"
                        : sl.review_status === "COMMENT_APPLIED"
                          ? "AI"
                          : "초안";

                    const isCoverThumb = sl.slide_type === "COVER";
                    const isIndexThumb = sl.slide_type === "INDEX";
                    return (
                      <div
                        key={sl.id}
                        className="mb-2 grid grid-cols-[16px_1fr] gap-1.5"
                      >
                        <span className="pt-0.5 text-right text-[11px] tabular-nums text-[#8C8C8C]">
                          {sl.slide_order}
                        </span>
                        <button
                          type="button"
                          onClick={() => onSelectSlide(sl.id)}
                          className={`relative aspect-[16/9] w-full overflow-hidden rounded-[6px] p-2 text-left transition-all cursor-pointer ${
                            isCoverThumb
                              ? "bg-[#111111] text-white"
                              : "bg-white text-[#111111]"
                          } ${
                            active
                              ? "border border-transparent ring-2 ring-[#111111]"
                              : isCoverThumb
                                ? "border border-[#262626] hover:border-[#E9501F]"
                                : "border border-[#D4D4D4] hover:border-[#8C8C8C]"
                          }`}
                        >
                          <span
                            className="block h-[2px] w-4"
                            style={{
                              backgroundColor:
                                isCoverThumb ||
                                isIndexThumb ||
                                bundle.project.analysis_track === "REVIEW_CENTRIC"
                                  ? "#E9501F"
                                  : "#111111",
                            }}
                          />
                          <p
                            className={`mt-1 line-clamp-2 text-[9px] font-semibold leading-tight ${
                              isCoverThumb ? "text-white" : "text-[#111111]"
                            }`}
                          >
                            {isCoverThumb ? `표지 · ${sl.title}` : isIndexThumb ? "INDEX 목차" : sl.title}
                          </p>
                          <span
                            className={`absolute right-1 bottom-1 rounded-[6px] border bg-white/95 px-1.5 py-[1px] text-[9px] font-medium whitespace-nowrap ${stateCls}`}
                          >
                            {stateLabel}
                          </span>
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* CENTER CANVAS STAGE + BOTTOM BAR */}
      <section className="flex min-w-0 min-h-0 flex-col bg-[#F5F5F5]">
        {isGeneratingSlides && bundle.slide_gen_job && (
          <SlideGenerationMonitor
            job={bundle.slide_gen_job}
            slideCount={sortedSlides.length}
            mode="banner"
          />
        )}
        <div className="flex flex-1 min-h-0 items-center justify-center overflow-hidden p-4 lg:p-5">
          <SlideCanvas
            slide={currentSlide}
            bundle={bundle}
            onSelectFact={handleSelectFact}
            onSelectSlide={onSelectSlide}
          />
        </div>

        <div className="flex h-[46px] shrink-0 items-center justify-between gap-3 border-t border-[#E5E5E5] bg-white px-4">
          <div className="flex items-center gap-3 text-[12px] text-[#4A4A4A] tabular-nums">
            <span className="rounded-[5px] border border-[#E5E5E5] bg-[#FAFAFA] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#111111]">
              16:9 · 1920×1080
            </span>
            <span>
              슬라이드 {currentIdx + 1} / {sortedSlides.length}
            </span>
            <span className="text-[#E5E5E5]">|</span>
            <span>
              확정 {approvedCount}/{sortedSlides.length}장
            </span>
            {unapprovedCount > 0 && (
              <>
                <span className="hidden text-[#E5E5E5] sm:inline">|</span>
                <span className="hidden font-medium text-[#C26B00] sm:inline">
                  검토 필요 {unapprovedCount}
                </span>
              </>
            )}
            <span className="hidden text-[#E5E5E5] xl:inline">|</span>
            <span className="hidden text-[11px] text-[#8C8C8C] xl:inline">
              ← / → 키로 장표 이동
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => {
                const prev = sortedSlides[currentIdx - 1];
                if (prev) onSelectSlide(prev.id);
              }}
              className="inline-flex h-[30px] shrink-0 items-center gap-1 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white px-3 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5] disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
              이전
            </button>

            <button
              type="button"
              onClick={() =>
                updateSlide(bundle.project.id, currentSlide.id, {
                  review_status:
                    currentSlide.review_status === "APPROVED"
                      ? "NEEDS_REVIEW"
                      : "APPROVED",
                })
              }
              className="hidden sm:inline-flex h-[30px] shrink-0 items-center gap-1 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white px-2.5 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
            >
              {currentSlide.review_status === "APPROVED" ? "확정 해제" : "확정"}
            </button>

            <button
              type="button"
              onClick={handleApproveAndNext}
              className="inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#111111] px-3.5 text-[12px] font-medium text-white hover:bg-[#262626] cursor-pointer"
            >
              <Check className="h-3.5 w-3.5 shrink-0" />
              {currentIdx < sortedSlides.length - 1
                ? "확정하고 다음"
                : "확정하고 QC 출력"}
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>
        </div>
      </section>

      <RightInspector
        bundle={bundle}
        slide={currentSlide}
        activeTab={inspectorTab}
        onTabChange={setInspectorTab}
        focusedFactId={focusedFactId}
      />
    </div>
  );
}
