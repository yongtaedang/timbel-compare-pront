# timbel-compare-front

텍스트 비교(CER) 도구의 프론트엔드. Next.js 16 **정적 export 전용** — 서버 코드가 없고
`output: "export"`가 만든 정적 HTML+CSS+JS를 nginx가 서빙한다.

화면이 하는 일은 셋뿐이다: 폴더 두 개를 고르고, 옵션을 정하고, 결과 zip을 받는다. 비교는
[`timbel-compare-api`](../timbel-compare-api)(별도 레포)가 원본 파이썬 스크립트를 그대로 실행해서
한다 — 이쪽엔 CER 계산 코드가 한 줄도 없다.

```
사용자 ─폴더 선택─▶ 프론트 ─multipart─▶ timbel-compare-api ─▶ text_comparison_linux_007.py
                        ◀────zip─────────
                    브라우저가 바로 내려받음(summary.html · summary.csv · 파일별 HTML)
```

## 구조test

- `next.config.ts` — `output: "export"`, `images.unoptimized: true`. SSR/서버 액션/API
  라우트를 쓰지 않는다.
- `src/app/page.tsx` — 화면 전부. 폴더 선택 → 옵션 → 실행 → 업로드 진행률 → 다운로드.
- `src/lib/api.ts` — API 호출. 업로드 진행률을 보려고 fetch가 아니라 `XMLHttpRequest`를 쓴다
  (fetch는 아직 업로드 진행률을 주지 않는다). 성공이면 zip Blob, 실패면 `{code,message}` JSON을
  `ApiError`로 바꾼다.
- `src/lib/pairing.ts` — 두 폴더에서 같은 이름의 `.txt`를 짝짓는다. **짝이 맞는 파일만 올린다** —
  짝 없는 파일은 서버가 어차피 무시하므로 업로드할 이유가 없다.
- `src/components/folder-picker.tsx` — `<input webkitdirectory>`로 폴더를 통째로 고른다.
- `src/components/options-form.tsx` — 감탄사 제거(`--eli-gantu`)와 워커 수(`-w`).

## 옵션이 두 개뿐인 이유

원본 스크립트의 `--remove-punctuation`과 `--ignore-case`는 argparse에서 `store_true`인데
`default=True`다 — **항상 켜져 있고 끄는 인자가 없다.** 체크박스를 두면 꺼도 안 꺼지는 옵션이
되므로 화면에는 "항상 켜져 있다"는 안내만 둔다. 자세한 내용은 API 레포 README "옵션" 절.

## 로컬에서 실행

```bash
npm ci
npm run dev        # http://localhost:3000
```

API가 함께 떠 있어야 한다:

```bash
cd ../timbel-compare-api
PYTHONPATH=src uvicorn compare_api.main:app --reload --port 8080
```

`.env.dev`의 `NEXT_PUBLIC_API_URL`이 그 주소를 가리키고, API의 `CORS_ALLOWED_ORIGINS`에
`http://localhost:3000`이 들어 있어야 한다. 둘 중 하나라도 틀리면 실행을 눌러도 브라우저
콘솔에만 CORS 오류가 뜬다.

## 테스트

```bash
npm test          # vitest — 파일 짝짓기, 폼 조립
npm run lint
npm run typecheck
```

비교 수치 검증은 여기 없다. API 레포의 `pytest`가 원본 스크립트를 실제로 돌려
`summary.csv`까지 대조한다.

## 빌드

```bash
npm run build:dev     # .env.dev 값을 인라인 → out/
npm run build:prd     # .env.prd 값을 인라인 → out/
npm run serve:out     # out/을 정적 서버로 확인(http://localhost:3000)
```

`NEXT_PUBLIC_*`는 **빌드 시점에 번들에 박힌다.** API 주소를 바꾸려면 env를 고치고 다시 빌드해야
하며, 그래서 dev/prd 이미지가 서로 다르다.

## 환경 변수

템플릿은 [`.env.example`](.env.example). 시크릿은 없다(정적 export라 값이 브라우저에 그대로
노출된다 — 비밀을 둘 수 없는 구조다).

| 이름 | 설명 |
|---|---|
| `NEXT_PUBLIC_API_URL` | timbel-compare-api 베이스 URL |
| `NEXT_PUBLIC_API_PREFIX` | API 라우트 접두사. API의 `API_PREFIX`와 같아야 한다 |
| `NEXT_PUBLIC_DEFAULT_WORKERS` | 워커 수 입력칸 기본값. 비우면 브라우저가 보는 논리 코어 수 |

## 배포

VM에서 git pull → `docker compose up -d --build`. 절차는
[`docs/deploy-guide.md`](docs/deploy-guide.md).
