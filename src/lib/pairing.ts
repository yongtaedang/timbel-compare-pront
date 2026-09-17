// 두 폴더에서 같은 이름의 .txt를 짝짓는다 — 파이썬 main()의 파일 목록 처리에 해당한다.
// 브라우저는 폴더를 <input webkitdirectory>로 받으므로 File 객체에 상대 경로가 실려 온다.

export type FilePair = { fileName: string; reference: File; recognition: File };

export type PairingResult = {
  pairs: FilePair[];
  /** 한쪽에만 있어서 비교 대상에서 빠진 파일들. 화면에 그대로 알려 준다. */
  referenceOnly: string[];
  recognitionOnly: string[];
};

/** 폴더 선택으로 들어온 FileList에서 .txt만, 파일명(경로 제외) 기준으로 모은다. */
function indexTxtFiles(files: FileList | File[] | null): Map<string, File> {
  const map = new Map<string, File>();
  for (const file of Array.from(files ?? [])) {
    if (!file.name.toLowerCase().endsWith(".txt")) continue;
    map.set(file.name, file);
  }
  return map;
}

export function pairFiles(reference: FileList | File[] | null, recognition: FileList | File[] | null): PairingResult {
  const refs = indexTxtFiles(reference);
  const recogs = indexTxtFiles(recognition);

  const pairs: FilePair[] = [];
  const referenceOnly: string[] = [];

  for (const name of [...refs.keys()].sort()) {
    const recog = recogs.get(name);
    if (recog) pairs.push({ fileName: name, reference: refs.get(name)!, recognition: recog });
    else referenceOnly.push(name);
  }

  const recognitionOnly = [...recogs.keys()].filter((name) => !refs.has(name)).sort();

  return { pairs, referenceOnly, recognitionOnly };
}
