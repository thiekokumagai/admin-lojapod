// Exportação em CSV pensada para abrir direto no Excel em português:
// separador ";", vírgula decimal e BOM UTF-8 (para os acentos não quebrarem).

export type CsvCell = string | number | null | undefined;

function escapeCell(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  const text = typeof cell === "number" ? String(cell).replace(".", ",") : cell;
  // Planilha interpreta "=", "+", "-" e "@" no começo como fórmula: neutraliza texto vindo do usuário
  const safe = typeof cell === "string" && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[";\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(";"));
  return `﻿${lines.join("\r\n")}`;
}

export function downloadCsv(filename: string, headers: string[], rows: CsvCell[][]) {
  const blob = new Blob([buildCsv(headers, rows)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
