import { describe, it, expect } from "vitest";
import { buildCsv } from "./csv";

describe("buildCsv", () => {
  it("usa ';', BOM e vírgula decimal (abre direto no Excel em português)", () => {
    const csv = buildCsv(["Produto", "Valor"], [["Café", 12.5]]);
    expect(csv.startsWith("﻿")).toBe(true);
    expect(csv).toContain("Produto;Valor\r\nCafé;12,5");
  });

  it("protege texto com ';', aspas e quebra de linha", () => {
    const csv = buildCsv(["Nome"], [['Box "Top"; grande'], ["linha1\nlinha2"]]);
    expect(csv).toContain('"Box ""Top""; grande"');
    expect(csv).toContain('"linha1\nlinha2"');
  });

  it("neutraliza texto que a planilha leria como fórmula", () => {
    const csv = buildCsv(["Cliente"], [["=HYPERLINK(\"x\")"], ["+55 11"], ["@alguem"]]);
    expect(csv).toContain("'=HYPERLINK");
    expect(csv).toContain("'+55 11");
    expect(csv).toContain("'@alguem");
  });

  it("número negativo não é tratado como fórmula e vazio fica em branco", () => {
    const csv = buildCsv(["A", "B", "C"], [[-3.2, null, undefined]]);
    expect(csv).toContain("-3,2;;");
  });
});
