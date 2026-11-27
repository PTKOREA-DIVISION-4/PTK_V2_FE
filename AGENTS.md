# AGENTS.md — PTK_V2_FE (Factbook Generator Frontend)

> 어떤 AI 도구(Claude · Gemini · GPT · Copilot · Cursor …)를 쓰든, 어떤 사람이 작업하든 **이 파일이 유일한 진입점**입니다.
> `CLAUDE.md` · `GEMINI.md` · `.github/copilot-instructions.md` 는 이 파일을 가리키는 포인터일 뿐입니다.

## 이 레포는

- Next.js(App Router) · React 19 · TypeScript · Tailwind CSS v4 기반 **팩트북 생성 워크스페이스 (`Division 4`)** 프런트엔드입니다.
- 짝 레포: [`PTKOREA-DIVISION-4/PTK_V2_BE`](https://github.com/PTKOREA-DIVISION-4/PTK_V2_BE) (FastAPI 백엔드 · `docs/API_SPEC.md` 기준으로 연동).
- 이 레포와 BE 레포는 **PUBLIC** 입니다. 비밀값·백엔드 API 키를 절대 넣지 않습니다.

## 먼저 읽을 것 (순서 고정, 끝까지)

1. `docs/harness/README.md` — 인덱스·태그·우선순위
2. `docs/harness/ai-operating-protocol.md` — 행동 규약 (공통)
3. `docs/harness/workflow.md` — 이슈 · 브랜치 · 커밋 · PR · 머지 · 브랜치 정리 (공통)
4. `docs/harness/project-rules.md` — 사용자가 지시한 FE 규칙
5. `docs/harness/design-tokens.md` — Division 4 라이트 UI 디자인 토큰·아이콘·차트 규격
6. `docs/harness/architecture.md` — 폴더 · 도메인 · 상태 관리 구조
7. `docs/harness/verification.md` — 실행할 검증 명령과 완료 기준(DoD)
8. `docs/harness/environment.md` — Node · 환경변수 (`NEXT_PUBLIC_API_BASE_URL`)
9. `docs/harness/rule-changes.md` — 규칙을 추가·변경하는 절차

## 절대 규칙 (요약 — 근거와 상세는 위 문서)

1. **[U]** 모든 작업은 **이슈 → 브랜치 → 커밋 → PR** 로만 한다. `main` 직접 push 금지.
2. **[U]** PR 에는 `Closes #N` · `## 작업 내용` · `## 수정 파일` · `## 검증` · `## 그 외` 를 적는다 (자동 검사: `harness-check`).
3. **[U]** 브랜치명은 `<type>/<이슈번호>` (예: `feat/12`). 콜론(`:`)은 git 에서 쓸 수 없어 슬래시로 확정했다.
4. **[U]** 머지가 끝난 브랜치는 **원격·로컬 모두 삭제**한다.
5. **[U]** 디자인 시스템: **Division 4** 헤더(아이콘 없이 제목만), **라이트 모드**(`#FFFFFF`/`#FAFAFA`), **블랙(`#111111`) 메인 + 오렌지(`#E9501F`) 포인트**, **Lucide 아이콘 전용**, **데스크탑 웹 앱 레이아웃**, **중간 라운드(`6/8/12px`)**.
6. **[U]** 수정으로 **사용자 UX가 지저분해지면 안 된다.** 처음 보는 사람도 쉽게 쓸 수 있어야 하며, 웹 UI 와 PPTX 디자인 포맷을 일관되게 맞춘다.
7. **[U]** 두 레포는 PUBLIC 이지만 사내 서비스이므로 외부 API 키·`.env.local` 뿐 아니라 **고객사명·실측 수치·원본 산출물·내부 URL 등 기밀 정보도 레포에 절대 넣지 않는다** (`P-11`).
8. **[A]** **`next dev` 가 실행 중일 때 `npm run build` 를 동시에 실행하지 않는다**(`.next` 충돌 방지). 변경 후 반드시 `npx tsc --noEmit && npm run build` 를 통과시킨다.
9. **[U]** 새 규칙은 **사용자에게 먼저 물어보고** 승인된 것만 추가한다 (`docs/harness/rule-changes.md`).

## 명령 치트시트

```bash
# 설치 (lockfile 기준)
npm ci

# 개발 서버
npm run dev                  # http://localhost:3000

# 검증 (next dev 를 먼저 중지한 뒤 실행)
npx tsc --noEmit && npm run build
```

## 하지 말 것

- `git add -A` / `git add .` (파일을 하나씩 지정), `main` force push, `.env.local` 커밋.
- `next dev` 가 켜져 있는 상태에서 `npm run build` 실행.
- `lucide-react` 외의 커스텀 SVG 아이콘/이모지 아이콘 남용, 모바일 앱 같은 카드/대시보드 레이아웃 회귀.
- 실행하지 않은 검증을 했다고 보고, 승인받지 않은 규칙을 하네스에 기록.
