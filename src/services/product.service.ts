import { apiFetch } from "@/services/api";
import type {
  CreateProductItemPayload,
  CreateProductPayload,
  ProductItem,
  ProductListMeta,
  ProductListParams,
  ProductResponse,
  RemoveProductVariationOptionPayload,
  RemoveProductVariationPayload,
  UpdateProductItemPayload,
  StockMovement,
} from "@/types/product";

type ProductApiResponse = {
  id: string;
  title: string;
  categoryId: string;
  description?: string | null;
  descriptionFormated?: string | null;
  images?: Array<{
    id: string;
    url: string;
  }>;
  variations?: Array<{
    id: string;
    variationId: string;
    title?: string;
    variation?: {
      id: string;
      title: string;
      options?: Array<{
        id: string;
        value: string;
      }>;
    };
    options?: Array<{
      id: string;
      value: string;
    }>;
  }>;
  items?: unknown[];
  price?: string | null;
  promotionalPrice?: string | null;
  costPrice?: string | null;
  isVisible?: boolean;
};

type ProductItemApiResponse = {
  id: string;
  stock: number;
  options?: Array<{
    option: {
      id: string;
      value: string;
      variation?: {
        id: string;
        title: string;
      };
    };
  }>;
};

function normalizeProduct(item: ProductApiResponse): ProductResponse {
  const items = item.items as Array<{ id: string; stock: number; sku?: string; options?: unknown[] }> | undefined ?? [];
  const totalStock = items.reduce((acc, i) => acc + (i.stock ?? 0), 0);
  const firstWithSku = items.find((i) => i.sku);
  const primarySku: string | null = firstWithSku?.sku ?? null;
  const status: "active" | "inactive" = item.isVisible ? "active" : "inactive";

  return {
    id: item.id,
    title: item.title,
    categoryId: item.categoryId,
    description: item.description ?? "",
    descriptionFormated: item.descriptionFormated ?? "",
    images: (item.images ?? []).map((image) => ({
      id: image.id,
      url: image.url,
    })),
    variationIds: (item.variations ?? []).map((variation) => variation.variationId ?? variation.variation?.id ?? ""),
    variations: (item.variations ?? []).map((variation) => ({
      id: variation.id,
      variationId: variation.variationId ?? variation.variation?.id ?? "",
      title: variation.title ?? variation.variation?.title ?? "",
      options: (variation.options ?? variation.variation?.options ?? []).map((option) => ({
        id: option.id,
        value: option.value,
      })),
    })),
    itemsCount: item.items?.length ?? 0,
    price: item.price ? Number(item.price) : undefined,
    promotionalPrice: item.promotionalPrice ? Number(item.promotionalPrice) : undefined,
    costPrice: item.costPrice ? Number(item.costPrice) : undefined,
    activeOptionIds: (item.items ?? []).flatMap((i) => (i.options ?? []).map((o) => o.option.id)),
    totalStock,
    primarySku,
    status,
    items: (item.items as ProductItemApiResponse[] ?? []).map(normalizeProductItem),
  };
}

function normalizeProductItem(item: ProductItemApiResponse): ProductItem {
  return {
    id: item.id,
    stock: item.stock,
    options: (item.options ?? []).map((entry) => ({
      variationId: entry.option.variation?.id ?? "",
      variationTitle: entry.option.variation?.title,
      optionId: entry.option.id,
      optionValue: entry.option.value,
    })),
  };
}

export async function getProducts(
  params?: ProductListParams,
): Promise<{ products: ProductResponse[]; meta: ProductListMeta }> {
  const limit = params?.limit ?? 30;
  const page = params?.page ?? 1;
  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (params?.search) qs.set("search", params.search);
  if (params?.categoryId) qs.set("categoryId", params.categoryId);

  const response = await apiFetch(`/products?${qs.toString()}`);
  
  // Try to get total count from header
  const totalCountHeader = response.headers.get('x-total-count');
  const totalCount = totalCountHeader ? parseInt(totalCountHeader, 10) : 0;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / limit) : undefined;
  
  const data = (await response.json()) as ProductApiResponse[];
  const products = data.map(normalizeProduct);
  
  return {
    products,
    meta: { 
      page, 
      limit, 
      hasNextPage: totalPages !== undefined ? page < totalPages : products.length === limit,
      totalPages 
    },
  };
}

export async function createProduct(payload: CreateProductPayload): Promise<ProductResponse> {
  const response = await apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function getProductById(id: string): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${id}`);
  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch(`/products/${id}`, {
    method: "DELETE",
  });
}

export async function uploadProductImages(productId: string, files: File[]): Promise<ProductResponse> {
  const body = new FormData();
  files.forEach((file) => body.append("files", file));

  const response = await apiFetch(`/products/${productId}/images`, {
    method: "POST",
    body,
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function replaceProductImage(productId: string, imageId: string, file: File): Promise<ProductResponse> {
  const body = new FormData();
  body.append("file", file);

  const response = await apiFetch(`/products/${productId}/images/${imageId}`, {
    method: "PATCH",
    body,
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await apiFetch(`/products/${productId}/images/${imageId}`, {
    method: "DELETE",
  });
}

export async function linkProductVariations(productId: string, variationIds: string[]): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${productId}/variations`, {
    method: "POST",
    body: JSON.stringify({
      variationIds,
    }),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function removeProductVariation(productId: string, payload: RemoveProductVariationPayload): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${productId}/variations`, {
    method: "DELETE",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function removeProductVariationOption(
  productId: string,
  payload: RemoveProductVariationOptionPayload,
): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${productId}/variation-options`, {
    method: "DELETE",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function createProductItems(productId: string, items: CreateProductItemPayload[]): Promise<ProductItem[]> {
  const response = await apiFetch(`/products/${productId}/items`, {
    method: "POST",
    body: JSON.stringify({
      items,
    }),
  });

  const data = (await response.json()) as ProductItemApiResponse[];
  return data.map(normalizeProductItem);
}

export async function updateProductItemsCollection(productId: string, items: CreateProductItemPayload[]): Promise<ProductItem[]> {
  const response = await apiFetch(`/products/${productId}/items`, {
    method: "PATCH",
    body: JSON.stringify({
      items,
    }),
  });

  const data = (await response.json()) as ProductItemApiResponse[];
  return data.map(normalizeProductItem);
}

export async function getProductItems(productId: string): Promise<ProductItem[]> {
  try {
    const response = await apiFetch(`/products/${productId}/items`);
    const data = (await response.json()) as ProductItemApiResponse[];
    return data.map(normalizeProductItem);
  } catch (error: any) {
    if (error.message?.includes("404")) {
      return [];
    }
    throw error;
  }
}

export async function updateProductItem(itemId: string, payload: UpdateProductItemPayload): Promise<ProductItem> {
  const response = await apiFetch(`/products/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductItemApiResponse;
  return normalizeProductItem(data);
}

export async function updateProductItemsBatch(
  items: { itemId: string; payload: UpdateProductItemPayload }[]
) {
  return Promise.all(items.map((item) => updateProductItem(item.itemId, item.payload)));
}

export async function getProductStockHistory(productId: string): Promise<StockMovement[]> {
  const response = await apiFetch(`/products/${productId}/stock-history`);
  return await response.json();
}
export async function updateProduct(
  id: string,
  payload: Partial<CreateProductPayload>
): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}

export async function duplicateProduct(id: string): Promise<ProductResponse> {
  const response = await apiFetch(`/products/${id}/duplicate`, {
    method: "POST",
  });

  const data = (await response.json()) as ProductApiResponse;
  return normalizeProduct(data);
}