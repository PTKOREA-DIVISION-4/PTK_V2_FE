import type {
  AnalysisTrack,
  CommentDiffResponse,
  DataLabSeries,
  ExportRecord,
  JobStatusResponse,
  KeywordGroup,
  Project,
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

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001"
).replace(/\/$/, "");

export class ApiError extends Error {
  code: string;
  userActionHint?: string;
  retryable: boolean;
  status: number;

  constructor(params: {
    message: string;
    code?: string;
    userActionHint?: string;
    retryable?: boolean;
    status?: number;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.code = params.code || "API_ERROR";
    this.userActionHint = params.userActionHint;
    this.retryable = Boolean(params.retryable);
    this.status = params.status ?? 500;
  }
}

function makeIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit & { withIdempotency?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (options.withIdempotency) {
    headers.set("Idempotency-Key", makeIdempotencyKey());
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let json: Record<string, unknown> | null = null;
  if (text) {
    try {
      json = JSON.parse(text) as Record<string, unknown>;
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const errObj = (json?.error as Record<string, unknown> | undefined) ?? json;
    throw new ApiError({
      message:
        (errObj?.message as string) ||
        (json?.detail as string) ||
        `서버 요청 실패 (HTTP ${res.status})`,
      code: (errObj?.code as string) || `HTTP_${res.status}`,
      userActionHint: errObj?.user_action_hint as string | undefined,
      retryable: Boolean(errObj?.retryable),
      status: res.status,
    });
  }

  return (json ?? text) as T;
}

export function resolveMediaUrl(projectId: string, localPath?: string | null): string | null {
  if (!localPath) return null;
  const filename = localPath.split(/[\\/]/).pop();
  if (!filename) return null;
  return `${API_BASE_URL}/media/${encodeURIComponent(projectId)}/${encodeURIComponent(filename)}`;
}

export function getExportDownloadUrl(projectId: string, exportId: string): string {
  return `${API_BASE_URL}/api/v1/projects/${encodeURIComponent(projectId)}/exports/${encodeURIComponent(exportId)}/download`;
}

export interface BackendProjectSummaryResponse {
  project: Project;
  workflow_meta: WorkflowMeta;
  api_readiness: Record<string, boolean>;
}

export interface BackendKeywordRecommendResponse {
  recommended_groups: Array<{
    group_type: "OWN" | "COMPETITOR" | "INDUSTRY";
    label: string;
    keywords: string[];
    hashtags: string[];
  }>;
  suggested_naver_shopping_category_id: string | null;
  suggested_analysis_track: AnalysisTrack;
}

export interface BackendSourceListResponse {
  items: Array<{
    id: string;
    section_code: SectionCode;
    provider: SourceItemDetail["provider"];
    channel: string;
    title: string;
    source_url?: string | null;
    author?: string | null;
    published_at?: string | null;
    evidence_quote?: string | null;
    sentiment: SourceItemDetail["sentiment"];
    review_status: ReviewStatus;
    has_media: boolean;
  }>;
  facets: SourceFacetCounts;
  total: number;
  page: number;
  page_size: number;
}

export interface BackendSnsPostItem {
  id: string;
  owner_type: "OWN" | "COMPETITOR";
  brand_label: string;
  platform: SnsTopPost["platform"];
  post_url: string;
  caption: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  engagement_score: number;
  rank_order: number;
  is_creator_collab: boolean;
  media_asset?: {
    id: string;
    asset_type: string;
    original_url?: string | null;
    local_path: string;
    caption?: string | null;
    annotation_text?: string | null;
    width: number;
    height: number;
    is_valid: boolean;
  } | null;
  key_takeaway?: string | null;
}

export const factbookApi = {
  health: () =>
    apiFetch<{ status: string; api_readiness: Record<string, boolean> }>("/health"),

  listProjects: () => apiFetch<Project[]>("/api/v1/projects"),

  getProjectSummary: (projectId: string) =>
    apiFetch<BackendProjectSummaryResponse>(`/api/v1/projects/${projectId}/summary`),

  recommendKeywords: (payload: {
    brand_name: string;
    product_name: string;
    industry_category: string;
    competitor_brands: string[];
  }) =>
    apiFetch<BackendKeywordRecommendResponse>("/api/v1/projects/recommend-keywords", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  createProject: (payload: {
    name: string;
    brand_name: string;
    product_name: string;
    industry_category: string;
    analysis_track?: AnalysisTrack;
    period_start: string;
    period_end: string;
    naver_shopping_category_id?: string | null;
    competitors: { brand_name: string; product_name: string }[];
    sns_accounts: {
      owner_type: "OWN" | "COMPETITOR";
      brand_label: string;
      platform?: SnsTopPost["platform"];
      account_url: string;
      handle?: string;
    }[];
    keyword_groups: Omit<KeywordGroup, "id">[];
  }) =>
    apiFetch<Project>("/api/v1/projects", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateProject: (projectId: string, payload: Partial<Project>) =>
    apiFetch<Project>(`/api/v1/projects/${projectId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  deleteProject: (projectId: string) =>
    apiFetch<void>(`/api/v1/projects/${projectId}`, { method: "DELETE" }),

  getResearchPlan: (projectId: string) =>
    apiFetch<ResearchPlan & { workflow_meta?: WorkflowMeta }>(
      `/api/v1/projects/${projectId}/research-plan`
    ),

  updateResearchPlan: (
    projectId: string,
    payload: {
      is_confirmed: boolean;
      target_communities?: string[];
      items?: { item_key: string; is_enabled: boolean }[];
    }
  ) =>
    apiFetch<ResearchPlan & { workflow_meta?: WorkflowMeta }>(
      `/api/v1/projects/${projectId}/research-plan`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    ),

  runCollection: (
    projectId: string,
    payload: { force_refresh?: boolean; selected_sources?: string[] | null } = {}
  ) =>
    apiFetch<JobStatusResponse>(`/api/v1/projects/${projectId}/collections/run`, {
      method: "POST",
      withIdempotency: true,
      body: JSON.stringify(payload),
    }),

  retryCollection: (
    projectId: string,
    payload: { subtask_keys: string[]; force_refresh?: boolean }
  ) =>
    apiFetch<JobStatusResponse>(`/api/v1/projects/${projectId}/collections/retry`, {
      method: "POST",
      withIdempotency: true,
      body: JSON.stringify({ force_refresh: true, ...payload }),
    }),

  getJob: (jobId: string) => apiFetch<JobStatusResponse>(`/api/v1/jobs/${jobId}`),

  cancelJob: (jobId: string) =>
    apiFetch<JobStatusResponse>(`/api/v1/jobs/${jobId}/cancel`, { method: "POST" }),

  listSources: (projectId: string, pageSize = 200) =>
    apiFetch<BackendSourceListResponse>(
      `/api/v1/projects/${projectId}/sources?page=1&page_size=${pageSize}`
    ),

  getSourceDetail: (projectId: string, sourceId: string) =>
    apiFetch<SourceItemDetail>(`/api/v1/projects/${projectId}/sources/${sourceId}`),

  bulkUpdateSources: (
    projectId: string,
    payload: {
      source_ids?: string[];
      review_status: ReviewStatus;
      filter_section?: SectionCode;
      filter_channel?: string;
      filter_all_matching?: boolean;
    }
  ) =>
    apiFetch<{ updated_count: number; review_status: ReviewStatus; facets: SourceFacetCounts }>(
      `/api/v1/projects/${projectId}/sources/bulk`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      }
    ),

  getDatalab: (projectId: string) =>
    apiFetch<{
      project_id: string;
      search_trends: DataLabSeries[];
      shopping_insights: DataLabSeries[];
      methodology_summary: string;
    }>(`/api/v1/projects/${projectId}/datalab`),

  getSnsTop5: (projectId: string) =>
    apiFetch<{
      project_id: string;
      own_top_posts: BackendSnsPostItem[];
      competitor_top_posts: BackendSnsPostItem[];
      creator_collabs: BackendSnsPostItem[];
    }>(`/api/v1/projects/${projectId}/sns-top5`),

  generateSlides: (
    projectId: string,
    payload: { summary_split_mode?: SummarySplitMode; use_approved_only?: boolean } = {}
  ) =>
    apiFetch<SlideDraft[]>(`/api/v1/projects/${projectId}/slides/generate`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  generateSlidesAsync: (
    projectId: string,
    payload: { summary_split_mode?: SummarySplitMode; use_approved_only?: boolean } = {}
  ) =>
    apiFetch<JobStatusResponse>(`/api/v1/projects/${projectId}/slides/generate-async`, {
      method: "POST",
      withIdempotency: true,
      body: JSON.stringify(payload),
    }),

  getSlideGenerationStatus: (projectId: string) =>
    apiFetch<JobStatusResponse | null>(
      `/api/v1/projects/${projectId}/slides/generation-status`
    ),

  listSlides: (projectId: string) =>
    apiFetch<SlideDraft[]>(`/api/v1/projects/${projectId}/slides`),

  updateSlide: (projectId: string, slideId: string, payload: Partial<SlideDraft>) =>
    apiFetch<SlideDraft>(`/api/v1/projects/${projectId}/slides/${slideId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  applyComment: (
    projectId: string,
    slideId: string,
    payload: { raw_comment: string; auto_apply?: boolean }
  ) =>
    apiFetch<CommentDiffResponse>(
      `/api/v1/projects/${projectId}/slides/${slideId}/apply-comment`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),

  decideComment: (
    projectId: string,
    slideId: string,
    commentId: string,
    decision: "APPLY" | "REVERT"
  ) =>
    apiFetch<SlideDraft>(
      `/api/v1/projects/${projectId}/slides/${slideId}/comments/${commentId}/decide`,
      {
        method: "POST",
        body: JSON.stringify({ decision }),
      }
    ),

  updateSummarySplit: (projectId: string, summary_split_mode: SummarySplitMode) =>
    apiFetch<SlideDraft[]>(`/api/v1/projects/${projectId}/summary-split`, {
      method: "PATCH",
      body: JSON.stringify({ summary_split_mode }),
    }),

  approveSection: (projectId: string, sectionCode: SectionCode) =>
    apiFetch<{ section_code: SectionCode; approved_slide_count: number }>(
      `/api/v1/projects/${projectId}/sections/${sectionCode}/approve`,
      { method: "POST" }
    ),

  runQc: (projectId: string) =>
    apiFetch<QcReport>(`/api/v1/projects/${projectId}/exports/qc`, { method: "POST" }),

  createPptxExport: (projectId: string, allow_warnings = true) =>
    apiFetch<ExportRecord>(`/api/v1/projects/${projectId}/exports/pptx`, {
      method: "POST",
      body: JSON.stringify({ allow_warnings }),
    }),

  listExports: (projectId: string) =>
    apiFetch<ExportRecord[]>(`/api/v1/projects/${projectId}/exports`),
};
