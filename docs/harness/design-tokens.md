# 디자인 토큰 & 시각 규격 — PTK_V2_FE (Division 4)

> 범위: **FE 전용**. 태그는 `README.md` 참고. 근거 파일: `src/app/globals.css`, `src/app/layout.tsx`, `src/components/visuals/FactbookCharts.tsx`.

## 1. 브랜드 헤더 [U 2026-11-27]

- 상단 내비게이션 좌측 브랜드 영역에는 **아이콘 박스 없이 텍스트 `Division 4` 만** 표시한다.

## 2. 컬러 팔레트 (`src/app/globals.css`) [U 2026-11-27]

| 토큰 / CSS 변수 | 값 | 용도 |
|---|---|---|
| `--panel` | `#ffffff` | 기본 페이지·카드 배경 (라이트 모드) |
| `--bg` | `#f5f5f5` | 스튜디오 외곽 배경 |
| `--subtle` | `#fafafa` | 보조 서피스·헤더 스트립 |
| `--field` / `--field-on` | `#f5f5f5` / `#fafafa` | 입력 필드·비활성/활성 배경 |
| `--line` / `--line-strong` | `#e5e5e5` / `#d4d4d4` | 기본 구분선 / 강조 테두리 |
| `--text` / `--text-2` / `--text-3` | `#111111` / `#4a4a4a` / `#8c8c8c` | 본문 / 보조 / 메타·캡션 |
| `--primary` / `--primary-hover` | `#111111` / `#262626` | **메인 컬러(블랙)** — 주 CTA, 선택 상태, 주요 텍스트·차트 |
| `--accent` / `--accent-soft` / `--accent-border` | `#e9501f` / `#fff3ee` / `#f9c8b8` | **포인트 컬러(오렌지)** — 자사 강조·핵심 배지·차트 포인트 |
| `--ok` / `--warn` / `--danger` | `#1f8a5b` / `#c26b00` / `#dc2626` | 승인·성공 / 경고 / 차단·부정 |

- 블랙(`#111111`)이 주조색이고, 오렌지(`#E9501F`)는 핵심 강조(자사 데이터, TOP 1, 활성 포인트 등)에만 사용한다. 화면 전체를 주황색으로 채우지 않는다.

## 3. 타이포그래피 & 라운드 (`src/app/globals.css`, `src/app/layout.tsx`) [U 2026-11-27]

- **기본 폰트**: `"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif` (기본 `14px`)
- **숫자 정렬**: 지표·표·차트 축 수치는 `.tabular-nums` (`font-variant-numeric: tabular-nums`) 적용 [D]
- **Border Radius** (중간 균형 라운드):
  - `--radius-sm`: `6px` — 뱃지·작은 칩·보조 태그
  - `--radius`: `8px` — 버튼·입력창·내부 패널·차트 툴팁
  - `--radius-lg`: `12px` — 모달·장표 캔버스·주요 섹션 카드

## 4. 아이콘 [U 2026-11-27]

- **`lucide-react` 패키지(`https://lucide.dev/icons/`)만** 사용한다. 직접 그린 아이콘 SVG 나 이모지를 UI 아이콘으로 쓰지 않는다.

## 5. 차트 팔레트 (`FactbookCharts.tsx`) [D]

- 자사(`OWN`) / 쇼핑 점유 강조: `#E9501F`
- 통합검색 SoS(`SEARCH_TREND`) / 경쟁 1(`COMPETITOR`): `#111111`
- 경쟁 2 · 3 / 보조 시리즈: `#666666`, `#999999`, `#3A3A3A`
- 장표 `3-1` (`DATALAB_SOS_BAR`) 은 웹과 PPTX 모두 **통합검색 SoS(%) + 쇼핑 클릭 점유율(%) 그룹 가로 막대차트**(`metricType="ALL"`)로 표시한다.
