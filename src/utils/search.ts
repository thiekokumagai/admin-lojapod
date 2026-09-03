export function normalizeSearchText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function matchesProductSearch(
  searchTerm: string,
  product: { title?: string; description?: string; categoryId?: string; [key: string]: any }
): boolean {
  const trimmed = searchTerm.trim();
  if (!trimmed) return true;

  const searchWords = normalizeSearchText(trimmed)
    .split(/\s+/)
    .filter(Boolean);

  if (searchWords.length === 0) return true;

  const searchableText = `${product.title || ""} ${product.description || ""}`;
  const normalizedSearchable = normalizeSearchText(searchableText);

  return searchWords.every((word) => normalizedSearchable.includes(word));
}
