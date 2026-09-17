# ─── Stage 1: Build ────────────────────────────────────────────────────────
# Next.js 정적 export(next.config.ts의 output: "export") — build:dev/build:prd 분기는
# BUILD_PROFILE 인자로 정한다. dotenv-cli가 .env.${BUILD_PROFILE}을 읽어 NEXT_PUBLIC_*를
# 빌드타임에 번들에 인라인한다(둘 다 시크릿 없음 — .dockerignore 참고).
# 산출물은 out/ 디렉토리의 정적 HTML+CSS+JS.
FROM node:22-alpine AS build
WORKDIR /workspace

# 의존성 캐시 최적화 — lockfile + package.json만 먼저 복사해 npm ci 레이어를 분리한다.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG BUILD_PROFILE=dev
RUN npm run build:${BUILD_PROFILE}

# ─── Stage 2: nginx serving ────────────────────────────────────────────────
FROM nginx:1.27-alpine

# wget 추가 — alpine 기본 이미지엔 없다. 아래 HEALTHCHECK의 wget --spider용(~150KB).
RUN apk add --no-cache wget

COPY nginx-security-headers.conf /etc/nginx/snippets/nginx-security-headers.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/out /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=10s --timeout=3s --retries=5 --start-period=10s \
  CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
