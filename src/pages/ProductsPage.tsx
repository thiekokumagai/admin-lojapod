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
      : rawProducts.filter((p) => p.status === filters.status);

  const categories = categoriesQuery.data ?? [];
  const isPageLoading = categoriesQuery.loading;

  // ─── Inline Price Update ──────────────────────────────────────────────────
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, price, promotionalPrice, costPrice }: { id: string; price?: number; promotionalPrice?: number; costPrice?: number }) => {
      await updateProduct(id, { price, promotionalPrice, costPrice });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Preço atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao atualizar preço",
      });
    },
  });

  // ─── Inline Stock Update ──────────────────────────────────────────────────
  const updateStockMutation = useMutation({
    mutationFn: async ({ itemId, type, quantity }: { itemId: string; type: 'ADD' | 'SUBTRACT'; quantity: number }) => {
      await updateProductItem(itemId, { type, quantity, observation: 'Ajuste rápido' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Estoque atualizado com sucesso" });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: error.message || "Erro ao atualizar estoque",
      });
    },
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
          await updateProductMutation.mutateAsync({ id, ...values });
        }}
        onUpdateStock={async (itemId, type, quantity) => {
          await updateStockMutation.mutateAsync({ itemId, type, quantity });
        }}
        onDuplicateProduct={async (id) => {
          await duplicateProductMutation.mutateAsync(id);
        }}
      />
    </div>
  );
}