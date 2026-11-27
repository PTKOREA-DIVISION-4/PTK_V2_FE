"use client";

import React from "react";
import { ExternalLink } from "lucide-react";
import {
  InlineMarkdown,
  MarkdownDocument,
} from "@/components/ui/MarkdownContent";
import { SlideOverDrawer } from "@/components/ui/SlideOverDrawer";
import { SECTION_LABELS, type SourceItemDetail } from "@/lib/types";

export function SourceViewerDrawer({
  source,
  onClose,
  footer,
}: {
  source: SourceItemDetail | null;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  return (
    <SlideOverDrawer
      open={Boolean(source)}
      onClose={onClose}
      title={source?.title ?? ""}
      subtitle={
        source
          ? `${SECTION_LABELS[source.section_code]} · ${source.channel} (${source.provider})`
          : undefined
      }
      footer={footer}
    >
      {source && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] px-3.5 py-2.5 text-xs text-[#4A4A4A]">
            <span>
              수집일:{" "}
              <strong className="text-[#111111]">
                {source.published_at ?? "-"}
              </strong>
            </span>
            {source.source_url && (
              <a
                href={source.source_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#111111] hover:underline"
              >
                원문 URL 열기
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {source.evidence_quote && (
            <div className="rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] p-3.5">
              <p className="text-[11px] font-semibold text-[#111111]">
                장표 인용 핵심 문장
              </p>
              <div className="mt-1 text-sm font-medium leading-relaxed text-[#111111]">
                “<InlineMarkdown text={source.evidence_quote} />”
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[#8C8C8C]">
              원문 전체 텍스트 (근거 스팬 하이라이트)
            </p>
            <div className="rounded-[8px] border border-[#E5E5E5] bg-white p-4">
              {source.content ? (
                <MarkdownDocument
                  content={source.content}
                  highlightQuotes={[
                    ...(source.highlight_spans ?? [])
                      .map((s) => s.quote)
                      .filter(Boolean),
                    ...(source.evidence_quote ? [source.evidence_quote] : []),
                  ]}
                />
              ) : (
                <span className="text-xs text-[#8C8C8C]">
                  원문 전문을 불러오는 중입니다...
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </SlideOverDrawer>
  );
}
