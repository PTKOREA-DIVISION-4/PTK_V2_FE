# 아키텍처 — PTK_V2_FE

> 범위: **FE 전용**. 태그는 `README.md` 참고. 태그가 없는 문장은 코드에서 관측한 현재 상태다.

## 1. 기술 스택 (관측)

- **Next.js 15** (App Router, `reactStrictMode: true`), **React 19**, **TypeScript** (`strict: true`, `@/*` → `./src/*`)
- **Tailwind CSS v4** (`@tailwindcss/postcss`), **`lucide-react`**, **`recharts`**

## 2. 계층 구조 & 폴더 책임 [U 2026-11-25]

프런트엔드는 **기능 도메인 중심 구조**로 나뉜다.

| 경로 | 책임 |
|---|---|
| `src/app/` | 얇은 라우트 진입점: `/` (대시보드), `/projects/new` (생성 위저드), `/projects/[projectId]` (스튜디오), `layout.tsx`, `globals.css` |
| `src/features/` | 도메인별 화면·로직: `dashboard` · `project-setup` · `data-collection` · `fact-review` · `ppt-export` · `studio` |
| `src/components/ui/` | 공통 UI: `AsyncActionButton` · `Modal` · `SlideOverDrawer` · `SourceViewerDrawer` · `MarkdownContent` · `StatusBadge` · `StyledSelect` · `ToastProvider` |
| `src/components/visuals/` | 데이터 시각화: `FactbookCharts.tsx` (`DataLabTrendChart`, `DataLabSosBarChart`, `VocSentimentChart`, `HorizontalDataBarChart`) |
| `src/components/providers/` | `ClientProviders.tsx` (`StoreProvider` + `ToastProvider` 래핑) |
| `src/lib/` | 백엔드 통신 & 전역 상태: `api.ts` · `store.tsx` · `types.ts` · `mock-data.ts` |

## 3. 현재 파일 맵 (관측)

```
src/
├─ app/
│  ├─ layout.tsx · globals.css · page.tsx
│  └─ projects/
│     ├─ new/page.tsx
│     └─ [projectId]/page.tsx
├─ components/
│  ├─ providers/ClientProviders.tsx
│  ├─ ui/            AsyncActionButton · MarkdownContent · Modal · SlideOverDrawer · SourceViewerDrawer · StatusBadge · StyledSelect · ToastProvider
│  └─ visuals/       FactbookCharts.tsx
├─ features/
│  ├─ dashboard/     DashboardView.tsx
│  ├─ project-setup/ NewProjectWizard.tsx · ProjectBriefModal.tsx
│  ├─ studio/        StudioShell.tsx
│  ├─ data-collection/ DataCollectionView.tsx
│  ├─ fact-review/   FactReviewStudio.tsx · OverviewGrid.tsx · RightInspector.tsx · SlideCanvas.tsx
│  └─ ppt-export/    PptExportView.tsx
└─ lib/              api.ts · store.tsx · types.ts · mock-data.ts
```

## 4. 데이터 흐름 & 방어 규약 [D]

- **실 API 연동 기본**: 모든 프로젝트·수집·검수·장표·QC·PPTX 출력은 `src/lib/api.ts` 를 통해 백엔드(`/api/v1`)와 통신한다. (`mock-data.ts` 는 위저드의 `buildDefaultPlanItems` 기본 항목 헬퍼 외 더미 모드로 쓰지 않는다.)
- **멱등성·에러 처리**: `api.ts` 에서 작업 생성 요청 시 `Idempotency-Key` 를 부여하고, 백엔드 `ErrorEnvelope`(`error.message`, `error.user_action_hint`)를 파싱해 토스트/모달로 노출한다.
- **중복 클릭 방지**: 비동기 액션 버튼은 `AsyncActionButton` 을 우선 사용한다.
- **이미지 경로**: 백엔드 로컬 아카이빙 이미지는 `resolveMediaUrl(projectId, localPath)` 로 `/media/{project_id}/{filename}` 에 연결한다.
- **의존 방향**: `src/app → src/features → src/components · src/lib`. `src/components` 나 `src/lib` 가 `src/features` 를 import 하지 않는다.
