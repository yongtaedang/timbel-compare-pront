import type { NextConfig } from "next";

// CSR 정적 export — 서버가 하는 일이 하나도 없다(비교 연산은 전부 브라우저 Web Worker).
// `next build` 산출물이 out/에 정적 HTML+CSS+JS로 떨어지고 nginx가 그대로 서빙한다.
// 이미지 최적화 로더는 정적 export와 호환되지 않아 unoptimized로 끈다.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
