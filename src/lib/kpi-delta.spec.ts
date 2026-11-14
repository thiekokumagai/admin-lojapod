import { describe, expect, it } from "vitest";
import { computeDelta } from "./kpi-delta";

const fmt = (v: number) => String(v);

describe("computeDelta", () => {
  it("variação percentual de alta é boa", () => {
    expect(computeDelta(120, 100, { kind: "percent", format: fmt })).toEqual({
      text: "20%",
      direction: "up",
      good: true,
      previousText: "100",
    });
  });

  it("queda pequena usa uma casa decimal", () => {
    const d = computeDelta(97.5, 100, { kind: "percent", format: fmt })!;
    expect(d.text).toBe("2,5%");
    expect(d.direction).toBe("down");
    expect(d.good).toBe(false);
  });

  it("invert: carrinhos abandonados caindo é bom", () => {
    const d = computeDelta(5, 10, { kind: "percent", format: fmt, invert: true })!;
    expect(d.direction).toBe("down");
    expect(d.good).toBe(true);
  });

  it("base zero: 'novo' quando surgiu, nada quando os dois são zero", () => {
    expect(computeDelta(50, 0, { kind: "percent", format: fmt })?.text).toBe("novo");
    expect(computeDelta(0, 0, { kind: "percent", format: fmt })).toBeNull();
  });

  it("pontos percentuais para margem/conversão", () => {
    const d = computeDelta(32.4, 30, { kind: "points", format: fmt })!;
    expect(d.text).toBe("2,4 p.p.");
    expect(d.good).toBe(true);
  });

  it("sem dado anterior (ex.: margem null) não mostra nada", () => {
    expect(computeDelta(30, null, { kind: "points", format: fmt })).toBeNull();
    expect(computeDelta(null, 30, { kind: "points", format: fmt })).toBeNull();
  });

  it("sem mudança fica neutro", () => {
    expect(computeDelta(100, 100, { kind: "percent", format: fmt })).toMatchObject({
      direction: "flat",
      good: null,
    });
  });
});
