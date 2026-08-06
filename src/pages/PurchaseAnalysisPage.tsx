import { useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { usePurchaseAnalysis } from "@/hooks/useInvestments";
import { PurchaseAnalysisParams } from "@/services/investment.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Calculator, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NumericFormat } from "react-number-format";

export default function PurchaseAnalysisPage() {
  const navigate = useNavigate();
  const { data: categories, loading: categoriesLoading } = useCategories();
  
  const [params, setParams] = useState<PurchaseAnalysisParams>({
    meses: 3,
    dias_cobertura: 45,
    valor: undefined,
  });
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [shouldFetch, setShouldFetch] = useState(false);

  // When form is submitted, trigger fetch by passing actual params
  const finalParams: PurchaseAnalysisParams = {
    ...params,
    categoria: selectedCategories.length > 0 ? selectedCategories.join(",") : undefined,
  };

  const { data, isLoading, isFetching } = usePurchaseAnalysis(finalParams, shouldFetch);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>({ key: 'categoria', direction: 'asc' });

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    setShouldFetch(true);
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    if (!data?.itens) return [];
    
    const sortableItems = [...data.itens];
    if (sortConfig !== null) {
      sortableItems.sort((a: any, b: any) => {
        let aVal = a[sortConfig.key] ?? '';
        let bVal = b[sortConfig.key] ?? '';
        
        // Handle nested or specific cases if needed
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/investimentos")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            Simulação de Compras
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Analise e simule as necessidades de reposição de estoque.
          </p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Parâmetros da Simulação</CardTitle>
          <CardDescription>Defina os critérios para análise das compras</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSimulate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Disponível (R$) - Opcional</Label>
                <NumericFormat
                  id="valor"
                  customInput={Input}
                  placeholder="Ex: 5000,00 (Se vazio, usa orçamento do caixa)"
                  value={params.valor === undefined ? "" : params.valor}
                  onValueChange={(values) => {
                    const { floatValue } = values;
                    setParams({ ...params, valor: floatValue });
                  }}
                  thousandSeparator="."
                  decimalSeparator=","
                  prefix="R$ "
                  decimalScale={2}
                  fixedDecimalScale
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meses">Meses de Histórico (Vendas)</Label>
                <Input
                  id="meses"
                  type="number"
                  min="1"
                  value={params.meses}
                  onChange={(e) => setParams({ ...params, meses: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dias_cobertura">Dias de Cobertura (Estoque)</Label>
                <Input
                  id="dias_cobertura"
                  type="number"
                  min="1"
                  value={params.dias_cobertura}
                  onChange={(e) => setParams({ ...params, dias_cobertura: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Filtro por Categorias (opcional)</Label>
              {categoriesLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando categorias...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-48 overflow-y-auto p-4 border rounded-md bg-slate-50">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={selectedCategories.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <label
                        htmlFor={`cat-${cat.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {cat.title}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full md:w-auto" disabled={isLoading || isFetching}>
              {(isLoading || isFetching) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calculator className="mr-2 h-4 w-4" />
              )}
              {shouldFetch ? "Recalcular Simulação" : "Simular Compra"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {shouldFetch && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Resultado da Análise</CardTitle>
            {data && (
              <div className="flex flex-wrap gap-2 md:gap-4 mt-2">
                <Badge variant="outline" className="bg-slate-50">Orçamento: {formatCurrency(data.orcamento_disponivel)}</Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Total Sugerido: {formatCurrency(data.valor_total_sugerido)}</Badge>
                <Badge variant="outline" className="bg-slate-50">Itens: {data.total_itens}</Badge>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoading || isFetching ? (
               <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
               </div>
            ) : (data && data.itens && data.itens.length > 0) ? (
               <>
                 <div className="grid md:hidden gap-3">
                   {getSortedItems().map((item: any, idx: number) => (
                     <div key={`mobile-${item.id_produto}-${idx}`} className="border rounded-xl p-4 flex flex-col gap-3 bg-white shadow-sm">
                        <div className="flex justify-between items-start">
                           <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm">{item.descricao}</span>
                              {item.variacao && <span className="text-xs text-slate-500 font-medium">{item.variacao}</span>}
                              <span className="text-xs text-slate-500 mt-1">{item.categoria}</span>
                           </div>
                           <Badge className={
                                item.prioridade === 'alta' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 shadow-none px-2 py-0 text-[10px]' :
                                item.prioridade === 'media' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-none px-2 py-0 text-[10px]' :
                                'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none px-2 py-0 text-[10px]'
                            } variant="secondary">{item.prioridade}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                           <div className="flex flex-col">
                             <span className="text-slate-500 text-xs">Média/Mês</span>
                             <span className="font-medium text-slate-700">{item.media_mensal}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-slate-500 text-xs">Estoque</span>
                             <span className="font-medium text-slate-700">{item.estoque_atual}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-slate-500 text-xs">Sugerido</span>
                             <span className="font-bold text-violet-600">{item.quantidade_sugerida}</span>
                           </div>
                           <div className="flex flex-col">
                             <span className="text-slate-500 text-xs">Custo Un.</span>
                             <span className="font-medium text-slate-700">{formatCurrency(item.valor_custo)}</span>
                           </div>
                        </div>
                        <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
                           <span className="text-slate-600 font-medium text-sm">Total</span>
                           <span className="font-bold text-lg text-slate-800">
                             {formatCurrency(item.valor_total_sugerido)}
                           </span>
                        </div>
                     </div>
                   ))}
                 </div>
                 <div className="hidden md:block overflow-x-auto border rounded-xl">
                   <Table className="min-w-[800px]">
                     <TableHeader className="bg-slate-50">
                       <TableRow>
                         <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('categoria')}>
                           Categoria {sortConfig?.key === 'categoria' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                         </TableHead>
                         <TableHead className="cursor-pointer hover:bg-slate-100" onClick={() => handleSort('descricao')}>
                           Produto {sortConfig?.key === 'descricao' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                         </TableHead>
                         <TableHead className="text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('media_mensal')}>
                           Média/Mês {sortConfig?.key === 'media_mensal' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                         </TableHead>
                         <TableHead className="text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('estoque_atual')}>
                           Estoque {sortConfig?.key === 'estoque_atual' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                         </TableHead>
                         <TableHead className="text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('quantidade_sugerida')}>
                           Sugerido (Qtd) {sortConfig?.key === 'quantidade_sugerida' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                         </TableHead>
                         <TableHead className="text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('valor_custo')}>
                           Custo Un. {sortConfig?.key === 'valor_custo' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                         </TableHead>
                         <TableHead className="text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('valor_total_sugerido')}>
                           Total {sortConfig?.key === 'valor_total_sugerido' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                         </TableHead>
                         <TableHead className="text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('prioridade')}>
                           Prioridade {sortConfig?.key === 'prioridade' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                         </TableHead>
                       </TableRow>
                     </TableHeader>
                     <TableBody>
                       {getSortedItems().map((item: any, idx: number) => (
                         <TableRow key={`${item.id_produto}-${idx}`}>
                           <TableCell>
                             <div className="font-medium text-slate-700">{item.categoria}</div>
                           </TableCell>
                           <TableCell>
                             <div className="font-medium text-slate-800">{item.descricao}</div>
                             {item.variacao && <div className="text-xs text-slate-500">{item.variacao}</div>}
                           </TableCell>
                           <TableCell className="text-right text-slate-600">{item.media_mensal}</TableCell>
                           <TableCell className="text-right text-slate-600">{item.estoque_atual}</TableCell>
                           <TableCell className="text-right font-bold text-violet-600">{item.quantidade_sugerida}</TableCell>
                           <TableCell className="text-right text-slate-600">{formatCurrency(item.valor_custo)}</TableCell>
                           <TableCell className="text-right font-semibold text-slate-800">{formatCurrency(item.valor_total_sugerido)}</TableCell>
                           <TableCell className="text-center">
                              <Badge className={
                                  item.prioridade === 'alta' ? 'bg-rose-100 text-rose-700 hover:bg-rose-200 shadow-none' :
                                  item.prioridade === 'media' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-none' :
                                  'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none'
                              } variant="secondary">{item.prioridade}</Badge>
                           </TableCell>
                         </TableRow>
                       ))}
                     </TableBody>
                   </Table>
                 </div>
               </>
            ) : (
               <div className="text-center py-12 text-slate-500">
                  {data?.alerta || "Nenhum item sugerido para compra com os critérios informados."}
               </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
