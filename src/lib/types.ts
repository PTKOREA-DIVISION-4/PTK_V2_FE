export type SectionCode =
  | "0_OVERVIEW"
  | "1_OWN"
  | "2_MARKET"
  | "3_COMPETITOR"
  | "4_CONSUMER"
  | "5_SUMMARY_CONCLUSION";

export type AnalysisTrack = "REVIEW_CENTRIC" | "MARKET_CENTRIC";

export type ProjectStage = "SETUP" | "PLAN" | "COLLECT" | "REVIEW" | "EXPORT";

export type SummarySplitMode = "SPLIT_2" | "SPLIT_4";

export type ReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SlideReviewStatus = "NEEDS_REVIEW" | "COMMENT_APPLIED" | "APPROVED";

export type JobStatus =
  | "PENDING"
  | "RUNNING"
  | "PARTIAL_SUCCESS"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type QcSeverity = "PASS" | "WARNING" | "BLOCKER";

export type OwnerType = "OWN" | "COMPETITOR" | "INDUSTRY";

export type SnsPlatform = "INSTAGRAM" | "YOUTUBE" | "TIKTOK" | "OTHER";

export type KeywordGroupType = "OWN" | "COMPETITOR" | "INDUSTRY";

export const SECTION_LABELS: Record<SectionCode, string> = {
  "0_OVERVIEW": "0. 분석 개요",
  "1_OWN": "1. 자사 분석",
  "2_MARKET": "2. 시장 분석",
  "3_COMPETITOR": "3. 경쟁사 분석",
  "4_CONSUMER": "4. 소비자 분석",
  "5_SUMMARY_CONCLUSION": "5. 현황 요약 · 결론",
};

export interface CompetitorTarget {
  id: string;
  brand_name: string;
  product_name: string;
  display_order: number;
}

export interface SnsAccount {
  id: string;
  owner_type: "OWN" | "COMPETITOR";
  brand_label: string;
  platform: SnsPlatform;
  account_url: string;
  handle: string;
}

export interface KeywordGroup {
  id: string;
  group_type: KeywordGroupType;
  label: string;
  keywords: string[];
  hashtags: string[];
}

export interface Project {
  id: string;
  name: string;
  brand_name: string;
  product_name: string;
  industry_category: string;
  analysis_track: AnalysisTrack;
  period_start: string;
  period_end: string;
  current_stage: ProjectStage;
  summary_split_mode: SummarySplitMode;
  naver_shopping_category_id?: string | null;
  brief_note?: string;
  competitors: CompetitorTarget[];
  sns_accounts: SnsAccount[];
  keyword_groups: KeywordGroup[];
  created_at: string;
  updated_at: string;
}

export interface ResearchPlanItem {
  id: string;
  section_code: SectionCode;
  item_key: string;
  title: string;
  description: string;
  data_sources: string[];
  is_enabled: boolean;
  display_order: number;
}

export interface ResearchPlan {
  id: string;
  project_id: string;
  analysis_track: AnalysisTrack;
  is_confirmed: boolean;
  target_communities: string[];
  estimated_duration_seconds: number;
  items: ResearchPlanItem[];
}

export interface HighlightSpan {
  start: number;
  end: number;
  quote: string;
}

export interface SourceItemDetail {
  id: string;
  section_code: SectionCode;
  provider: "PERPLEXITY" | "SCRAPECREATORS" | "APIFY" | "NAVER_DATALAB";
  channel: string;
  title: string;
  content: string;
  source_url?: string | null;
  author?: string | null;
  published_at?: string | null;
  evidence_quote?: string | null;
  highlight_spans: HighlightSpan[];
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED";
  review_status: ReviewStatus;
  has_media: boolean;
}

export interface SourceFacetCounts {
  total: number;
  by_review_status: Record<string, number>;
  by_section: Record<string, number>;
  by_channel: Record<string, number>;
  by_provider: Record<string, number>;
}

export interface DataLabPoint {
  period: string;
  ratio: number;
}

export interface DataLabSeries {
  id: string;
  metric_type: "SEARCH_TREND" | "SHOPPING_INSIGHT";
  group_label: string;
  owner_type: OwnerType;
  period_start: string;
  period_end: string;
  time_unit: string;
  points: DataLabPoint[];
  cumulative_index_sum: number;
  share_of_search_pct: number;
  growth_rate_pct: number;
  peak_date: string | null;
  peak_value: number;
  methodology_note: string;
}

export interface SnsTopPost {
  id: string;
  owner_type: "OWN" | "COMPETITOR";
  brand_label: string;
  platform: SnsPlatform;
  post_url: string;
  caption: string;
  published_at: string;
  views: number;
  likes: number;
  comments: number;
  engagement_score: number;
  rank_order: number;
  is_creator_collab: boolean;
  thumbnail_accent: string;
  media_url?: string | null;
  key_takeaway: string;
}

export interface KpiCard {
  label: string;
  value: string;
  delta?: string | null;
  basis?: string | null;
}

export interface SlideBullet {
  claim: string;
  evidence_quote?: string | null;
  source_name?: string | null;
  source_url?: string | null;
  fact_id?: string | null;
}

export interface SlideTable {
  headers: string[];
  rows: string[][];
}

export interface SlideVisualAsset {
  asset_type: string;
  title: string;
  local_path?: string | null;
  caption?: string | null;
  annotation_text?: string | null;
  metadata?: Record<string, unknown>;
}

export interface AsIsToBeContent {
  as_is_points: string[];
  key_issues: string[];
  to_be_directions: string[];
  linked_fact_ids: string[];
}

export interface SlideDraft {
  id: string;
  project_id: string;
  section_code: SectionCode;
  slide_order: number;
  slide_type: string;
  title: string;
  headcopy: string;
  kpi_cards: KpiCard[];
  bullets: SlideBullet[];
  table?: SlideTable | null;
  visual_assets: SlideVisualAsset[];
  as_is_to_be?: AsIsToBeContent | null;
  footnote?: string | null;
  review_status: SlideReviewStatus;
  latest_comment_status?: string | null;
  qc_flag?: string | null;
  updated_at: string;
}

export interface CommentDiffPayload {
  headcopy: string;
  bullets: SlideBullet[];
  as_is_to_be?: AsIsToBeContent | null;
}

export interface CommentDiffResponse {
  comment_id: string;
  slide_id: string;
  raw_comment: string;
  refined_comment: string;
  status: "PREVIEW_READY" | "APPLIED" | "REVERTED";
  before_draft: CommentDiffPayload;
  after_draft: CommentDiffPayload;
}

export interface JobSubtask {
  id: string;
  subtask_key: string;
  label: string;
  status: JobStatus;
  progress_pct: number;
  collected_count: number;
  error_message?: string | null;
}

export interface JobStatusResponse {
  id: string;
  project_id: string;
  job_type: string;
  status: JobStatus;
  progress_pct: number;
  logs: string[];
  subtasks: JobSubtask[];
}

export interface QcCheckItem {
  gate_code: string;
  severity: QcSeverity;
  message: string;
  target_section?: SectionCode | null;
  target_slide_id?: string | null;
  user_action_hint?: string | null;
}

export interface QcReport {
  project_id: string;
  overall_status: QcSeverity;
  can_export: boolean;
  summary_split_mode: SummarySplitMode;
  total_slides_checked: number;
  present_sections: SectionCode[];
  missing_sections: SectionCode[];
  checks: QcCheckItem[];
}

export interface ExportRecord {
  id: string;
  project_id: string;
  qc_status: QcSeverity;
  qc_report?: QcReport;
  summary_split_mode: SummarySplitMode;
  slide_count: number;
  file_size_bytes: number;
  download_filename: string;
  download_url?: string | null;
  created_at: string;
}

export interface WorkflowMeta {
  current_stage: ProjectStage;
  plan_confirmed: boolean;
  total_sources_count: number;
  pending_sources_count: number;
  approved_sources_count: number;
  rejected_sources_count: number;
  total_slides_count: number;
  approved_slides_count: number;
  unreviewed_slides_count: number;
  missing_sections: SectionCode[];
  can_export: boolean;
  next_step_hint: string;
}

export interface ProjectBundle {
  project: Project;
  plan: ResearchPlan;
  sources: SourceItemDetail[];
  datalab: DataLabSeries[];
  sns_top_posts: SnsTopPost[];
  slides: SlideDraft[];
  last_job: JobStatusResponse;
  slide_gen_job?: JobStatusResponse | null;
  exports: ExportRecord[];
  active_comment_diffs: Record<string, CommentDiffResponse>;
  workflow_meta?: WorkflowMeta;
  loaded?: boolean;
}
