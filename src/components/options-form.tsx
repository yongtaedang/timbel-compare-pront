"use client";

// 비교 옵션 — 원본 스크립트가 CLI로 받는 것만 보여 준다.
//
// 구두점 제거(--remove-punctuation)와 대소문자 무시(--ignore-case)는 스크립트에서
// `store_true`인데 default가 이미 True라 끌 방법이 없다. 있는 척 체크박스를 두면 꺼도 안 꺼지는
// 옵션이 되므로, 켜져 있다는 사실만 적어 둔다(API README "옵션" 절).

import type { CompareOptions } from "@/lib/api";

type Props = {
  options: CompareOptions;
  onChange: (options: CompareOptions) => void;
  workers: number;
  onWorkersChange: (workers: number) => void;
  disabled: boolean;
};

export default function OptionsForm({ options, onChange, workers, onWorkersChange, disabled }: Props) {
  return (
    <div className="rounded-card border border-line bg-card p-4 shadow-card">
      <div className="text-sm font-semibold text-ink">비교 옵션</div>

      <label className="mt-3 flex gap-2 text-sm text-ink-2">
        <input
          type="checkbox"
          checked={options.eliGantu}
          disabled={disabled}
          onChange={(event) => onChange({ ...options, eliGantu: event.target.checked })}
          className="mt-0.5 size-4 accent-brand-600"
        />
        <span>
          <span className="font-medium text-ink">감탄사 제거</span>
          <span className="block text-xs text-muted">
            단독으로 선 &apos;이/그/저/뭐/어&apos;를 지우고 비교한다 (<code>--eli-gantu</code>)
          </span>
        </span>
      </label>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink-2">
        <span className="font-medium text-ink">워커 수</span>
        <input
          type="number"
          min={1}
          max={64}
          value={workers}
          disabled={disabled}
          onChange={(event) => onWorkersChange(Math.max(1, Number(event.target.value) || 1))}
          className="w-20 rounded-md border border-line px-2 py-1 text-sm"
        />
        <span className="text-xs text-muted">
          서버가 동시에 돌릴 프로세스 수 (<code>-w</code>). 서버 상한을 넘으면 상한으로 줄어든다.
        </span>
      </label>

      <p className="mt-4 border-t border-line pt-3 text-xs text-muted">
        구두점 제거와 대소문자 무시는 원본 스크립트에서 <strong>항상 켜져 있다</strong> — 끌 수 있는
        인자가 없다.
      </p>
    </div>
  );
}
