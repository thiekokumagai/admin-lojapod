import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PageLoader } from "@/components/common/PageLoader";
import { comboService, type Combo } from "@/services/combo.service";
import { getCategories } from "@/services/category.service";
import { ComboListTable, type ComboListTableFilters } from "@/components/combo/ComboListTable";
import type { Category } from "@/types/category";

export default function CombosPage() {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkPending, setIsBulkPending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [searchParams, setSearchParams] = useSearchParams();

  const filters: ComboListTableFilters = {
    search: searchParams.get("search") || "",
    status: (searchParams.get("status") as any) || "all",
    categoryId: searchParams.get("categoryId") || "",
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadCombos();
  }, [filters.status, filters.categoryId, filters.search]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadCombos = async () => {
    try {
      setIsLoading(true);
      const data = await comboService.list({
        search: filters.search || undefined,
        isActive:
          filters.status === "active"
            ? "true"
            : filters.status === "inactive"
            ? "false"
            : undefined,
        categoryId: filters.categoryId || undefined,
      });

      // Filtro adicional no cliente se for esgotado
      const filtered =
        filters.status === "out_of_stock"
          ? data.filter((c) => (c.stock ?? 0) <= 0)
          : data;

      setCombos(filtered);
    } catch (err: any) {
      toast.error(err.message || "Erro ao carregar lista de combos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (next: ComboListTableFilters) => {
    const newParams = new URLSearchParams(searchParams);

    if (next.search) newParams.set("search", next.search);
    else newParams.delete("search");

    if (next.status && next.status !== "all") newParams.set("status", next.status);
    else newParams.delete("status");

    if (next.categoryId) newParams.set("categoryId", next.categoryId);
    else newParams.delete("categoryId");

    setSearchParams(newParams, { replace: true });
    setSelectedIds([]);
  };

  const handleBulkEnable = async (ids: string[]) => {
    try {
      setIsBulkPending(true);
      for (const id of ids) {
        const c = combos.find((item) => item.id === id);
        if (c && !c.isActive) {
          await comboService.toggleActive(id);
        }
      }
      toast.success("Combos ativados com sucesso!");
      setSelectedIds([]);
      loadCombos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao ativar combos.");
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleBulkDisable = async (ids: string[]) => {
    try {
      setIsBulkPending(true);
      for (const id of ids) {
        const c = combos.find((item) => item.id === id);
        if (c && c.isActive) {
          await comboService.toggleActive(id);
        }
      }
      toast.success("Combos desativados com sucesso!");
      setSelectedIds([]);
      loadCombos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao desativar combos.");
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    try {
      setIsBulkPending(true);
      for (const id of ids) {
        await comboService.delete(id);
      }
      toast.success("Combos excluídos com sucesso!");
      setSelectedIds([]);
      loadCombos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir combos.");
    } finally {
      setIsBulkPending(false);
    }
  };

  const handleDuplicate = async (combo: Combo) => {
    try {
      await comboService.duplicate(combo.id);
      toast.success("Combo duplicado com sucesso! Foi criado como inativo para revisão.");
      loadCombos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao duplicar combo.");
    }
  };

  const handleUpdatePrice = async (id: string, newPrice: number) => {
    try {
      const target = combos.find((c) => c.id === id);
      if (!target) return;
      await comboService.update(id, {
        name: target.name,
        price: newPrice,
      });
      toast.success("Preço do combo atualizado com sucesso!");
      loadCombos();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar preço do combo.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Combos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie os combos promocionais cadastrados, filtre e aplique ações em massa.
          </p>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link to="/combos/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo combo
          </Link>
        </Button>
      </div>

      <ComboListTable
        combos={combos}
        categories={categories}
        isLoading={isLoading}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkEnable={handleBulkEnable}
        onBulkDisable={handleBulkDisable}
        onBulkDelete={handleBulkDelete}
        isBulkPending={isBulkPending}
        onDuplicateCombo={handleDuplicate}
        onUpdateComboPrice={handleUpdatePrice}
      />
    </div>
  );
}
