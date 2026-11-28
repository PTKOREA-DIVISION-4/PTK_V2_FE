"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Radio,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { JobStatusResponse, SourceFacetCounts } from "@/lib/types";

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function CollectionProgressPanel({
  job,
  facets,
  isCollecting,
  expanded,
  onToggleExpand,
  actions,
}: {
  job: JobStatusResponse;
  facets: SourceFacetCounts;
  isCollecting: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  actions: React.ReactNode;
}) {
  const [elapsedSec, setElapsedSec] = useState(0);

  useEffect(() => {
    if (!isCollecting) {
      setElapsedSec(0);
      return;
    }
    const startMs = Date.now();
    const tick = () => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - startMs) / 1000)));
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [isCollecting, job.id]);

  const completedSubtasks = job.subtasks.filter((s) => s.status === "COMPLETED").length;
  const failedSubtasks = job.subtasks.filter((s) => s.status === "FAILED");
  const totalSubtasks = job.subtasks.length;
  const barPct = isCollecting
    ? Math.max(8, Math.min(99, job.progress_pct || Math.round((completedSubtasks / Math.max(1, totalSubtasks)) * 100)))
    : job.status === "COMPLETED"
      ? 100
      : job.progress_pct;

  const badgeMeta = isCollecting
    ? { tone: "indigo" as const, label: "실시간 수집 중" }
    : job.status === "COMPLETED"
      ? { tone: "teal" as const, label: "수집 완료" }
      : job.status === "PARTIAL_SUCCESS"
        ? { tone: "amber" as const, label: `부분 완료 (${failedSubtasks.length}개 재시도 권장)` }
        : job.status === "FAILED"
          ? { tone: "coral" as const, label: "수집 오류" }
          : { tone: "slate" as const, label: "수집 대기" };

  return (
    <section
      aria-busy={isCollecting}
      className={`overflow-hidden rounded-[12px] border bg-white transition-colors ${
        isCollecting ? "border-[#F9C8B8] shadow-[0_4px_18px_-6px_rgba(233,80,31,0.16)]" : "border-[#E5E5E5]"
      }`}
    >
      {/* Animated Top Progress Strip */}
      <div className="h-1.5 w-full overflow-hidden bg-[#EFEFEF]">
        <div
          className={`h-full transition-all duration-500 ${
            isCollecting
              ? "progress-bar-shimmer"
              : job.status === "FAILED"
                ? "bg-[#DC2626]"
                : job.status === "PARTIAL_SUCCESS"
                  ? "bg-[#D97706]"
                  : "bg-[#1F8A5B]"
          }`}
          style={{ width: `${barPct}%` }}
        />
      </div>

      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          {isCollecting ? (
            <span className="inline-flex shrink-0 items-center gap-2 rounded-[6px] border border-[#F9C8B8] bg-[#FFF3EE] px-2.5 py-1 text-[12px] font-bold text-[#E9501F]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E9501F] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E9501F]" />
              </span>
              실시간 수집 중
            </span>
          ) : (
            <StatusBadge tone={badgeMeta.tone} dot>
              {badgeMeta.label}
            </StatusBadge>
          )}

          <div className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-[#111111]">
            <span>
              진행률{" "}
              <strong className="font-bold tabular-nums text-[#111111]">
                {job.progress_pct}%
              </strong>
            </span>
            {totalSubtasks > 0 && (
              <>
                <span className="text-[#E5E5E5]">|</span>
                <span className="text-[12px] text-[#4A4A4A] tabular-nums">
                  단계 <strong>{completedSubtasks}</strong>/{totalSubtasks}
                </span>
              </>
            )}
            {isCollecting && (
              <>
                <span className="text-[#E5E5E5]">|</span>
                <span className="inline-flex items-center gap-1 rounded-[5px] bg-[#FAFAFA] px-2 py-0.5 font-mono text-[12px] font-semibold text-[#E9501F] tabular-nums">
                  <Clock className="h-3 w-3" />
                  {formatElapsed(elapsedSec)} 경과
                </span>
              </>
            )}
            <span className="text-[#E5E5E5]">|</span>
            <span className="text-[12px] text-[#4A4A4A] tabular-nums">
              총 원문 <strong>{facets.total}</strong>건 · 승인{" "}
              <strong className="text-[#1F8A5B]">
                {facets.by_review_status.APPROVED ?? 0}
              </strong>
              건 · 대기{" "}
              <strong className="text-[#C26B00]">
                {facets.by_review_status.PENDING ?? 0}
              </strong>
              건
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-[8px] px-2.5 text-xs font-medium text-[#4A4A4A] hover:bg-[#F5F5F5] cursor-pointer"
          >
            세부 작업
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* Subtasks Grid & Live Logs */}
      {expanded && (
        <div className="space-y-3 border-t border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3.5">
          <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {job.subtasks.map((st) => {
              const isRun = st.status === "RUNNING";
              const isDone = st.status === "COMPLETED";
              const isFail = st.status === "FAILED";

              return (
                <div
                  key={st.id}
                  className={`flex flex-col justify-between gap-2 rounded-[8px] border px-3 py-2.5 transition-colors ${
                    isFail
                      ? "border-[#FECACA] bg-[#FEF2F2]"
                      : isRun
                        ? "border-[#F9C8B8] bg-[#FFF8F5]"
                        : isDone
                          ? "border-[#E5E5E5] bg-white"
                          : "border-[#E5E5E5] bg-[#F5F5F5]/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 text-[12px] font-semibold text-[#111111]">
                        {isDone ? (
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#1F8A5B]" />
                        ) : isRun ? (
                          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#E9501F]" />
                        ) : isFail ? (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#DC2626]" />
                        ) : (
                          <Clock className="h-3.5 w-3.5 shrink-0 text-[#8C8C8C]" />
                        )}
                        <span className="truncate">{st.label}</span>
                      </div>

                      {st.error_message ? (
                        <p className="mt-1 line-clamp-2 text-[11px] text-[#DC2626]">
                          {st.error_message}
                        </p>
                      ) : isDone ? (
                        <p className="mt-1 text-[11px] font-medium text-[#1F8A5B] tabular-nums">
                          수집 완료 · {st.collected_count}건
                        </p>
                      ) : isRun ? (
                        <p className="mt-1 text-[11px] font-medium text-[#E9501F]">
                          API 데이터 수집 및 정제 진행 중...
                        </p>
                      ) : (
                        <p className="mt-1 text-[11px] text-[#8C8C8C]">
                          실행 대기 중
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 font-mono text-[11px] font-semibold tabular-nums ${
                        isRun
                          ? "text-[#E9501F]"
                          : isDone
                            ? "text-[#1F8A5B]"
                            : isFail
                              ? "text-[#DC2626]"
                              : "text-[#8C8C8C]"
                      }`}
                    >
                      {st.progress_pct}%
                    </span>
                  </div>

                  {/* Mini subtask bar */}
                  <div className="h-1 w-full overflow-hidden rounded-full bg-[#EFEFEF]">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isRun
                          ? "progress-bar-shimmer"
                          : isDone
                            ? "bg-[#1F8A5B]"
                            : isFail
                              ? "bg-[#DC2626]"
                              : "bg-[#D4D4D4]"
                      }`}
                      style={{
                        width: `${isRun ? Math.max(20, st.progress_pct) : st.progress_pct}%`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {job.logs.length > 0 && (
            <div className="rounded-[8px] border border-[#E5E5E5] bg-white px-3.5 py-2.5">
              <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-[#4A4A4A]">
                <span className="inline-flex items-center gap-1.5">
                  <Radio
                    className={`h-3.5 w-3.5 ${
                      isCollecting ? "animate-pulse text-[#E9501F]" : "text-[#8C8C8C]"
                    }`}
                  />
                  실시간 수집 로그
                </span>
                <span className="font-mono text-[#8C8C8C] tabular-nums">
                  최근 {Math.min(4, job.logs.length)}건
                </span>
              </div>
              <ul className="space-y-1 font-mono text-[11px] text-[#4A4A4A]">
                {job.logs.slice(-4).map((line, i, arr) => {
                  const isNewest = i === arr.length - 1;
                  return (
                    <li
                      key={`${i}-${line.slice(0, 24)}`}
                      className={`flex items-center gap-2 truncate ${
                        isNewest && isCollecting ? "font-semibold text-[#111111]" : ""
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          isNewest && isCollecting ? "bg-[#E9501F]" : "bg-[#D4D4D4]"
                        }`}
                      />
                      <span className="truncate">{line}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export function SourcesTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E5E5E5] bg-white">
      <div className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#FFF8F5] px-4 py-2.5">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#E9501F]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>다중 채널에서 원문·근거 문장을 실시간으로 수집하고 있습니다...</span>
        </div>
        <span className="text-[11px] text-[#8C8C8C]">
          수집이 완료된 항목부터 순차적으로 목록에 표시됩니다
        </span>
      </div>

      <table className="w-full text-left text-xs">
        <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[11px] font-semibold text-[#4A4A4A]">
          <tr>
            <th className="w-10 px-4 py-3" />
            <th className="w-36 px-3 py-3">목차</th>
            <th className="w-28 px-3 py-3">채널</th>
            <th className="px-3 py-3">제목 · 핵심 인용문</th>
            <th className="w-20 px-3 py-3">감성</th>
            <th className="w-24 px-3 py-3">상태</th>
            <th className="w-24 px-3 py-3">수집일</th>
            <th className="w-36 px-4 py-3 text-right">검수 액션</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E5E5E5]">
          {Array.from({ length: rows }).map((_, idx) => (
            <tr key={idx} className="bg-white">
              <td className="px-4 py-3.5 text-center">
                <div className="skeleton-shimmer mx-auto h-4 w-4 rounded-[4px]" />
              </td>
              <td className="px-3 py-3.5">
                <div className="skeleton-shimmer h-5 w-20 rounded-[6px]" />
              </td>
              <td className="px-3 py-3.5">
                <div className="skeleton-shimmer h-5 w-24 rounded-[6px]" />
              </td>
              <td className="px-3 py-3.5 space-y-2">
                <div
                  className="skeleton-shimmer h-4 rounded-[4px]"
                  style={{ width: `${72 - (idx % 3) * 10}%` }}
                />
                <div
                  className="skeleton-shimmer h-3 rounded-[4px]"
                  style={{ width: `${55 + (idx % 2) * 15}%` }}
                />
              </td>
              <td className="px-3 py-3.5">
                <div className="skeleton-shimmer h-5 w-12 rounded-[6px]" />
              </td>
              <td className="px-3 py-3.5">
                <div className="skeleton-shimmer h-5 w-16 rounded-[6px]" />
              </td>
              <td className="px-3 py-3.5">
                <div className="skeleton-shimmer h-4 w-16 rounded-[4px]" />
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="skeleton-shimmer ml-auto h-6 w-24 rounded-[6px]" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SourcesRefreshingBanner() {
  return (
    <div className="rounded-[10px] border border-[#F9C8B8] bg-[#FFF8F5] px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[#E9501F]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>최신 원문 재수집 진행 중 — 신규 수집 건이 아래 목록에 실시간 반영됩니다.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="skeleton-shimmer h-2.5 w-20 rounded-full" />
          <span className="skeleton-shimmer h-2.5 w-14 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function DataLabSkeleton() {
  const barWidths = [68, 84, 52, 74];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[8px] border border-[#F9C8B8] bg-[#FFF8F5] px-4 py-2.5 text-[12px] font-semibold text-[#E9501F]">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          네이버 데이터랩 검색·쇼핑 인사이트 시계열을 집계하는 중입니다...
        </span>
        <span className="skeleton-shimmer h-5 w-28 rounded-[6px]" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="skeleton-shimmer h-4 w-56 rounded-[4px]" />
            <div className="skeleton-shimmer h-3 w-32 rounded-[4px]" />
          </div>
          <div className="flex h-52 items-end gap-2 rounded-[8px] border border-[#F0F0F0] bg-[#FAFAFA] p-4">
            {[42, 58, 51, 76, 65, 88, 72, 94, 68, 79, 85, 62].map((h, i) => (
              <div
                key={i}
                className="skeleton-shimmer flex-1 rounded-t-[4px]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-5 space-y-4">
          <div className="space-y-1.5">
            <div className="skeleton-shimmer h-4 w-52 rounded-[4px]" />
            <div className="skeleton-shimmer h-3 w-40 rounded-[4px]" />
          </div>
          <div className="flex h-52 flex-col justify-center gap-4 rounded-[8px] border border-[#F0F0F0] bg-[#FAFAFA] p-4">
            {barWidths.map((w, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="skeleton-shimmer h-4 w-24 rounded-[4px]" />
                <div
                  className="skeleton-shimmer h-5 rounded-[4px]"
                  style={{ width: `${w}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#E5E5E5] bg-white p-4 space-y-2.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-8 w-full rounded-[6px]" />
        ))}
      </div>
    </div>
  );
}

export function SnsTop5Skeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-[10px] border border-[#F9C8B8] bg-[#FFF8F5] px-4 py-2.5 text-[12px] font-semibold text-[#E9501F]">
        <span className="inline-flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          공식 SNS TOP 5 게시물·조회·썸네일 이미지를 수집 및 아카이빙하는 중입니다...
        </span>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#E5E5E5] bg-white">
        <div className="flex items-center justify-between border-b border-[#E5E5E5] bg-[#FAFAFA] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="skeleton-shimmer h-5 w-16 rounded-[6px]" />
            <div className="skeleton-shimmer h-5 w-32 rounded-[4px]" />
          </div>
          <div className="skeleton-shimmer h-5 w-28 rounded-[6px]" />
        </div>

        <div className="grid gap-3.5 p-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col overflow-hidden rounded-[10px] border border-[#E5E5E5] bg-white"
            >
              <div className="flex items-center justify-between border-b border-[#F0F0F0] bg-[#FAFAFA] px-3.5 py-2">
                <div className="skeleton-shimmer h-4 w-24 rounded-[4px]" />
                <div className="skeleton-shimmer h-4 w-16 rounded-[6px]" />
              </div>
              <div className="p-3.5 space-y-2.5">
                <div className="skeleton-shimmer aspect-[16/9] w-full rounded-[8px]" />
                <div className="skeleton-shimmer h-3.5 w-5/6 rounded-[4px]" />
                <div className="skeleton-shimmer h-3.5 w-2/3 rounded-[4px]" />
                <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-2.5">
                  <div className="skeleton-shimmer h-3.5 w-28 rounded-[4px]" />
                  <div className="skeleton-shimmer h-3.5 w-16 rounded-[4px]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
