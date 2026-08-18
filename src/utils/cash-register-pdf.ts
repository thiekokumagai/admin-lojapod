import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

export interface CashRegisterPDFData {
  cashRegister: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
  };
  summary: {
    totalReceived?: number | string;
    totalGross?: number | string;
    totalCardFees?: number | string;
    totalEntries?: number | string;
    totalOutflows?: number | string;
    motoboyOutflows?: number | string;
    marketingOutflows?: number | string;
    partnersOutflows?: number | string;
    totalProductCost?: number | string;
    totalInvestment?: number | string;
    totalNet?: number | string;
    totalsByMethod?: Record<string, number | string>;
    orderCount?: number;
  };
  orders?: Array<{
    id: string;
    orderNumber: number | string;
    customerName: string;
    paymentDate?: string;
    paymentMethod?: string;
    installments?: number;
    totalReceived: number | string;
    cardFee?: number | string;
  }>;
  transactions?: Array<{
    id: string;
    description: string;
    type: "ENTRY" | "OUTFLOW" | string;
    category?: string;
    amount: number | string;
    date?: string;
    createdAt?: string;
  }>;
}

const parseNumber = (val: any): number => {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? 0 : parsed;
};

const formatCurrency = (val: any) => {
  const num = parseNumber(val);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(num);
};

const formatMethodName = (method?: string) => {
  if (!method) return "-";
  const m = method.toLowerCase();
  if (m === "pix") return "Pix";
  if (m === "credito" || m === "credit" || m === "cartão de crédito") return "Cartão de Crédito";
  if (m === "debito" || m === "debit" || m === "cartão de débito") return "Cartão de Débito";
  if (m === "dinheiro" || m === "cash" || m === "dinheiro") return "Dinheiro";
  return method;
};

const formatCategoryName = (cat?: string) => {
  if (!cat) return "Geral";
  const c = cat.toUpperCase();
  if (c === "MOTOBOY") return "Motoboy / Frete";
  if (c === "INVESTMENT") return "Investimento";
  if (c === "MARKETING") return "Marketing";
  if (c === "FIXED_COSTS") return "Contas Fixas";
  if (c === "PARTNERS") return "Sócios";
  if (c === "BANK") return "Banco";
  if (c === "GENERAL") return "Geral";
  return cat;
};

export function generateCashRegisterPDF(data: CashRegisterPDFData): void {
  const { cashRegister, summary, orders = [], transactions = [] } = data;

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  // 1. Cabeçalho Principal
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("RELATÓRIO DE CAIXA", margin, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // Slate 300
  const issueDateStr = format(new Date(), "dd/MM/yyyy HH:mm");
  doc.text(`Emissão: ${issueDateStr}`, pageWidth - margin, 14, { align: "right" });

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(cashRegister.title || "Caixa Sem Título", margin, 22);

  const startFormatted = cashRegister.startDate
    ? format(new Date(cashRegister.startDate.split("T")[0] + "T00:00:00"), "dd/MM/yyyy")
    : "-";
  const endFormatted = cashRegister.endDate
    ? format(new Date(cashRegister.endDate.split("T")[0] + "T00:00:00"), "dd/MM/yyyy")
    : "-";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Período: ${startFormatted} até ${endFormatted}`, pageWidth - margin, 22, { align: "right" });

  currentY = 34;

  // 2. Resumo Financeiro (Tabela de Indicadores)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("1. Fluxo de Caixa & Indicadores Financeiros", margin, currentY);
  currentY += 4;

  const gross = parseNumber(summary.totalGross ?? summary.totalReceived);
  const entries = parseNumber(summary.totalEntries);
  const investments = parseNumber(summary.totalInvestment);
  const productCost = parseNumber(summary.totalProductCost);
  const cardFees = parseNumber(summary.totalCardFees);
  const outflows = parseNumber(summary.totalOutflows);
  const motoboy = parseNumber(summary.motoboyOutflows);
  const marketing = parseNumber(summary.marketingOutflows);
  const partners = parseNumber(summary.partnersOutflows);
  const net = summary.totalNet !== undefined
    ? parseNumber(summary.totalNet)
    : gross - cardFees - outflows + entries;

  const summaryRows = [
    [
      { content: "Faturamento Bruto:", styles: { fontStyle: "bold" } },
      formatCurrency(gross),
      { content: "Entradas Manuais:", styles: { fontStyle: "bold" } },
      formatCurrency(entries),
    ],
    [
      { content: "Investimentos:", styles: { fontStyle: "bold" } },
      formatCurrency(investments),
      { content: "Custo de Produtos:", styles: { fontStyle: "bold" } },
      formatCurrency(productCost),
    ],
    [
      { content: "Taxas Retidas (Cartão):", styles: { fontStyle: "bold" } },
      formatCurrency(cardFees),
      { content: "Saídas / Despesas:", styles: { fontStyle: "bold" } },
      formatCurrency(outflows),
    ],
    [
      { content: "Gasto Motoboy:", styles: { fontStyle: "bold" } },
      formatCurrency(motoboy),
      { content: "Marketing / Publicidade:", styles: { fontStyle: "bold" } },
      formatCurrency(marketing),
    ],
    [
      { content: "Saída Sócios:", styles: { fontStyle: "bold" } },
      formatCurrency(partners),
      { content: "Saldo Líquido Final:", styles: { fontStyle: "bold", textColor: [16, 185, 129] } },
      { content: formatCurrency(net), styles: { fontStyle: "bold", textColor: [16, 185, 129] } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [],
    body: summaryRows as any,
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 45, halign: "left" },
      1: { cellWidth: 40, halign: "left", fontStyle: "bold" },
      2: { cellWidth: 45, halign: "left" },
      3: { cellWidth: 40, halign: "left", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // 3. Resumo por Método de Pagamento (Se existir)
  if (summary.totalsByMethod && Object.keys(summary.totalsByMethod).length > 0) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text("2. Vendas por Forma de Pagamento", margin, currentY);
    currentY += 4;

    const methodBody = Object.entries(summary.totalsByMethod).map(([method, total]) => [
      formatMethodName(method),
      formatCurrency(parseNumber(total)),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [["Forma de Pagamento", "Total Recebido"]],
      body: methodBody,
      theme: "striped",
      headStyles: {
        fillColor: [51, 65, 85],
        textColor: [255, 255, 255],
        fontSize: 9,
        fontStyle: "bold",
        halign: "left",
      },
      styles: {
        fontSize: 8.5,
        cellPadding: 2,
      },
      columnStyles: {
        0: { halign: "left" },
        1: { halign: "right", fontStyle: "bold" },
      },
      margin: { left: margin, right: margin },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 4. Tabela de Pedidos / Vendas Recebidos
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`3. Pedidos Incluídos neste Caixa (${orders.length})`, margin, currentY);
  currentY += 4;

  let totalOrdersGross = 0;
  let totalOrdersFee = 0;
  let totalOrdersNet = 0;

  const ordersBody = orders.map((order) => {
    const grossVal = parseNumber(order.totalReceived);
    const feeVal = parseNumber(order.cardFee);
    const netVal = grossVal - feeVal;

    totalOrdersGross += grossVal;
    totalOrdersFee += feeVal;
    totalOrdersNet += netVal;

    const paymentDateStr = order.paymentDate
      ? format(new Date(order.paymentDate), "dd/MM/yyyy HH:mm")
      : "-";

    const methodStr =
      formatMethodName(order.paymentMethod) +
      (order.installments && order.installments > 1 ? ` (${order.installments}x)` : "");

    return [
      `#${order.orderNumber}`,
      order.customerName || "Cliente",
      paymentDateStr,
      methodStr,
      formatCurrency(grossVal),
      feeVal > 0 ? formatCurrency(feeVal) : "-",
      formatCurrency(netVal),
    ];
  });

  const ordersFoot = [
    [
      { content: "TOTAL DOS PEDIDOS", colSpan: 4, styles: { fontStyle: "bold", halign: "right" } },
      { content: formatCurrency(totalOrdersGross), styles: { fontStyle: "bold", halign: "right" } },
      { content: formatCurrency(totalOrdersFee), styles: { fontStyle: "bold", halign: "right", textColor: [225, 29, 72] } },
      { content: formatCurrency(totalOrdersNet), styles: { fontStyle: "bold", halign: "right", textColor: [16, 185, 129] } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Nº", "Cliente", "Data Pagamento", "Método", "Bruto", "Taxa", "Líquido"]],
    body: ordersBody.length > 0 ? ordersBody : [["-", "Nenhum pedido pago neste período.", "-", "-", "-", "-", "-"]],
    foot: ordersBody.length > 0 ? (ordersFoot as any) : undefined,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 16, fontStyle: "bold" },
      1: { cellWidth: 45 },
      2: { cellWidth: 32 },
      3: { cellWidth: 32 },
      4: { cellWidth: 20, halign: "right" },
      5: { cellWidth: 18, halign: "right" },
      6: { cellWidth: 20, halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Ocultar a transação de Caixa Inicial da lista, pois ela é o saldo inicial
  const displayTransactions = transactions.filter(
    (tx) => !(tx.description === "Caixa Inicial" && tx.category === "Banco")
  );

  // 5. Tabela de Movimentações Manuais & Saídas de Caixa
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);

  doc.text(`4. Movimentações Manuais & Saídas de Caixa (${displayTransactions.length})`, margin, currentY);
  currentY += 4;

  let totalManualEntries = 0;
  let totalManualOutflows = 0;

  const txBody = displayTransactions.map((tx) => {
    const typeUpper = String(tx.type || "").toUpperCase();
    const isEntry = typeUpper === "ENTRY" || typeUpper === "ENTRADA" || typeUpper === "IN";
    const amountVal = parseNumber(tx.amount);

    if (isEntry) {
      totalManualEntries += amountVal;
    } else {
      totalManualOutflows += amountVal;
    }

    const txDateStr = tx.date || tx.createdAt
      ? format(new Date(tx.date || tx.createdAt!), "dd/MM/yyyy HH:mm")
      : "-";

    return [
      txDateStr,
      tx.description || "-",
      formatCategoryName(tx.category),
      isEntry ? "Entrada (+)" : "Saída (-)",
      `${isEntry ? "+" : "-"} ${formatCurrency(amountVal)}`,
    ];
  });

  const txFoot = [
    [
      { content: "RESUMO MOVIMENTAÇÕES", colSpan: 3, styles: { fontStyle: "bold", halign: "right" } },
      { content: `Entradas: ${formatCurrency(totalManualEntries)}`, styles: { fontStyle: "bold", textColor: [16, 185, 129] } },
      { content: `Saídas: ${formatCurrency(totalManualOutflows)}`, styles: { fontStyle: "bold", textColor: [225, 29, 72], halign: "right" } },
    ],
  ];

  autoTable(doc, {
    startY: currentY,
    head: [["Data/Hora", "Descrição", "Categoria", "Tipo", "Valor"]],
    body: txBody.length > 0 ? txBody : [["-", "Nenhuma movimentação manual neste caixa.", "-", "-", "-"]],
    foot: txBody.length > 0 ? (txFoot as any) : undefined,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [30, 41, 59],
      fontSize: 8.5,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 32 },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 24, fontStyle: "bold" },
      4: { cellWidth: 26, halign: "right", fontStyle: "bold" },
    },
    margin: { left: margin, right: margin },
  });

  // 6. Adicionar Rodapé de Páginas em Todas as Páginas
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400

    // Linha separadora do rodapé
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.text(`Relatório de Caixa - ${cashRegister.title || "Caixa"}`, margin, pageHeight - 5);
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: "right" });
  }

  // Nome sanitizado para o download
  const cleanTitle = (cashRegister.title || "Caixa").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Relatorio_Caixa_${cleanTitle}_${format(new Date(), "yyyy-MM-dd")}.pdf`;

  doc.save(fileName);
}
