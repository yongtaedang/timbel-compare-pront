// timbel-compare-api 호출. 브라우저가 직접 API를 때린다(정적 사이트라 서버 경유가 없다).
//
// 성공 응답은 zip 바이너리, 실패 응답은 {"code","message"} JSON이다. 업로드가 수백 MB까지
// 갈 수 있어서 fetch 대신 XMLHttpRequest를 쓴다 — 업로드 진행률을 볼 수 있는 건 아직 이쪽뿐이다.

import type { FilePair } from "./pairing";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
export const API_PREFIX = process.env.NEXT_PUBLIC_API_PREFIX ?? "/api/compare/v1";

export type CompareOptions = {
  /** 단독 감탄사(이/그/저/뭐/어) 제거 — 원본 스크립트의 --eli-gantu. */
  eliGantu: boolean;
  /** 워커 수(-w). 비우면 서버가 스크립트 기본값(서버 코어 수)을 쓴다. */
  workers?: number;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** 짝이 맞는 파일만 담는다 — 짝 없는 파일은 서버가 어차피 무시하므로 올릴 이유가 없다. */
export function buildFormData(pairs: FilePair[], options: CompareOptions): FormData {
  const form = new FormData();
  for (const pair of pairs) {
    form.append("reference", pair.reference, pair.fileName);
    form.append("recognition", pair.recognition, pair.fileName);
  }
  form.append("eli_gantu", String(options.eliGantu));
  if (options.workers) form.append("workers", String(options.workers));
  return form;
}

export type UploadProgress = { loaded: number; total: number };

export type CompareHandle = {
  /** 결과 zip. 실패하면 ApiError로 거절된다. */
  result: Promise<{ blob: Blob; fileName: string }>;
  abort: () => void;
};

/** 서버가 준 Content-Disposition의 파일명을 쓰고, 없으면 시각으로 만든다. */
function fileNameFrom(disposition: string | null): string {
  const match = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (match) return decodeURIComponent(match[1]);
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);
  return `compare-result-${stamp}.zip`;
}

async function errorFrom(blob: Blob, status: number): Promise<ApiError> {
  try {
    const parsed = JSON.parse(await blob.text()) as { message?: string };
    if (parsed.message) return new ApiError(parsed.message, status);
  } catch {
    // JSON이 아니면 상태 코드만으로 안내한다.
  }
  return new ApiError(`비교 요청이 실패했습니다 (HTTP ${status}).`, status);
}

export function requestCompare(
  pairs: FilePair[],
  options: CompareOptions,
  onProgress: (progress: UploadProgress) => void,
): CompareHandle {
  const xhr = new XMLHttpRequest();

  const result = new Promise<{ blob: Blob; fileName: string }>((resolve, reject) => {
    xhr.open("POST", `${API_BASE}${API_PREFIX}/compare`);
    xhr.responseType = "blob";

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress({ loaded: event.loaded, total: event.total });
    };

    xhr.onload = () => {
      const blob = xhr.response as Blob;
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ blob, fileName: fileNameFrom(xhr.getResponseHeader("Content-Disposition")) });
      } else {
        void errorFrom(blob, xhr.status).then(reject);
      }
    };

    xhr.onerror = () =>
      reject(new ApiError("API에 연결하지 못했습니다. 주소와 CORS 설정을 확인하세요.", 0));
    xhr.onabort = () => reject(new ApiError("사용자가 중단했습니다.", 0));

    xhr.send(buildFormData(pairs, options));
  });

  return { result, abort: () => xhr.abort() };
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
