"use client";

// 폴더 하나를 통째로 고르는 입력. 파이썬 CLI의 -A/-B 인자에 해당한다.
// 브라우저가 파일을 읽기만 할 뿐 어디로도 보내지 않는다 — 업로드가 아니다.

import { useId } from "react";

type Props = {
  label: string;
  hint: string;
  files: FileList | null;
  onPick: (files: FileList | null) => void;
};

export default function FolderPicker({ label, hint, files, onPick }: Props) {
  const id = useId();
  const txtCount = Array.from(files ?? []).filter((f) => f.name.toLowerCase().endsWith(".txt")).length;

  return (
    <div className="rounded-card border border-line bg-card p-4 shadow-card">
      <label htmlFor={id} className="block text-sm font-semibold text-ink">
        {label}
      </label>
      <p className="mt-1 text-xs text-muted">{hint}</p>
      <input
        id={id}
        type="file"
        webkitdirectory=""
        directory=""
        multiple
        onChange={(event) => onPick(event.target.files)}
        className="mt-3 block w-full text-sm text-ink-2 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100"
      />
      {files && (
        <p className="mt-2 text-xs text-muted">
          .txt {txtCount.toLocaleString()}개 선택됨 (전체 {files.length.toLocaleString()}개)
        </p>
      )}
    </div>
  );
}
