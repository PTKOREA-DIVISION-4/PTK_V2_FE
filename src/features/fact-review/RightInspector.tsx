"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import {
  InlineMarkdown,
  stripMarkdownInline,
} from "@/components/ui/MarkdownContent";
import { SourceViewerDrawer } from "@/components/ui/SourceViewerDrawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { useFactbookStore } from "@/lib/store";
import {
  SECTION_LABELS,
  type ProjectBundle,
  type SlideDraft,
  type SourceItemDetail,
} from "@/lib/types";

export type InspectorTab = "EDIT" | "EVIDENCE" | "AI";

const PRESET_PROMPTS = [
  "헤드카피를 수치 중심의 전략 보고서 톤으로 다듬어 줘",
  "경쟁사 대비 차별화 포인트를 불릿 첫 줄에 강조해 줘",
  "소비자 아쉬움 요인과 실행 제안 연결을 강화해 줘",
];

export function RightInspector({
  bundle,
  slide,
  activeTab,
  onTabChange,
  focusedFactId,
}: {
  bundle: ProjectBundle;
  slide: SlideDraft;
  activeTab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  focusedFactId: string | null;
}) {
  const {
    updateSlide,
    loadSourceDetail,
    bulkUpdateSourceStatus,
    previewCommentDiff,
    decideCommentDiff,
  } = useFactbookStore();
  const { pushToast } = useToast();

  const [commentText, setCommentText] = useState("");
  const [inspectSource, setInspectSource] = useState<SourceItemDetail | null>(null);
  const activeDiff = bundle.active_comment_diffs[slide.id];

  const liveInspectSource = useMemo(
    () =>
      inspectSource
        ? bundle.sources.find((s) => s.id === inspectSource.id) ?? inspectSource
        : null,
    [inspectSource, bundle.sources]
  );

  const openEvidenceDrawer = (src: SourceItemDetail) => {
    setInspectSource(src);
    if (!src.content) {
      void loadSourceDetail(bundle.project.id, src.id).catch(() => {
        pushToast({
          tone: "warning",
          title: "원문 상세 내용을 불러오지 못했습니다.",
        });
      });
    }
  };

  useEffect(() => {
    setCommentText("");
  }, [slide.id]);

  const linkedSources = useMemo(() => {
    const citedIds = new Set(
      slide.bullets.map((b) => b.fact_id).filter((id): id is string => Boolean(id))
    );
    const asIsIds = new Set(slide.as_is_to_be?.linked_fact_ids ?? []);
    const allIds = new Set([...citedIds, ...asIsIds]);

    const exactMatches = bundle.sources.filter((s) => allIds.has(s.id));
    const sectionMatches = bundle.sources.filter(
      (s) => s.section_code === slide.section_code && !allIds.has(s.id)
    );
    return [...exactMatches, ...sectionMatches];
  }, [bundle.sources, slide.as_is_to_be, slide.bullets, slide.section_code]);

  const handlePreviewAi = async () => {
    if (!commentText.trim()) {
      pushToast({
        tone: "warning",
        title: "수정 코멘트를 입력해 주세요.",
      });
      return;
    }
    await previewCommentDiff(bundle.project.id, slide.id, commentText.trim());
    pushToast({
      tone: "info",
      title: "AI 수정 Diff 초안이 생성되었습니다.",
      description: "변경 전/후를 비교한 뒤 [반영 확정] 또는 [원복]을 선택하세요.",
    });
  };

  const handleApplyDiff = () => {
    if (!activeDiff) return;
    decideCommentDiff(bundle.project.id, slide.id, activeDiff.comment_id, "APPLY");
    setCommentText("");
    pushToast({
      tone: "success",
      title: "AI 수정안이 슬라이드에 반영되었습니다.",
    });
  };

  const handleRevertDiff = () => {
    if (!activeDiff) return;
    decideCommentDiff(bundle.project.id, slide.id, activeDiff.comment_id, "REVERT");
    pushToast({
      tone: "info",
      title: "AI 수정 제안을 취소하고 원본을 유지했습니다.",
    });
  };

  return (
    <aside className="flex h-full flex-col border-l border-[#E5E5E5] bg-white min-h-0">
      <div className="grid h-[38px] shrink-0 grid-cols-3 border-b border-[#E5E5E5] bg-white">
        <button
          type="button"
          onClick={() => onTabChange("EDIT")}
          className={`flex items-center justify-center border-b-2 text-[13px] transition-colors cursor-pointer ${
            activeTab === "EDIT"
              ? "border-[#111111] font-semibold text-[#111111]"
              : "border-transparent font-medium text-[#8C8C8C] hover:text-[#111111]"
          }`}
        >
          서식·편집
        </button>

        <button
          type="button"
          onClick={() => onTabChange("EVIDENCE")}
          className={`flex items-center justify-center gap-1 border-b-2 text-[13px] transition-colors cursor-pointer ${
            activeTab === "EVIDENCE"
              ? "border-[#111111] font-semibold text-[#111111]"
              : "border-transparent font-medium text-[#8C8C8C] hover:text-[#111111]"
          }`}
        >
          <span>근거</span>
          <span className="text-[11px] tabular-nums text-[#8C8C8C]">
            {linkedSources.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange("AI")}
          className={`flex items-center justify-center gap-1.5 border-b-2 text-[13px] transition-colors cursor-pointer ${
            activeTab === "AI"
              ? "border-[#111111] font-semibold text-[#111111]"
              : "border-transparent font-medium text-[#8C8C8C] hover:text-[#111111]"
          }`}
        >
          <span>AI</span>
          {activeDiff && (
            <span className="h-1.5 w-1.5 rounded-full bg-[#E9501F]" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3.5">
        {activeTab === "EDIT" && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className="block text-[12px] text-[#4A4A4A]">
                슬라이드 제목
              </label>
              <input
                type="text"
                value={slide.title}
                onChange={(e) =>
                  updateSlide(bundle.project.id, slide.id, {
                    title: e.target.value,
                  })
                }
                className="w-full h-8 rounded-[8px] border border-[#D4D4D4] bg-white px-2.5 text-xs font-semibold text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[12px] text-[#4A4A4A]">
                상단 헤드카피 (Key Message)
              </label>
              <textarea
                rows={3}
                value={slide.headcopy}
                onChange={(e) =>
                  updateSlide(bundle.project.id, slide.id, {
                    headcopy: e.target.value,
                  })
                }
                className="w-full rounded-[8px] border border-[#D4D4D4] bg-white p-2.5 text-xs leading-relaxed text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            {slide.kpi_cards.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[12px] text-[#4A4A4A]">
                  KPI 수치
                </label>
                <div className="space-y-1.5">
                  {slide.kpi_cards.map((kpi, idx) => (
                    <div key={idx} className="grid grid-cols-2 gap-1.5">
                      <input
                        type="text"
                        value={kpi.label}
                        onChange={(e) => {
                          const next = slide.kpi_cards.map((c, cIdx) =>
                            cIdx === idx ? { ...c, label: e.target.value } : c
                          );
                          updateSlide(bundle.project.id, slide.id, {
                            kpi_cards: next,
                          });
                        }}
                        className="h-8 rounded-[8px] border border-[#D4D4D4] bg-white px-2 text-[11px] text-[#4A4A4A] focus:border-[#111111] focus:outline-none"
                      />
                      <input
                        type="text"
                        value={kpi.value}
                        onChange={(e) => {
                          const next = slide.kpi_cards.map((c, cIdx) =>
                            cIdx === idx ? { ...c, value: e.target.value } : c
                          );
                          updateSlide(bundle.project.id, slide.id, {
                            kpi_cards: next,
                          });
                        }}
                        className="h-8 rounded-[8px] border border-[#D4D4D4] bg-white px-2 text-[11px] font-bold tabular-nums text-[#111111] focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {slide.bullets.length > 0 && (
              <div className="space-y-1.5">
                <label className="block text-[12px] text-[#4A4A4A]">
                  본문 인사이트 ({slide.bullets.length})
                </label>
                {slide.bullets.map((bullet, idx) => (
                  <textarea
                    key={idx}
                    rows={3}
                    value={bullet.claim}
                    onChange={(e) => {
                      const next = slide.bullets.map((b, bIdx) =>
                        bIdx === idx ? { ...b, claim: e.target.value } : b
                      );
                      updateSlide(bundle.project.id, slide.id, {
                        bullets: next,
                      });
                    }}
                    className="w-full rounded-[8px] border border-[#D4D4D4] bg-white p-2 text-xs leading-relaxed text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                ))}
              </div>
            )}

            {slide.as_is_to_be && (
              <div className="space-y-1.5">
                <label className="block text-[12px] text-[#4A4A4A]">
                  TO-BE 전략 방향
                </label>
                {slide.as_is_to_be.to_be_directions.map((dir, idx) => (
                  <textarea
                    key={idx}
                    rows={2}
                    value={dir}
                    onChange={(e) => {
                      if (!slide.as_is_to_be) return;
                      const nextDirs = slide.as_is_to_be.to_be_directions.map(
                        (d, dIdx) => (dIdx === idx ? e.target.value : d)
                      );
                      updateSlide(bundle.project.id, slide.id, {
                        as_is_to_be: {
                          ...slide.as_is_to_be,
                          to_be_directions: nextDirs,
                        },
                      });
                    }}
                    className="w-full rounded-[8px] border border-[#D4D4D4] bg-white p-2 text-xs leading-relaxed text-[#111111] focus:border-[#111111] focus:outline-none"
                  />
                ))}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-[12px] text-[#4A4A4A]">
                슬라이드 각주
              </label>
              <input
                type="text"
                value={slide.footnote ?? ""}
                onChange={(e) =>
                  updateSlide(bundle.project.id, slide.id, {
                    footnote: e.target.value,
                  })
                }
                placeholder="출처 및 산출 기준 입력..."
                className="w-full h-8 rounded-[8px] border border-[#D4D4D4] bg-white px-2.5 text-[11px] text-[#4A4A4A] focus:border-[#111111] focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeTab === "EVIDENCE" && (
          <div>
            <p className="mb-3 text-[12px] leading-relaxed text-[#8C8C8C]">
              {SECTION_LABELS[slide.section_code]} 장표에 인용된 근거 자료입니다.
            </p>

            {linkedSources.length === 0 ? (
              <p className="py-8 text-center text-xs text-[#8C8C8C]">
                연결된 텍스트 원문이 없습니다.
              </p>
            ) : (
              <div className="divide-y divide-[#E5E5E5]">
                {linkedSources.map((src) => {
                  const isFocused = focusedFactId === src.id;
                  return (
                    <div
                      key={src.id}
                      className={`py-3 ${
                        isFocused ? "-mx-2 rounded-[8px] bg-[#F5F5F5] px-2" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-[#4A4A4A]">
                          {src.channel}
                        </span>
                        <StatusBadge
                          tone={
                            src.review_status === "APPROVED"
                              ? "teal"
                              : src.review_status === "REJECTED"
                                ? "coral"
                                : "amber"
                          }
                        >
                          {src.review_status === "APPROVED"
                            ? "승인됨"
                            : src.review_status === "REJECTED"
                              ? "제외됨"
                              : "검토 대기"}
                        </StatusBadge>
                      </div>

                      <h5 className="mt-1 text-[13px] font-semibold text-[#111111]">
                        {src.title}
                      </h5>

                      {src.evidence_quote && (
                        <blockquote className="mt-1.5 border-l-2 border-[#111111] pl-2.5 text-[12px] leading-relaxed text-[#111111]">
                          “<InlineMarkdown text={src.evidence_quote} />”
                        </blockquote>
                      )}

                      {src.content && (
                        <p className="mt-1.5 line-clamp-3 text-[12px] leading-relaxed text-[#4A4A4A]">
                          {stripMarkdownInline(src.content)}
                        </p>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => openEvidenceDrawer(src)}
                            className="inline-flex items-center gap-1 rounded-[6px] border border-[#D4D4D4] bg-white px-2 py-0.5 text-[11px] font-medium text-[#111111] hover:bg-[#FAFAFA] cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            원문 보기
                          </button>
                          {src.source_url ? (
                            <a
                              href={src.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4A4A4A] hover:text-[#111111] hover:underline"
                            >
                              원문 링크
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="text-[11px] text-[#8C8C8C]">
                              {src.published_at ?? ""}
                            </span>
                          )}
                        </div>

                        {src.review_status !== "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => {
                              bulkUpdateSourceStatus(bundle.project.id, {
                                sourceIds: [src.id],
                                reviewStatus: "APPROVED",
                              });
                              pushToast({
                                tone: "success",
                                title: "근거 자료가 승인되었습니다.",
                              });
                            }}
                            className="inline-flex items-center gap-1 rounded-[6px] bg-[#111111] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#262626] cursor-pointer"
                          >
                            <Check className="h-3 w-3" />
                            근거 승인
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === "AI" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[12px] font-medium text-[#111111]">
                AI 수정 코멘트
              </label>
              <textarea
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="예: 경쟁사 대비 검색 점유율 격차를 헤드카피에 부각하고 전략 제안서 톤으로 정리해 줘."
                className="w-full rounded-[8px] border border-[#D4D4D4] bg-white p-2.5 text-xs leading-relaxed text-[#111111] placeholder:text-[#8C8C8C] focus:border-[#111111] focus:outline-none"
              />

              <div className="flex flex-col gap-1">
                {PRESET_PROMPTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCommentText(preset)}
                    className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] px-2.5 py-1.5 text-left text-[11px] text-[#4A4A4A] hover:border-[#111111]/40 hover:text-[#111111] cursor-pointer"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              <AsyncActionButton
                variant="primary"
                size="sm"
                loadingText="AI 수정 Diff 생성 중..."
                onAction={handlePreviewAi}
                className="w-full"
              >
                <Wand2 className="h-3.5 w-3.5" />
                AI 수정안 미리보기
              </AsyncActionButton>
            </div>

            {activeDiff && (
              <div className="space-y-3 rounded-[8px] border border-[#D4D4D4] bg-[#FAFAFA] p-3">
                <div className="flex items-center justify-between">
                  <StatusBadge tone="obsidian">미리보기 대기</StatusBadge>
                  <span className="text-[11px] text-[#4A4A4A]">변경 비교</span>
                </div>

                <div className="rounded-[6px] border border-[#E5E5E5] bg-white px-2.5 py-2 text-[11px] text-[#4A4A4A]">
                  <span className="font-semibold text-[#111111]">요청: </span>
                  {activeDiff.refined_comment}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-[#4A4A4A]">
                    헤드카피 변경
                  </p>
                  <div className="rounded-[6px] border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-2 text-[11px] text-[#DC2626] line-through">
                    {activeDiff.before_draft.headcopy}
                  </div>
                  <div className="rounded-[6px] border border-[#BBE5D0] bg-white px-2.5 py-2 text-[11px] font-semibold text-[#111111]">
                    {activeDiff.after_draft.headcopy}
                  </div>
                </div>

                {activeDiff.after_draft.bullets[0] && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-medium text-[#4A4A4A]">
                      인사이트 변경안
                    </p>
                    <div className="rounded-[6px] border border-[#E5E5E5] bg-white px-2.5 py-2 text-[11px] text-[#111111]">
                      {activeDiff.after_draft.bullets[0].claim}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleRevertDiff}
                    className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white text-xs font-medium text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                    원복
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyDiff}
                    className="inline-flex h-8 items-center justify-center gap-1 whitespace-nowrap rounded-[8px] bg-[#111111] text-xs font-medium text-white hover:bg-[#262626] cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                    반영 확정
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <SourceViewerDrawer
        source={liveInspectSource}
        onClose={() => setInspectSource(null)}
      />
    </aside>
  );
}
