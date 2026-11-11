import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useInfiniteProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductListTable, ProductListTableFilters } from "@/components/products/ProductListTable";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { PageLoader } from "@/components/common/PageLoader";
import {
  deleteProduct,
  getProductItems,
  updateProductItem,
  updateProduct,
  duplicateProduct,
} from "@/services/product.service";

const PRODUCT_INLINE_MUTATION_KEY = ["products", "inline-update"] as const;

// Aplica uma transformação em cada produto de qualquer formato de cache de produtos
function patchProductsCache(data: any, fn: (product: any) => any): any {
  if (!data) return data;
  const patchList = (list: any[]) => list.map((p) => (p && typeof p === "object" ? fn(p) : p));
  // Páginas da API vêm como { products, meta } (ou { data, meta } em outros endpoints)
  const patchPage = (pg: any) => {
    if (!pg || typeof pg !== "object") return pg;
    if (Array.isArray(pg.products)) return { ...pg, products: patchList(pg.products) };
    if (Array.isArray(pg.data)) return { ...pg, data: patchList(pg.data) };
    return pg;
  };
  if (Array.isArray(data.pages)) {
    return { ...data, pages: data.pages.map(patchPage) };
  }
  if (Array.isArray(data)) return patchList(data);
  if (Array.isArray(data.products) || Array.isArray(data.data)) return patchPage(data);
  if (typeof data === "object" && "id" in data) return fn(data);
  return data;
}

const PAGE_SIZE = 100;

export default function ProductsPage() {
  const queryClient = useQueryClient();

  const [searchParams, setSearchParams] = useSearchParams();

  // Pagination & filter state from URL
  const filters: ProductListTableFilters = {
    search: searchParams.get("search") || "",
    status: (searchParams.get("status") as any) || "active",
    categoryId: searchParams.get("categoryId") || "",
  };

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Reset page when filters change
  const handleFiltersChange = (next: ProductListTableFilters) => {
    const newParams = new URLSearchParams(searchParams);
    
    if (next.search) newParams.set("search", next.search);
    else newParams.delete("search");

    if (next.status && next.status !== "active") newParams.set("status", next.status);
    else newParams.delete("status");

    if (next.categoryId) newParams.set("categoryId", next.categoryId);
    else newParams.delete("categoryId");

    setSearchParams(newParams, { replace: true });
    setSelectedIds([]);
  };

  const productsQuery = useInfiniteProducts({
    limit: PAGE_SIZE,
    search: filters.search || undefined,
    categoryId: filters.categoryId || undefined,
  });
  const categoriesQuery = useCategories();

  const rawProducts = productsQuery.data?.pages.flatMap((p) => p.products || []) ?? [];
  const meta = productsQuery.data?.pages[0]?.meta;

  // Client-side status filter (API doesn't support it yet)
  const products =
    filters.status === "all"
      ? rawProducts
      : rawProducts.filter((p) => {
          if (filters.status === "active") return p.status === "active";
          if (filters.status === "inactive") return p.status === "inactive";
          if (filters.status === "featured") return Boolean(p.isFeatured);
          if (filters.status === "critical") {
            return (p.coverageDays !== null && p.coverageDays !== undefined && p.coverageDays <= 3 && p.totalStock > 0);
          }
          if (filters.status === "low_stock") {
            const dailyRunRate = p.dailyRunRate ?? 0;
            const min = p.minStock ?? Math.max(3, Math.ceil(dailyRunRate * 7));
            const isCritical = (p.coverageDays !== null && p.coverageDays !== undefined && p.coverageDays <= 3 && p.totalStock > 0);
            return p.totalStock > 0 && p.totalStock <= min && !isCritical;
          }
          if (filters.status === "stagnant") {
            return (p.daysWithoutSales ?? 0) >= 45 && p.totalStock > 0;
          }
          if (filters.status === "out_of_stock") {
            return p.totalStock === 0;
          }
          return p.status === filters.status;
        });

  const categories = categoriesQuery.data ?? [];
  const isPageLoading = categoriesQuery.loading;

  // ─── Helpers de atualização otimista ──────────────────────────────────────
  const restoreSnapshot = (snapshot?: Array<[readonly unknown[], unknown]>) => {
    snapshot?.forEach(([key, data]) => queryClient.setQueryData(key, data));
  };

  // Só revalida quando não houver outras alterações pendentes, para um refetch
  // não "desfazer" visualmente cliques que ainda estão sendo salvos
  const revalidateProductsWhenIdle = () => {
    if (queryClient.isMutating({ mutationKey: PRODUCT_INLINE_MUTATION_KEY }) <= 1) {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  };

  // ─── Inline Price Update ──────────────────────────────────────────────────
  const updateProductMutation = useMutation({
    mutationKey: PRODUCT_INLINE_MUTATION_KEY,
    mutationFn: async ({ id, price, promotionalPrice, costPrice }: { id: string; price?: number; promotionalPrice?: number; costPrice?: number }) => {
      await updateProduct(id, { price, promotionalPrice, costPrice });
    },
    // Atualização otimista: o preço muda na tela na hora e a API roda em segundo plano
    onMutate: async ({ id, ...values }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["products"] });
      const changes = Object.fromEntries(
        Object.entries(values).filter(([, v]) => v !== undefined)
      );
      queryClient.setQueriesData({ queryKey: ["products"] }, (old: any) =>
        patchProductsCache(old, (p) => (p.id === id ? { ...p, ...changes } : p))
      );
      return { snapshot };
    },
    onSuccess: () => {
      toast({ title: "Preço atualizado com sucesso" });
    },
    onError: (error: Error, _vars, context) => {
      restoreSnapshot(context?.snapshot);
      toast({
        variant: "destructive",
        title: error.message || "Erro ao atualizar preço",
      });
    },
    onSettled: revalidateProductsWhenIdle,
  });

  // ─── Inline Stock Update ──────────────────────────────────────────────────
  const updateStockMutation = useMutation({
    mutationKey: PRODUCT_INLINE_MUTATION_KEY,
    mutationFn: async ({ itemId, type, quantity }: { itemId: string; type: 'ADD' | 'SUBTRACT'; quantity: number }) => {
      await updateProductItem(itemId, { type, quantity, observation: 'Ajuste rápido' });
    },
    // Atualização otimista: a quantidade muda na tela na hora e a API roda em segundo plano
    onMutate: async ({ itemId, type, quantity }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["products"] });
      const delta = type === 'ADD' ? quantity : -quantity;
      queryClient.setQueriesData({ queryKey: ["products"] }, (old: any) =>
        patchProductsCache(old, (p) => {
          if (!Array.isArray(p.items) || !p.items.some((it: any) => it?.id === itemId)) return p;
          return {
            ...p,
            items: p.items.map((it: any) =>
              it?.id === itemId ? { ...it, stock: Math.max(0, (it.stock ?? 0) + delta) } : it
            ),
            ...(typeof p.totalStock === "number" ? { totalStock: Math.max(0, p.totalStock + delta) } : {}),
          };
        })
      );
      return { snapshot };
    },
    onError: (error: Error, _vars, context) => {
      restoreSnapshot(context?.snapshot);
      toast({
        variant: "destructive",
        title: error.message || "Erro ao atualizar estoque",
      });
    },
    onSettled: revalidateProductsWhenIdle,
  });

  // ─── Duplicate Product ────────────────────────────────────────────────────
  const duplicateProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await duplicateProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto duplicado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao duplicar produto",
      });
    },
  });

  // ─── Bulk Delete ───────────────────────────────────────────────────────────
  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await deleteProduct(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
      toast({ title: "Produtos excluídos com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao excluir produtos",
      });
    },
  });

  // ─── Bulk Disable (atualiza isVisible) ─────────────────────────
  const bulkDisableMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const productId of ids) {
        await updateProduct(productId, { isVisible: false });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
      toast({ title: "Produtos desativados" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao desativar produtos",
      });
    },
  });

  // ─── Bulk Enable (atualiza isVisible) ────────────────────────────
  const bulkEnableMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const productId of ids) {
        await updateProduct(productId, { isVisible: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelectedIds([]);
      toast({ title: "Produtos ativados" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao ativar produtos",
      });
    },
  });

  const isBulkPending =
    bulkDeleteMutation.isPending ||
    bulkDisableMutation.isPending ||
    bulkEnableMutation.isPending;

  if (isPageLoading && !productsQuery.data) {
    return <PageLoader message="Carregando produtos..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produtos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os produtos cadastrados, filtre e aplique ações em massa.
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link to="/produtos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo produto
          </Link>
        </Button>
      </div>

      <ProductListTable
        products={products}
        categories={categories}
        isLoading={productsQuery.isLoading}
        hasNextPage={productsQuery.hasNextPage}
        isFetchingNextPage={productsQuery.isFetchingNextPage}
        onLoadMore={() => productsQuery.fetchNextPage()}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={(ids) => bulkDeleteMutation.mutate(ids)}
        onBulkDisable={(ids) => bulkDisableMutation.mutate(ids)}
        onBulkEnable={(ids) => bulkEnableMutation.mutate(ids)}
        isBulkPending={isBulkPending}
        onUpdateProduct={async (id, values) => {
          // Não aguarda a API: o cache já foi atualizado de forma otimista
          updateProductMutation.mutate({ id, ...values });
        }}
        onUpdateStock={async (itemId, type, quantity) => {
          updateStockMutation.mutate({ itemId, type, quantity });
        }}
        onDuplicateProduct={async (id) => {
          await duplicateProductMutation.mutateAsync(id);
        }}
      />
    </div>
  );
}