# 배포 가이드 (timbel-compare-front)

VM에 레포를 pull 받아 컨테이너로 띄운다. 산출물은 정적 파일뿐이라 nginx 이미지 하나면 끝난다.

## 1. 순서가 중요하다 — API 주소를 먼저 정한다

`NEXT_PUBLIC_API_URL`은 런타임 환경 변수가 아니라 **빌드 인자**다. `next build`가 이 값을 그대로
클라이언트 번들 안에 써 넣기 때문에, 컨테이너를 띄울 때 env를 바꿔도 아무 소용이 없다.

```bash
vi .env.prd        # NEXT_PUBLIC_API_URL=https://api-compare.timbel.dev
git commit -am "chore: 운영 API 주소를 맞춘다"
```

## 2. 첫 배포

```bash
git clone <저장소 주소> timbel-compare-front
cd timbel-compare-front
docker compose -f deploy/dev/docker-compose.yml up -d --build
curl -I localhost:3000                 # 200
```

compose는 `BUILD_PROFILE: prd`로 빌드한다. 개발용 값으로 띄우려면 `dev`로 바꾼다.

## 3. 재배포

```bash
git pull
docker compose -f deploy/dev/docker-compose.yml up -d --build
```

`.env.prd`를 고쳤을 때도 **반드시 다시 빌드**해야 한다(`--build` 없이 `up -d`만 하면 옛 번들이
그대로 뜬다).

## 4. 앞단 프록시

프론트 자체는 정적 파일이라 특별할 게 없다. TLS 종단과 도메인 연결만 하면 된다.

```nginx
server {
    server_name compare.timbel.dev;
    location / { proxy_pass http://127.0.0.1:3000; }
}
```

업로드는 브라우저 → API로 직접 간다. **이 프록시를 거치지 않으므로** 여기에
`client_max_body_size`를 키울 필요는 없다 — 키워야 하는 건 API 쪽 프록시다
(API 레포 `docs/deploy-guide.md` 4절).

## 5. 배포 후 확인

1. 화면이 뜨는지: `https://<프론트 주소>`
2. 브라우저 개발자도구 Network를 켜고 폴더 두 개를 골라 실행
3. `POST /api/compare/v1/compare` 요청이 **API 주소로** 나가는지, 응답이 `200 application/zip`인지
4. zip이 내려오고, 풀면 `summary.html`이 열리는지

가장 흔한 실패는 CORS다. 요청이 브라우저에서 막히면 서버 로그에는 아무것도 남지 않는다 —
API의 `CORS_ALLOWED_ORIGINS`에 이 프론트 origin이 정확히(스킴·포트 포함) 들어 있는지 본다.

| 증상 | 원인 |
|---|---|
| 실행을 눌러도 아무 일이 없고 콘솔에 CORS 오류 | API의 `CORS_ALLOWED_ORIGINS`에 프론트 주소가 없다 |
| "API에 연결하지 못했습니다" | `NEXT_PUBLIC_API_URL`이 틀렸거나 API가 안 떠 있다. 빌드된 값이므로 재빌드 필요 |
| 413 | API 앞단 프록시의 `client_max_body_size`(프론트 프록시가 아니다) |
| 업로드는 끝났는데 한참 멈춰 있음 | 정상이다. 서버가 비교 중이며 파일 수에 따라 몇 분 걸린다 |
