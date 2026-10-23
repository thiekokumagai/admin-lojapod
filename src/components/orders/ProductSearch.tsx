import { useState, useEffect } from "react";
import { Search, Loader2, Plus, Boxes } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { comboService, type Combo } from "@/services/combo.service";
import type { ProductResponse } from "@/types/product";
import { buildImageUrl } from "@/utils/image-url";

interface ProductSearchProps {
  onSelectProduct: (product: ProductResponse) => void;
  onSelectCombo?: (combo: Combo) => void;
}

export function ProductSearch({ onSelectProduct, onSelectCombo }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [combos, setCombos] = useState<Combo[]>([]);
  const [isLoadingCombos, setIsLoadingCombos] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading: isLoadingProducts } = useProducts(debouncedTerm ? { search: debouncedTerm, limit: 50 } : undefined);
  const products = (data?.products || []).filter(p => p.status === 'active' && p.totalStock > 0);

  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setCombos([]);
      setIsLoadingCombos(false);
      return;
    }

    let isMounted = true;
    setIsLoadingCombos(true);

    comboService.list({ search: debouncedTerm.trim(), isActive: "true" })
      .then((res) => {
        if (isMounted) {
          setCombos(res.filter(c => c.isActive && (c.stock === undefined || c.stock > 0)));
        }
      })
      .catch((err) => {
        console.warn("Erro ao buscar combos no pedido manual:", err);
        if (isMounted) setCombos([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingCombos(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedTerm]);

  const isLoading = isLoadingProducts || isLoadingCombos;
  const hasResults = products.length > 0 || combos.length > 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar produto ou combo por nome..." 
          className="pl-9 h-11"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
      </div>

      {isOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-72 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : hasResults ? (
            <div className="py-1 divide-y divide-slate-100">
              {/* Seção de Combos */}
              {combos.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-[11px] font-bold text-indigo-700 bg-indigo-50/70 uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-indigo-600" /> Combos ({combos.length})
                  </div>
                  {combos.map((combo) => (
                    <div
                      key={`combo-${combo.id}`}
                      className="flex items-center justify-between p-3 hover:bg-indigo-50/40 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                      onClick={() => {
                        if (onSelectCombo) {
                          onSelectCombo(combo);
                        } else {
                          onSelectProduct({
                            id: combo.id,
                            title: combo.name,
                            price: Number(combo.price),
                            promotionalPrice: combo.originalPrice > Number(combo.price) ? Number(combo.price) : 0,
                            totalStock: combo.stock ?? 999,
                            status: "active",
                            images: combo.imageUrl ? [{ id: "1", url: combo.imageUrl, isMain: true }] : [],
                            items: [],
                            variations: [],
                          } as any);
                        }
                        setSearchTerm("");
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        {combo.imageUrl ? (
                          <img src={buildImageUrl(combo.imageUrl)} alt={combo.name} className="w-10 h-10 rounded-md object-cover border shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
                            <Boxes className="w-5 h-5 text-indigo-500" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-800 text-sm truncate">{combo.name}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                              Combo
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Estoque: {combo.stock ?? "Disponível"}
                            {combo.items?.length > 0 && ` • ${combo.items.length} produto(s)`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-indigo-700 text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(combo.price) || 0)}
                        </span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-indigo-600 hover:bg-indigo-100/60 hover:text-indigo-700">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Seção de Produtos */}
              {products.length > 0 && (
                <div>
                  {combos.length > 0 && (
                    <div className="px-3 py-1.5 text-[11px] font-bold text-slate-500 bg-slate-50 uppercase tracking-wider">
                      Produtos ({products.length})
                    </div>
                  )}
                  {products.map(product => (
                    <div 
                      key={product.id}
                      className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors"
                      onClick={() => {
                        onSelectProduct(product);
                        setSearchTerm("");
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        {product.images && product.images.length > 0 ? (
                          <img src={buildImageUrl(product.images[0].url)} alt={product.title} className="w-10 h-10 rounded-md object-cover border shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-xs text-slate-400">Sem img</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-800 text-sm truncate">{product.title}</div>
                          <div className="text-xs text-slate-500">Estoque: {product.totalStock}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-700 text-sm">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.promotionalPrice || product.price || 0)}
                        </span>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-violet-600 hover:bg-violet-50 hover:text-violet-700">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              Nenhum produto ou combo encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
