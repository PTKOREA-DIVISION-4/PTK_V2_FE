"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  type BackendKeywordRecommendResponse,
  type BackendSnsPostItem,
  type BackendSourceListResponse,
  factbookApi,
  resolveMediaUrl,
} from "@/lib/api";
import {
  AnalysisTrack,
  CommentDiffResponse,
  ExportRecord,
  JobStatusResponse,
  Project,
  ProjectBundle,
  QcCheckItem,
  QcReport,
  ResearchPlan,
  ReviewStatus,
  SectionCode,
  SlideDraft,
  SnsTopPost,
  SourceFacetCounts,
  SourceItemDetail,
  SummarySplitMode,
  WorkflowMeta,
} from "@/lib/types";

export interface CreateProjectWizardInput {
  name: string;
  brand_name: string;
  product_name: string;
  industry_category: string;
  analysis_track: AnalysisTrack;
  period_start: string;
  period_end: string;
  brief_note?: string;
  competitors: { brand_name: string; product_name: string }[];
  sns_accounts: {
    owner_type: "OWN" | "COMPETITOR";
    brand_label: string;
    platform: "INSTAGRAM" | "YOUTUBE" | "TIKTOK" | "OTHER";
    account_url: string;
    handle: string;
  }[];
  keyword_groups: {
    group_type: "OWN" | "COMPETITOR" | "INDUSTRY";
    label: string;
    keywords: string[];
    hashtags: string[];
  }[];
  target_communities: string[];
  disabled_item_keys: string[];
}

interface FactbookContextValue {
  bundles: ProjectBundle[];
  loadingList: boolean;
  loadingProjectId: string | null;
  syncState: "saved" | "saving";
  refreshProjects: () => Promise<void>;
  ensureProjectLoaded: (projectId: string, force?: boolean) => Promise<void>;
  getBundle: (projectId: string) => ProjectBundle | undefined;
  getWorkflowMeta: (bundle: ProjectBundle) => WorkflowMeta;
  getSourceFacets: (bundle: ProjectBundle) => SourceFacetCounts;
  evaluateQc: (bundle: ProjectBundle) => QcReport;
  runQc: (projectId: string) => Promise<QcReport>;
  recommendKeywords: (payload: {
    brand_name: string;
    product_name: string;
    industry_category: string;
    competitor_brands: string[];
  }) => Promise<BackendKeywordRecommendResponse>;
  createProjectFromWizard: (input: CreateProjectWizardInput) => Promise<string>;
  updateProjectBrief: (projectId: string, patch: Partial<Project>) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  togglePlanItem: (projectId: string, itemKey: string, enabled: boolean) => void;
  toggleCommunity: (projectId: string, community: string) => void;
  confirmResearchPlan: (projectId: string) => Promise<void>;
  runCollectionSimulation: (projectId: string, subtaskKeys?: string[]) => Promise<void>;
  loadSourceDetail: (projectId: string, sourceId: string) => Promise<SourceItemDetail>;
  bulkUpdateSourceStatus: (
    projectId: string,
    params: {
      sourceIds?: string[];
      reviewStatus: ReviewStatus;
      filterSection?: SectionCode | "ALL";
      filterChannel?: string;
      filterAllMatching?: boolean;
    }
  ) => Promise<number>;
  generateSlides: (projectId: string, splitMode?: SummarySplitMode) => Promise<void>;
  updateSlide: (projectId: string, slideId: string, patch: Partial<SlideDraft>) => Promise<void>;
  previewCommentDiff: (
    projectId: string,
    slideId: string,
    rawComment: string
  ) => Promise<CommentDiffResponse>;
  decideCommentDiff: (
    projectId: string,
    slideId: string,
    commentId: string,
    decision: "APPLY" | "REVERT"
  ) => Promise<void>;
  switchSummarySplit: (projectId: string, splitMode: SummarySplitMode) => Promise<void>;
  approveSectionSlides: (projectId: string, sectionCode: SectionCode) => Promise<number>;
  createMockExport: (projectId: string) => Promise<ExportRecord>;
}

const FactbookContext = createContext<FactbookContextValue | null>(null);

const TERMINAL_JOB_STATUSES = new Set([
  "COMPLETED",
  "PARTIAL_SUCCESS",
  "FAILED",
  "CANCELLED",
]);

function makeIdleJob(projectId: string): JobStatusResponse {
  return {
    id: `idle-${projectId}`,
    project_id: projectId,
    job_type: "COLLECTION",
    status: "PENDING",
    progress_pct: 0,
    logs: [],
    subtasks: [
      { id: "st-1", subtask_key: "perplexity_research", label: "거시 시장·규제·자사/경쟁 1:1·벤치마크 리서치 (Perplexity)", status: "PENDING", progress_pct: 0, collected_count: 0 },
      { id: "st-2", subtask_key: "naver_datalab", label: "네이버 데이터랩 검색어 트렌드·쇼핑 인사이트 정량 수집", status: "PENDING", progress_pct: 0, collected_count: 0 },
      { id: "st-3", subtask_key: "sns_official_top5", label: "자사·경쟁사 공식 SNS 채널 지표 및 기간 내 TOP 5 추출", status: "PENDING", progress_pct: 0, collected_count: 0 },
      { id: "st-4", subtask_key: "creator_collab", label: "크리에이터 협업 콘텐츠 및 시딩 레퍼런스 수집", status: "PENDING", progress_pct: 0, collected_count: 0 },
      { id: "st-5", subtask_key: "community_voc", label: "국내 커뮤니티·블로그·카페·리뷰 실소비자 VOC 수집", status: "PENDING", progress_pct: 0, collected_count: 0 },
      { id: "st-6", subtask_key: "news_press", label: "자사·경쟁사 언론 보도 기사 및 월별·주제별 PR 동향 수집", status: "PENDING", progress_pct: 0, collected_count: 0 },
      { id: "st-7", subtask_key: "media_archiving", label: "참조 이미지·영상 주요 장면 스크린샷 로컬 아카이빙", status: "PENDING", progress_pct: 0, collected_count: 0 },
    ],
  };
}

function makeStubPlan(project: Project): ResearchPlan {
  return {
    id: `plan-${project.id}`,
    project_id: project.id,
    analysis_track: project.analysis_track,
    is_confirmed: project.current_stage !== "SETUP" && project.current_stage !== "PLAN",
    target_communities: ["theqoo", "dcinside", "fmkorea", "naver_blog", "naver_cafe"],
    estimated_duration_seconds: 90,
    items: [],
  };
}

function mapSourceItems(res: BackendSourceListResponse | undefined): SourceItemDetail[] {
  if (!res?.items) return [];
  return res.items.map((item) => ({
    id: item.id,
    section_code: item.section_code,
    provider: item.provider,
    channel: item.channel,
    title: item.title,
    content: "",
    source_url: item.source_url,
    author: item.author,
    published_at: item.published_at,
    evidence_quote: item.evidence_quote,
    highlight_spans: [],
    sentiment: item.sentiment,
    review_status: item.review_status,
    has_media: item.has_media,
  }));
}

function mapSnsPosts(projectId: string, items: BackendSnsPostItem[]): SnsTopPost[] {
  return items.map((p) => ({
    id: p.id,
    owner_type: p.owner_type,
    brand_label: p.brand_label,
    platform: p.platform,
    post_url: p.post_url,
    caption: p.caption,
    published_at: p.published_at.slice(0, 10),
    views: p.views,
    likes: p.likes,
    comments: p.comments,
    engagement_score: p.engagement_score,
    rank_order: p.rank_order,
    is_creator_collab: p.is_creator_collab,
    thumbnail_accent: p.owner_type === "OWN" ? "#E9501F" : "#111111",
    media_url:
      resolveMediaUrl(projectId, p.media_asset?.local_path) ??
      p.media_asset?.original_url ??
      null,
    key_takeaway: p.key_takeaway || "",
  }));
}

function deriveCompletedJobIfCollected(
  projectId: string,
  sourcesCount: number,
  datalabCount: number,
  snsCount: number,
  existing?: JobStatusResponse
): JobStatusResponse {
  if (existing && (existing.status === "RUNNING" || existing.id === existing.id && existing.logs.length > 0)) {
    return existing;
  }
  const base = makeIdleJob(projectId);
  if (sourcesCount > 0 || datalabCount > 0 || snsCount > 0) {
    return {
      ...base,
      status: "COMPLETED",
      progress_pct: 100,
      logs: [`수집 데이터 로드 완료 (원문 ${sourcesCount}건 · 데이터랩 ${datalabCount}종 · SNS ${snsCount}건)`],
      subtasks: base.subtasks.map((st) => ({
        ...st,
        status: "COMPLETED",
        progress_pct: 100,
        collected_count:
          st.subtask_key === "naver_datalab"
            ? datalabCount
            : st.subtask_key === "sns_official_top5"
            ? snsCount
            : sourcesCount,
      })),
    };
  }
  return base;
}

export function FactbookProvider({ children }: { children: React.ReactNode }) {
  const [bundles, setBundles] = useState<ProjectBundle[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingProjectId, setLoadingProjectId] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<"saved" | "saving">("saved");
  const activePollsRef = useRef<Set<string>>(new Set());

  const markSavedSoon = useCallback(() => {
    setSyncState("saving");
    setTimeout(() => setSyncState("saved"), 320);
  }, []);

  const mutateBundle = useCallback(
    (projectId: string, updater: (b: ProjectBundle) => ProjectBundle) => {
      markSavedSoon();
      setBundles((prev) =>
        prev.map((b) => (b.project.id === projectId ? updater(b) : b))
      );
    },
    [markSavedSoon]
  );

  const refreshProjects = useCallback(async () => {
    setLoadingList(true);
    try {
      const projects = await factbookApi.listProjects();
      const summaries = await Promise.allSettled(
        projects.map((p) => factbookApi.getProjectSummary(p.id))
      );

      setBundles((prev) => {
        const prevMap = new Map(prev.map((b) => [b.project.id, b]));
        return projects.map((proj, idx) => {
          const sumRes = summaries[idx];
          const summary =
            sumRes.status === "fulfilled" ? sumRes.value : undefined;
          const existing = prevMap.get(proj.id);
          const resolvedProj = summary?.project ?? proj;
          if (existing?.loaded) {
            return {
              ...existing,
              project: resolvedProj,
              workflow_meta: summary?.workflow_meta ?? existing.workflow_meta,
            };
          }
          return {
            project: resolvedProj,
            plan: existing?.plan ?? makeStubPlan(resolvedProj),
            sources: existing?.sources ?? [],
            datalab: existing?.datalab ?? [],
            sns_top_posts: existing?.sns_top_posts ?? [],
            slides: existing?.slides ?? [],
            last_job: existing?.last_job ?? makeIdleJob(resolvedProj.id),
            exports: existing?.exports ?? [],
            active_comment_diffs: existing?.active_comment_diffs ?? {},
            workflow_meta: summary?.workflow_meta,
            loaded: false,
          };
        });
      });
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    void refreshProjects();
  }, [refreshProjects]);

  const ensureProjectLoaded = useCallback(
    async (projectId: string, force = false) => {
      const existing = bundles.find((b) => b.project.id === projectId);
      if (existing?.loaded && !force) return;

      setLoadingProjectId(projectId);
      try {
        const [sumRes, planRes, srcRes, dlRes, snsRes, slideRes, expRes] =
          await Promise.allSettled([
            factbookApi.getProjectSummary(projectId),
            factbookApi.getResearchPlan(projectId),
            factbookApi.listSources(projectId, 200),
            factbookApi.getDatalab(projectId),
            factbookApi.getSnsTop5(projectId),
            factbookApi.listSlides(projectId),
            factbookApi.listExports(projectId),
          ]);

        if (sumRes.status !== "fulfilled") {
          return;
        }
        const summary = sumRes.value;
        const plan =
          planRes.status === "fulfilled"
            ? planRes.value
            : makeStubPlan(summary.project);
        const sources =
          srcRes.status === "fulfilled" ? mapSourceItems(srcRes.value) : [];
        const datalab =
          dlRes.status === "fulfilled"
            ? [...dlRes.value.search_trends, ...dlRes.value.shopping_insights]
            : [];
        const sns_top_posts =
          snsRes.status === "fulfilled"
            ? [
                ...mapSnsPosts(projectId, snsRes.value.own_top_posts),
                ...mapSnsPosts(projectId, snsRes.value.competitor_top_posts),
                ...mapSnsPosts(projectId, snsRes.value.creator_collabs),
              ]
            : [];
        const slides =
          slideRes.status === "fulfilled" ? slideRes.value : [];
        const exportsList =
          expRes.status === "fulfilled" ? expRes.value : [];

        setBundles((prev) => {
          const prevEntry = prev.find((b) => b.project.id === projectId);
          const nextBundle: ProjectBundle = {
            project: summary.project,
            plan,
            sources,
            datalab,
            sns_top_posts,
            slides,
            last_job: deriveCompletedJobIfCollected(
              projectId,
              sources.length,
              datalab.length,
              sns_top_posts.length,
              prevEntry?.last_job
            ),
            exports: exportsList,
            active_comment_diffs: prevEntry?.active_comment_diffs ?? {},
            workflow_meta: summary.workflow_meta,
            loaded: true,
          };
          if (prevEntry) {
            return prev.map((b) => (b.project.id === projectId ? nextBundle : b));
          }
          return [nextBundle, ...prev];
        });
      } finally {
        setLoadingProjectId((cur) => (cur === projectId ? null : cur));
      }
    },
    [bundles]
  );

  const pollJobUntilDone = useCallback(
    async (projectId: string, jobId: string): Promise<JobStatusResponse> => {
      if (activePollsRef.current.has(jobId)) {
        return factbookApi.getJob(jobId);
      }
      activePollsRef.current.add(jobId);
      let lastCompletedCount = -1;
      try {
        while (true) {
          const job = await factbookApi.getJob(jobId);
          setBundles((prev) =>
            prev.map((b) =>
              b.project.id === projectId ? { ...b, last_job: job } : b
            )
          );
          if (TERMINAL_JOB_STATUSES.has(job.status)) {
            await ensureProjectLoaded(projectId, true);
            return job;
          }
          const completedNow = job.subtasks.filter(
            (st) => st.status === "COMPLETED"
          ).length;
          if (completedNow > lastCompletedCount && completedNow > 0) {
            lastCompletedCount = completedNow;
            void Promise.allSettled([
              factbookApi.listSources(projectId, 200),
              factbookApi.getDatalab(projectId),
              factbookApi.getSnsTop5(projectId),
            ]).then(([srcRes, dlRes, snsRes]) => {
              setBundles((prev) =>
                prev.map((b) => {
                  if (b.project.id !== projectId) return b;
                  const nextSources =
                    srcRes.status === "fulfilled"
                      ? mapSourceItems(srcRes.value)
                      : b.sources;
                  const nextDl =
                    dlRes.status === "fulfilled"
                      ? [...dlRes.value.search_trends, ...dlRes.value.shopping_insights]
                      : b.datalab;
                  const nextSns =
                    snsRes.status === "fulfilled"
                      ? [
                          ...mapSnsPosts(projectId, snsRes.value.own_top_posts),
                          ...mapSnsPosts(projectId, snsRes.value.competitor_top_posts),
                          ...mapSnsPosts(projectId, snsRes.value.creator_collabs),
                        ]
                      : b.sns_top_posts;
                  return {
                    ...b,
                    sources: nextSources,
                    datalab: nextDl,
                    sns_top_posts: nextSns,
                  };
                })
              );
            });
          }
          await new Promise((r) => setTimeout(r, 1500));
        }
      } finally {
        activePollsRef.current.delete(jobId);
      }
    },
    [ensureProjectLoaded]
  );

  const getBundle = useCallback(
    (projectId: string) => bundles.find((b) => b.project.id === projectId),
    [bundles]
  );

  const getSourceFacets = useCallback(
    (bundle: ProjectBundle): SourceFacetCounts => {
      if (!bundle.loaded && bundle.workflow_meta) {
        return {
          total: bundle.workflow_meta.total_sources_count,
          by_review_status: {
            PENDING: bundle.workflow_meta.pending_sources_count,
            APPROVED: bundle.workflow_meta.approved_sources_count,
            REJECTED: bundle.workflow_meta.rejected_sources_count,
          },
          by_section: {},
          by_channel: {},
          by_provider: {},
        };
      }
      const by_review_status: Record<string, number> = {};
      const by_section: Record<string, number> = {};
      const by_channel: Record<string, number> = {};
      const by_provider: Record<string, number> = {};

      for (const s of bundle.sources) {
        by_review_status[s.review_status] =
          (by_review_status[s.review_status] || 0) + 1;
        by_section[s.section_code] = (by_section[s.section_code] || 0) + 1;
        by_channel[s.channel] = (by_channel[s.channel] || 0) + 1;
        by_provider[s.provider] = (by_provider[s.provider] || 0) + 1;
      }
      return {
        total: bundle.sources.length,
        by_review_status,
        by_section,
        by_channel,
        by_provider,
      };
    },
    []
  );

  const evaluateQc = useCallback((bundle: ProjectBundle): QcReport => {
    const slides = bundle.slides;
    const allSections: SectionCode[] = [
      "0_OVERVIEW",
      "1_OWN",
      "2_MARKET",
      "3_COMPETITOR",
      "4_CONSUMER",
      "5_SUMMARY_CONCLUSION",
    ];
    const presentSet = new Set(slides.map((s) => s.section_code));
    const present_sections = allSections.filter((s) => presentSet.has(s));
    const missing_sections = allSections.filter((s) => !presentSet.has(s));
    const checks: QcCheckItem[] = [];

    if (slides.length === 0) {
      checks.push({
        gate_code: "REQUIRED_SECTIONS",
        severity: "BLOCKER",
        message:
          "생성된 슬라이드 초안이 없습니다. 최소 0~5장 표준 섹션이 모두 존재해야 합니다.",
        user_action_hint: "자료 검수를 마친 뒤 '장표 초안 생성'을 실행해 주세요.",
      });
    } else if (missing_sections.length > 0) {
      checks.push({
        gate_code: "REQUIRED_SECTIONS",
        severity: "BLOCKER",
        message: `필수 목차 섹션이 누락되었습니다: ${missing_sections.join(", ")}`,
        target_section: missing_sections[0],
        user_action_hint: "누락된 섹션을 보완해 주세요.",
      });
    } else {
      checks.push({
        gate_code: "REQUIRED_SECTIONS",
        severity: "PASS",
        message:
          "0. 분석 개요 ~ 5. 현황 요약·결론 전체 표준 목차가 완비되었습니다.",
      });
    }

    const emptySlide = slides.find((s) => {
      const hasHc = Boolean(s.headcopy.trim());
      const hasBody =
        s.bullets.length > 0 ||
        s.kpi_cards.length > 0 ||
        Boolean(s.table?.rows.length) ||
        s.visual_assets.length > 0 ||
        Boolean(s.as_is_to_be?.as_is_points.length);
      return !hasHc || !hasBody;
    });

    if (emptySlide) {
      checks.push({
        gate_code: "NO_EMPTY_SLIDES",
        severity: "BLOCKER",
        message: `빈 장표 감지: '${emptySlide.title}'에 리드 문장 또는 본문이 비어 있습니다.`,
        target_section: emptySlide.section_code,
        target_slide_id: emptySlide.id,
        user_action_hint: "해당 장표로 이동해 내용을 보완해 주세요.",
      });
    } else if (slides.length > 0) {
      checks.push({
        gate_code: "NO_EMPTY_SLIDES",
        severity: "PASS",
        message: `전체 ${slides.length}장 슬라이드에 리드 문장과 핵심 본문이 채워져 있습니다.`,
      });
    }

    const missingFootnote = slides.find(
      (s) => s.bullets.length > 0 && !s.footnote?.trim()
    );
    if (missingFootnote) {
      checks.push({
        gate_code: "EVIDENCE_AND_DATALAB_BASIS",
        severity: "WARNING",
        message: `'${missingFootnote.title}' 하단 출처 표기가 비어 있습니다.`,
        target_section: missingFootnote.section_code,
        target_slide_id: missingFootnote.id,
        user_action_hint: "우측 편집 패널에서 출처 각주를 추가하는 것을 권장합니다.",
      });
    } else {
      checks.push({
        gate_code: "EVIDENCE_AND_DATALAB_BASIS",
        severity: "PASS",
        message:
          "데이터랩 산식 기준 표기(최댓값=100 상대지수) 및 장표별 출처가 확인되었습니다.",
      });
    }

    const summaryParts = slides.filter((s) => s.slide_type === "SUMMARY_PART");
    if (slides.length > 0 && summaryParts.length < 2) {
      checks.push({
        gate_code: "MEDIA_AND_OVERFLOW",
        severity: "BLOCKER",
        message:
          "현황 요약(Summary)은 1장 압축 방지를 위해 최소 2장 또는 4장 분할이 필요합니다.",
        target_section: "5_SUMMARY_CONCLUSION",
        user_action_hint: "요약 분할 스위치에서 2장 또는 4장 분할을 선택해 주세요.",
      });
    } else {
      checks.push({
        gate_code: "MEDIA_AND_OVERFLOW",
        severity: "PASS",
        message: `Summary ${summaryParts.length}장 분할 구성 및 레이아웃 밀도가 정상입니다.`,
      });
    }

    const severities = checks.map((c) => c.severity);
    const overall_status = severities.includes("BLOCKER")
      ? "BLOCKER"
      : severities.includes("WARNING")
      ? "WARNING"
      : "PASS";

    return {
      project_id: bundle.project.id,
      overall_status,
      can_export: overall_status !== "BLOCKER",
      summary_split_mode: bundle.project.summary_split_mode,
      total_slides_checked: slides.length,
      present_sections,
      missing_sections,
      checks,
    };
  }, []);

  const getWorkflowMeta = useCallback(
    (bundle: ProjectBundle): WorkflowMeta => {
      if (!bundle.loaded && bundle.workflow_meta) {
        return {
          ...bundle.workflow_meta,
          approved_slides_count:
            bundle.workflow_meta.approved_slides_count ??
            Math.max(
              0,
              bundle.workflow_meta.total_slides_count -
                bundle.workflow_meta.unreviewed_slides_count
            ),
        };
      }
      const facets = getSourceFacets(bundle);
      const qc = evaluateQc(bundle);
      const approvedSlides = bundle.slides.filter(
        (s) => s.review_status === "APPROVED"
      ).length;
      const unreviewedSlides = bundle.slides.filter(
        (s) => s.review_status === "NEEDS_REVIEW"
      ).length;

      let next_step_hint = "조사 계획을 확정하고 자료 수집을 시작해 주세요.";
      if (!bundle.plan.is_confirmed) {
        next_step_hint =
          "0~5장 조사 항목과 수집 커뮤니티를 확정한 뒤 자료 수집을 실행해 주세요.";
      } else if (facets.total === 0) {
        next_step_hint =
          "자료·수집 풀에서 다중 소스 수집을 실행해 원문을 확보해 주세요.";
      } else if (bundle.slides.length === 0) {
        next_step_hint =
          "수집 자료를 일괄 채택/제한한 뒤 0~5장 장표 초안을 생성해 주세요.";
      } else if (!qc.can_export) {
        next_step_hint = "사전 QC 차단 항목을 보완해야 PPTX 출력이 가능합니다.";
      } else if (unreviewedSlides > 0) {
        next_step_hint = `미검토 장표 ${unreviewedSlides}건을 확인하고 코멘트 반영 또는 확정을 완료해 주세요.`;
      } else {
        next_step_hint =
          "모든 장표 검수와 사전 QC를 통과했습니다. PPTX를 출력할 수 있습니다.";
      }

      return {
        current_stage: bundle.project.current_stage,
        plan_confirmed: bundle.plan.is_confirmed,
        total_sources_count: facets.total,
        pending_sources_count: facets.by_review_status.PENDING || 0,
        approved_sources_count: facets.by_review_status.APPROVED || 0,
        rejected_sources_count: facets.by_review_status.REJECTED || 0,
        total_slides_count: bundle.slides.length,
        approved_slides_count: approvedSlides,
        unreviewed_slides_count: unreviewedSlides,
        missing_sections: qc.missing_sections,
        can_export: qc.can_export,
        next_step_hint,
      };
    },
    [evaluateQc, getSourceFacets]
  );

  const recommendKeywords = useCallback(
    async (payload: {
      brand_name: string;
      product_name: string;
      industry_category: string;
      competitor_brands: string[];
    }) => {
      return factbookApi.recommendKeywords(payload);
    },
    []
  );

  const createProjectFromWizard = useCallback(
    async (input: CreateProjectWizardInput): Promise<string> => {
      setSyncState("saving");
      try {
        const created = await factbookApi.createProject({
          name: input.name.trim(),
          brand_name: input.brand_name.trim(),
          product_name: input.product_name.trim(),
          industry_category: input.industry_category,
          analysis_track: input.analysis_track,
          period_start: input.period_start,
          period_end: input.period_end,
          competitors: input.competitors,
          sns_accounts: input.sns_accounts.map((a) => ({
            owner_type: a.owner_type,
            brand_label: a.brand_label,
            platform: a.platform,
            account_url: a.account_url,
            handle: a.handle,
          })),
          keyword_groups: input.keyword_groups,
        });

        const disabledSet = new Set(input.disabled_item_keys);
        const initialPlan = await factbookApi.getResearchPlan(created.id);
        const confirmedPlan = await factbookApi.updateResearchPlan(created.id, {
          is_confirmed: true,
          target_communities: input.target_communities,
          items: initialPlan.items.map((it) => ({
            item_key: it.item_key,
            is_enabled: !disabledSet.has(it.item_key),
          })),
        });

        const job = await factbookApi.runCollection(created.id, {
          force_refresh: false,
        });

        const newBundle: ProjectBundle = {
          project: { ...created, current_stage: "COLLECT" },
          plan: confirmedPlan,
          sources: [],
          datalab: [],
          sns_top_posts: [],
          slides: [],
          last_job: job,
          exports: [],
          active_comment_diffs: {},
          loaded: true,
        };
        setBundles((prev) => [newBundle, ...prev]);

        // Poll in background while router navigates into the workspace
        void pollJobUntilDone(created.id, job.id);
        return created.id;
      } finally {
        setSyncState("saved");
      }
    },
    [pollJobUntilDone]
  );

  const updateProjectBrief = useCallback(
    async (projectId: string, patch: Partial<Project>) => {
      setSyncState("saving");
      try {
        const updated = await factbookApi.updateProject(projectId, patch);
        mutateBundle(projectId, (b) => ({
          ...b,
          project: updated,
        }));
      } finally {
        setSyncState("saved");
      }
    },
    [mutateBundle]
  );

  const deleteProject = useCallback(async (projectId: string) => {
    setSyncState("saving");
    try {
      await factbookApi.deleteProject(projectId);
      setBundles((prev) => prev.filter((b) => b.project.id !== projectId));
    } finally {
      setSyncState("saved");
    }
  }, []);

  const togglePlanItem = useCallback(
    (projectId: string, itemKey: string, enabled: boolean) => {
      mutateBundle(projectId, (b) => ({
        ...b,
        plan: {
          ...b.plan,
          items: b.plan.items.map((item) =>
            item.item_key === itemKey ? { ...item, is_enabled: enabled } : item
          ),
        },
      }));
    },
    [mutateBundle]
  );

  const toggleCommunity = useCallback(
    (projectId: string, community: string) => {
      mutateBundle(projectId, (b) => {
        const exists = b.plan.target_communities.includes(community);
        const next = exists
          ? b.plan.target_communities.filter((c) => c !== community)
          : [...b.plan.target_communities, community];
        return {
          ...b,
          plan: { ...b.plan, target_communities: next },
        };
      });
    },
    [mutateBundle]
  );

  const confirmResearchPlan = useCallback(
    async (projectId: string) => {
      const bundle = bundles.find((b) => b.project.id === projectId);
      if (!bundle) return;
      await factbookApi.updateResearchPlan(projectId, {
        is_confirmed: true,
        target_communities: bundle.plan.target_communities,
        items: bundle.plan.items.map((i) => ({
          item_key: i.item_key,
          is_enabled: i.is_enabled,
        })),
      });
      mutateBundle(projectId, (b) => ({
        ...b,
        plan: { ...b.plan, is_confirmed: true },
        project: { ...b.project, current_stage: "COLLECT" },
      }));
    },
    [bundles, mutateBundle]
  );

  const runCollectionSimulation = useCallback(
    async (projectId: string, subtaskKeys?: string[]) => {
      setSyncState("saving");
      try {
        const job = subtaskKeys?.length
          ? await factbookApi.retryCollection(projectId, {
              subtask_keys: subtaskKeys,
              force_refresh: true,
            })
          : await factbookApi.runCollection(projectId, {
              force_refresh: false,
            });
        mutateBundle(projectId, (b) => ({ ...b, last_job: job }));
        await pollJobUntilDone(projectId, job.id);
      } finally {
        setSyncState("saved");
      }
    },
    [mutateBundle, pollJobUntilDone]
  );

  const loadSourceDetail = useCallback(
    async (projectId: string, sourceId: string): Promise<SourceItemDetail> => {
      const detail = await factbookApi.getSourceDetail(projectId, sourceId);
      setBundles((prev) =>
        prev.map((b) =>
          b.project.id === projectId
            ? {
                ...b,
                sources: b.sources.map((s) => (s.id === sourceId ? detail : s)),
              }
            : b
        )
      );
      return detail;
    },
    []
  );

  const bulkUpdateSourceStatus = useCallback(
    async (
      projectId: string,
      params: {
        sourceIds?: string[];
        reviewStatus: ReviewStatus;
        filterSection?: SectionCode | "ALL";
        filterChannel?: string;
        filterAllMatching?: boolean;
      }
    ): Promise<number> => {
      setSyncState("saving");
      try {
        const res = await factbookApi.bulkUpdateSources(projectId, {
          source_ids: params.sourceIds ?? [],
          review_status: params.reviewStatus,
          filter_section:
            params.filterSection && params.filterSection !== "ALL"
              ? params.filterSection
              : undefined,
          filter_channel:
            params.filterChannel && params.filterChannel !== "ALL"
              ? params.filterChannel
              : undefined,
          filter_all_matching: Boolean(params.filterAllMatching),
        });
        mutateBundle(projectId, (b) => ({
          ...b,
          sources: b.sources.map((src) => {
            const matchesId = params.sourceIds?.includes(src.id);
            const matchesFilter =
              params.filterAllMatching &&
              (!params.filterSection ||
                params.filterSection === "ALL" ||
                src.section_code === params.filterSection) &&
              (!params.filterChannel ||
                params.filterChannel === "ALL" ||
                src.channel === params.filterChannel);
            if (matchesId || matchesFilter) {
              return { ...src, review_status: params.reviewStatus };
            }
            return src;
          }),
        }));
        return res.updated_count;
      } finally {
        setSyncState("saved");
      }
    },
    [mutateBundle]
  );

  const generateSlides = useCallback(
    async (projectId: string, splitMode?: SummarySplitMode) => {
      setSyncState("saving");
      try {
        const slides = await factbookApi.generateSlides(projectId, {
          summary_split_mode: splitMode,
          use_approved_only: true,
        });
        mutateBundle(projectId, (b) => ({
          ...b,
          project: {
            ...b.project,
            current_stage: "REVIEW",
            summary_split_mode: splitMode || b.project.summary_split_mode,
          },
          slides,
        }));
      } finally {
        setSyncState("saved");
      }
    },
    [mutateBundle]
  );

  const updateSlide = useCallback(
    async (projectId: string, slideId: string, patch: Partial<SlideDraft>) => {
      mutateBundle(projectId, (b) => ({
        ...b,
        slides: b.slides.map((s) =>
          s.id === slideId ? { ...s, ...patch } : s
        ),
      }));
      await factbookApi.updateSlide(projectId, slideId, patch);
    },
    [mutateBundle]
  );

  const previewCommentDiff = useCallback(
    async (
      projectId: string,
      slideId: string,
      rawComment: string
    ): Promise<CommentDiffResponse> => {
      setSyncState("saving");
      try {
        const diff = await factbookApi.applyComment(projectId, slideId, {
          raw_comment: rawComment,
          auto_apply: false,
        });
        mutateBundle(projectId, (b) => ({
          ...b,
          active_comment_diffs: { ...b.active_comment_diffs, [slideId]: diff },
        }));
        return diff;
      } finally {
        setSyncState("saved");
      }
    },
    [mutateBundle]
  );

  const decideCommentDiff = useCallback(
    async (
      projectId: string,
      slideId: string,
      commentId: string,
      decision: "APPLY" | "REVERT"
    ) => {
      setSyncState("saving");
      try {
        const updatedSlide = await factbookApi.decideComment(
          projectId,
          slideId,
          commentId,
          decision
        );
        mutateBundle(projectId, (b) => {
          const diff = b.active_comment_diffs[slideId];
          return {
            ...b,
            slides: b.slides.map((s) => (s.id === slideId ? updatedSlide : s)),
            active_comment_diffs: diff
              ? {
                  ...b.active_comment_diffs,
                  [slideId]: {
                    ...diff,
                    status: decision === "APPLY" ? "APPLIED" : "REVERTED",
                  },
                }
              : b.active_comment_diffs,
          };
        });
      } finally {
        setSyncState("saved");
      }
    },
    [mutateBundle]
  );

  const switchSummarySplit = useCallback(
    async (projectId: string, splitMode: SummarySplitMode) => {
      setSyncState("saving");
      try {
        const slides = await factbookApi.updateSummarySplit(projectId, splitMode);
        mutateBundle(projectId, (b) => ({
          ...b,
          project: { ...b.project, summary_split_mode: splitMode },
          slides,
        }));
      } finally {
        setSyncState("saved");
      }
    },
    [mutateBundle]
  );

  const approveSectionSlides = useCallback(
    async (projectId: string, sectionCode: SectionCode) => {
      const res = await factbookApi.approveSection(projectId, sectionCode);
      mutateBundle(projectId, (b) => ({
        ...b,
        slides: b.slides.map((s) =>
          s.section_code === sectionCode
            ? { ...s, review_status: "APPROVED" }
            : s
        ),
      }));
      return res.approved_slide_count;
    },
    [mutateBundle]
  );

  const runQc = useCallback(async (projectId: string) => {
    return factbookApi.runQc(projectId);
  }, []);

  const createMockExport = useCallback(
    async (projectId: string): Promise<ExportRecord> => {
      setSyncState("saving");
      try {
        const rec = await factbookApi.createPptxExport(projectId, true);
        mutateBundle(projectId, (b) => ({
          ...b,
          project: { ...b.project, current_stage: "EXPORT" },
          exports: [rec, ...b.exports],
        }));
        return rec;
      } finally {
        setSyncState("saved");
      }
    },
    [mutateBundle]
  );

  return (
    <FactbookContext.Provider
      value={{
        bundles,
        loadingList,
        loadingProjectId,
        syncState,
        refreshProjects,
        ensureProjectLoaded,
        getBundle,
        getWorkflowMeta,
        getSourceFacets,
        evaluateQc,
        runQc,
        recommendKeywords,
        createProjectFromWizard,
        updateProjectBrief,
        deleteProject,
        togglePlanItem,
        toggleCommunity,
        confirmResearchPlan,
        runCollectionSimulation,
        loadSourceDetail,
        bulkUpdateSourceStatus,
        generateSlides,
        updateSlide,
        previewCommentDiff,
        decideCommentDiff,
        switchSummarySplit,
        approveSectionSlides,
        createMockExport,
      }}
    >
      {children}
    </FactbookContext.Provider>
  );
}

export function useFactbookStore() {
  const ctx = useContext(FactbookContext);
  if (!ctx) {
    throw new Error("useFactbookStore must be used inside FactbookProvider");
  }
  return ctx;
}
