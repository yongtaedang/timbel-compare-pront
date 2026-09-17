// 프론트가 직접 하는 일은 둘뿐이다: 같은 이름끼리 짝을 맞추는 것과, 그 짝을 폼으로 싸는 것.
// 비교 결과 자체는 timbel-compare-api의 pytest가 원본 스크립트로 확인한다.

import { describe, expect, it } from "vitest";
import { buildFormData } from "@/lib/api";
import { pairFiles } from "@/lib/pairing";

const file = (name: string, content = "내용") => new File([content], name, { type: "text/plain" });

describe("pairFiles", () => {
  it("같은 이름의 .txt만 짝짓는다", () => {
    const result = pairFiles(
      [file("a.txt"), file("b.txt"), file("c.md")],
      [file("a.txt"), file("z.txt")],
    );
    expect(result.pairs.map((p) => p.fileName)).toEqual(["a.txt"]);
    expect(result.referenceOnly).toEqual(["b.txt"]);
    expect(result.recognitionOnly).toEqual(["z.txt"]);
  });

  it(".txt가 아닌 파일은 양쪽 목록 어디에도 넣지 않는다", () => {
    const result = pairFiles([file("note.md")], [file("note.md")]);
    expect(result.pairs).toEqual([]);
    expect(result.referenceOnly).toEqual([]);
    expect(result.recognitionOnly).toEqual([]);
  });

  it("짝은 파일명 순으로 정렬된다", () => {
    const names = ["c.txt", "a.txt", "b.txt"].map((n) => file(n));
    expect(pairFiles(names, names).pairs.map((p) => p.fileName)).toEqual(["a.txt", "b.txt", "c.txt"]);
  });

  it("선택이 없으면 빈 결과", () => {
    expect(pairFiles(null, null).pairs).toEqual([]);
  });
});

describe("buildFormData", () => {
  const pairs = pairFiles([file("a.txt"), file("b.txt")], [file("a.txt"), file("b.txt")]).pairs;

  it("짝마다 reference/recognition 필드를 하나씩 넣는다", () => {
    const form = buildFormData(pairs, { eliGantu: false });
    expect(form.getAll("reference")).toHaveLength(2);
    expect(form.getAll("recognition")).toHaveLength(2);
  });

  it("업로드 파일명은 경로 없는 파일명이다", () => {
    const form = buildFormData(pairs, { eliGantu: false });
    const names = form.getAll("reference").map((entry) => (entry as File).name);
    expect(names).toEqual(["a.txt", "b.txt"]);
  });

  it("옵션을 스크립트 인자 이름으로 담는다", () => {
    const form = buildFormData(pairs, { eliGantu: true, workers: 8 });
    expect(form.get("eli_gantu")).toBe("true");
    expect(form.get("workers")).toBe("8");
  });

  it("워커 수를 비우면 아예 보내지 않는다 — 서버가 기본값을 쓴다", () => {
    const form = buildFormData(pairs, { eliGantu: false });
    expect(form.has("workers")).toBe(false);
  });
});
