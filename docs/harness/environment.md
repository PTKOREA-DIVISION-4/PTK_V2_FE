# 환경 — PTK_V2_FE

> 범위: **FE 전용**. 태그는 `README.md` 참고.

## 1. 버전 [D]

| 항목 | 버전 | 비고 |
|---|---|---|
| Node.js | **22+** (개발 환경 `v24.18.0`, CI `22`) | — |
| npm | **10+** (개발 환경 `11.16.0`) | `package-lock.json` 기반 `npm ci` 사용 |
| Next.js / React | Next `^15.1.6` (실제 `15.5.29`), React `^19.0.0` | Tailwind CSS `^4.0.0`, TypeScript `^5.7.3` |

## 2. 설치·실행 절차 [D]

```bash
# 1) 의존성 설치 (lockfile 고정)
npm ci

# 2) 환경변수 (로컬 전용, 커밋 금지)
cp .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL 을 실행 중인 백엔드 주소로 맞춘다

# 3) 개발 서버 (기본 http://localhost:3000)
npm run dev
```

- **ENV-1 [D]** 백엔드 기본 포트는 `8000` 이다. 로컬에서 다른 프로세스가 `8000` 을 쓰고 있어 백엔드를 `8001` 로 띄웠다면, `.env.local` 의 `NEXT_PUBLIC_API_BASE_URL` 도 `http://127.0.0.1:8001` 로 맞춘다 (`ai-operating-protocol.md` P-13).
- **ENV-2 [A 2026-11-27]** `.env.local` 은 `.gitignore` 로 제외되며, **백엔드 외부 API 키는 절대 FE 환경변수(`NEXT_PUBLIC_*`)에 넣지 않는다.**

## 3. 환경변수 (`.env.example` 기준)

| 이름 | 예시 | 용도 |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8001` | PTK_V2_BE 백엔드 Base URL |
