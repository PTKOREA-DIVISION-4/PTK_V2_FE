"use client";

import React, { useState } from "react";
import { useFactbookStore } from "@/lib/store";
import { ProjectBundle } from "@/lib/types";
import { Modal } from "@/components/ui/Modal";
import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/ToastProvider";

export function ProjectBriefModal({
  open,
  onClose,
  bundle,
}: {
  open: boolean;
  onClose: () => void;
  bundle: ProjectBundle;
}) {
  const { updateProjectBrief } = useFactbookStore();
  const { pushToast } = useToast();
  const { project } = bundle;

  const [name, setName] = useState(project.name);
  const [periodStart, setPeriodStart] = useState(project.period_start);
  const [periodEnd, setPeriodEnd] = useState(project.period_end);
  const [briefNote, setBriefNote] = useState(project.brief_note || "");

  const handleSave = async () => {
    await updateProjectBrief(project.id, {
      name: name.trim() || project.name,
      period_start: periodStart,
      period_end: periodEnd,
      brief_note: briefNote,
    });
    pushToast({
      tone: "success",
      title: "요청·자료 설정이 저장되었습니다.",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="요청 · 자료"
      description="단일 브랜드·제품 기준 정보와 기획자 전체 요청사항을 확인하고 수정합니다."
      footer={
        <>
          <AsyncActionButton variant="secondary" onClick={onClose}>
            닫기
          </AsyncActionButton>
          <AsyncActionButton
            variant="primary"
            loadingText="저장 중..."
            onAction={handleSave}
          >
            설정 저장
          </AsyncActionButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap p-3 rounded-[8px] bg-[#FAFAFA] border border-[#E5E5E5]">
          <StatusBadge tone="obsidian">
            단일 타겟: {project.brand_name} · {project.product_name}
          </StatusBadge>
          <StatusBadge
            tone={project.analysis_track === "REVIEW_CENTRIC" ? "indigo" : "slate"}
          >
            {project.analysis_track === "REVIEW_CENTRIC"
              ? "후기·커뮤니티 중심"
              : "시장·지표 중심"}
          </StatusBadge>
          <StatusBadge tone="slate">{project.industry_category}</StatusBadge>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
            팩트북 제목
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-[8px] border border-[#D4D4D4] bg-white text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
              조사 시작일
            </label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full h-10 px-3 rounded-[8px] border border-[#D4D4D4] bg-white text-sm text-[#111111] tabular-nums focus:outline-none focus:border-[#111111]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
              조사 종료일
            </label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full h-10 px-3 rounded-[8px] border border-[#D4D4D4] bg-white text-sm text-[#111111] tabular-nums focus:outline-none focus:border-[#111111]"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
            기획자 요청 사항 (Global Brief)
          </label>
          <textarea
            rows={3}
            value={briefNote}
            onChange={(e) => setBriefNote(e.target.value)}
            className="w-full p-3 rounded-[8px] border border-[#D4D4D4] bg-white text-sm text-[#111111] focus:outline-none focus:border-[#111111]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
            비교 경쟁 제품 ({project.competitors.length}종)
          </label>
          <div className="flex flex-wrap gap-2">
            {project.competitors.map((c) => (
              <span
                key={c.id}
                className="px-2.5 py-1 rounded-[6px] bg-[#FAFAFA] border border-[#E5E5E5] text-xs font-medium text-[#111111]"
              >
                {c.brand_name} · {c.product_name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
