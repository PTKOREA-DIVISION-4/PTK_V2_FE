"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Sparkles,
} from "lucide-react";
import type { JobStatusResponse } from "@/lib/types";

function formatElapsed(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function SlideGenerationMonitor({
  job,
  slideCount,
  mode,
}: {
  job: JobStatusResponse;
  slideCount: number;
  mode: "full" | "banner";
}) {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const isRunning = job.status === "RUNNING" || job.status === "PENDING";

  useEffect(() => {
    if (!isRunning) {
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
  }, [isRunning, job.id]);

  const completedCount = job.subtasks.filter((s) => s.status === "COMPLETED").length;
  const totalCount = Math.max(1, job.subtasks.length);
  const pct = isRunning
    ? Math.max(6, Math.min(99, job.progress_pct || Math.round((completedCount / totalCount) * 100)))
    : 100;
  const latestLog = job.logs[job.logs.length - 1] ?? "장표 생성 파이프라인 준비 중...";

  if (mode === "banner") {
    return (
      <div className="shrink-0 border-b border-[#F9C8B8] bg-[#FFF8F5]">
        <div className="h-1 w-full overflow-hidden bg-[#F5E1D8]">
          <div
            className="progress-bar-shimmer h-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[5px] border border-[#F9C8B8] bg-white px-2 py-0.5 text-[11px] font-bold text-[#E9501F]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E9501F] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E9501F]" />
              </span>
              AI 장표 실시간 생성 중
            </span>
            <span className="text-[12px] font-bold tabular-nums text-[#111111]">
              {pct}%
            </span>
            <span className="text-[12px] text-[#737373] tabular-nums">
              단계 {completedCount}/{job.subtasks.length} · 장표 {slideCount}장
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-[#E9501F] tabular-nums">
              <Clock className="h-3 w-3" />
              {formatElapsed(elapsedSec)}
            </span>
            <span className="hidden truncate font-mono text-[11px] text-[#4A4A4A] xl:inline">
              {latestLog}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex shrink-0 items-center gap-1 rounded-[6px] border border-[#F9C8B8] bg-white px-2 py-1 text-[11px] font-semibold text-[#111111] hover:bg-[#FFF3EE] cursor-pointer"
          >
            {expanded ? "단계 접기" : "단계 보기"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>

        {expanded && (
          <div className="border-t border-[#F5E1D8] bg-white px-4 py-3">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
              {job.subtasks.map((st) => {
                const done = st.status === "COMPLETED";
                const running = st.status === "RUNNING";
                const failed = st.status === "FAILED";
                return (
                  <div
                    key={st.id}
                    className={`rounded-[6px] border px-2.5 py-1.5 text-[11px] ${
                      done
                        ? "border-[#BBE5D0] bg-[#F2FBF6]"
                        : running
                          ? "border-[#F9C8B8] bg-[#FFF8F5]"
                          : failed
                            ? "border-[#FECACA] bg-[#FEF2F2]"
                            : "border-[#E5E5E5] bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#1F8A5B]" />
                      ) : running ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#E9501F]" />
                      ) : failed ? (
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-[#DC2626]" />
                      ) : (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#D4D4D4]" />
                      )}
                      <span className="truncate font-semibold text-[#111111]">
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full-stage loading view when initial blueprint slides are still assembling
  return (
    <div className="mx-auto flex w-full max-w-[980px] flex-col gap-5 p-6">
      <div className="overflow-hidden rounded-[12px] border border-[#F9C8B8] bg-white shadow-[0_8px_24px_-8px_rgba(233,80,31,0.16)]">
        <div className="h-1.5 w-full overflow-hidden bg-[#F5E1D8]">
          <div
            className="progress-bar-shimmer h-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>

        <div className="p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#111111] text-white">
                <Sparkles className="h-5 w-5 text-[#E9501F]" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#111111]">
                  AI 팩트북 장표 실시간 생성 중 ({pct}%)
                </h2>
                <p className="text-[12px] text-[#4A4A4A]">
                  표지·목차(INDEX) 골격을 먼저 구성한 뒤 8개 AI 배치가 병렬로 각 파트를 실시간 채웁니다.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[#F9C8B8] bg-[#FFF8F5] px-2.5 py-1 font-mono text-[12px] font-bold text-[#E9501F] tabular-nums">
              <Clock className="h-3.5 w-3.5" />
              {formatElapsed(elapsedSec)} 경과
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
            {job.subtasks.map((st) => {
              const done = st.status === "COMPLETED";
              const running = st.status === "RUNNING";
              return (
                <div
                  key={st.id}
                  className={`rounded-[8px] border p-2.5 transition-colors ${
                    done
                      ? "border-[#BBE5D0] bg-[#F2FBF6]"
                      : running
                        ? "border-[#F9C8B8] bg-[#FFF8F5]"
                        : "border-[#E5E5E5] bg-[#FAFAFA]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#1F8A5B]" />
                    ) : running ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#E9501F]" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-[#D4D4D4]" />
                    )}
                    <span className="text-[11px] font-semibold tabular-nums text-[#737373]">
                      {done ? "완료" : running ? "생성 중" : "대기"}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[11.5px] font-semibold leading-snug text-[#111111]">
                    {st.label}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-[8px] border border-[#262626] bg-[#111111] px-3.5 py-2.5 font-mono text-[11px] text-[#D4D4D4]">
            {job.logs.slice(-4).map((line, i) => (
              <p key={i} className="truncate leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* 16:9 Slide Skeleton Preview */}
      <div className="aspect-[16/9] w-full rounded-[12px] border border-[#E5E5E5] bg-white p-6 shadow-xs">
        <div className="skeleton-shimmer h-4 w-36 rounded" />
        <div className="skeleton-shimmer mt-3 h-7 w-2/3 rounded" />
        <div className="skeleton-shimmer mt-3 h-12 w-full rounded-[8px]" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="skeleton-shimmer h-20 rounded-[8px]" />
          <div className="skeleton-shimmer h-20 rounded-[8px]" />
          <div className="skeleton-shimmer h-20 rounded-[8px]" />
        </div>
        <div className="skeleton-shimmer mt-4 h-36 rounded-[8px]" />
      </div>
    </div>
  );
}
