import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { TrendingUp, TrendingDown, Percent } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/richtexteditor";
import { calculateProfitMargin, formatCurrency } from "@/utils/formatters";
import type { CategoryList } from "@/types/category";

export type ProductDetailsFormValues = {
  title: string;
  categoryId: string;
  description?: string;
  descriptionFormated?: string;
  price?: number;
  promotionalPrice?: number;
  costPrice?: number;
};

type ProductDetailsFormProps = {
  form: UseFormReturn<ProductDetailsFormValues>;
  categories: CategoryList[];
};

export function ProductDetailsForm({
  form,
  categories,
}: ProductDetailsFormProps) {
  const watchPrice = form.watch("price");
  const watchCostPrice = form.watch("costPrice");

  const profitCalc = useMemo(() => {
    return calculateProfitMargin(watchPrice, watchCostPrice);
  }, [watchPrice, watchCostPrice]);

  return (
    <Card className="rounded-3xl border bg-card shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Dados do produto</CardTitle>
        <CardDescription>Escolha a categoria e preencha o título.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-2xl bg-background">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input className="h-12 rounded-2xl bg-background" placeholder="Nome do produto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Suporta HTML)</FormLabel>
                  <FormControl>
                    <RichTextEditor
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 md:grid-cols-3">
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          className="h-12 rounded-2xl bg-background pl-9"
                          placeholder="0,00"
                          value={field.value !== undefined ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(digits ? Number(digits) / 100 : undefined);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="promotionalPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço Promocional</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          className="h-12 rounded-2xl bg-background pl-9"
                          placeholder="0,00"
                          value={field.value !== undefined ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(digits ? Number(digits) / 100 : undefined);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (Venda)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <Input
                          type="tel"
                          inputMode="numeric"
                          className="h-12 rounded-2xl bg-background pl-9"
                          placeholder="0,00"
                          value={field.value !== undefined ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(digits ? Number(digits) / 100 : undefined);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              
            </div>

            {/* Painel Informativo de Porcentagem de Lucro e Margem */}
            <div className="rounded-2xl border p-4 transition-all bg-card shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-primary" />
                  Análise de Lucratividade
                </span>
                {profitCalc.hasProfitInfo && (
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                    profitCalc.isNegative
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                      : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  }`}>
                    {profitCalc.isNegative ? <TrendingDown className="h-3.5 w-3.5" /> : <TrendingUp className="h-3.5 w-3.5" />}
                    {profitCalc.isNegative ? "Prejuízo" : "Lucro Estimado"}
                  </span>
                )}
              </div>

              {profitCalc.hasProfitInfo ? (
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-muted/40 p-3 rounded-xl">
                    <span className="text-[11px] text-muted-foreground font-semibold block">Lucro Bruto</span>
                    <span className={`text-base font-extrabold block ${profitCalc.isNegative ? "text-rose-600" : "text-emerald-600"}`}>
                      {formatCurrency(profitCalc.profit)}
                    </span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-xl">
                    <span className="text-[11px] text-muted-foreground font-semibold block">Margem de Lucro</span>
                    <span className={`text-base font-extrabold block ${profitCalc.isNegative ? "text-rose-600" : "text-emerald-600"}`}>
                      {profitCalc.marginPercentage.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">(sobre a venda)</span>
                  </div>
                  <div className="bg-muted/40 p-3 rounded-xl">
                    <span className="text-[11px] text-muted-foreground font-semibold block">Markup</span>
                    <span className={`text-base font-extrabold block ${profitCalc.isNegative ? "text-rose-600" : "text-emerald-600"}`}>
                      {profitCalc.markupPercentage.toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">(sobre o custo)</span>
                  </div>
                </div>
              ) : (
                <div className="py-2 text-center text-xs text-muted-foreground">
                  Informe o <strong>Preço de Custo</strong> e o <strong>Preço de Venda</strong> para calcular a porcentagem de lucro em tempo real.
                </div>
              )}
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
