import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Plus, Trash2, ArrowUp, ArrowDown, ExternalLink, CheckCircle2, Layers } from "lucide-react";
import { compositionService } from "@/services/composition.service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import type { CompositionGroup, AttachProductCompositionItem } from "@/types/composition";

interface ProductCompositionManagerProps {
  productId: string;
}

interface LocalAttachedGroup {
  groupId: string;
  sortOrder: number;
  customMinQuantity?: number | null;
  customMaxQuantity?: number | null;
  customFreeQuantity?: number | null;
}

export function ProductCompositionManager({ productId }: ProductCompositionManagerProps) {
  const queryClient = useQueryClient();

  const { data: allGroups = [], isLoading: loadingGroups } = useQuery({
    queryKey: ["composition-groups"],
    queryFn: () => compositionService.listGroups(),
  });

  const { data: productCompositions, isLoading: loadingProductCompositions } = useQuery({
    queryKey: ["product-compositions", productId],
    queryFn: () => compositionService.getProductCompositions(productId),
    enabled: !!productId,
  });

  const [attached, setAttached] = useState<LocalAttachedGroup[]>([]);

  useEffect(() => {
    if (productCompositions) {
      const seen = new Set<string>();
      const uniqueCompositions = productCompositions.filter((pc) => {
        if (!pc.groupId || seen.has(pc.groupId)) return false;
        seen.add(pc.groupId);
        return true;
      });
      setAttached(
        uniqueCompositions.map((pc, idx) => ({
          groupId: pc.groupId,
          sortOrder: pc.sortOrder ?? idx,
          customMinQuantity: pc.customMinQuantity,
          customMaxQuantity: pc.customMaxQuantity,
          customFreeQuantity: pc.customFreeQuantity,
        })),
      );
    }
  }, [productCompositions]);

  const saveMutation = useMutation({
    mutationFn: (items: AttachProductCompositionItem[]) =>
      compositionService.attachProductCompositions(productId, { groups: items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-compositions", productId] });
      toast({ title: "Etapas de montagem salvas com sucesso!" });
    },
    onError: (err: any) => {
      toast({ variant: "destructive", title: "Erro ao salvar etapas", description: err.message });
    },
  });

  const isGroupAttached = (groupId: string) => attached.some((a) => a.groupId === groupId);

  const toggleGroup = (group: CompositionGroup) => {
    setAttached((prev) => {
      if (prev.some((a) => a.groupId === group.id)) {
        return prev.filter((a) => a.groupId !== group.id);
      }
      return [
        ...prev,
        {
          groupId: group.id,
          sortOrder: prev.length,
          customMinQuantity: null,
          customMaxQuantity: null,
          customFreeQuantity: null,
        },
      ];
    });
  };

  const updateItem = (groupId: string, field: keyof LocalAttachedGroup, value: any) => {
    setAttached((prev) =>
      prev.map((item) => (item.groupId === groupId ? { ...item, [field]: value } : item)),
    );
  };

  const moveItem = (index: number, direction: "up" | "down") => {
    const newAttached = [...attached];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newAttached.length) return;

    const temp = newAttached[index];
    newAttached[index] = newAttached[targetIdx];
    newAttached[targetIdx] = temp;

    // Atualiza sortOrder
    newAttached.forEach((item, i) => {
      item.sortOrder = i;
    });

    setAttached(newAttached);
  };

  const handleSave = () => {
    const seen = new Set<string>();
    const uniqueAttached = attached.filter((item) => {
      if (!item.groupId || seen.has(item.groupId)) return false;
      seen.add(item.groupId);
      return true;
    });

    const payload: AttachProductCompositionItem[] = uniqueAttached.map((item, idx) => ({
      groupId: item.groupId,
      sortOrder: idx,
      customMinQuantity:
        item.customMinQuantity !== undefined &&
        item.customMinQuantity !== null &&
        item.customMinQuantity !== ("" as any)
          ? Math.max(0, Number(item.customMinQuantity))
          : null,
      customMaxQuantity:
        item.customMaxQuantity !== undefined &&
        item.customMaxQuantity !== null &&
        item.customMaxQuantity !== ("" as any)
          ? Math.max(1, Number(item.customMaxQuantity))
          : null,
      customFreeQuantity:
        item.customFreeQuantity !== undefined &&
        item.customFreeQuantity !== null &&
        item.customFreeQuantity !== ("" as any)
          ? Math.max(0, Number(item.customFreeQuantity))
          : null,
    }));

    saveMutation.mutate(payload);
  };

  if (loadingGroups || loadingProductCompositions) {
    return <div className="p-8 text-center text-muted-foreground">Carregando grupos de montagem...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Etapas de Montagem Vinculadas
            </CardTitle>
            <CardDescription>
              Configure quais grupos de complementos/ingredientes o cliente deve ou pode selecionar para este produto.
            </CardDescription>
          </div>
          <Button asChild variant="outline" size="sm" className="rounded-xl gap-1">
            <Link to="/composicoes" target="_blank">
              Biblioteca de Grupos <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {allGroups.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-8 text-center space-y-3">
              <p className="text-muted-foreground">Nenhum grupo de montagem cadastrado na loja.</p>
              <Button asChild size="sm" className="rounded-xl">
                <Link to="/composicoes">Criar Primeiro Grupo</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <Label className="text-sm font-semibold">Grupos Disponíveis na Loja</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allGroups.map((group) => {
                    const attachedToProduct = isGroupAttached(group.id);
                    return (
                      <div
                        key={group.id}
                        onClick={() => toggleGroup(group)}
                        className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          attachedToProduct
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-border hover:border-muted-foreground/30 bg-background"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-sm truncate">{group.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {group.options?.length || 0} opções • Min {group.minQuantity} / Max {group.maxQuantity}
                          </p>
                        </div>
                        <Switch
                          checked={attachedToProduct}
                          onClick={(e) => e.stopPropagation()}
                          onCheckedChange={() => toggleGroup(group)}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {attached.length > 0 && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base font-semibold">Ordem e Limites Específicos para este Produto</Label>
                      <p className="text-xs text-muted-foreground">
                        Defina a ordem em que as etapas aparecerão para o cliente e sobrescreva os limites padrão se desejar.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {attached.map((item, index) => {
                      const group = allGroups.find((g) => g.id === item.groupId);
                      if (!group) return null;

                      return (
                        <div
                          key={item.groupId}
                          className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl border bg-background gap-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3 min-w-[200px]">
                            <div className="flex flex-col gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={index === 0}
                                onClick={() => moveItem(index, "up")}
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                disabled={index === attached.length - 1}
                                onClick={() => moveItem(index, "down")}
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs font-mono">
                                  Etapa {index + 1}
                                </Badge>
                                <span className="font-semibold text-sm">{group.name}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                Padrão do grupo: Min {group.minQuantity} | Max {group.maxQuantity} | Grátis {group.freeQuantity}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <Label className="text-xs whitespace-nowrap">Mínimo:</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="tel"
                                placeholder={String(group.minQuantity)}
                                value={item.customMinQuantity ?? ""}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, "");
                                  updateItem(
                                    item.groupId,
                                    "customMinQuantity",
                                    digits === "" ? null : parseInt(digits, 10),
                                  );
                                }}
                                className="h-8 w-20 text-center rounded-xl"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Label className="text-xs whitespace-nowrap">Máximo:</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="tel"
                                placeholder={String(group.maxQuantity)}
                                value={item.customMaxQuantity ?? ""}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, "");
                                  if (digits === "") {
                                    updateItem(item.groupId, "customMaxQuantity", null);
                                    return;
                                  }
                                  const parsed = parseInt(digits, 10);
                                  updateItem(
                                    item.groupId,
                                    "customMaxQuantity",
                                    parsed > 0 ? parsed : null,
                                  );
                                }}
                                className="h-8 w-20 text-center rounded-xl"
                              />
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Label className="text-xs whitespace-nowrap">Qtd Grátis:</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                autoComplete="tel"
                                placeholder={String(group.freeQuantity)}
                                value={item.customFreeQuantity ?? ""}
                                onChange={(e) => {
                                  const digits = e.target.value.replace(/\D/g, "");
                                  updateItem(
                                    item.groupId,
                                    "customFreeQuantity",
                                    digits === "" ? null : parseInt(digits, 10),
                                  );
                                }}
                                className="h-8 w-20 text-center rounded-xl"
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                              onClick={() => toggleGroup(group)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={handleSave}
                      disabled={saveMutation.isPending}
                      className="rounded-2xl px-6 font-semibold shadow-md"
                    >
                      {saveMutation.isPending ? "Salvando..." : "Salvar Etapas do Produto"}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
