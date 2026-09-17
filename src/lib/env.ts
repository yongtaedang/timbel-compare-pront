// 빌드타임에 인라인되는 설정값(.env.dev/.env.prd). 정적 export라 런타임 주입은 없다 —
// 값을 바꾸려면 다시 빌드해야 한다(README "환경 변수" 절).

/** 기본 워커 수 — 비우면 브라우저가 보는 논리 코어 수를 제안값으로 쓴다(서버가 상한을 건다). */
export function defaultWorkers(): number {
  const configured = Number(process.env.NEXT_PUBLIC_DEFAULT_WORKERS);
  if (Number.isFinite(configured) && configured > 0) return Math.floor(configured);
  if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
    return Math.max(1, navigator.hardwareConcurrency);
  }
  return 4;
}
