"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LayoutGrid } from "lucide-react";
import { DataCollectionView } from "@/features/data-collection/DataCollectionView";
import { FactReviewStudio } from "@/features/fact-review/FactReviewStudio";
import { OverviewGrid } from "@/features/fact-review/OverviewGrid";
import { PptExportView } from "@/features/ppt-export/PptExportView";
import { ProjectBriefModal } from "@/features/project-setup/ProjectBriefModal";
import { useFactbookStore } from "@/lib/store";

export type StudioMode = "COLLECT" | "REVIEW" | "OVERVIEW" | "EXPORT";

export function StudioShell({ projectId }: { projectId: string }) {
  const {
    getBundle,
    getWorkflowMeta,
    syncState,
    ensureProjectLoaded,
    loadingList,
    loadingProjectId,
  } = useFactbookStore();
  const bundle = getBundle(projectId);

  const [mode, setMode] = useState<StudioMode>(() =>
    bundle && (bundle.last_job.status === "RUNNING" || bundle.slides.length === 0)
      ? "COLLECT"
      : "REVIEW"
  );
  const [selectedSlideId, setSelectedSlideId] = useState<string>(
    () => bundle?.slides[0]?.id ?? ""
  );
  const [briefOpen, setBriefOpen] = useState(false);
  const initialModeSetRef = useRef(false);

  useEffect(() => {
    initialModeSetRef.current = false;
    void ensureProjectLoaded(projectId);
  }, [ensureProjectLoaded, projectId]);

  useEffect(() => {
    if (!bundle?.loaded) return;
    if (!initialModeSetRef.current) {
      initialModeSetRef.current = true;
      if (bundle.last_job.status === "RUNNING" || bundle.slides.length === 0) {
        setMode("COLLECT");
      }
    }
    if (!selectedSlideId && bundle.slides[0]?.id) {
      setSelectedSlideId(bundle.slides[0].id);
    }
  }, [bundle?.loaded, bundle?.last_job.status, bundle?.slides, selectedSlideId]);

  const workflowMeta = useMemo(
    () => (bundle ? getWorkflowMeta(bundle) : null),
    [bundle, getWorkflowMeta]
  );

  if (loadingList || loadingProjectId === projectId || (bundle && !bundle.loaded)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#E5E5E5] border-t-[#111111]" />
        <p className="mt-3 text-sm font-medium text-[#4A4A4A]">
          팩트북 워크스페이스 데이터를 불러오는 중입니다...
        </p>
      </div>
    );
  }

  if (!bundle || !workflowMeta) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center">
        <h1 className="text-lg font-bold text-[#111111]">
          프로젝트를 찾을 수 없습니다
        </h1>
        <p className="mt-1.5 text-[13px] text-[#4A4A4A]">
          삭제되었거나 존재하지 않는 팩트북 ID ({projectId}) 입니다.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-[#111111] px-4 text-[13px] font-medium text-white hover:bg-[#262626]"
        >
          <ArrowLeft className="h-4 w-4" />
          문서 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const handleOpenSlideFromOtherMode = (slideId: string) => {
    setSelectedSlideId(slideId);
    setMode("REVIEW");
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F5F5] text-[#111111]">
      {/* Light-Mode Black-Main + Orange-Point 2-Tier Header */}
      <header className="sticky top-0 z-30 bg-white">
        <div className="h-[2px] w-full bg-[#E9501F]" />

        {/* TIER 1: Crisp White Title Bar (40px) */}
        <div className="flex h-[40px] items-center justify-between border-b border-[#E5E5E5] bg-white px-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[#111111] hover:opacity-80 transition-opacity"
              title="문서 목록으로"
            >
              <span className="text-[13px] font-bold tracking-tight">
                Division 4
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#E9501F]" />
            </Link>

            <Link
              href="/"
              className="inline-flex h-6 w-6 items-center justify-center rounded-[6px] text-[#4A4A4A] hover:bg-[#F5F5F5] hover:text-[#111111]"
              aria-label="문서 목록으로 돌아가기"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Link>

            <span className="hidden text-[12px] text-[#8C8C8C] sm:inline">
              {syncState === "saving" ? "저장 중..." : "저장됨"}
            </span>
          </div>

          <div className="min-w-0 px-4 text-center">
            <p className="truncate text-[13px] font-semibold text-[#111111]">
              {bundle.project.name}
            </p>
          </div>

          <div className="hidden shrink-0 items-center gap-2 text-[11px] text-[#8C8C8C] md:flex">
            <span>{bundle.project.brand_name}</span>
            <span>·</span>
            <span className="tabular-nums">
              {bundle.project.period_start} ~ {bundle.project.period_end}
            </span>
          </div>
        </div>

        {/* TIER 2: Menu & Action Bar (42px) */}
        <div className="flex h-[42px] items-center justify-between gap-3 border-b border-[#E5E5E5] bg-[#FAFAFA] px-3.5">
          <nav className="flex h-full items-center gap-1 overflow-x-auto">
            {(
              [
                {
                  key: "COLLECT",
                  label: `자료·수집 풀 (${workflowMeta.total_sources_count})`,
                },
                {
                  key: "REVIEW",
                  label: `장표 스튜디오 (${workflowMeta.approved_slides_count}/${workflowMeta.total_slides_count})`,
                },
                {
                  key: "OVERVIEW",
                  label: "전체 모아보기",
                },
                {
                  key: "EXPORT",
                  label: "사전 QC · 출력",
                },
              ] as const
            ).map((tab) => {
              const active = mode === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMode(tab.key)}
                  className={`flex h-full shrink-0 items-center border-b-2 px-3 text-[13px] transition-colors cursor-pointer ${
                    active
                      ? "border-[#111111] font-semibold text-[#111111]"
                      : "border-transparent font-medium text-[#4A4A4A] hover:text-[#111111]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => setBriefOpen(true)}
              className="inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white px-2.5 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
            >
              요청·자료
            </button>
            <button
              type="button"
              onClick={() => setMode("OVERVIEW")}
              className="hidden sm:inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white px-2.5 text-[12px] font-medium text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
            >
              <LayoutGrid className="h-3.5 w-3.5 shrink-0 text-[#4A4A4A]" />
              모아보기
            </button>
            <button
              type="button"
              onClick={() => setMode("EXPORT")}
              className="inline-flex h-[30px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#111111] px-3 text-[12px] font-medium text-white hover:bg-[#262626] cursor-pointer"
            >
              PPTX로 내보내기
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 min-h-0">
        {mode === "COLLECT" && (
          <DataCollectionView
            bundle={bundle}
            onGoToStudio={() => setMode("REVIEW")}
          />
        )}
        {mode === "REVIEW" && (
          <FactReviewStudio
            bundle={bundle}
            selectedSlideId={selectedSlideId}
            onSelectSlide={setSelectedSlideId}
            onGoToExport={() => setMode("EXPORT")}
            onGoToCollection={() => setMode("COLLECT")}
          />
        )}
        {mode === "OVERVIEW" && (
          <OverviewGrid
            bundle={bundle}
            onOpenSlide={handleOpenSlideFromOtherMode}
          />
        )}
        {mode === "EXPORT" && (
          <PptExportView
            bundle={bundle}
            onJumpToSlide={handleOpenSlideFromOtherMode}
            onGoToCollection={() => setMode("COLLECT")}
          />
        )}
      </main>

      <ProjectBriefModal
        open={briefOpen}
        onClose={() => setBriefOpen(false)}
        bundle={bundle}
      />
    </div>
  );
}
