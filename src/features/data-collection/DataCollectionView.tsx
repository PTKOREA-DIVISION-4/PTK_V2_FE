"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  Eye,
  Filter,
  Heart,
  Info,
  Instagram,
  MessageCircle,
  RefreshCw,
  Search,
  Video,
  X,
  Youtube,
} from "lucide-react";
import {
  DataLabSosBarChart,
  DataLabTrendChart,
} from "@/components/visuals/FactbookCharts";
import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import { ChannelBadge, ChannelGlyph, normalizeChannelKey } from "@/components/ui/ChannelBadge";
import { stripMarkdownInline } from "@/components/ui/MarkdownContent";
import { SourceViewerDrawer } from "@/components/ui/SourceViewerDrawer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { useToast } from "@/components/ui/ToastProvider";
import {
  CollectionProgressPanel,
  DataLabSkeleton,
  SnsTop5Skeleton,
  SourcesRefreshingBanner,
  SourcesTableSkeleton,
} from "@/features/data-collection/CollectionLoadingState";
import { useFactbookStore } from "@/lib/store";
import {
  SECTION_LABELS,
  type ProjectBundle,
  type ReviewStatus,
  type SectionCode,
  type SnsTopPost,
  type SourceItemDetail,
} from "@/lib/types";

type PoolSubTab = "SOURCES" | "DATALAB" | "SNS_TOP5";

function getPlatformBadgeMeta(platform: string) {
  const key = platform.toUpperCase();
  if (key === "YOUTUBE") {
    return {
      label: "YouTube",
      Icon: Youtube,
      pillClass: "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]",
      iconClass: "text-[#DC2626]",
    };
  }
  if (key === "INSTAGRAM") {
    return {
      label: "Instagram",
      Icon: Instagram,
      pillClass: "border-[#FBCFE8] bg-[#FDF2F8] text-[#9D174D]",
      iconClass: "text-[#DB2777]",
    };
  }
  return {
    label: platform,
    Icon: Video,
    pillClass: "border-[#D4D4D4] bg-[#F5F5F5] text-[#111111]",
    iconClass: "text-[#4A4A4A]",
  };
}

function getReviewBadgeProps(status: ReviewStatus) {
  if (status === "APPROVED") {
    return { tone: "teal" as const, label: "승인됨" };
  }
  if (status === "REJECTED") {
    return { tone: "coral" as const, label: "제외됨" };
  }
  return { tone: "amber" as const, label: "검토 대기" };
}

function getSentimentBadge(sentiment: SourceItemDetail["sentiment"]) {
  if (sentiment === "POSITIVE") return { tone: "teal" as const, label: "긍정" };
  if (sentiment === "NEGATIVE") return { tone: "coral" as const, label: "부정" };
  if (sentiment === "MIXED") return { tone: "amber" as const, label: "복합" };
  return { tone: "slate" as const, label: "중립" };
}

export function DataCollectionView({
  bundle,
  onGoToStudio,
}: {
  bundle: ProjectBundle;
  onGoToStudio: () => void;
}) {
  const {
    getSourceFacets,
    runCollectionSimulation,
    loadSourceDetail,
    bulkUpdateSourceStatus,
    generateSlides,
  } = useFactbookStore();
  const { pushToast } = useToast();

  const [subTab, setSubTab] = useState<PoolSubTab>("SOURCES");
  const [isTriggeringCollection, setIsTriggeringCollection] = useState(false);

  const isCollecting =
    isTriggeringCollection ||
    bundle.last_job.status === "RUNNING" ||
    (bundle.last_job.status === "PENDING" && !bundle.last_job.id.startsWith("idle-"));

  const [jobExpanded, setJobExpanded] = useState<boolean>(
    isCollecting || bundle.last_job.status !== "COMPLETED"
  );

  useEffect(() => {
    if (isCollecting) {
      setJobExpanded(true);
    }
  }, [isCollecting]);

  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<SectionCode | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | "ALL">("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeSource, setActiveSource] = useState<SourceItemDetail | null>(null);

  const [snsFilter, setSnsFilter] = useState<
    "ALL" | "OWN" | "COMPETITOR" | "COLLAB"
  >("ALL");
  const [snsPlatformFilter, setSnsPlatformFilter] = useState<string>("ALL");
  const [datalabMetric, setDatalabMetric] = useState<
    "SEARCH_TREND" | "SHOPPING_INSIGHT"
  >("SEARCH_TREND");

  const facets = useMemo(() => getSourceFacets(bundle), [bundle, getSourceFacets]);

  const filteredSources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bundle.sources.filter((src) => {
      if (sectionFilter !== "ALL" && src.section_code !== sectionFilter) {
        return false;
      }
      if (statusFilter !== "ALL" && src.review_status !== statusFilter) {
        return false;
      }
      if (channelFilter !== "ALL" && src.channel !== channelFilter) {
        return false;
      }
      if (q) {
        const hay = `${src.title} ${src.content} ${src.evidence_quote ?? ""} ${src.channel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bundle.sources, searchQuery, sectionFilter, statusFilter, channelFilter]);

  const collabLabel = `${bundle.project.brand_name} 협업`;

  const snsScopeCounts = useMemo(() => {
    const own = bundle.sns_top_posts.filter(
      (p) => p.owner_type === "OWN" && p.brand_label !== collabLabel
    ).length;
    const comp = bundle.sns_top_posts.filter(
      (p) => p.owner_type === "COMPETITOR" && p.brand_label !== collabLabel
    ).length;
    const collab = bundle.sns_top_posts.filter(
      (p) => p.is_creator_collab || p.brand_label === collabLabel
    ).length;
    const byPlatform: Record<string, number> = {};
    for (const p of bundle.sns_top_posts) {
      const k = p.platform.toUpperCase();
      byPlatform[k] = (byPlatform[k] ?? 0) + 1;
    }
    return { total: bundle.sns_top_posts.length, own, comp, collab, byPlatform };
  }, [bundle.sns_top_posts, collabLabel]);

  const filteredSnsPosts = useMemo(() => {
    return bundle.sns_top_posts.filter((post) => {
      if (
        snsFilter === "OWN" &&
        !(post.owner_type === "OWN" && post.brand_label !== collabLabel)
      ) {
        return false;
      }
      if (
        snsFilter === "COMPETITOR" &&
        !(post.owner_type === "COMPETITOR" && post.brand_label !== collabLabel)
      ) {
        return false;
      }
      if (
        snsFilter === "COLLAB" &&
        !(post.is_creator_collab || post.brand_label === collabLabel)
      ) {
        return false;
      }
      if (
        snsPlatformFilter !== "ALL" &&
        post.platform.toUpperCase() !== snsPlatformFilter
      ) {
        return false;
      }
      return true;
    });
  }, [bundle.sns_top_posts, collabLabel, snsFilter, snsPlatformFilter]);

  const groupedSnsByCompany = useMemo(() => {
    type PlatformLane = {
      platform: string;
      posts: SnsTopPost[];
    };
    type CompanyGroup = {
      key: string;
      brandLabel: string;
      role: "OWN" | "COMPETITOR" | "COLLAB";
      roleLabel: string;
      totalCount: number;
      platforms: PlatformLane[];
    };

    const companyMap = new Map<string, {
      brandLabel: string;
      role: "OWN" | "COMPETITOR" | "COLLAB";
      roleLabel: string;
      platformMap: Map<string, SnsTopPost[]>;
    }>();

    for (const post of filteredSnsPosts) {
      const isCollabBucket = post.brand_label === collabLabel;
      const role: "OWN" | "COMPETITOR" | "COLLAB" = isCollabBucket
        ? "COLLAB"
        : post.owner_type === "OWN"
          ? "OWN"
          : "COMPETITOR";
      const roleLabel =
        role === "OWN"
          ? "자사 공식"
          : role === "COMPETITOR"
            ? "경쟁사 공식"
            : "크리에이터 협업";
      const key = `${role}:${post.brand_label}`;
      if (!companyMap.has(key)) {
        companyMap.set(key, {
          brandLabel: post.brand_label,
          role,
          roleLabel,
          platformMap: new Map(),
        });
      }
      const platKey = post.platform.toUpperCase();
      const bucket = companyMap.get(key)!;
      const arr = bucket.platformMap.get(platKey) ?? [];
      arr.push(post);
      bucket.platformMap.set(platKey, arr);
    }

    const roleOrder: Record<"OWN" | "COMPETITOR" | "COLLAB", number> = {
      OWN: 0,
      COMPETITOR: 1,
      COLLAB: 2,
    };

    const result: CompanyGroup[] = [];
    for (const [key, val] of companyMap.entries()) {
      const platforms: PlatformLane[] = Array.from(val.platformMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([platform, posts]) => ({
          platform,
          posts: [...posts].sort((a, b) => a.rank_order - b.rank_order),
        }));
      result.push({
        key,
        brandLabel: val.brandLabel,
        role: val.role,
        roleLabel: val.roleLabel,
        totalCount: platforms.reduce((acc, p) => acc + p.posts.length, 0),
        platforms,
      });
    }
    return result.sort((a, b) => roleOrder[a.role] - roleOrder[b.role]);
  }, [collabLabel, filteredSnsPosts]);

  const failedSubtasks = bundle.last_job.subtasks.filter(
    (st) => st.status === "FAILED"
  );

  const allFilteredSelected =
    filteredSources.length > 0 &&
    filteredSources.every((s) => selectedIds.includes(s.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const visibleSet = new Set(filteredSources.map((s) => s.id));
      setSelectedIds((prev) => prev.filter((id) => !visibleSet.has(id)));
    } else {
      const merged = new Set([
        ...selectedIds,
        ...filteredSources.map((s) => s.id),
      ]);
      setSelectedIds(Array.from(merged));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const openSourceDrawer = (src: SourceItemDetail) => {
    setActiveSource(src);
    if (!src.content) {
      void loadSourceDetail(bundle.project.id, src.id).catch(() => {
        pushToast({
          tone: "warning",
          title: "원문 상세 내용을 불러오지 못했습니다.",
        });
      });
    }
  };

  const handleBulkDecision = async (
    reviewStatus: ReviewStatus,
    allMatching = false
  ) => {
    const count = await bulkUpdateSourceStatus(bundle.project.id, {
      sourceIds: allMatching ? undefined : selectedIds,
      reviewStatus,
      filterSection: sectionFilter,
      filterChannel: channelFilter,
      filterAllMatching: allMatching,
    });
    if (!allMatching) {
      setSelectedIds([]);
    }
    pushToast({
      tone: reviewStatus === "APPROVED" ? "success" : "info",
      title: `${count}건의 자료를 '${reviewStatus === "APPROVED" ? "승인" : "제외"}' 처리했습니다.`,
      description: "승인된 자료만 장표 근거 및 요약 생성에 반영됩니다.",
    });
  };

  const handleRetryFailed = async () => {
    const keys = failedSubtasks.map((st) => st.subtask_key);
    setIsTriggeringCollection(true);
    try {
      await runCollectionSimulation(bundle.project.id, keys);
      pushToast({
        tone: "success",
        title: "실패 항목 재수집 완료",
        description: "신규 수집 원문과 분석 지표가 자료 풀에 반영되었습니다.",
      });
    } finally {
      setIsTriggeringCollection(false);
    }
  };

  const handleFullRecollect = async () => {
    setIsTriggeringCollection(true);
    try {
      await runCollectionSimulation(bundle.project.id);
      pushToast({
        tone: "success",
        title: "전체 수집 파이프라인 재실행 완료",
        description: "웹 리서치 · 네이버 데이터랩 · SNS TOP 5가 최신화되었습니다.",
      });
    } finally {
      setIsTriggeringCollection(false);
    }
  };

  const handleGenerateSlides = async () => {
    await generateSlides(bundle.project.id, bundle.project.summary_split_mode);
    pushToast({
      tone: "info",
      title: "실시간 장표 생성을 시작했습니다.",
      description: "스튜디오에서 표지·목차와 각 파트가 채워지는 과정을 바로 확인할 수 있습니다.",
    });
    onGoToStudio();
  };

  const liveActiveSource = useMemo(
    () =>
      activeSource
        ? bundle.sources.find((s) => s.id === activeSource.id) ?? activeSource
        : null,
    [activeSource, bundle.sources]
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-6 py-5">
      {/* Live Collection Progress Monitor */}
      <CollectionProgressPanel
        job={bundle.last_job}
        facets={facets}
        isCollecting={isCollecting}
        expanded={jobExpanded}
        onToggleExpand={() => setJobExpanded((v) => !v)}
        actions={
          <>
            {failedSubtasks.length > 0 && (
              <AsyncActionButton
                variant="secondary"
                size="sm"
                loadingText="재수집 중..."
                disabled={isCollecting}
                onAction={handleRetryFailed}
                className="border-[#F5D8A8] bg-[#FFFBEB] text-[#C26B00] hover:bg-[#FEF3C7]"
              >
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                실패 {failedSubtasks.length}건 재시도
              </AsyncActionButton>
            )}
            <AsyncActionButton
              variant="secondary"
              size="sm"
              loadingText="전체 재수집 중..."
              disabled={isCollecting}
              onAction={handleFullRecollect}
            >
              <RefreshCw className={`h-3.5 w-3.5 shrink-0 ${isCollecting ? "animate-spin" : ""}`} />
              {isCollecting ? "수집 실행 중" : "전체 재수집"}
            </AsyncActionButton>
            <AsyncActionButton
              variant="primary"
              size="sm"
              loadingText="장표 생성 중..."
              disabled={isCollecting}
              onAction={handleGenerateSlides}
              title={isCollecting ? "자료 수집이 끝난 뒤 장표를 생성할 수 있습니다." : undefined}
            >
              장표 초안 (재)생성
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </AsyncActionButton>
          </>
        }
      />

      {/* Sub-tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-1">
          {(
            [
              { key: "SOURCES", label: `수집 원문 인덱스 (${bundle.sources.length})` },
              { key: "DATALAB", label: `네이버 데이터랩 (${bundle.datalab.length})` },
              { key: "SNS_TOP5", label: `SNS 인기 게시물 TOP 5 (${bundle.sns_top_posts.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setSubTab(t.key)}
              className={`border-b-2 px-3 py-2.5 text-[13px] transition-colors cursor-pointer ${
                subTab === t.key
                  ? "border-[#111111] font-semibold text-[#111111]"
                  : "border-transparent font-medium text-[#4A4A4A] hover:text-[#111111]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <p className="pb-2 text-xs text-[#8C8C8C]">
          항목을 클릭하면 우측 드로어에서 하이라이트 원문을 대조할 수 있습니다.
        </p>
      </div>

      {/* TAB 1: COLLECTED SOURCES */}
      {subTab === "SOURCES" && (
        <div className="space-y-3">
          <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="relative min-w-[240px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8C8C8C]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="제목, 본문 인용문, 채널명 검색..."
                  className="w-full h-9 rounded-[8px] border border-[#D4D4D4] bg-white pl-9 pr-3 text-[13px] text-[#111111] placeholder:text-[#8C8C8C] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <div className="inline-flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 shrink-0 text-[#8C8C8C]" />
                  <StyledSelect
                    value={channelFilter}
                    onChange={(e) => setChannelFilter(e.target.value)}
                    aria-label="채널 필터"
                    className="text-xs"
                  >
                    <option value="ALL">전체 채널</option>
                    {Object.entries(facets.by_channel).map(([ch, cnt]) => (
                      <option key={ch} value={ch}>
                        {ch} ({cnt})
                      </option>
                    ))}
                  </StyledSelect>
                </div>

                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map(
                  (st) => {
                    const count =
                      st === "ALL"
                        ? facets.total
                        : facets.by_review_status[st] ?? 0;
                    const label =
                      st === "ALL"
                        ? "전체"
                        : st === "PENDING"
                          ? "검토 대기"
                          : st === "APPROVED"
                            ? "승인됨"
                            : "제외됨";
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`h-9 shrink-0 whitespace-nowrap rounded-[8px] px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                          statusFilter === st
                            ? "bg-[#111111] text-white"
                            : "border border-[#D4D4D4] bg-white text-[#4A4A4A] hover:bg-[#FAFAFA]"
                        }`}
                      >
                        {label} <span className="tabular-nums">({count})</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 border-t border-[#E5E5E5] pt-2.5">
              <button
                type="button"
                onClick={() => setSectionFilter("ALL")}
                className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                  sectionFilter === "ALL"
                    ? "bg-[#111111] text-white"
                    : "bg-[#F5F5F5] text-[#4A4A4A] hover:text-[#111111]"
                }`}
              >
                전체 목차 ({facets.total})
              </button>
              {(Object.keys(SECTION_LABELS) as SectionCode[]).map((sec) => {
                const cnt = facets.by_section[sec] ?? 0;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSectionFilter(sec)}
                    className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      sectionFilter === sec
                        ? "bg-[#111111] text-white"
                        : "bg-[#F5F5F5] text-[#4A4A4A] hover:text-[#111111]"
                    }`}
                  >
                    {SECTION_LABELS[sec]} ({cnt})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bulk Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#E5E5E5] bg-white px-4 py-2.5">
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-[#111111]">
              <input
                type="checkbox"
                checked={allFilteredSelected}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded-[6px] border-[#D4D4D4] accent-[#111111]"
              />
              현재 목록 전체 선택 ({filteredSources.length}건 중{" "}
              <span className="font-bold text-[#111111]">
                {selectedIds.length}
              </span>
              건 선택됨)
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {selectedIds.length > 0 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleBulkDecision("APPROVED", false)}
                    className="inline-flex h-8 items-center gap-1 rounded-[8px] bg-[#111111] px-3 text-xs font-medium text-white hover:bg-[#262626] cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" />
                    선택 {selectedIds.length}건 승인
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkDecision("REJECTED", false)}
                    className="inline-flex h-8 items-center gap-1 rounded-[8px] border border-[#FECACA] bg-white px-3 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    선택 제외
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => handleBulkDecision("APPROVED", true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#D4D4D4] bg-white px-3 text-xs font-medium text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#1F8A5B]" />
                  현재 필터 조건 전체 승인
                </button>
              )}
            </div>
          </div>

          {isCollecting && filteredSources.length > 0 && <SourcesRefreshingBanner />}

          {/* Desktop Sources Data Table */}
          {isCollecting && bundle.sources.length === 0 ? (
            <SourcesTableSkeleton />
          ) : (
          <div className="overflow-x-auto rounded-[12px] border border-[#E5E5E5] bg-white">
            {filteredSources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <p className="text-sm font-medium text-[#4A4A4A]">
                  조건에 맞는 수집 자료가 없습니다.
                </p>
                <p className="mt-1 text-xs text-[#8C8C8C]">
                  검색어나 목차/상태 필터를 초기화해 보세요.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[11px] font-semibold text-[#4A4A4A]">
                  <tr>
                    <th className="w-10 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={allFilteredSelected}
                        onChange={toggleSelectAll}
                        aria-label="전체 선택"
                        className="h-4 w-4 rounded-[6px] border-[#D4D4D4] accent-[#111111]"
                      />
                    </th>
                    <th className="w-36 whitespace-nowrap px-3 py-3">목차</th>
                    <th className="w-36 whitespace-nowrap px-3 py-3">채널</th>
                    <th className="px-3 py-3">제목 · 핵심 인용문</th>
                    <th className="w-20 whitespace-nowrap px-3 py-3">감성</th>
                    <th className="w-28 whitespace-nowrap px-3 py-3">상태</th>
                    <th className="w-28 whitespace-nowrap px-3 py-3">수집일</th>
                    <th className="w-36 whitespace-nowrap px-4 py-3 text-right">검수 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {filteredSources.map((src) => {
                    const rev = getReviewBadgeProps(src.review_status);
                    const sent = getSentimentBadge(src.sentiment);
                    const checked = selectedIds.includes(src.id);

                    return (
                      <tr
                        key={src.id}
                        className={`group transition-colors hover:bg-[#FAFAFA] ${
                          checked ? "bg-[#F5F5F5]" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-3 text-center align-top">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleOne(src.id)}
                            aria-label={`${src.title} 선택`}
                            className="mt-0.5 h-4 w-4 rounded-[6px] border-[#D4D4D4] accent-[#111111]"
                          />
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-top">
                          <StatusBadge tone="slate">
                            {SECTION_LABELS[src.section_code]}
                          </StatusBadge>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 align-top">
                          <ChannelBadge channel={src.channel} compact />
                        </td>
                        <td className="px-3 py-3 align-top">
                          <button
                            type="button"
                            onClick={() => openSourceDrawer(src)}
                            className="w-full text-left cursor-pointer"
                          >
                            <p className="text-[13px] font-semibold text-[#111111] group-hover:underline">
                              {src.title}
                            </p>
                            {src.evidence_quote && (
                              <p className="mt-1 line-clamp-1 border-l-2 border-[#111111] pl-2 text-xs text-[#4A4A4A]">
                                “{stripMarkdownInline(src.evidence_quote)}”
                              </p>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge tone={sent.tone}>{sent.label}</StatusBadge>
                        </td>
                        <td className="px-3 py-3 align-top">
                          <StatusBadge tone={rev.tone} dot>
                            {rev.label}
                          </StatusBadge>
                        </td>
                        <td className="px-3 py-3 align-top tabular-nums whitespace-nowrap text-[#8C8C8C]">
                          {src.published_at ? src.published_at.slice(0, 10) : "-"}
                        </td>
                        <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            {src.review_status !== "APPROVED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  bulkUpdateSourceStatus(bundle.project.id, {
                                    sourceIds: [src.id],
                                    reviewStatus: "APPROVED",
                                  })
                                }
                                className="h-7 shrink-0 whitespace-nowrap rounded-[6px] border border-[#BBE5D0] bg-[#F0FAF5] px-2 text-[11px] font-medium text-[#1F8A5B] hover:bg-[#E1F5EB] cursor-pointer"
                              >
                                승인
                              </button>
                            )}
                            {src.review_status !== "REJECTED" && (
                              <button
                                type="button"
                                onClick={() =>
                                  bulkUpdateSourceStatus(bundle.project.id, {
                                    sourceIds: [src.id],
                                    reviewStatus: "REJECTED",
                                  })
                                }
                                className="h-7 shrink-0 whitespace-nowrap rounded-[6px] border border-[#D4D4D4] bg-white px-2 text-[11px] font-medium text-[#4A4A4A] hover:bg-[#FAFAFA] cursor-pointer"
                              >
                                제외
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openSourceDrawer(src)}
                              className="h-7 shrink-0 whitespace-nowrap rounded-[6px] px-2 text-[11px] font-medium text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
                            >
                              원문
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          )}
        </div>
      )}

      {/* TAB 2: NAVER DATALAB */}
      {subTab === "DATALAB" && (
        isCollecting && bundle.datalab.length === 0 ? (
          <DataLabSkeleton />
        ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA] px-4 py-3 text-xs text-[#111111]">
            <div className="flex items-start gap-2.5">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#111111]" />
              <div>
                <p className="font-semibold">
                  산출 근거 투명 공개 원칙 (임의 점수화 없음)
                </p>
                <p className="mt-0.5 text-[#4A4A4A]">
                  {bundle.datalab.find((s) => s.metric_type === datalabMetric)?.methodology_note ??
                    bundle.datalab[0]?.methodology_note ??
                    "출처: 네이버 데이터랩 통합검색어 트렌드 | 기준: 비교군 최댓값=100 상대지수 및 구간 합산 점유율(%)"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 rounded-[8px] border border-[#E5E5E5] bg-white p-1">
              {(
                [
                  { key: "SEARCH_TREND", label: "통합검색 트렌드" },
                  { key: "SHOPPING_INSIGHT", label: "쇼핑 인사이트 클릭" },
                ] as const
              ).map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setDatalabMetric(m.key)}
                  className={`h-7 rounded-[6px] px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    datalabMetric === m.key
                      ? "bg-[#111111] text-white"
                      : "text-[#4A4A4A] hover:text-[#111111]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-5">
              <h3 className="text-[14px] font-semibold text-[#111111]">
                {datalabMetric === "SHOPPING_INSIGHT"
                  ? "주차별 쇼핑 클릭 추이 (최댓값=100 상대지수)"
                  : "주차별 검색량 추이 (최댓값=100 상대지수)"}
              </h3>
              <p className="mt-0.5 text-xs text-[#8C8C8C]">
                {bundle.project.period_start} ~ {bundle.project.period_end}
              </p>
              <div className="mt-4">
                <DataLabTrendChart seriesList={bundle.datalab} metricType={datalabMetric} />
              </div>
            </div>

            <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-5">
              <h3 className="text-[14px] font-semibold text-[#111111]">
                {datalabMetric === "SHOPPING_INSIGHT"
                  ? "구간 쇼핑 관심 점유율 비교 (%)"
                  : "구간 검색 점유율 비교 (Share of Search %)"}
              </h3>
              <p className="mt-0.5 text-xs text-[#8C8C8C]">
                비교 그룹의 구간 상대지수 합산 대비 비중
              </p>
              <div className="mt-4">
                <DataLabSosBarChart seriesList={bundle.datalab} metricType={datalabMetric} />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-[12px] border border-[#E5E5E5] bg-white">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E5E5E5] bg-[#FAFAFA] text-[#4A4A4A]">
                <tr>
                  <th className="px-4 py-3 font-semibold">유형</th>
                  <th className="px-4 py-3 font-semibold">구분</th>
                  <th className="px-4 py-3 font-semibold">키워드 그룹</th>
                  <th className="px-4 py-3 font-semibold text-right">
                    구간 합산 지수
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    구간 점유율 (%)
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    기간 증감률
                  </th>
                  <th className="px-4 py-3 font-semibold text-right">
                    최고점 (Peak)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {bundle.datalab.map((row) => (
                  <tr key={row.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-3 text-[11px] font-medium text-[#4A4A4A]">
                      {row.metric_type === "SHOPPING_INSIGHT" ? "쇼핑 클릭" : "통합검색"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={row.owner_type === "OWN" ? "indigo" : "slate"}
                      >
                        {row.owner_type === "OWN" ? "자사" : "경쟁사"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#111111]">
                      {row.group_label}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-[#4A4A4A]">
                      {row.cumulative_index_sum.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-[#111111]">
                      {row.share_of_search_pct.toFixed(1)}%
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold tabular-nums ${
                        row.growth_rate_pct >= 0
                          ? "text-[#1F8A5B]"
                          : "text-[#DC2626]"
                      }`}
                    >
                      {row.growth_rate_pct >= 0 ? "+" : ""}
                      {row.growth_rate_pct.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-[#4A4A4A]">
                      {row.peak_date ?? "-"} ({row.peak_value})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        )
      )}

      {/* TAB 3: SNS TOP 5 */}
      {subTab === "SNS_TOP5" && (
        isCollecting && bundle.sns_top_posts.length === 0 ? (
          <SnsTop5Skeleton />
        ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-[#E5E5E5] bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { key: "ALL", label: `전체 (${snsScopeCounts.total})` },
                    { key: "OWN", label: `자사 · ${bundle.project.brand_name} (${snsScopeCounts.own})` },
                    { key: "COMPETITOR", label: `경쟁사 (${snsScopeCounts.comp})` },
                    { key: "COLLAB", label: `협업·광고 (${snsScopeCounts.collab})` },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSnsFilter(item.key)}
                    className={`h-8 rounded-[8px] px-3 text-xs font-medium transition-colors cursor-pointer ${
                      snsFilter === item.key
                        ? "bg-[#111111] text-white"
                        : "border border-[#D4D4D4] bg-white text-[#4A4A4A] hover:bg-[#FAFAFA]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <span className="hidden h-5 w-px bg-[#E5E5E5] md:inline-block" />

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSnsPlatformFilter("ALL")}
                  className={`h-8 rounded-[8px] px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                    snsPlatformFilter === "ALL"
                      ? "border border-[#111111] bg-[#FAFAFA] font-semibold text-[#111111]"
                      : "border border-[#E5E5E5] bg-white text-[#737373] hover:text-[#111111]"
                  }`}
                >
                  전체 플랫폼
                </button>
                {Object.entries(snsScopeCounts.byPlatform)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([plat, count]) => {
                    const meta = getPlatformBadgeMeta(plat);
                    const PlatIcon = meta.Icon;
                    const active = snsPlatformFilter === plat;
                    return (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setSnsPlatformFilter(plat)}
                        className={`inline-flex h-8 items-center gap-1.5 rounded-[8px] border px-2.5 text-xs font-medium transition-colors cursor-pointer ${
                          active
                            ? meta.pillClass
                            : "border-[#E5E5E5] bg-white text-[#4A4A4A] hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <PlatIcon className={`h-3.5 w-3.5 ${active ? "" : meta.iconClass}`} />
                        <span>{meta.label}</span>
                        <span className="text-[11px] opacity-75 tabular-nums">({count})</span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <span className="text-[11px] text-[#8C8C8C]">
              카드형 피드는 조회수 0을 숨기고 좋아요 · 댓글 중심으로 표시합니다.
            </span>
          </div>

          {groupedSnsByCompany.length === 0 ? (
            <div className="rounded-[12px] border border-dashed border-[#D4D4D4] bg-white py-14 text-center text-sm text-[#8C8C8C]">
              해당 조건의 SNS 인기 게시물이 없습니다.
            </div>
          ) : (
            <div className="space-y-5">
              {groupedSnsByCompany.map((company) => {
                const isOwn = company.role === "OWN";
                const isComp = company.role === "COMPETITOR";
                return (
                  <section
                    key={company.key}
                    className="overflow-hidden rounded-[12px] border border-[#E5E5E5] bg-white"
                  >
                    {/* Company Section Header Banner */}
                    <div
                      className={`flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E5E5] bg-[#FAFAFA] px-5 py-3.5 border-l-4 ${
                        isOwn
                          ? "border-l-[#E9501F]"
                          : isComp
                            ? "border-l-[#111111]"
                            : "border-l-[#8C8C8C]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`rounded-[6px] px-2 py-0.5 text-[11px] font-bold tracking-tight ${
                            isOwn
                              ? "bg-[#E9501F] text-white"
                              : isComp
                                ? "bg-[#111111] text-white"
                                : "border border-[#D4D4D4] bg-white text-[#4A4A4A]"
                          }`}
                        >
                          {company.roleLabel}
                        </span>
                        <h3 className="text-[15px] font-bold tracking-tight text-[#111111]">
                          {company.brandLabel}
                        </h3>
                        <span className="text-xs text-[#737373] tabular-nums">
                          총 {company.totalCount}건
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {company.platforms.map((lane) => {
                          const meta = getPlatformBadgeMeta(lane.platform);
                          const PlatIcon = meta.Icon;
                          return (
                            <span
                              key={lane.platform}
                              className={`inline-flex items-center gap-1 rounded-[6px] border px-2 py-0.5 text-[11px] font-semibold ${meta.pillClass}`}
                            >
                              <PlatIcon className="h-3 w-3" />
                              {meta.label} {lane.posts.length}건
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Platform Lanes within Company */}
                    <div className="divide-y divide-[#F0F0F0]">
                      {company.platforms.map((lane) => {
                        const platMeta = getPlatformBadgeMeta(lane.platform);
                        const PlatIcon = platMeta.Icon;
                        return (
                          <div key={lane.platform} className="p-5 space-y-3.5">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1 text-xs font-bold ${platMeta.pillClass}`}
                                >
                                  <ChannelGlyph channelKey={normalizeChannelKey(lane.platform)} size={14} />
                                  {platMeta.label}
                                </span>
                                <span className="text-[13px] font-semibold text-[#111111]">
                                  {company.brandLabel} · {platMeta.label} 인기 TOP {lane.posts.length}
                                </span>
                              </div>
                              <span className="text-[11px] text-[#8C8C8C]">
                                참여 지표 산식 정렬
                              </span>
                            </div>

                            <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                              {lane.posts.map((post: SnsTopPost) => (
                                <article
                                  key={post.id}
                                  className={`flex flex-col overflow-hidden rounded-[10px] border bg-white transition-shadow hover:shadow-[0_4px_16px_-6px_rgba(17,17,17,0.1)] ${
                                    post.rank_order === 1
                                      ? isOwn
                                        ? "border-[#E9501F]/60"
                                        : "border-[#111111]/40"
                                      : "border-[#E5E5E5]"
                                  }`}
                                >
                                  {/* Owner color top stripe */}
                                  <div
                                    className={`h-[3px] w-full ${
                                      isOwn
                                        ? "bg-[#E9501F]"
                                        : isComp
                                          ? "bg-[#111111]"
                                          : "bg-[#8C8C8C]"
                                    }`}
                                  />

                                  {/* Card Header */}
                                  <div className="flex items-center justify-between border-b border-[#F0F0F0] bg-[#FAFAFA] px-3.5 py-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span
                                        className={`shrink-0 rounded-[6px] px-1.5 py-0.5 text-[11px] font-bold text-white tabular-nums ${
                                          post.rank_order === 1 && isOwn
                                            ? "bg-[#E9501F]"
                                            : "bg-[#111111]"
                                        }`}
                                      >
                                        TOP {post.rank_order}
                                      </span>
                                      <span className="truncate text-xs font-semibold text-[#111111]">
                                        {post.brand_label}
                                      </span>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-1.5">
                                      {post.is_creator_collab && (
                                        <span className="rounded-[6px] border border-[#F9C8B8] bg-[#FFF3EE] px-1.5 py-0.5 text-[10px] font-semibold text-[#E9501F]">
                                          협업
                                        </span>
                                      )}
                                      <span
                                        className={`inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-0.5 text-[10px] font-semibold ${platMeta.pillClass}`}
                                      >
                                        <PlatIcon className="h-2.5 w-2.5" />
                                        {platMeta.label}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Card Body */}
                                  <div className="flex flex-1 flex-col justify-between p-3.5 space-y-2.5">
                                    <div className="space-y-2.5">
                                      {post.media_url && (
                                        <div className="aspect-[16/9] w-full overflow-hidden rounded-[8px] border border-[#E5E5E5] bg-[#FAFAFA]">
                                          <img
                                            src={post.media_url}
                                            alt={post.caption.slice(0, 40) || post.brand_label}
                                            className="h-full w-full object-cover"
                                            onError={(e) => {
                                              (e.currentTarget as HTMLImageElement).style.display = "none";
                                            }}
                                          />
                                        </div>
                                      )}
                                      <p className="line-clamp-2 text-xs leading-relaxed text-[#111111]">
                                        {stripMarkdownInline(post.caption) || "(캡션 없음)"}
                                      </p>
                                    </div>

                                    {/* Metrics Footer */}
                                    <div className="flex items-center justify-between border-t border-[#F0F0F0] pt-2.5 text-xs text-[#4A4A4A]">
                                      <div className="flex items-center gap-2.5 tabular-nums">
                                        {post.views > 0 && (
                                          <span className="inline-flex items-center gap-1 font-semibold text-[#111111]">
                                            <Eye className="h-3.5 w-3.5 text-[#737373]" />
                                            {post.views.toLocaleString()}
                                          </span>
                                        )}
                                        <span className="inline-flex items-center gap-1">
                                          <Heart className="h-3.5 w-3.5 text-[#DC2626]" />
                                          {post.likes.toLocaleString()}
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                          <MessageCircle className="h-3.5 w-3.5 text-[#8C8C8C]" />
                                          {post.comments.toLocaleString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] tabular-nums text-[#8C8C8C]">
                                          {post.published_at}
                                        </span>
                                        {post.post_url && (
                                          <a
                                            href={post.post_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label="원문 게시물 열기"
                                            className="text-[#8C8C8C] hover:text-[#111111]"
                                          >
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </article>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
        )
      )}

      {/* Highlight Spans Source Drawer */}
      <SourceViewerDrawer
        source={liveActiveSource}
        onClose={() => setActiveSource(null)}
        footer={
          liveActiveSource ? (
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <StatusBadge
                  tone={getReviewBadgeProps(liveActiveSource.review_status).tone}
                  dot
                >
                  {getReviewBadgeProps(liveActiveSource.review_status).label}
                </StatusBadge>
                {liveActiveSource.author && (
                  <span className="text-xs text-[#8C8C8C]">
                    작성: {liveActiveSource.author}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateSourceStatus(bundle.project.id, {
                      sourceIds: [liveActiveSource.id],
                      reviewStatus: "REJECTED",
                    });
                    pushToast({
                      tone: "info",
                      title: "해당 자료를 제외 처리했습니다.",
                    });
                  }}
                  className="h-8 rounded-[8px] border border-[#FECACA] bg-white px-3 text-xs font-medium text-[#DC2626] hover:bg-[#FEF2F2] cursor-pointer"
                >
                  제외하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    bulkUpdateSourceStatus(bundle.project.id, {
                      sourceIds: [liveActiveSource.id],
                      reviewStatus: "APPROVED",
                    });
                    pushToast({
                      tone: "success",
                      title: "해당 자료를 장표 근거로 승인했습니다.",
                    });
                  }}
                  className="h-8 rounded-[8px] bg-[#111111] px-3.5 text-xs font-medium text-white hover:bg-[#262626] cursor-pointer"
                >
                  근거로 승인
                </button>
              </div>
            </div>
          ) : null
        }
      />
    </div>
  );
}
