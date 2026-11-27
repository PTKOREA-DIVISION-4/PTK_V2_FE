# 작업 워크플로우 — Issue → Branch → Commit → PR → Merge → Cleanup

> 범위: **공통** (`PTK_V2_FE` · `PTK_V2_BE` 동일). 출처 태그 정의는 `README.md` 참고.

## 0. 대원칙

1. **[U 2026-11-27]** 모든 작업은 **이슈와 PR을 통해서만** 진행한다. `main` 에 직접 push 하지 않는다.
2. **[U 2026-11-27]** PR 에는 **해당 이슈를 닫는 문구(`Closes #N`)**, **작업 내용**, **수정 파일**, **그 외** 사항을 반드시 적는다.
3. **[U 2026-11-27]** 브랜치명은 **`(수정 종류)` 와 `(이슈 번호)`** 로 짓는다. 구분자는 `/` 를 쓴다 → `feat/12`.
   - **[A 2026-11-27]** 사용자가 처음 제시한 `(수정 종류):(이슈 번호)` 의 콜론(`:`)은 git 브랜치명에 쓸 수 없어서(`git check-ref-format --branch "feat:12"` → 실패) 슬래시 형식으로 확정했다.
4. **[U 2026-11-27]** 개발이 끝난 브랜치는 **반드시 정리(삭제)** 한다.
5. **[D]** 이슈 1개 = 브랜치 1개 = PR 1개 = (스쿼시 후) main 커밋 1개.
6. **[A 2026-11-27]** 예외 1회(이미 사용됨): 비어 있는 레포는 PR 의 base 가 없으므로, 첫 스캐폴드 커밋(`.gitignore` · `README.md` · 하네스)만 `main` 에 직접 올렸다. **이후 예외는 없다.**

## 1. 수정 종류(type) 와 라벨 [D]

| type | 쓰는 경우 | 이슈 라벨 (기존 라벨만 사용) |
|---|---|---|
| `feat` | 새 기능 · 화면 · 엔드포인트 · UI 변경 | `enhancement` |
| `fix` | 버그 수정 | `bug` |
| `refactor` | 동작 변경 없는 구조 개선 | (없음) |
| `docs` | 문서·하네스만 변경 | `documentation` |
| `chore` | 설정 · 빌드 · 의존성 · CI · 초기 세팅 | (없음) |
| `test` | 테스트만 추가·수정 | (없음) |
| `style` | 코드 포맷·린트 등 동작 무관 변경 (UI 디자인 변경은 `feat`/`fix`) | (없음) |
| `perf` | 성능 개선 | (없음) |

새 라벨을 만들지 않는다. 한 작업이 여러 종류에 걸치면 **가장 큰 변경의 종류** 하나를 고르고, 나머지는 본문에 적는다.

## 2. 단계별 절차와 명령 [D]

`<type>` = 위 표의 값, `<N>` = 이슈 번호, `<요약>` = 한국어 한 줄(마침표 없음, 50자 안팎).

```bash
# 0) 준비 — 항상 최신 main 에서 시작
git switch main && git pull --ff-only origin main

# 1) 이슈 생성 (본문은 .github/ISSUE_TEMPLATE/task.md 형식)
gh issue create --title "<type>: <요약>" --body-file <본문.md> [--label enhancement|bug|documentation]
#   → 출력된 URL 의 마지막 숫자가 이슈 번호 <N>

# 2) 브랜치 생성
git switch -c <type>/<N>

# 3) 구현 + 검증 (docs/harness/verification.md 의 명령을 전부 실행)

# 4) 커밋 — 파일을 하나씩 지정한다. `git add -A` · `git add .` 금지 (비밀·산출물 혼입 방지)
git add <파일들>
git commit -m "<type>: <요약> (#<N>)"

# 5) push + PR
git push -u origin <type>/<N>
gh pr create --base main --head <type>/<N> \
  --title "<type>: <요약> (#<N>)" --body-file <PR본문.md>

# 6) harness-check · CI 통과 확인 후 스쿼시 머지 + 원격 브랜치 삭제
gh pr checks <PR번호> --watch
gh pr merge <PR번호> --squash --delete-branch --subject "<type>: <요약> (#<N>)" --body ""

# 7) 로컬 정리 (Squash Merge 는 main 에 새 커밋 SHA 를 만들므로 -D 사용)
git switch main && git pull --ff-only origin main
git branch -D <type>/<N> && git fetch --prune

# 8) 정리 검증 — 아래 출력이 main 계열만 있어야 한다
git branch -a      # * main / remotes/origin/HEAD -> origin/main / remotes/origin/main
```

> 이슈와 PR 은 GitHub 에서 **번호 체계를 공유**한다. 이슈 #1 다음 PR 이 #2 가 되므로, 브랜치 번호(`feat/1`)와 PR 번호는 다를 수 있다. 브랜치·커밋·`Closes` 에 쓰는 번호는 항상 **이슈 번호**다.

## 3. 커밋 메시지 [D]

- 형식: `<type>: <요약> (#<N>)` — 정규식 `^(feat|fix|refactor|docs|chore|test|style|perf): .+ \(#[1-9][0-9]*\)$`
- 한 커밋 = 한 논리 변경. 필요하면 빈 줄 뒤에 본문(왜 바꿨는지)을 적는다.
- 비밀값(API 키·토큰·`.env` 내용)을 메시지·코드·문서 어디에도 넣지 않는다.
- AI 도구가 붙이는 공동 작성자 트레일러 등 **자동 서명은 넣지 않는다**.

## 4. 이슈 본문 [D]

`.github/ISSUE_TEMPLATE/task.md` 의 4개 섹션을 채운다: `배경 / 목적` · `작업 범위` · `완료 조건(체크리스트)` · `참고`.
다른 레포에 영향이 있으면(예: BE API 변경 → FE 반영) **양쪽 레포에 각각 이슈**를 만들고 `참고` 에 서로 링크한다.

## 5. PR 본문 (필수 형식) [U + D]

`.github/PULL_REQUEST_TEMPLATE.md` 형식을 그대로 쓴다.

```markdown
Closes #<N>

## 작업 내용
무엇을·왜 바꿨는지

## 수정 파일
- `경로` — 한 줄 설명

## 검증
실행한 명령과 실제 결과 (verification.md 기준). 실행하지 않은 검증은 "미실행"으로 쓴다.

## 그 외
영향 범위 · 주의사항 · 후속 작업 · 다른 레포 연관 · 더 나은 대안을 검토한 결과 1줄
```

- 첫 번째 `Closes #<N>` 의 `<N>` 은 **브랜치명의 번호와 같아야** 한다.
- PR 제목은 커밋 제목과 같다: `<type>: <요약> (#<N>)`.
- 위 규칙은 `.github/workflows/harness-check.yml` 이 PR 마다 자동 검사한다 (브랜치명 · 제목 · `Closes #N` · 4개 섹션 비어 있지 않음). 실패하면 머지하지 않는다.

## 6. 머지 방식 [D]

- **Squash and merge** 만 사용한다. 머지 커밋 제목 = PR 제목.
- 본인 PR 을 직접 머지해도 되지만, `harness-check` (및 CI 가 있으면 CI) 가 모두 통과한 뒤에만 머지한다.
- `main` 에 대한 force push · 히스토리 재작성은 금지다 (`ai-operating-protocol.md` P-10).

## 7. 브랜치 정리 규칙 [U + D]

- 머지가 끝난 작업 브랜치는 **원격(`--delete-branch`) 과 로컬(`git branch -d`) 모두** 즉시 삭제한다.
- 머지하지 않고 닫는 PR 도 이슈에 사유를 남긴 뒤 브랜치를 삭제한다.
- 정기 점검 명령: `git fetch --prune && git branch -a` 에 `main` 계열 외 브랜치가 없어야 한다. 남아 있으면 정리 이슈 없이 바로 삭제하고 PR 본문 `그 외` 에 기록한다.

## 8. 소급 기록(retroactive) 규칙 [A 2026-11-27]

레포 연결 이전에 이미 끝난 개발 단계를 이력으로 옮길 때는 위 절차를 그대로 따르되, **이슈 본문과 PR `그 외` 에 "소급 기록"임과 실제 개발 시점을 명시**한다. 단계별 파일은 최종 상태 기준으로 나눈 것이라 **단계 단독으로는 빌드·테스트가 되지 않을 수 있음**도 함께 적는다.
