"use client";

// 비교 실행 화면.
//
// 하는 일은 셋뿐이다: 폴더 두 개를 고르고, 옵션을 정해서, API로 보낸 뒤 결과 zip을 받는다.
// 비교 자체는 timbel-compare-api가 원본 파이썬 스크립트를 그대로 돌려서 한다.

import { useMemo, useRef, useState } from "react";
import FolderPicker from "@/components/folder-picker";
import OptionsForm from "@/components/options-form";
import { downloadBlob, requestCompare, type CompareHandle, type CompareOptions } from "@/lib/api";
import { defaultWorkers } from "@/lib/env";
import { pairFiles } from "@/lib/pairing";

type Phase =
  | { step: "idle" }
  | { step: "uploading"; percent: number }
  | { step: "running" }
  | { step: "done"; fileName: string; at: Date }
  | { step: "failed"; message: string };

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)}MB`;

export default function HomePage() {
  const [referenceFiles, setReferenceFiles] = useState<FileList | null>(null);
  const [recognitionFiles, setRecognitionFiles] = useState<FileList | null>(null);
  const [options, setOptions] = useState<CompareOptions>({ eliGantu: false });
  const [workers, setWorkers] = useState(() => defaultWorkers());
  const [phase, setPhase] = useState<Phase>({ step: "idle" });
  const handleRef = useRef<CompareHandle | null>(null);

  const pairing = useMemo(
    () => pairFiles(referenceFiles, recognitionFiles),
    [referenceFiles, recognitionFiles],
  );

  const uploadBytes = useMemo(
    () => pairing.pairs.reduce((sum, pair) => sum + pair.reference.size + pair.recognition.size, 0),
    [pairing],
  );

  const busy = phase.step === "uploading" || phase.step === "running";

  const start = async () => {
    if (pairing.pairs.length === 0) return;
    setPhase({ step: "uploading", percent: 0 });

    const handle = requestCompare(pairing.pairs, { ...options, workers }, ({ loaded, total }) => {
      const percent = total ? Math.round((loaded / total) * 100) : 0;
      // 업로드가 끝나면 서버가 비교를 도는 구간이다 — 진행률로는 알 수 없어 단계를 바꿔 알린다.
      setPhase(percent >= 100 ? { step: "running" } : { step: "uploading", percent });
    });
    handleRef.current = handle;

    try {
      const { blob, fileName } = await handle.result;
      downloadBlob(blob, fileName);
      setPhase({ step: "done", fileName, at: new Date() });
    } catch (error) {
      setPhase({ step: "failed", message: error instanceof Error ? error.message : String(error) });
    } finally {
      handleRef.current = null;
    }
  };

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">텍스트 비교 도구</h1>
        <p className="mt-1 text-sm text-muted">
          참조 텍스트와 인식 텍스트를 글자 단위로 맞춰 CER(문자 오류율)을 낸다. 폴더 두 개를 고르면
          서버가 비교해서 리포트 폴더를 zip으로 돌려준다 — 그 안의 <code>summary.html</code>을 열면
          전체 결과가, 파일별 HTML을 열면 상세 비교가 보인다.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <FolderPicker
          label="참조 텍스트 폴더 (A)"
          hint="정답 텍스트가 든 폴더. 폴더 안의 .txt만 보낸다."
          files={referenceFiles}
          onPick={setReferenceFiles}
        />
        <FolderPicker
          label="인식 텍스트 폴더 (B)"
          hint="비교할 인식 결과 폴더. 참조 폴더와 파일명이 같아야 짝이 된다."
          files={recognitionFiles}
          onPick={setRecognitionFiles}
        />
      </div>

      <OptionsForm
        options={options}
        onChange={setOptions}
        workers={workers}
        onWorkersChange={setWorkers}
        disabled={busy}
      />

      <div className="rounded-card border border-line bg-card p-4 shadow-card">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={start}
            disabled={busy || pairing.pairs.length === 0}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? "비교 중…" : `비교 실행 (${pairing.pairs.length.toLocaleString()}쌍)`}
          </button>

          {busy && (
            <button
              type="button"
              onClick={() => handleRef.current?.abort()}
              className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-2 hover:bg-surface"
            >
              중단
            </button>
          )}

          {pairing.pairs.length > 0 && !busy && (
            <span className="text-xs text-muted">보낼 용량 {mb(uploadBytes)}</span>
          )}
        </div>

        {phase.step === "uploading" && (
          <Progress percent={phase.percent} label={`업로드 중… ${phase.percent}%`} />
        )}

        {phase.step === "running" && (
          <Progress
            percent={100}
            striped
            label="서버에서 비교 중… 파일 수와 길이에 따라 몇 분 걸릴 수 있다. 창을 닫지 말 것."
          />
        )}

        {phase.step === "done" && (
          <p className="mt-4 text-sm text-inserted">
            완료 — <span className="font-mono">{phase.fileName}</span>을 내려받았다. 압축을 풀고
            summary.html을 열면 된다.
          </p>
        )}

        {phase.step === "failed" && (
          <pre className="mt-4 whitespace-pre-wrap rounded-md bg-surface p-3 text-xs text-deleted">
            {phase.message}
          </pre>
        )}

        {(pairing.referenceOnly.length > 0 || pairing.recognitionOnly.length > 0) && (
          <p className="mt-4 text-xs text-muted">
            짝이 없어 보내지 않는 파일 — 참조 쪽 {pairing.referenceOnly.length}개, 인식 쪽{" "}
            {pairing.recognitionOnly.length}개.
          </p>
        )}

        {referenceFiles && recognitionFiles && pairing.pairs.length === 0 && (
          <p className="mt-4 text-sm text-deleted">두 폴더에 같은 이름의 .txt 파일이 없다.</p>
        )}
      </div>
    </main>
  );
}

function Progress({ percent, label, striped }: { percent: number; label: string; striped?: boolean }) {
  return (
    <div className="mt-4">
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full bg-brand-500 transition-[width] ${striped ? "animate-pulse" : ""}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-muted">{label}</p>
    </div>
  );
}
