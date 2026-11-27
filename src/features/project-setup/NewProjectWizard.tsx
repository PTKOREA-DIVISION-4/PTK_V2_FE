"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { buildDefaultPlanItems } from "@/lib/mock-data";
import { useFactbookStore } from "@/lib/store";
import { AnalysisTrack, SECTION_LABELS, SnsPlatform } from "@/lib/types";
import { AsyncActionButton } from "@/components/ui/AsyncActionButton";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { useToast } from "@/components/ui/ToastProvider";

const INDUSTRIES = [
  { label: "뷰티/화장품", track: "REVIEW_CENTRIC" as const },
  { label: "F&B/식음료", track: "REVIEW_CENTRIC" as const },
  { label: "패션/어패럴", track: "REVIEW_CENTRIC" as const },
  { label: "생활용품/소형가전", track: "REVIEW_CENTRIC" as const },
  { label: "금융/보험/핀테크", track: "MARKET_CENTRIC" as const },
  { label: "IT/플랫폼/SaaS", track: "MARKET_CENTRIC" as const },
  { label: "자동차/모빌리티", track: "MARKET_CENTRIC" as const },
  { label: "대형가전/B2B", track: "MARKET_CENTRIC" as const },
];

const ALL_COMMUNITIES = [
  { key: "theqoo", label: "더쿠 (뷰티·소비자)" },
  { key: "dcinside", label: "디시인사이드" },
  { key: "fmkorea", label: "에펨코리아" },
  { key: "clien", label: "클리앙 (IT·가전·금융)" },
  { key: "naver_blog", label: "네이버 블로그" },
  { key: "naver_cafe", label: "네이버 카페" },
];

const WIZARD_STEPS = [
  {
    num: 1 as const,
    title: "타겟 브랜드 · 제품",
    desc: "단일 브랜드/제품 및 트랙",
  },
  {
    num: 2 as const,
    title: "기간 · 경쟁 제품",
    desc: "분석 기간과 비교군 매칭",
  },
  {
    num: 3 as const,
    title: "SNS · 검색 키워드",
    desc: "공식 계정 및 키워드 3종",
  },
  {
    num: 4 as const,
    title: "쓰기 전에 정해 주세요",
    desc: "커뮤니티 및 리서치 플랜",
  },
];

function detectPlatform(url: string): SnsPlatform {
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return "INSTAGRAM";
  if (lower.includes("youtube.com") || lower.includes("youtu.be")) return "YOUTUBE";
  if (lower.includes("tiktok.com")) return "TIKTOK";
  return "OTHER";
}

function extractHandle(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    return (seg || u.hostname).replace(/^@/, "");
  } catch {
    return "official";
  }
}

export function NewProjectWizard() {
  const router = useRouter();
  const { createProjectFromWizard, recommendKeywords } = useFactbookStore();
  const { pushToast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [name, setName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [productName, setProductName] = useState("");
  const [industry, setIndustry] = useState("뷰티/화장품");
  const [track, setTrack] = useState<AnalysisTrack>("REVIEW_CENTRIC");
  const [periodStart, setPeriodStart] = useState("2026-06-01");
  const [periodEnd, setPeriodEnd] = useState("2026-11-27");
  const [briefNote, setBriefNote] = useState("");

  const [competitors, setCompetitors] = useState([
    { brand_name: "", product_name: "" },
  ]);
  const [snsAccounts, setSnsAccounts] = useState<
    { owner_type: "OWN" | "COMPETITOR"; brand_label: string; account_url: string }[]
  >([
    { owner_type: "OWN", brand_label: "", account_url: "" },
  ]);

  const [ownKeywords, setOwnKeywords] = useState("");
  const [compKeywords, setCompKeywords] = useState("");
  const [indKeywords, setIndKeywords] = useState("");

  const [communities, setCommunities] = useState<string[]>([
    "theqoo",
    "dcinside",
    "fmkorea",
    "naver_blog",
    "naver_cafe",
  ]);
  const [disabledKeys, setDisabledKeys] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const planPreview = useMemo(
    () =>
      buildDefaultPlanItems(
        brandName || "자사 브랜드",
        productName || "주력 제품",
        track
      ),
    [brandName, productName, track]
  );

  const handleIndustryPick = (indLabel: string, defaultTrack: AnalysisTrack) => {
    setIndustry(indLabel);
    setTrack(defaultTrack);
    if (defaultTrack === "REVIEW_CENTRIC") {
      setCommunities(["theqoo", "dcinside", "fmkorea", "naver_blog", "naver_cafe"]);
    } else {
      setCommunities(["clien", "fmkorea", "dcinside", "naver_blog", "naver_cafe"]);
    }
  };

  const fillRecommendedKeywords = async () => {
    const b = brandName.trim() || "브랜드";
    const p = productName.trim() || "주력제품";
    const comps = competitors
      .map((c) => c.brand_name.trim())
      .filter(Boolean);
    try {
      const rec = await recommendKeywords({
        brand_name: b,
        product_name: p,
        industry_category: industry,
        competitor_brands: comps,
      });
      const ownGrp = rec.recommended_groups.find((g) => g.group_type === "OWN");
      const compGrp = rec.recommended_groups.find((g) => g.group_type === "COMPETITOR");
      const indGrp = rec.recommended_groups.find((g) => g.group_type === "INDUSTRY");
      if (ownGrp) setOwnKeywords([...ownGrp.keywords, ...ownGrp.hashtags].join(", "));
      if (compGrp) setCompKeywords([...compGrp.keywords, ...compGrp.hashtags].join(", "));
      if (indGrp) setIndKeywords([...indGrp.keywords, ...indGrp.hashtags].join(", "));
      pushToast({
        tone: "success",
        title: "백엔드 추천 키워드·해시태그가 적용되었습니다.",
      });
    } catch {
      setOwnKeywords(`${b}, ${p}, ${b} ${p}, ${p} 후기, #${b.replace(/\s+/g, "")}`);
      setCompKeywords(
        comps.length > 0
          ? comps.map((c) => `${c}, ${c} 비교`).join(", ")
          : `${industry} 대표 경쟁 제품`
      );
      setIndKeywords(`${industry}, ${industry} 추천, ${industry} 트렌드`);
      pushToast({
        tone: "info",
        title: "기본 추천 키워드·해시태그가 채워졌습니다.",
      });
    }
  };

  const validateAndNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!brandName.trim() || !productName.trim()) {
        setErrorMsg("단일 브랜드명과 주력 제품명을 모두 입력해 주세요.");
        return;
      }
      if (brandName.includes(",") || brandName.includes("/")) {
        setErrorMsg(
          "단일 브랜드 원칙에 따라 쉼표(,) 없이 하나의 브랜드만 입력해 주세요."
        );
        return;
      }
      if (!name.trim()) {
        setName(`2026 ${brandName.trim()} ${productName.trim()} 팩트북`);
      }
      setSnsAccounts((prev) =>
        prev.map((s, i) =>
          i === 0 && !s.brand_label ? { ...s, brand_label: brandName.trim() } : s
        )
      );
      setStep(2);
      return;
    }
    if (step === 2) {
      if (periodEnd < periodStart) {
        setErrorMsg("조사 종료일은 시작일 이후여야 합니다.");
        return;
      }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!ownKeywords.trim()) fillRecommendedKeywords();
      setStep(4);
    }
  };

  const handleFinish = async () => {
    const validComps = competitors.filter(
      (c) => c.brand_name.trim() && c.product_name.trim()
    );
    const validSns = snsAccounts
      .filter((s) => s.account_url.trim())
      .map((s) => ({
        owner_type: s.owner_type,
        brand_label: s.brand_label.trim() || brandName.trim(),
        platform: detectPlatform(s.account_url),
        account_url: s.account_url.trim(),
        handle: extractHandle(s.account_url),
      }));

    const parseTags = (raw: string) =>
      raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);

    try {
      const newId = await createProjectFromWizard({
        name: name.trim() || `${brandName} ${productName} 팩트북`,
        brand_name: brandName.trim(),
        product_name: productName.trim(),
        industry_category: industry,
        analysis_track: track,
        period_start: periodStart,
        period_end: periodEnd,
        brief_note: briefNote.trim(),
        competitors: validComps,
        sns_accounts: validSns,
        keyword_groups: [
          {
            group_type: "OWN",
            label: `${brandName} ${productName}`,
            keywords: parseTags(ownKeywords).filter((k) => !k.startsWith("#")),
            hashtags: parseTags(ownKeywords).filter((k) => k.startsWith("#")),
          },
          {
            group_type: "COMPETITOR",
            label: "경쟁사 키워드",
            keywords: parseTags(compKeywords).filter((k) => !k.startsWith("#")),
            hashtags: parseTags(compKeywords).filter((k) => k.startsWith("#")),
          },
          {
            group_type: "INDUSTRY",
            label: `${industry} 시장 키워드`,
            keywords: parseTags(indKeywords).filter((k) => !k.startsWith("#")),
            hashtags: parseTags(indKeywords).filter((k) => k.startsWith("#")),
          },
        ],
        target_communities: communities,
        disabled_item_keys: disabledKeys,
      });

      pushToast({
        tone: "success",
        title: "새 팩트북이 생성되었으며 실시간 데이터 수집을 시작했습니다.",
      });
      router.push(`/projects/${newId}`);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "프로젝트 생성 중 오류가 발생했습니다.";
      setErrorMsg(msg);
      pushToast({ tone: "error", title: msg });
    }
  };

  const enabledPlanCount = planPreview.length - disabledKeys.length;
  const coverAccent = track === "REVIEW_CENTRIC" ? "#E9501F" : "#111111";

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white text-[#111111]">
      <div className="h-[2px] w-full shrink-0 bg-[#E9501F]" />

      {/* Desktop Top Header */}
      <header className="flex h-[52px] shrink-0 items-center justify-between border-b border-[#E5E5E5] bg-white px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium whitespace-nowrap text-[#4A4A4A] hover:text-[#111111]"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            문서 목록
          </Link>
          <span className="h-4 w-px bg-[#E5E5E5]" />
          <div className="flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#111111] text-white">
              <FileText className="h-3 w-3" />
            </span>
            <span className="text-[14px] font-bold tracking-tight whitespace-nowrap">
              새 팩트북 설정
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium tabular-nums whitespace-nowrap text-[#8C8C8C]">
            단계 {step} / 4
          </span>
          <div className="h-1.5 w-36 overflow-hidden rounded-full bg-[#E5E5E5]">
            <div
              className="h-full bg-[#111111] transition-all duration-300"
              style={{ width: `${step * 25}%` }}
            />
          </div>
        </div>
      </header>

      {/* Desktop 3-Column Split Body */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        {/* LEFT VERTICAL DESKTOP STEPPER */}
        <aside className="hidden lg:flex flex-col justify-between border-r border-[#E5E5E5] bg-[#FAFAFA] p-5">
          <div className="space-y-1.5">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[#8C8C8C]">
              생성 단계
            </p>
            {WIZARD_STEPS.map((item) => {
              const active = step === item.num;
              const completed = step > item.num;
              const clickable = item.num <= step;
              return (
                <button
                  key={item.num}
                  type="button"
                  disabled={!clickable}
                  onClick={() => {
                    if (clickable) {
                      setErrorMsg(null);
                      setStep(item.num);
                    }
                  }}
                  className={`flex w-full items-start gap-3 rounded-[8px] px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "bg-[#111111] text-white"
                      : completed
                        ? "hover:bg-[#EFEFEF] text-[#111111] cursor-pointer"
                        : "text-[#8C8C8C] cursor-default"
                  }`}
                >
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] text-[11px] font-bold ${
                      active
                        ? "bg-white text-[#111111]"
                        : completed
                          ? "bg-[#111111] text-white"
                          : "border border-[#D4D4D4] bg-white text-[#8C8C8C]"
                    }`}
                  >
                    {completed ? <Check className="h-3 w-3" /> : item.num}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold leading-snug">
                      {item.title}
                    </p>
                    <p
                      className={`mt-0.5 text-[11px] ${
                        active ? "text-white/75" : "text-[#8C8C8C]"
                      }`}
                    >
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-3.5 text-xs text-[#4A4A4A] space-y-1">
            <p className="font-semibold text-[#111111]">단일 타겟 원칙</p>
            <p className="text-[11px] leading-relaxed text-[#8C8C8C]">
              하나의 브랜드 × 주력 제품으로 모수를 고정해 데이터랩과 커뮤니티 담론 왜곡을 방지합니다.
            </p>
          </div>
        </aside>

        {/* CENTER WIDE FORM WORKSPACE */}
        <div className="flex min-w-0 min-h-0 flex-col bg-white">
          <div className="flex-1 overflow-y-auto px-6 py-8 lg:px-12">
            <div className="mx-auto max-w-[820px]">
              {step === 1 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[24px] font-bold tracking-tight text-[#111111]">
                      어떤 브랜드와 제품의 팩트북을 만들까요?
                    </h1>
                    <p className="mt-1.5 text-[13px] text-[#4A4A4A]">
                      단일 브랜드 × 단일 주력 제품 기준으로 검색 데이터와 실사용 후기를 수집합니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
                        타겟 브랜드 (단일) *
                      </label>
                      <input
                        type="text"
                        value={brandName}
                        onChange={(e) => setBrandName(e.target.value)}
                        placeholder="예: 설화수"
                        className="w-full h-11 px-3.5 rounded-[8px] border border-[#D4D4D4] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] focus:outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
                        주력 제품 또는 히어로 라인 *
                      </label>
                      <input
                        type="text"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="예: 윤조에센스 6세대"
                        className="w-full h-11 px-3.5 rounded-[8px] border border-[#D4D4D4] bg-[#FAFAFA] focus:bg-white focus:border-[#111111] focus:outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
                      팩트북 문서 제목 (선택)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="미입력 시 브랜드·제품명 기반으로 자동 생성됩니다"
                      className="w-full h-10 px-3.5 rounded-[8px] border border-[#D4D4D4] bg-white focus:border-[#111111] focus:outline-none text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A4A4A] mb-2">
                      산업군 선택
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {INDUSTRIES.map((ind) => (
                        <button
                          key={ind.label}
                          type="button"
                          onClick={() => handleIndustryPick(ind.label, ind.track)}
                          className={`h-10 px-3 rounded-[8px] text-xs font-medium border whitespace-nowrap transition-colors cursor-pointer ${
                            industry === ind.label
                              ? "bg-[#111111] text-white border-[#111111]"
                              : "bg-white text-[#4A4A4A] border-[#D4D4D4] hover:bg-[#FAFAFA] hover:text-[#111111]"
                          }`}
                        >
                          {ind.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A4A4A] mb-2">
                      분석 트랙
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <button
                        type="button"
                        onClick={() => setTrack("REVIEW_CENTRIC")}
                        className={`text-left p-4 rounded-[8px] border transition-colors cursor-pointer ${
                          track === "REVIEW_CENTRIC"
                            ? "bg-[#F5F5F5] border-[#111111] ring-1 ring-[#111111]"
                            : "bg-white border-[#D4D4D4] hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-[#111111]">
                            후기·실사용 중심 (Review Track)
                          </span>
                          {track === "REVIEW_CENTRIC" && (
                            <Check className="h-4 w-4 shrink-0 text-[#111111]" />
                          )}
                        </div>
                        <p className="text-xs text-[#4A4A4A] mt-1.5 leading-relaxed">
                          실사용 후기·KBF·국내 커뮤니티·쇼핑 인사이트 비중 강화
                        </p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTrack("MARKET_CENTRIC")}
                        className={`text-left p-4 rounded-[8px] border transition-colors cursor-pointer ${
                          track === "MARKET_CENTRIC"
                            ? "bg-[#F5F5F5] border-[#111111] ring-1 ring-[#111111]"
                            : "bg-white border-[#D4D4D4] hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-semibold text-[#111111]">
                            시장·검색 지표 중심 (Market Track)
                          </span>
                          {track === "MARKET_CENTRIC" && (
                            <Check className="h-4 w-4 shrink-0 text-[#111111]" />
                          )}
                        </div>
                        <p className="text-xs text-[#4A4A4A] mt-1.5 leading-relaxed">
                          거시 시장 규모·정책·검색 트렌드·고객 여정 장벽 분석
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[24px] font-bold tracking-tight text-[#111111]">
                      조사 기간과 경쟁 제품을 정해 주세요
                    </h1>
                    <p className="mt-1.5 text-[13px] text-[#4A4A4A]">
                      네이버 데이터랩 검색 점유율(SoS)과 SNS TOP 5 비교 기준이 됩니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
                        조사 시작일
                      </label>
                      <input
                        type="date"
                        value={periodStart}
                        onChange={(e) => setPeriodStart(e.target.value)}
                        className="w-full h-10 px-3 rounded-[8px] border border-[#D4D4D4] bg-white text-sm tabular-nums focus:border-[#111111] focus:outline-none"
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
                        className="w-full h-10 px-3 rounded-[8px] border border-[#D4D4D4] bg-white text-sm tabular-nums focus:border-[#111111] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-[#4A4A4A]">
                        직접 경쟁 브랜드 + 제품 페어 (최대 4개)
                      </label>
                      {competitors.length < 4 && (
                        <button
                          type="button"
                          onClick={() =>
                            setCompetitors((prev) => [
                              ...prev,
                              { brand_name: "", product_name: "" },
                            ])
                          }
                          className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#111111] hover:underline cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 shrink-0" />
                          경쟁 제품 추가
                        </button>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      {competitors.map((comp, idx) => (
                        <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2.5 items-center">
                          <input
                            type="text"
                            value={comp.brand_name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCompetitors((prev) =>
                                prev.map((c, i) =>
                                  i === idx ? { ...c, brand_name: v } : c
                                )
                              );
                            }}
                            placeholder="경쟁 브랜드 (예: 라네즈)"
                            className="h-10 px-3 rounded-[8px] border border-[#D4D4D4] text-sm focus:border-[#111111] focus:outline-none"
                          />
                          <input
                            type="text"
                            value={comp.product_name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCompetitors((prev) =>
                                prev.map((c, i) =>
                                  i === idx ? { ...c, product_name: v } : c
                                )
                              );
                            }}
                            placeholder="경쟁 제품명 (예: 워터뱅크 크림)"
                            className="h-10 px-3 rounded-[8px] border border-[#D4D4D4] text-sm focus:border-[#111111] focus:outline-none"
                          />
                          {competitors.length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                setCompetitors((prev) =>
                                  prev.filter((_, i) => i !== idx)
                                )
                              }
                              className="rounded-[6px] p-2 text-[#8C8C8C] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <span className="w-8" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#4A4A4A] mb-1.5">
                      기획자 사전 요청사항 (Global Brief)
                    </label>
                    <textarea
                      rows={4}
                      value={briefNote}
                      onChange={(e) => setBriefNote(e.target.value)}
                      placeholder="예: 2030 신규 입문 장벽과 선물 기획세트 반응 위주로 짚어주세요."
                      className="w-full p-3 rounded-[8px] border border-[#D4D4D4] text-sm focus:outline-none focus:border-[#111111]"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-7">
                  <div>
                    <h1 className="text-[24px] font-bold tracking-tight text-[#111111]">
                      공식 SNS URL과 검색 키워드를 확인하세요
                    </h1>
                    <p className="mt-1.5 text-[13px] text-[#4A4A4A]">
                      SNS TOP 5 추출과 네이버 데이터랩 트렌드 비교에 사용됩니다.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-[#4A4A4A]">
                        자사·경쟁사 공식 SNS 계정 URL
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setSnsAccounts((prev) => [
                            ...prev,
                            { owner_type: "COMPETITOR", brand_label: "", account_url: "" },
                          ])
                        }
                        className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-[#111111] hover:underline cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 shrink-0" />
                        계정 추가
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {snsAccounts.map((acc, idx) => {
                        const platform = acc.account_url
                          ? detectPlatform(acc.account_url)
                          : null;
                        return (
                          <div key={idx} className="grid grid-cols-[116px_150px_1fr] gap-2.5 items-center">
                            <StyledSelect
                              value={acc.owner_type}
                              onChange={(e) => {
                                const v = e.target.value as "OWN" | "COMPETITOR";
                                setSnsAccounts((prev) =>
                                  prev.map((a, i) =>
                                    i === idx ? { ...a, owner_type: v } : a
                                  )
                                );
                              }}
                              className="h-10 text-xs"
                            >
                              <option value="OWN">자사</option>
                              <option value="COMPETITOR">경쟁사</option>
                            </StyledSelect>
                            <input
                              type="text"
                              value={acc.brand_label}
                              onChange={(e) => {
                                const v = e.target.value;
                                setSnsAccounts((prev) =>
                                  prev.map((a, i) =>
                                    i === idx ? { ...a, brand_label: v } : a
                                  )
                                );
                              }}
                              placeholder="브랜드명"
                              className="h-10 px-3 rounded-[8px] border border-[#D4D4D4] text-sm focus:border-[#111111] focus:outline-none"
                            />
                            <div className="relative">
                              <input
                                type="url"
                                value={acc.account_url}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  setSnsAccounts((prev) =>
                                    prev.map((a, i) =>
                                      i === idx ? { ...a, account_url: v } : a
                                    )
                                  );
                                }}
                                placeholder="https://www.instagram.com/..."
                                className="w-full h-10 pl-3 pr-24 rounded-[8px] border border-[#D4D4D4] text-sm focus:border-[#111111] focus:outline-none"
                              />
                              {platform && (
                                <span className="absolute right-2.5 top-2 px-2 py-0.5 rounded-[6px] bg-[#F5F5F5] text-[10px] font-medium text-[#4A4A4A]">
                                  {platform}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="pt-5 border-t border-[#E5E5E5] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[#4A4A4A]">
                        수집 키워드 · 해시태그 그룹 (쉼표 구분)
                      </span>
                      <button
                        type="button"
                        onClick={fillRecommendedKeywords}
                        className="inline-flex items-center gap-1.5 h-8 px-3 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white hover:bg-[#F5F5F5] text-xs font-medium text-[#111111] cursor-pointer"
                      >
                        <Sparkles className="h-3.5 w-3.5 shrink-0" />
                        추천 키워드 채우기
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[11px] font-medium text-[#8C8C8C] mb-1.5">
                          자사 키워드 · 해시태그
                        </label>
                        <textarea
                          rows={3}
                          value={ownKeywords}
                          onChange={(e) => setOwnKeywords(e.target.value)}
                          placeholder="예: 설화수, 윤조에센스, #설화수"
                          className="w-full p-2.5 rounded-[8px] border border-[#D4D4D4] text-sm focus:border-[#111111] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#8C8C8C] mb-1.5">
                          경쟁사 키워드
                        </label>
                        <textarea
                          rows={3}
                          value={compKeywords}
                          onChange={(e) => setCompKeywords(e.target.value)}
                          placeholder="예: 라네즈 워터뱅크, 헤라 시그니아"
                          className="w-full p-2.5 rounded-[8px] border border-[#D4D4D4] text-sm focus:border-[#111111] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-[#8C8C8C] mb-1.5">
                          산업·제품 일반 키워드
                        </label>
                        <textarea
                          rows={3}
                          value={indKeywords}
                          onChange={(e) => setIndKeywords(e.target.value)}
                          placeholder="예: 퍼스트 에센스, 속건조 에센스"
                          className="w-full p-2.5 rounded-[8px] border border-[#D4D4D4] text-sm focus:border-[#111111] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-[22px] font-bold tracking-tight text-[#111111]">
                      쓰기 전에 정해 주세요
                    </h1>
                    <p className="mt-1 text-[13px] text-[#4A4A4A]">
                      수집 대상 커뮤니티와 0~5장 리서치 범위를 선택하면 바로 스튜디오가 열립니다.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#111111] text-[11px] font-bold text-white">
                          1
                        </span>
                        <h2 className="text-[14px] font-semibold text-[#111111]">
                          커뮤니티 · 채널
                        </h2>
                      </div>
                      <div className="border-t border-[#E5E5E5]">
                        {ALL_COMMUNITIES.map((comm) => {
                          const active = communities.includes(comm.key);
                          return (
                            <button
                              key={comm.key}
                              type="button"
                              onClick={() =>
                                setCommunities((prev) =>
                                  active
                                    ? prev.filter((c) => c !== comm.key)
                                    : [...prev, comm.key]
                                )
                              }
                              className="flex w-full items-center gap-2.5 border-b border-[#E5E5E5] py-2.5 px-1 text-left hover:bg-[#FAFAFA] cursor-pointer"
                            >
                              <span
                                className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border ${
                                  active
                                    ? "border-[#111111] bg-[#111111] text-white"
                                    : "border-[#D4D4D4] bg-white text-transparent"
                                }`}
                              >
                                <Check className="h-3 w-3" />
                              </span>
                              <span className="text-xs font-semibold text-[#111111]">
                                {comm.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="md:col-span-8 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-5 w-5 items-center justify-center rounded-[6px] bg-[#111111] text-[11px] font-bold text-white">
                            2
                          </span>
                          <h2 className="text-[14px] font-semibold text-[#111111]">
                            리서치 목차 ({enabledPlanCount}/{planPreview.length})
                          </h2>
                        </div>
                      </div>

                      <div className="border-t border-[#E5E5E5]">
                        {planPreview.map((item) => {
                          const enabled = !disabledKeys.includes(item.item_key);
                          return (
                            <button
                              key={item.item_key}
                              type="button"
                              onClick={() => {
                                setDisabledKeys((prev) =>
                                  enabled
                                    ? [...prev, item.item_key]
                                    : prev.filter((k) => k !== item.item_key)
                                );
                              }}
                              className={`flex w-full items-start gap-2.5 border-b border-[#E5E5E5] py-2.5 px-1 text-left hover:bg-[#FAFAFA] cursor-pointer ${
                                enabled ? "" : "opacity-55"
                              }`}
                            >
                              <span
                                className={`mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[6px] border ${
                                  enabled
                                    ? "border-[#111111] bg-[#111111] text-white"
                                    : "border-[#D4D4D4] bg-white text-transparent"
                                }`}
                              >
                                <Check className="h-3 w-3" />
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[13px] font-semibold text-[#111111]">
                                    {item.title}
                                  </span>
                                  <span className="text-[11px] text-[#8C8C8C]">
                                    {SECTION_LABELS[item.section_code]}
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-[#4A4A4A]">
                                  {item.description}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="mt-6 px-3.5 py-2.5 rounded-[8px] bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#DC2626]">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>

          {/* Fixed Desktop Bottom Action Bar */}
          <div className="flex shrink-0 items-center justify-between border-t border-[#E5E5E5] bg-white px-6 py-3.5 lg:px-12">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
                  }}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[8px] border border-[#D4D4D4] bg-white px-4 text-[13px] font-medium text-[#111111] hover:bg-[#F5F5F5] cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  이전 단계
                </button>
              ) : (
                <span className="text-xs text-[#8C8C8C]">
                  입력 내용은 다음 단계에서 언제든 수정할 수 있습니다.
                </span>
              )}
            </div>

            {step < 4 ? (
              <AsyncActionButton
                variant="primary"
                size="md"
                onClick={validateAndNext}
              >
                다음 단계
                <ArrowRight className="h-4 w-4 shrink-0" />
              </AsyncActionButton>
            ) : (
              <AsyncActionButton
                variant="primary"
                size="md"
                loadingText="스튜디오 여는 중..."
                onAction={handleFinish}
              >
                이대로 수집 시작
              </AsyncActionButton>
            )}
          </div>
        </div>

        {/* RIGHT LIVE COVER & SPEC PREVIEW PANEL */}
        <aside className="hidden xl:flex flex-col gap-5 border-l border-[#E5E5E5] bg-[#FAFAFA] p-6 overflow-y-auto">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8C8C8C]">
              실시간 표지 미리보기
            </p>
            <div className="mt-2.5 flex aspect-[16/9] flex-col justify-between rounded-[8px] border border-[#D4D4D4] bg-white p-5 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#8C8C8C]">{industry}</span>
                <span className="rounded-[6px] border border-[#E5E5E5] px-1.5 py-0.5 text-[9px] font-medium text-[#4A4A4A]">
                  PPT 16:9
                </span>
              </div>

              <div>
                <span
                  className="block h-[3px] w-7"
                  style={{ backgroundColor: coverAccent }}
                />
                <p
                  className="mt-2 text-[9px] font-bold tracking-wide"
                  style={{ color: coverAccent }}
                >
                  FACT BOOK
                </p>
                <p className="mt-1 truncate text-[16px] font-bold text-[#111111]">
                  {brandName.trim() || "브랜드명"}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-[#4A4A4A]">
                  {productName.trim() || "주력 제품명"}
                </p>
              </div>

              <span className="text-[9px] tabular-nums text-[#8C8C8C]">
                {periodEnd.slice(0, 7).replace("-", ".")}
              </span>
            </div>
          </div>

          <div className="rounded-[12px] border border-[#E5E5E5] bg-white p-4 space-y-3">
            <p className="text-xs font-semibold text-[#111111]">
              구성 요약
            </p>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8C8C]">문서명</dt>
                <dd className="truncate font-medium text-[#111111]">
                  {name.trim() || `${brandName.trim() || "새"} 팩트북`}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8C8C]">분석 트랙</dt>
                <dd className="font-medium text-[#111111]">
                  {track === "REVIEW_CENTRIC" ? "후기 중심" : "시장 지표 중심"}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8C8C]">조사 기간</dt>
                <dd className="tabular-nums text-[#111111]">
                  {periodStart} ~ {periodEnd}
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8C8C]">경쟁 제품</dt>
                <dd className="tabular-nums text-[#111111]">
                  {competitors.filter((c) => c.brand_name.trim()).length}개
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8C8C]">SNS 채널</dt>
                <dd className="tabular-nums text-[#111111]">
                  {snsAccounts.filter((s) => s.account_url.trim()).length}개
                </dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8C8C]">조사 항목</dt>
                <dd className="font-semibold tabular-nums text-[#111111]">
                  {enabledPlanCount} / {planPreview.length}개
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
