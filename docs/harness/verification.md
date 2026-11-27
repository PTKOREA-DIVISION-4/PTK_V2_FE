# 검증 명령과 완료 기준(DoD) — PTK_V2_FE

> 범위: **FE 전용**. 태그는 `README.md` 참고. 명령은 **레포 루트**에서 실행한다 (`ai-operating-protocol.md` P-14).

## 1. 모든 PR 에서 필수

```bash
# 1) (실행 중인 next dev 가 있다면 먼저 종료 — FE-15 [A])
# 2) 타입체크 + 프로덕션 빌드 (반드시 둘 다 Exit 0)
npx tsc --noEmit && npm run build
```

- **V-1 [A 2026-11-27]** **`next dev` 가 켜져 있을 때 `npm run build` 를 실행하지 않는다.** `.next` 캐시가 겹쳐 dev 서버나 빌드가 깨진다. 빌드 후 필요하면 `npm run dev` 를 다시 띄운다.
- **V-2 [A 2026-11-27]** 변경 후 `npx tsc --noEmit` 와 `npm run build` 가 모두 **오류 0건(Exit 0)** 이어야 한다.
- **V-3 [D]** PR 의 `## 검증` 에는 실행한 명령과 실제 결과를 그대로 적는다. 실행하지 않았으면 "미실행"이라고 쓴다.

## 2. UI·기능 변경 시 추가 확인 [D]

| 바꾼 것 | 추가로 확인할 것 |
|---|---|
| 화면 레이아웃 · 디자인 토큰 · 차트 · 뷰어 | 백엔드 + 프런트 dev 서버 실행 상태에서 변경 페이지 접속 → Chrome DevTools 콘솔 **런타임 에러 0건** + 스크린샷으로 시각 확인 |
| API 연동 (`src/lib/api.ts` · `types.ts` · `store.tsx`) | 짝 레포 `PTK_V2_BE` 의 `docs/API_SPEC.md` 와 필드·엔드포인트 일치 확인. 필요 시 `PTK_V2_BE` 이슈/PR 링크를 `## 그 외` 에 기록 |
| 패키지 (`package.json`) | `npm install` 후 `package-lock.json` 함께 커밋, 이슈 본문에 의존성 추가 사유 명시 |

## 3. 완료 기준 (Definition of Done) [D]

PR 을 머지하기 전에 모두 만족해야 한다.

- [ ] (`next dev` 중지 확인 후) `npx tsc --noEmit && npm run build` Exit 0
- [ ] (UI 변경 시) 브라우저 렌더링 및 콘솔 런타임 에러 0건 확인
- [ ] 디자인 토큰(`design-tokens.md`) 준수: 라이트 모드, `#111111` 메인 / `#E9501F` 포인트, Lucide 아이콘만 사용, `Division 4` 헤더
- [ ] `.env.local`·시크릿·백엔드 API 키가 diff 에 없음 — `git diff --cached` 로 확인
- [ ] `git add` 는 파일 단위로 지정함 (`-A`/`.` 미사용)
- [ ] PR 본문 4개 섹션 + `Closes #N` 작성, `harness-check` 와 `ci` 통과
- [ ] 머지 후 원격·로컬 브랜치 삭제 (`workflow.md` §2 의 7·8단계)

## 4. CI [D]

`.github/workflows/ci.yml` 이 PR 마다 `npm ci` → `npx tsc --noEmit` → `npm run build` 를 실행한다. 로컬에서 통과하지 못한 PR 을 올리지 않는다.
