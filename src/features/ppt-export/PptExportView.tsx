"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileDown,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";
import { getExportDownloadUrl } from "@/lib/api";
import { useFactbookStore } from "@/lib/store";
import {
  SECTION_LABELS,
  type ProjectBundle,
  type QcCheckItem,
  type QcReport,
  type QcSeverity,
} from "@/lib/types";

function getSeverityMeta(sev: QcSeverity) {
  if (sev === "PASS") {
    return {
      tone: "teal" as const,
      label: "PASS · 출력 가능",
      icon: CheckCircle2,
      boxClass: "border-[#BBE5D0] bg-[#F0FAF5] text-[#111111]",
    };
  }
  if (sev === "WARNING") {
    return {
      tone: "amber" as const,
      label: "WARNING · 권고 확인",
      icon: AlertTriangle,
      boxClass: "border-[#F5D8A8] bg-[#FFFBEB] text-[#111111]",
    };
  }
  return {
    tone: "coral" as const,
    label: "BLOCKER · 출력 차단",
    icon: AlertOctagon,
    boxClass: "border-[#FECACA] bg-[#FEF2F2] text-[#111111]",
  };
}

export function PptExportView({
  bundle,
  onJumpToSlide,
  onGoToCollection,
}: {
  bundle: ProjectBundle;
  onJumpToSlide: (slideId: string) => void;
  onGoToCollection: () => void;
}) {
  const { evaluateQc, runQc, createMockExport, switchSummarySplit } =
    useFactbookStore();
  const { pushToast } = useToast();

  const localQc = useMemo(() => evaluateQc(bundle), [bundle, evaluateQc]);
  const [serverQc, setServerQc] = useState<QcReport | null>(null);
  const qc = serverQc ?? localQc;
  const headerMeta = getSeverityMeta(qc.overall_status);
  const HeaderIcon = headerMeta.icon;

  const refreshServerQc = useCallback(async () => {
    try {
      const report = await runQc(bundle.project.id);
      setServerQc(report);
    } catch {
      setServerQc(null);
    }
  }, [bundle.project.id, runQc]);

  useEffect(() => {
    void refreshServerQc();
  }, [refreshServerQc, bundle.slides.length, bundle.project.summary_split_mode]);

  const handleExport = async () => {
    const rec = await createMockExport(bundle.project.id);
    const dlUrl = getExportDownloadUrl(bundle.project.id, rec.id);
    const a = document.createElement("a");
    a.href = dlUrl;
    a.download = rec.download_filename;
    a.click();
    pushToast({
      tone: "success",
      title: `16:9 PPTX 생성 및 다운로드 완료 (${rec.download_filename})`,
      description: `${rec.slide_count}장 구성 · ${Math.max(1, Math.round(rec.file_size_bytes / 1024))} KB`,
    });
  };

  const resolveHintAction = (check: QcCheckItem) => {
    if (check.target_slide_id) {
      onJumpToSlide(check.target_slide_id);
      return;
    }
    if (check.gate_code === "GATE_3_EVIDENCE_LINKS") {
      onGoToCollection();
      return;
    }
    if (bundle.slides[0]) {
      onJumpToSlide(bundle.slides[0].id);
    }
  };

  return (
    <div className="mx-auto max-w-[1440px] space-y-5 px-6 py-6">
      <section
        className={`flex flex-wrap items-center justify-between gap-4 rounded-[12px] border p-5 ${headerMeta.boxClass}`}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-[8px] border border-[#E5E5E5] bg-white p-2">
            <HeaderIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge tone={headerMeta.tone}>{headerMeta.label}</StatusBadge>
              <span className="text-xs font-medium text-[#4A4A4A] tabular-nums">
                총 {qc.total_slides_checked}개 장표 검증됨
              </span>
            </div>
            <h2 className="mt-1.5 text-[15px] font-bold text-[#111111]">
              {qc.overall_status === "PASS"
                ? "모든 4대 품질 게이트를 통과했습니다. 바로 16:9 PPTX를 출력할 수 있습니다."
                : qc.overall_status === "WARNING"
                  ? "필수 게이트는 통과했으나, 권고 확인 항목(미확정 장표 등)이 있습니다."
                  : "출력 차단(BLOCKER) 항목을 먼저 해결해야 PPTX 내보내기가 활성화됩니다."}
            </h2>
          </div>
        </div>

        <AsyncActionButton
          variant={qc.can_export ? "primary" : "secondary"}
          size="lg"
          disabled={!qc.can_export}
          loadingText="16:9 PPTX 패키징 중..."
          onAction={handleExport}
        >
          <FileDown className="h-4 w-4" />
          16:9 PPTX로 내보내기
        </AsyncActionButton>
      </section>

      <div className="grid gap-5 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-5">
            <div className="flex items-center justify-between border-b border-[#E5E5E5] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#111111]" />
                <h3 className="text-[14px] font-bold text-[#111111]">
                  4-Gate Pre-Flight QC 점검표
                </h3>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await refreshServerQc();
                  pushToast({ tone: "info", title: "백엔드 4-Gate QC 점검을 갱신했습니다." });
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#4A4A4A] hover:text-[#111111] cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                QC 재점검
              </button>
            </div>

            <div className="divide-y divide-[#E5E5E5]">
              {qc.checks.map((check, idx) => {
                const sev = getSeverityMeta(check.severity);
                return (
                  <div
                    key={`${check.gate_code}-${idx}`}
                    className="flex flex-wrap items-start justify-between gap-3 py-3.5"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge tone={sev.tone} dot>
                          {check.severity}
                        </StatusBadge>
                        <span className="font-mono text-[11px] font-medium text-[#8C8C8C]">
                          {check.gate_code}
                        </span>
                      </div>
                      <p className="text-[13px] font-semibold text-[#111111]">
                        {check.message}
                      </p>
                      {check.user_action_hint && (
                        <p className="text-xs text-[#4A4A4A]">
                          가이드: {check.user_action_hint}
                        </p>
                      )}
                    </div>

                    {check.severity !== "PASS" && (
                      <button
                        type="button"
                        onClick={() => resolveHintAction(check)}
                        className="inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white px-2.5 text-xs font-medium text-[#111111] hover:border-[#111111] cursor-pointer"
                      >
                        해결하러 이동
                        <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4 lg:col-span-5">
          <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#111111]">
                출력 목차 및 분할 옵션
              </h3>
              <div className="inline-flex rounded-[8px] border border-[#D4D4D4] bg-[#F5F5F5] p-0.5">
                {(["SPLIT_2", "SPLIT_4"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => switchSummarySplit(bundle.project.id, mode)}
                    className={`rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      bundle.project.summary_split_mode === mode
                        ? "bg-white text-[#111111] shadow-2xs"
                        : "text-[#4A4A4A]"
                    }`}
                  >
                    {mode === "SPLIT_2" ? "요약 2장" : "요약 4장"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SECTION_LABELS) as (keyof typeof SECTION_LABELS)[]).map(
                (sec) => {
                  const present = qc.present_sections.includes(sec);
                  return (
                    <div
                      key={sec}
                      className={`flex items-center justify-between rounded-[8px] border px-3 py-2 text-xs ${
                        present
                          ? "border-[#BBE5D0] bg-[#F0FAF5] text-[#1F8A5B]"
                          : "border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                      }`}
                    >
                      <span className="font-medium text-[#111111]">
                        {SECTION_LABELS[sec]}
                      </span>
                      <span className="font-semibold">
                        {present ? "준비" : "누락"}
                      </span>
                    </div>
                  );
                }
              )}
            </div>
          </div>

          <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#111111]">
                내보내기 이력 ({bundle.exports.length})
              </h3>
              <span className="text-[11px] text-[#8C8C8C]">실제 PPTX 바이너리</span>
            </div>

            {bundle.exports.length === 0 ? (
              <p className="rounded-[8px] border border-dashed border-[#D4D4D4] py-8 text-center text-xs text-[#8C8C8C]">
                아직 내보낸 PPTX 이력이 없습니다.
              </p>
            ) : (
              <div className="divide-y divide-[#E5E5E5]">
                {bundle.exports.map((exp) => (
                  <div
                    key={exp.id}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#111111]">
                        {exp.download_filename}
                      </p>
                      <p className="mt-0.5 text-[11px] tabular-nums text-[#8C8C8C]">
                        {exp.slide_count}장 ·{" "}
                        {Math.round(exp.file_size_bytes / 1024)} KB ·{" "}
                        {exp.summary_split_mode === "SPLIT_2"
                          ? "요약 2장"
                          : "요약 4장"}
                      </p>
                    </div>
                    <a
                      href={getExportDownloadUrl(bundle.project.id, exp.id)}
                      download={exp.download_filename}
                      className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white px-2.5 text-xs font-medium text-[#111111] hover:border-[#111111]"
                    >
                      <Download className="h-3.5 w-3.5 shrink-0" />
                      PPTX 다운로드
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
