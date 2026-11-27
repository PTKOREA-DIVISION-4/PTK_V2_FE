# PTK_V2_FE — Factbook Generator Frontend (Division 4)

AI 리서치 수집 · 기획자 검수 · 장표 스튜디오 · 16:9 PPTX 출력 워크플로우를 제공하는 Next.js 프런트엔드입니다.

- 백엔드: [`PTKOREA-DIVISION-4/PTK_V2_BE`](https://github.com/PTKOREA-DIVISION-4/PTK_V2_BE) (FastAPI · 이 저장소와 `docs/API_SPEC.md` 로 연동)
- **작업 규칙은 [`AGENTS.md`](./AGENTS.md) 와 [`docs/harness/`](./docs/harness/README.md) 에 있습니다.** 사람이든 AI 든 작업 전에 먼저 읽어 주세요.

## 주요 화면 흐름

1. **대시보드 (`/`)** — 프로젝트 목록 및 상태 조회 (`Division 4` 라이트 스튜디오)
2. **4단계 생성 위저드 (`/projects/new`)** — 타깃 브랜드·제품 설정, 기간·경쟁군·브리프, SNS URL·AI 추천 키워드, 수집 항목 선택
3. **프로젝트 스튜디오 (`/projects/[projectId]`)**:
   - **자료·수집 풀**: 병렬 수집 진행률, 마크다운 원문·하이라이트 드로어, 일괄 승인/제외, 데이터랩(검색 vs 쇼핑), SNS TOP 5(회사×플랫폼)
   - **장표 스튜디오 / 전체 모아보기**: 22장 초안 편집, 근거 연결, AI 코멘트 윤문, 검색vs쇼핑 차트
   - **사전 QC · 출력**: 4-Gate 사전 검증 후 16:9 PPTX 다운로드

## 빠른 시작

```bash
npm ci
cp .env.example .env.local                       # NEXT_PUBLIC_API_BASE_URL 확인 (기본 8000, 충돌 시 8001)
npm run dev                                      # http://localhost:3000
```

- 검증(타입체크 + 프로덕션 빌드): `npx tsc --noEmit && npm run build` (**주의: `next dev` 실행 중에는 실행 금지**)
- 자세한 환경·디자인 토큰·검증 절차: [`docs/harness/environment.md`](./docs/harness/environment.md) · [`docs/harness/design-tokens.md`](./docs/harness/design-tokens.md) · [`docs/harness/verification.md`](./docs/harness/verification.md)
