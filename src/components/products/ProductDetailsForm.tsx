import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/richtexteditor";
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
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (Venda)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <Input
                          className="h-12 rounded-2xl bg-background pl-9"
                          placeholder="0,00"
                          value={field.value !== undefined ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(Number(digits) / 100);
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
                          className="h-12 rounded-2xl bg-background pl-9"
                          placeholder="0,00"
                          value={field.value !== undefined ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(Number(digits) / 100);
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
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço de Custo</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>
                        <Input
                          className="h-12 rounded-2xl bg-background pl-9"
                          placeholder="0,00"
                          value={field.value !== undefined ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(field.value) : ""}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            field.onChange(Number(digits) / 100);
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
