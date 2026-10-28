import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Search,
  ListPlus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Layers3,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { useVariations } from "@/hooks/useVariations";
import {
  createVariation,
  deleteVariation,
  updateVariation,
  updateVariationOrderBatch,
} from "@/services/variation.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { PageLoader } from "@/components/common/PageLoader";
import { cn } from "@/lib/utils";
import type { VariationFormValues } from "@/types/variation";

type OptionItem = {
  id?: string;
  value?: string;
};

const variationSchema = z.object({
  title: z.string().min(1, "Informe o nome da variação."),
  options: z
    .array(
      z.object({
        id: z.string().optional(),
        value: z.string().min(1, "A opção não pode ficar vazia."),
      }),
    )
    .min(1, "Adicione pelo menos uma opção."),
});

type VariationFormSchema = z.infer<typeof variationSchema>;

const defaultValues: VariationFormSchema = {
  title: "",
  options: [{ value: "" }],
};

export default function VariationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewVariation = id === "nova";

  const variationsQuery = useVariations();
  const [loaded, setLoaded] = useState(false);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);
  const isSavingOrderRef = useRef(false);

  // UX Tools state
  const [quickAddValue, setQuickAddValue] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const form = useForm<VariationFormSchema>({
    resolver: zodResolver(variationSchema),
    defaultValues,
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control: form.control,
    name: "options",
  });

  useEffect(() => {
    if (isNewVariation) {
      form.reset(defaultValues);
      replace(defaultValues.options);
      setLoaded(true);
      return;
    }

    const variation = (variationsQuery.data ?? []).find((item) => item.id === id);

    if (variation) {
      form.reset({
        title: variation.title,
        options:
          variation.options.length > 0
            ? variation.options.map((option) => ({ id: option.id, value: option.value }))
            : [{ value: "" }],
      });
      setLoaded(true);
    }
  }, [form, id, isNewVariation, replace, variationsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (values: VariationFormSchema) => {
      const payload: VariationFormValues = {
        title: values.title,
        options: values.options.map((option) => ({
          ...(option.id ? { id: option.id } : {}),
          value: option.value.trim(),
        })),
      };

      if (isNewVariation) {
        return createVariation(payload);
      }

      return updateVariation(id!, payload);
    },
    onSuccess: (variation) => {
      queryClient.invalidateQueries({ queryKey: ["variations"] });
      toast({ title: isNewVariation ? "Variação criada com sucesso" : "Variação atualizada com sucesso" });

      if (isNewVariation) {
        navigate(`/variacoes/${variation.id}`, { replace: true });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível salvar a variação",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVariation(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["variations"] });
      toast({ title: "Variação removida com sucesso" });
      navigate("/variacoes", { replace: true });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Não foi possível remover a variação",
      });
    },
  });

  const saveOrder = async (options: OptionItem[]) => {
    if (isSavingOrderRef.current || isNewVariation) return;

    isSavingOrderRef.current = true;
    setIsSavingOrder(true);

    try {
      await updateVariationOrderBatch(
        options
          .filter((item) => item.id)
          .map((item, index) => ({
            id: item.id!,
            order: index + 1,
          })),
      );
    } finally {
      isSavingOrderRef.current = false;
      setIsSavingOrder(false);
    }
  };

  const triggerAutoSaveOrder = (optionsToSave?: OptionItem[]) => {
    if (isNewVariation) return;
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveOrder(optionsToSave ?? form.getValues("options"));
    }, 350);
  };

  const handleReorder = (fromId: string, toId: string) => {
    const fromIndex = fields.findIndex((item) => item.id === fromId);
    const toIndex = fields.findIndex((item) => item.id === toId);

    if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

    move(fromIndex, toIndex);
    triggerAutoSaveOrder();
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    move(index, index - 1);
    triggerAutoSaveOrder();
  };

  const handleMoveDown = (index: number) => {
    if (index >= fields.length - 1) return;
    move(index, index + 1);
    triggerAutoSaveOrder();
  };

  const handleSortAlphabetically = () => {
    const currentOptions = form.getValues("options");
    const sorted = [...currentOptions].sort((a, b) =>
      (a.value || "").localeCompare(b.value || "", "pt-BR", { sensitivity: "base" }),
    );
    replace(sorted);
    triggerAutoSaveOrder(sorted);
    toast({ title: "Opções ordenadas alfabeticamente (A-Z)" });
  };

  const handleQuickAdd = () => {
    const trimmed = quickAddValue.trim();
    if (!trimmed) return;
    append({ value: trimmed });
    setQuickAddValue("");
  };

  const handleBulkAdd = () => {
    if (!bulkText.trim()) return;
    const items = bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (items.length === 0) return;

    items.forEach((item) => {
      append({ value: item });
    });

    toast({
      title: `${items.length} ${items.length === 1 ? "opção adicionada" : "opções adicionadas"} com sucesso!`,
    });

    setBulkText("");
    setIsBulkOpen(false);
  };

  // Watch form options to filter in real-time
  const watchedOptions = form.watch("options");

  const filteredFieldsWithIndex = useMemo(() => {
    const list = fields.map((field, originalIndex) => ({
      field,
      originalIndex,
      currentValue: watchedOptions?.[originalIndex]?.value ?? "",
    }));

    if (!searchFilter.trim()) return list;

    const term = searchFilter.toLowerCase().trim();
    return list.filter((item) => item.currentValue.toLowerCase().includes(term));
  }, [fields, watchedOptions, searchFilter]);

  const bulkParsedCount = useMemo(() => {
    return bulkText
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0).length;
  }, [bulkText]);

  if (!loaded && !isNewVariation) {
    return <PageLoader message="Carregando variação..." />;
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto px-1 sm:px-4 pb-28 sm:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <Button
            asChild
            variant="ghost"
            className="mb-1 -ml-2.5 h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <Link to="/variacoes">
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Voltar para variações
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              {isNewVariation ? "Nova variação" : form.watch("title") || "Variação"}
            </h1>
            <Badge variant="secondary" className="font-medium text-xs">
              {fields.length} {fields.length === 1 ? "opção" : "opções"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Crie ou edite o nome da variação e suas opções em uma tela unificada.
          </p>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden sm:flex items-center gap-2">
          {!isNewVariation && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </Button>
          )}

          <Button
            type="button"
            onClick={form.handleSubmit((values) => saveMutation.mutate(values))}
            disabled={saveMutation.isPending}
            className="gap-2 shadow-sm"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            {isNewVariation ? "Criar variação" : "Salvar alterações"}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))} className="space-y-4 sm:space-y-6">
          {/* Card: Dados Básicos */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-4">
              <div className="flex items-center gap-2">
                <Layers3 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <CardTitle className="text-sm sm:text-base font-semibold">Dados da Variação</CardTitle>
              </div>
              <CardDescription className="text-xs sm:text-sm">
                Defina o nome principal desta característica (ex: Sabor, Nicotina, Cor).
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-2 sm:pt-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel className="text-xs sm:text-sm font-medium">Nome da variação</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Sabor, Nicotina, Cor"
                        className="h-10 text-base sm:text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Card: Opções */}
          <Card className="shadow-sm">
            <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm sm:text-base font-semibold">Opções cadastradas</CardTitle>
                    <Badge variant="outline" className="text-xs bg-muted/50 font-normal">
                      {fields.length} {fields.length === 1 ? "item" : "itens"}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs sm:text-sm mt-0.5">
                    Adicione, renomeie, filtre ou reorganize a ordem das opções.
                  </CardDescription>
                </div>

                {/* Auxiliary tools */}
                <div className="flex items-center gap-2">
                  {isSavingOrder && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground animate-pulse mr-1">
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                      Salvando ordem...
                    </span>
                  )}

                  <div className="grid grid-cols-2 gap-2.5 w-full sm:w-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsBulkOpen(true)}
                      className="h-10 sm:h-9 px-3 gap-2 text-sm font-medium bg-muted/30 hover:bg-muted border-border/80 rounded-lg shadow-xs transition-colors"
                    >
                      <ListPlus className="h-4 w-4 text-primary shrink-0" />
                      <span>Adicionar em lote</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleSortAlphabetically}
                      disabled={fields.length < 2}
                      className="h-10 sm:h-9 px-3 gap-2 text-sm font-medium bg-muted/30 hover:bg-muted border-border/80 rounded-lg shadow-xs transition-colors"
                      title="Ordenar opções alfabeticamente de A a Z"
                    >
                      <ArrowUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span>Ordenar A-Z</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Add & Search Toolbar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {/* Quick Add input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar opção (ex: Grape Ice)..."
                    value={quickAddValue}
                    onChange={(e) => setQuickAddValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleQuickAdd();
                      }
                    }}
                    className="h-10 text-base sm:text-sm"
                  />
                  <Button
                    type="button"
                    onClick={handleQuickAdd}
                    disabled={!quickAddValue.trim()}
                    className="shrink-0 h-10 px-3.5 gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span className="text-xs sm:text-sm">Adicionar</span>
                  </Button>
                </div>

                {/* Filter input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar entre as opções..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="pl-9 pr-14 h-10 text-base sm:text-sm"
                  />
                  {searchFilter && (
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {filteredFieldsWithIndex.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSearchFilter("")}
                        className="text-muted-foreground hover:text-foreground p-0.5 rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-6 pt-4 sm:pt-5">
              {filteredFieldsWithIndex.length === 0 ? (
                <div className="rounded-xl border border-dashed p-6 sm:p-8 text-center">
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    Nenhuma opção encontrada para &quot;{searchFilter}&quot;
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setSearchFilter("")}
                    className="text-xs text-primary mt-1"
                  >
                    Limpar filtro de busca
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
                  {filteredFieldsWithIndex.map(({ field, originalIndex }) => (
                    <div
                      key={field.id}
                      draggable={!isSavingOrder && !searchFilter.trim()}
                      onDragStart={() => setDraggingId(field.id)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => {
                        if (draggingId) handleReorder(draggingId, field.id);
                        setDraggingId(null);
                      }}
                      onDragEnd={() => setDraggingId(null)}
                      className={cn(
                        "group relative flex items-center gap-1.5 sm:gap-2 rounded-xl border bg-card p-1.5 sm:p-2 shadow-sm transition-all hover:border-primary/50",
                        draggingId === field.id && "opacity-40 border-dashed border-primary",
                      )}
                    >
                      {/* Left: Drag handle (desktop only) & Index badge */}
                      <div className="flex items-center gap-1 pl-1 shrink-0">
                        <GripVertical
                          className={cn(
                            "hidden sm:block h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-foreground",
                            searchFilter.trim() ? "cursor-not-allowed opacity-30" : "cursor-grab",
                          )}
                          title={searchFilter.trim() ? "Limpe o filtro de busca para arrastar" : "Arrastar para reordenar"}
                        />
                        <span className="flex items-center justify-center text-[10px] sm:text-[11px] font-mono font-medium text-muted-foreground bg-muted/60 rounded px-1.5 py-0.5 min-w-[22px] select-none">
                          {String(originalIndex + 1).padStart(2, "0")}
                        </span>
                      </div>

                      {/* Middle: Controlled input */}
                      <FormField
                        control={form.control}
                        name={`options.${originalIndex}.value`}
                        render={({ field: optionField }) => (
                          <FormItem className="flex-1 min-w-0 m-0 space-y-0">
                            <FormControl>
                              <Input
                                {...optionField}
                                placeholder="Nome da opção"
                                className="h-9 sm:h-8 text-base sm:text-sm font-medium bg-background/50 focus-visible:ring-1"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />

                      {/* Right: Reorder buttons & Delete button */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Mover para cima"
                          onClick={() => handleMoveUp(originalIndex)}
                          disabled={originalIndex === 0}
                          className="h-8 w-8 text-muted-foreground/60 hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          title="Mover para baixo"
                          onClick={() => handleMoveDown(originalIndex)}
                          disabled={originalIndex === fields.length - 1}
                          className="h-8 w-8 text-muted-foreground/60 hover:text-foreground disabled:opacity-20"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => remove(originalIndex)}
                          disabled={fields.length === 1}
                          title="Remover esta opção"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bottom add button */}
              <div className="mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ value: "" })}
                  className="gap-1.5 text-xs w-full sm:w-auto"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Adicionar linha vazia
                </Button>

                <p className="text-[11px] sm:text-xs text-muted-foreground text-center sm:text-right">
                  Dica: use a barra rápida acima ou &quot;Em lote&quot; para colar dezenas de opções.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Desktop Bottom Actions Bar */}
          <div className="hidden sm:flex flex-wrap items-center justify-between gap-4 pt-2">
            <Button asChild variant="outline">
              <Link to="/variacoes">
                Cancelar e voltar
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              {!isNewVariation && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:bg-destructive/10 border-destructive/20"
                  onClick={() => setIsDeleteDialogOpen(true)}
                  disabled={deleteMutation.isPending}
                >
                  Excluir variação
                </Button>
              )}

              <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
                {saveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isNewVariation ? "Criar variação" : "Salvar alterações"}
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Mobile Sticky Floating Save Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t p-3 shadow-lg sm:hidden safe-area-bottom">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-foreground truncate">
              {fields.length} {fields.length === 1 ? "opção" : "opções"}
            </span>
            {isSavingOrder ? (
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-2.5 w-2.5 animate-spin text-primary" />
                Salvando ordem...
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Pronto para salvar</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isNewVariation && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/20 hover:bg-destructive/10 h-10 w-10 p-0"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={deleteMutation.isPending}
                title="Excluir variação"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}

            <Button
              type="button"
              size="sm"
              onClick={form.handleSubmit((values) => saveMutation.mutate(values))}
              disabled={saveMutation.isPending}
              className="h-10 px-4 gap-1.5 font-medium shadow-sm"
            >
              {saveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              {isNewVariation ? "Criar variação" : "Salvar"}
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Add Dialog */}
      <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg p-4 sm:p-6 rounded-xl">
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ListPlus className="h-5 w-5 text-primary" />
              Adicionar opções em lote
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Cole uma lista de opções separadas por linha ou por vírgula. Elas serão inseridas automaticamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2">
            <Textarea
              placeholder={"Cherry Watermelon\nCoconut Water\nMenthol\nWatermelon Lemon\nou: Cherry Watermelon, Coconut Water, Menthol..."}
              rows={6}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="font-mono text-xs leading-relaxed resize-y max-h-[40vh]"
            />

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">
                {bulkParsedCount} {bulkParsedCount === 1 ? "opção detectada" : "opções detectadas"}
              </span>
              <span className="text-[11px]">Linhas ou vírgulas</span>
            </div>
          </div>

          <DialogFooter className="flex-row justify-end gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setBulkText("");
                setIsBulkOpen(false);
              }}
              className="h-9 flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleBulkAdd}
              disabled={bulkParsedCount === 0}
              className="h-9 gap-1.5 flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              Adicionar {bulkParsedCount > 0 ? `(${bulkParsedCount})` : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg p-4 sm:p-6 rounded-xl">
          <AlertDialogHeader className="text-left">
            <AlertDialogTitle className="text-base sm:text-lg">Excluir esta variação?</AlertDialogTitle>
            <AlertDialogDescription className="text-xs sm:text-sm">
              Esta ação removerá a variação &quot;{form.getValues("title")}&quot; e todas as suas {fields.length} opções cadastradas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-2 sm:gap-2">
            <AlertDialogCancel className="h-9 mt-0 flex-1 sm:flex-none">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 flex-1 sm:flex-none"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}