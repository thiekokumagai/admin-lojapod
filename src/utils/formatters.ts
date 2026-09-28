export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatPhone = (value: string | null | undefined) => {
  if (!value) return "";
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) {
    return `(${digits}`;
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export interface ProfitCalculation {
  profit: number;
  marginPercentage: number;
  markupPercentage: number;
  isPositive: boolean;
  isNegative: boolean;
  hasProfitInfo: boolean;
}

export const calculateProfitMargin = (
  price?: number | null,
  costPrice?: number | null
): ProfitCalculation => {
  const p = price ?? 0;
  const c = costPrice ?? 0;

  const hasProfitInfo = p > 0 && c > 0;
  const profit = p - c;
  const marginPercentage = p > 0 ? (profit / p) * 100 : 0;
  const markupPercentage = c > 0 ? (profit / c) * 100 : 0;

  return {
    profit,
    marginPercentage,
    markupPercentage,
    isPositive: profit > 0,
    isNegative: profit < 0,
    hasProfitInfo,
  };
};
