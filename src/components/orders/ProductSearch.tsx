import { useState, useEffect } from "react";
import { Search, Loader2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import type { ProductResponse } from "@/types/product";

import { buildImageUrl } from "@/utils/image-url";

interface ProductSearchProps {
  onSelectProduct: (product: ProductResponse) => void;
}

export function ProductSearch({ onSelectProduct }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data, isLoading } = useProducts(debouncedTerm ? { search: debouncedTerm, limit: 50 } : undefined);
  const products = (data?.products || []).filter(p => p.status === 'active' && p.totalStock > 0);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Buscar produto por nome..." 
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
        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : products.length > 0 ? (
            <div className="py-1">
              {products.map(product => (
                <div 
                  key={product.id}
                  className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0"
                  onClick={() => {
                    onSelectProduct(product);
                    setSearchTerm("");
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {product.images && product.images.length > 0 ? (
                      <img src={buildImageUrl(product.images[0].url)} alt={product.title} className="w-10 h-10 rounded-md object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center">
                        <span className="text-xs text-slate-400">Sem img</span>
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-slate-800 text-sm">{product.title}</div>
                      <div className="text-xs text-slate-500">Estoque: {product.totalStock}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
          ) : (
            <div className="p-4 text-center text-sm text-slate-500">
              Nenhum produto encontrado.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
