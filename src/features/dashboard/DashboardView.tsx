"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  LayoutGrid,
  List,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useFactbookStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { useToast } from "@/components/ui/ToastProvider";
import type { AnalysisTrack } from "@/lib/types";

type StatusTab = "ALL" | "IN_PROGRESS" | "READY";
type TrackFilter = "ALL" | AnalysisTrack;

export function DashboardView() {
  const { bundles, loadingList, getWorkflowMeta, deleteProject, refreshProjects } =
    useFactbookStore();
  const { pushToast } = useToast();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [sortBy, setSortBy] = useState<"updated" | "name">("updated");
  const [statusTab, setStatusTab] = useState<StatusTab>("ALL");
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const tabCounts = useMemo(() => {
    let ready = 0;
    let inProgress = 0;
    bundles.forEach((b) => {
      const meta = getWorkflowMeta(b);
      if (meta.can_export) ready += 1;
      else inProgress += 1;
    });
    return {
      ALL: bundles.length,
      IN_PROGRESS: inProgress,
      READY: ready,
    };
  }, [bundles, getWorkflowMeta]);

  const filteredBundles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const copy = bundles.filter((b) => {
      const meta = getWorkflowMeta(b);
      if (statusTab === "READY" && !meta.can_export) return false;
      if (statusTab === "IN_PROGRESS" && meta.can_export) return false;
      if (trackFilter !== "ALL" && b.project.analysis_track !== trackFilter) {
        return false;
      }
      if (q) {
        const hay = `${b.project.name} ${b.project.brand_name} ${b.project.product_name} ${b.project.industry_category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === "name") {
      copy.sort((a, b) => a.project.name.localeCompare(b.project.name, "ko"));
    } else {
      copy.sort((a, b) =>
        b.project.updated_at.localeCompare(a.project.updated_at)
      );
    }
    return copy;
  }, [bundles, getWorkflowMeta, statusTab, trackFilter, searchQuery, sortBy]);

  const targetToDelete = bundles.find((b) => b.project.id === deleteTargetId);

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#111111]">
      <div className="h-[2px] w-full shrink-0 bg-[#E9501F]" />

      {/* Full-Width 60px Desktop Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-[60px] border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-10">
          {/* Left: Brand + Horizontal Navigation Tabs */}
          <div className="flex h-full items-center gap-7 min-w-0">
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-[16px] font-bold tracking-tight whitespace-nowrap text-[#111111]">
                Division 4
              </span>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#E9501F]" />
            </div>

            <nav className="hidden md:flex h-full items-center gap-1">
              {(
                [
                  { key: "ALL", label: "전체 문서", count: tabCounts.ALL },
                  { key: "IN_PROGRESS", label: "진행 중", count: tabCounts.IN_PROGRESS },
                  { key: "READY", label: "출력 가능", count: tabCounts.READY },
                ] as const
              ).map((tab) => {
                const active = statusTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setStatusTab(tab.key)}
                    className={`flex h-full shrink-0 items-center gap-1.5 border-b-2 px-3 text-[13px] whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? "border-[#111111] font-semibold text-[#111111]"
                        : "border-transparent font-medium text-[#4A4A4A] hover:text-[#111111]"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[11px] tabular-nums ${
                        active ? "text-[#111111]" : "text-[#8C8C8C]"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Search + Reset + Primary CTA */}
          <div className="flex shrink-0 items-center gap-2.5">
            <div className="relative hidden sm:block w-56 lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C8C8C]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="브랜드, 제품, 문서명 검색..."
                className="h-9 w-full rounded-[8px] border border-[#D4D4D4] bg-[#FAFAFA] pl-9 pr-3 text-[13px] text-[#111111] placeholder:text-[#8C8C8C] focus:border-[#111111] focus:bg-white focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={async () => {
                await refreshProjects();
                pushToast({
                  tone: "info",
                  title: "프로젝트 목록을 새로고침했습니다.",
                });
              }}
              className="hidden sm:inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] px-3 text-[13px] font-medium text-[#4A4A4A] hover:bg-[#F5F5F5] hover:text-[#111111] transition-colors cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 shrink-0" />
              새로고침
            </button>

            <Link
              href="/projects/new"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#111111] px-4 text-[13px] font-medium text-white hover:bg-[#262626] transition-colors"
            >
              <Plus className="h-4 w-4 shrink-0" />
              새 팩트북
            </Link>
          </div>
        </div>
      </header>

      {/* Open Airy Desktop Document Library */}
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-8 lg:px-10">
        {/* Clean Toolbar Row */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-[22px] font-bold tracking-tight text-[#111111] whitespace-nowrap">
              문서
            </h1>

            <div className="inline-flex items-center rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] p-0.5">
              {(
                [
                  { key: "ALL", label: "전체 트랙" },
                  { key: "REVIEW_CENTRIC", label: "후기·실사용 중심" },
                  { key: "MARKET_CENTRIC", label: "시장·검색 지표 중심" },
                ] as const
              ).map((item) => {
                const active = trackFilter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setTrackFilter(item.key)}
                    className={`h-7 shrink-0 whitespace-nowrap rounded-[6px] px-3 text-xs font-medium transition-colors cursor-pointer ${
                      active
                        ? "bg-white text-[#111111] shadow-2xs"
                        : "text-[#4A4A4A] hover:text-[#111111]"
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <StyledSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "updated" | "name")}
              aria-label="정렬"
            >
              <option value="updated">최근 수정순</option>
              <option value="name">이름순</option>
            </StyledSelect>

            <div className="inline-flex h-9 items-center rounded-[8px] border border-[#D4D4D4] bg-white p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="카드 미리보기로 보기"
                className={`inline-flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors cursor-pointer ${
                  viewMode === "grid"
                    ? "bg-[#111111] text-white"
                    : "text-[#8C8C8C] hover:text-[#111111]"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="테이블 목록으로 보기"
                className={`inline-flex h-7 w-7 items-center justify-center rounded-[6px] transition-colors cursor-pointer ${
                  viewMode === "table"
                    ? "bg-[#111111] text-white"
                    : "text-[#8C8C8C] hover:text-[#111111]"
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {loadingList && bundles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#E5E5E5] bg-[#FAFAFA] py-24 text-center text-sm text-[#4A4A4A]">
            팩트북 워크스페이스를 불러오는 중입니다...
          </div>
        ) : filteredBundles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[12px] border border-[#E5E5E5] bg-[#FAFAFA] py-20 text-center">
            <Sparkles className="h-6 w-6 text-[#8C8C8C]" />
            <p className="mt-2.5 text-[15px] font-medium text-[#111111]">
              조건에 맞는 팩트북 문서가 없습니다
            </p>
            <p className="mt-1 text-[13px] text-[#8C8C8C]">
              상단 필터를 초기화하거나 새 팩트북을 시작해 보세요.
            </p>
            <Link
              href="/projects/new"
              className="mt-5 inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] bg-[#111111] px-4 text-[13px] font-medium text-white hover:bg-[#262626]"
            >
              <Plus className="h-4 w-4 shrink-0" />
              새 팩트북 만들기
            </Link>
          </div>
        ) : viewMode === "grid" ? (
          /* Clean 4-Column Desktop Cover Gallery */
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredBundles.map((bundle) => {
              const { project } = bundle;
              const meta = getWorkflowMeta(bundle);
              const accentColor =
                project.analysis_track === "REVIEW_CENTRIC"
                  ? "#E9501F"
                  : "#111111";

              return (
                <article key={project.id} className="group flex flex-col">
                  <Link
                    href={`/projects/${project.id}`}
                    className="relative flex aspect-[16/9] flex-col justify-between overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-white p-5 shadow-[0_1px_2px_rgba(17,17,17,0.03)] transition-all group-hover:border-[#111111] group-hover:shadow-[0_6px_20px_-10px_rgba(17,17,17,0.14)]"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-[10px] font-medium text-[#8C8C8C]">
                        {project.industry_category}
                      </span>
                      <span className="shrink-0 rounded-[6px] border border-[#E5E5E5] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#4A4A4A]">
                        PPT
                      </span>
                    </div>

                    <div>
                      <span
                        className="block h-[3px] w-7"
                        style={{ backgroundColor: accentColor }}
                      />
                      <p
                        className="mt-2 text-[10px] font-bold tracking-wide"
                        style={{ color: accentColor }}
                      >
                        FACT BOOK
                      </p>
                      <p className="mt-1 truncate text-[17px] font-bold leading-tight text-[#111111]">
                        {project.brand_name}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[#4A4A4A]">
                        {project.product_name}
                      </p>
                    </div>

                    <span className="text-[10px] tabular-nums text-[#8C8C8C]">
                      {project.period_start} ~ {project.period_end}
                    </span>
                  </Link>

                  <div className="pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/projects/${project.id}`}
                        className="min-w-0 flex-1 truncate text-[14px] font-semibold text-[#111111] hover:underline"
                      >
                        {project.name}
                      </Link>
                      <StatusBadge
                        tone={meta.can_export ? "teal" : "amber"}
                        dot
                      >
                        {meta.can_export ? "출력 가능" : "진행 중"}
                      </StatusBadge>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-[12px] tabular-nums text-[#8C8C8C]">
                      <span>
                        {meta.total_slides_count > 0
                          ? `${meta.approved_slides_count}/${meta.total_slides_count}장 확정`
                          : `원문 ${meta.total_sources_count}건`}
                        {" · "}
                        {project.updated_at.slice(5, 10).replace("-", ".")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDeleteTargetId(project.id)}
                        className="rounded-[6px] p-1 text-[#8C8C8C] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer"
                        aria-label="프로젝트 삭제"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          /* Clean 7-Column Desktop Data Table */
          <div className="overflow-x-auto rounded-[12px] border border-[#E5E5E5] bg-white">
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-xs font-semibold text-[#4A4A4A]">
                <tr>
                  <th className="px-4 py-3 whitespace-nowrap">문서명 · 브랜드/제품</th>
                  <th className="px-4 py-3 whitespace-nowrap">산업군 · 트랙</th>
                  <th className="px-4 py-3 whitespace-nowrap">분석 기간</th>
                  <th className="px-4 py-3 whitespace-nowrap">진행 현황</th>
                  <th className="px-4 py-3 whitespace-nowrap">QC 상태</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">최근 수정</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {filteredBundles.map((bundle) => {
                  const { project } = bundle;
                  const meta = getWorkflowMeta(bundle);
                  const pct =
                    meta.total_slides_count > 0
                      ? Math.round(
                          (meta.approved_slides_count /
                            meta.total_slides_count) *
                            100
                        )
                      : 0;
                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-[#FAFAFA] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/projects/${project.id}`}
                          className="font-semibold text-[#111111] hover:underline"
                        >
                          {project.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-[#8C8C8C]">
                          {project.brand_name} · {project.product_name}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-xs font-medium text-[#111111]">
                          {project.industry_category}
                        </div>
                        <div className="text-[11px] text-[#8C8C8C]">
                          {project.analysis_track === "REVIEW_CENTRIC"
                            ? "후기·실사용 중심"
                            : "시장·검색 지표 중심"}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs tabular-nums whitespace-nowrap text-[#4A4A4A]">
                        {project.period_start} ~ {project.period_end}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-xs tabular-nums text-[#4A4A4A]">
                            <span>
                              {meta.total_slides_count > 0
                                ? `${meta.approved_slides_count}/${meta.total_slides_count}장`
                                : `원문 ${meta.total_sources_count}건`}
                            </span>
                            <span>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E5E5E5]">
                            <div
                              className="h-full bg-[#111111]"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge
                          tone={meta.can_export ? "teal" : "amber"}
                          dot
                        >
                          {meta.can_export ? "출력 가능" : "검토 필요"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3.5 text-right text-xs tabular-nums whitespace-nowrap text-[#8C8C8C]">
                        {project.updated_at.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/projects/${project.id}`}
                            className="inline-flex h-8 shrink-0 items-center whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white px-3 text-xs font-medium text-[#111111] hover:border-[#111111]"
                          >
                            열기
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(project.id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[#8C8C8C] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer"
                            aria-label="삭제"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal
        open={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        title="팩트북 삭제"
        description="삭제된 팩트북과 수집·검수 데이터는 데이터베이스에서 영구 삭제됩니다."
        maxWidthClass="max-w-md"
        footer={
          <>
            <AsyncActionButton
              variant="secondary"
              onClick={() => setDeleteTargetId(null)}
            >
              취소
            </AsyncActionButton>
            <AsyncActionButton
              variant="danger"
              onClick={async () => {
                if (deleteTargetId) {
                  await deleteProject(deleteTargetId);
                  pushToast({
                    tone: "info",
                    title: "프로젝트가 삭제되었습니다.",
                  });
                }
                setDeleteTargetId(null);
              }}
            >
              삭제하기
            </AsyncActionButton>
          </>
        }
      >
        <p className="text-[14px] text-[#4A4A4A]">
          <strong className="font-semibold text-[#111111]">
            {targetToDelete?.project.name}
          </strong>{" "}
          문서를 삭제할까요?
        </p>
      </Modal>
    </div>
  );
}
