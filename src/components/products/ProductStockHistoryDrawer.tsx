import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerTrigger } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { History, Plus, Minus, Equal } from "lucide-react";
import { getProductStockHistory } from "@/services/product.service";
import type { StockMovement } from "@/types/product";
import { PageLoader } from "@/components/common/PageLoader";

export function ProductStockHistoryDrawer({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && productId) {
      setLoading(true);
      getProductStockHistory(productId)
        .then(setHistory)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [open, productId]);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl flex gap-2 items-center">
          <History className="h-4 w-4" />
          Histórico
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Histórico de Estoque</DrawerTitle>
          <DrawerDescription>
            Veja todas as entradas, saídas e ajustes de estoque deste produto.
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 overflow-y-auto">
          {loading ? (
            <PageLoader message="Carregando histórico..." />
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm p-4">Nenhuma movimentação registrada.</p>
          ) : (
            <div className="space-y-4">
              {history.map((movement) => {
                const isAdd = movement.type === "ADD";
                const isSub = movement.type === "SUBTRACT";
                const isSet = movement.type === "SET";
                
                const itemName = movement.productItem?.options?.map((o: any) => o.optionValue || o.option?.value).join(" / ") || "Item Padrão";

                return (
                  <div key={movement.id} className="flex gap-4 p-4 border rounded-xl bg-muted/50 items-start">
                    <div className={`p-2 rounded-full mt-1 ${isAdd ? 'bg-green-100 text-green-700' : isSub ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isAdd && <Plus className="w-4 h-4" />}
                      {isSub && <Minus className="w-4 h-4" />}
                      {isSet && <Equal className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-sm">
                          {isAdd && "Entrada"}
                          {isSub && "Saída"}
                          {isSet && "Substituição"}
                          <span className="font-bold ml-1">
                            {isSet ? movement.quantity : `${isAdd ? '+' : '-'}${movement.quantity}`}
                          </span>
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(movement.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-xs font-semibold">{itemName}</p>
                      <p className="text-xs text-muted-foreground">
                        Saldo anterior: {movement.previousStock} &rarr; Novo saldo: {movement.newStock}
                      </p>
                      {movement.observation && (
                        <p className="text-xs text-muted-foreground mt-2 italic bg-background p-2 rounded-md">
                          "{movement.observation}"
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
