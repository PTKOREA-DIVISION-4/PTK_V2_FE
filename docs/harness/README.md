# 하네스(Harness) — 작업 규약 인덱스

이 문서 묶음은 **누가(사람) 어떤 AI(Claude · Gemini · GPT · Copilot · Cursor 등)로 작업하든 같은 절차·같은 형식·같은 품질의 결과물**이 나오도록 만든 규약입니다.
`PTK_V2_FE` · `PTK_V2_BE` 두 레포에 **공통 파일은 동일한 사본**으로, **레포별 파일은 각자 다른 내용**으로 들어 있습니다.

## 1. 모든 작업 시작 전 읽는 순서 (필수)

| 순서 | 파일 | 범위 | 내용 |
|---|---|---|---|
| 1 | `AGENTS.md` | 레포별 | 진입점·절대 규칙 요약·명령 치트시트 |
| 2 | `docs/harness/ai-operating-protocol.md` | **공통** | AI/사람이 지켜야 할 행동 규약 |
| 3 | `docs/harness/workflow.md` | **공통** | 이슈 → 브랜치 → 커밋 → PR → 머지 → 브랜치 정리 |
| 4 | `docs/harness/project-rules.md` | 레포별 | 사용자가 지시한 이 레포의 규칙 모음 |
| 5 | `docs/harness/architecture.md` | 레포별 | 구조·계층·네이밍 |
| 6 | `docs/harness/verification.md` | 레포별 | 실행할 검증 명령과 완료 기준(DoD) |
| 7 | `docs/harness/environment.md` | 레포별 | 버전·설치·환경변수 |
| 8 | `docs/harness/rule-changes.md` | **공통** | 규칙을 추가·수정·삭제하는 절차 (사용자 승인 필수) |
| 9 | `docs/harness/changelog.md` | 레포별 | 규칙 변경 이력 |
| (레포별) | `docs/harness/design-tokens.md` (FE) / `docs/harness/quality-rubric.md` (BE) | 레포별 | 디자인 토큰 / 팩트북 품질 루브릭 |

## 2. 출처 태그 — 모든 규칙 문장 앞에 붙는다

| 태그 | 의미 |
|---|---|
| **[U]** | 사용자가 직접 지시한 규칙 (대화 원문에 근거가 있음) |
| **[A]** | 작업 중 AI가 제안했고 **사용자가 승인**한 규칙 |
| **[D]** | 하네스를 구체적으로 만들기 위해 작성 시점에 정한 **기본값**. 사용자 검토 대기 상태이며 언제든 바꿀 수 있음 |

> 태그가 없는 문장은 규칙이 아니라 **관측된 현재 상태 설명**입니다. 규칙과 현재 상태가 다르면 규칙이 우선이며, 불일치는 이슈로 등록합니다.

## 3. 우선순위

1. 사용자의 **최신 명시 지시**
2. 이 하네스 (`AGENTS.md` + `docs/harness/*`)
3. 코드베이스의 기존 관행
4. AI의 일반적인 습관·선호

충돌하거나 모호하면 **임의로 판단하지 말고 사용자에게 질문**합니다 (`ai-operating-protocol.md` P-2, P-4).

## 4. 공통 파일을 두 레포에서 동일하게 유지하는 방법 [D]

공통 파일(`범위: 공통`, `.github/*`, `CLAUDE.md`, `GEMINI.md`)을 바꿀 때는 **두 레포에 각각 이슈 → PR**을 만들어 같은 내용으로 반영합니다. 한쪽 PR 본문 `## 그 외`에 다른 레포의 이슈/PR 링크를 남깁니다.

동일성 점검 명령 (FE 레포 루트에서 BE와 비교하는 예):

```bash
for f in docs/harness/README.md docs/harness/ai-operating-protocol.md docs/harness/workflow.md docs/harness/rule-changes.md \
         .github/PULL_REQUEST_TEMPLATE.md .github/ISSUE_TEMPLATE/task.md .github/ISSUE_TEMPLATE/config.yml \
         .github/workflows/harness-check.yml CLAUDE.md GEMINI.md .github/copilot-instructions.md; do
  gh api "repos/PTKOREA-DIVISION-4/PTK_V2_BE/contents/$f" --jq .content | base64 -d | diff -q - "$f" >/dev/null \
    && echo "SAME  $f" || echo "DIFF  $f"
done
```

BE 레포에서 FE와 비교할 때는 `PTK_V2_BE` 를 `PTK_V2_FE` 로 바꿉니다. `DIFF` 가 나오면 두 레포를 같은 내용으로 맞추는 이슈를 만듭니다.
