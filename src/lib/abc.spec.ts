import { describe, it, expect } from "vitest";
import { classifyAbc, sharePct } from "./abc";

const p = (id: string, totalRevenue: number) => ({ id, totalRevenue });

describe("classifyAbc", () => {
  it("A até 80% acumulado, B até 95%, C o resto (o produto que cruza 80% ainda é A)", () => {
    // total 1000: A=500 (0%→50), B=350 (50%→85, ainda A pois antes=50), C=100 (antes=85 → B), D=40 (antes=95 → C), E=10
    const items = [p("a", 500), p("b", 350), p("c", 100), p("d", 40), p("e", 10)];
    const abc = classifyAbc(items, 1000);
    expect(abc.get("a")).toBe("A");
    expect(abc.get("b")).toBe("A");
    expect(abc.get("c")).toBe("B");
    expect(abc.get("d")).toBe("C");
    expect(abc.get("e")).toBe("C");
  });

  it("não depende da ordem de entrada", () => {
    const items = [p("e", 10), p("a", 500), p("c", 100)];
    expect(classifyAbc(items, 610).get("a")).toBe("A");
  });

  it("sem total positivo não classifica", () => {
    expect(classifyAbc([p("a", 10)], 0).size).toBe(0);
  });

  it("um produto só é A", () => {
    expect(classifyAbc([p("a", 10)], 10).get("a")).toBe("A");
  });
});

describe("sharePct", () => {
  it("calcula a participação e limita a 100", () => {
    expect(sharePct(25, 100)).toBe(25);
    expect(sharePct(150, 100)).toBe(100);
    expect(sharePct(5, 0)).toBe(0);
  });
});
