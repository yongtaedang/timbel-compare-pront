import { defineConfig } from "vitest/config";

// src/lib의 순수 모듈만 검증한다(파일 짝짓기·폼 조립). 비교 로직은 여기 없다 —
// timbel-compare-api가 원본 스크립트를 돌리고, 그쪽 pytest가 수치까지 확인한다.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
});
