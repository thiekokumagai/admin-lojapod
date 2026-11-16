import { describe, expect, it } from "vitest";
import { buildPurchaseMessage, sortPurchaseItems, type PurchaseItem } from "./purchaseSimulation";

const items: PurchaseItem[] = [
  { descricao: "Pod Menta", categoria: "Pods", quantidade_sugerida: 10, valor_custo: 5, valor_total_sugerido: 50 },
  { descricao: "Álcool", categoria: "Acessórios", quantidade_sugerida: 2, valor_custo: 20, valor_total_sugerido: 40 },
  { descricao: "Zebra", categoria: "Pods", variacao: "Uva", quantidade_sugerida: 1, valor_custo: 12.5, valor_total_sugerido: 12.5 },
  { descricao: "Sem categoria", categoria: null, quantidade_sugerida: 3, valor_custo: 1, valor_total_sugerido: 3 },
];

describe("sortPurchaseItems", () => {
  it("ordena por nome A-Z e Z-A, ignorando acento e caixa", () => {
    const asc = sortPurchaseItems(items, { key: "descricao", direction: "asc" }).map((i) => i.descricao);
    expect(asc).toEqual(["Álcool", "Pod Menta", "Sem categoria", "Zebra"]);
    const desc = sortPurchaseItems(items, { key: "descricao", direction: "desc" }).map((i) => i.descricao);
    expect(desc).toEqual(["Zebra", "Sem categoria", "Pod Menta", "Álcool"]);
  });

  it("ordena por categoria, desempata pelo nome e deixa sem categoria no fim", () => {
    const asc = sortPurchaseItems(items, { key: "categoria", direction: "asc" }).map((i) => i.descricao);
    expect(asc).toEqual(["Álcool", "Pod Menta", "Zebra", "Sem categoria"]);
    const desc = sortPurchaseItems(items, { key: "categoria", direction: "desc" }).map((i) => i.descricao);
    expect(desc).toEqual(["Pod Menta", "Zebra", "Álcool", "Sem categoria"]); // empate de categoria segue A-Z
  });

  it("ordena números como números (não como texto)", () => {
    const asc = sortPurchaseItems(items, { key: "valor_custo", direction: "asc" }).map((i) => i.valor_custo);
    expect(asc).toEqual([1, 5, 12.5, 20]);
  });

  it("não altera a lista original", () => {
    const before = items.map((i) => i.descricao);
    sortPurchaseItems(items, { key: "descricao", direction: "desc" });
    expect(items.map((i) => i.descricao)).toEqual(before);
  });
});

describe("buildPurchaseMessage", () => {
  it("devolve vazio sem itens", () => {
    expect(buildPurchaseMessage([])).toBe("");
  });

  it("gera o formato do exemplo: categoria, uma linha por item 'nome - qtd', linha em branco entre categorias", () => {
    const message = buildPurchaseMessage([
      { descricao: "Ignite v500 green apple", categoria: "Descartável", quantidade_sugerida: 10, valor_custo: 30 },
      { descricao: "Ignite v500 grape ice", categoria: "Descartável", quantidade_sugerida: 10, valor_custo: 30 },
      { descricao: "Blvk", variacao: "menta 35mg", categoria: "Nicsalt", quantidade_sugerida: 11, valor_custo: 9 },
      { descricao: "Blvk", variacao: "menta 50mg", categoria: "Nicsalt", quantidade_sugerida: 5, valor_custo: 9 },
    ]);
    expect(message).toBe(
      [
        "Descartável",
        "Ignite v500 green apple - 10",
        "Ignite v500 grape ice - 10",
        "",
        "Nicsalt",
        "Blvk menta 35mg - 11",
        "Blvk menta 50mg - 5",
      ].join("\n"),
    );
  });

  it("não tem preço, total, título, numeração nem negrito", () => {
    const message = buildPurchaseMessage(items);
    expect(message).not.toMatch(/R\$|Total|Lista de compras|\*/);
    expect(message).not.toMatch(/^\d+\./m);
  });

  it("só cita os itens recebidos", () => {
    const message = buildPurchaseMessage([items[1]]);
    expect(message).toBe("Acessórios\nÁlcool - 2");
    expect(message).not.toContain("Zebra");
  });

  it("agrupa pela ordem em que a categoria aparece primeiro e mantém a ordem dos itens", () => {
    const message = buildPurchaseMessage([items[2], items[1], items[0]]);
    expect(message).toBe("Pods\nZebra Uva - 1\nPod Menta - 10\n\nAcessórios\nÁlcool - 2");
  });

  it("itens sem categoria vão num grupo final 'Sem categoria'", () => {
    const message = buildPurchaseMessage([items[3], items[0], { descricao: "Vazio", categoria: "  ", quantidade_sugerida: 4 }]);
    expect(message).toBe("Pods\nPod Menta - 10\n\nSem categoria\nSem categoria - 3\nVazio - 4");
  });
});
