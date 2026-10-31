import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { FileSpreadsheet, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export function SheetOrdersImportForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<{
    totalProcessed: number;
    imported: number;
    skipped: number;
    errors: Array<{ line: number; message: string }>;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({
        variant: "destructive",
        title: "Nenhum arquivo selecionado",
        description: "Selecione uma planilha (.xlsx, .xls ou .csv) para importar.",
      });
      return;
    }

    setIsUploading(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const token = localStorage.getItem("token") || "";
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

      const response = await fetch(`${baseUrl}/imports/orders/sheet`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Erro ao processar planilha");
      }

      setImportResult({
        totalProcessed: data.totalProcessed || 0,
        imported: data.imported || 0,
        skipped: data.skipped || 0,
        errors: data.errors || [],
      });

      toast({
        title: "Importação Concluída com Sucesso!",
        description: `${data.imported || 0} pedidos foram importados e contabilizados.`,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFile(null);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro na importação",
        description: err.message || "Não foi possível importar os pedidos da planilha.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="border border-border/60 shadow-sm">
      <CardContent className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              <h2 className="font-semibold text-lg">Importar Pedidos via Planilha (Excel / CSV)</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Importe pedidos anteriores de outros sistemas a partir de relatórios em Excel (.xlsx, .xls) ou CSV. 
              O sistema cadastra os clientes, endereços, faturamento e datas correspondentes.
            </p>
          </div>
        </div>

        <div className="rounded-lg border-2 border-dashed border-border p-6 flex flex-col items-center justify-center gap-4 bg-muted/20">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls, .csv"
            className="hidden"
            id="sheet-orders-upload"
          />

          <label
            htmlFor="sheet-orders-upload"
            className="cursor-pointer flex flex-col items-center gap-2 text-center"
          >
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <span className="font-medium text-sm text-foreground">
                {selectedFile ? selectedFile.name : "Clique para selecionar a planilha de pedidos"}
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Suporta colunas como: num_pedido, nome, whatsapp, endereco, numero, bairro, cidade, pagamento, total, data
              </p>
            </div>
          </label>

          {selectedFile && (
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs bg-muted px-3 py-1 rounded-md text-foreground font-mono">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </span>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                onClick={handleUpload}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processando Pedidos...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Iniciar Importação
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {importResult && (
          <div className="rounded-lg border p-4 bg-card space-y-3">
            <div className="flex items-center gap-2 font-medium text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Resultado da Importação
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-muted/40 rounded-md">
                <span className="text-xs text-muted-foreground block">Linhas Lidas</span>
                <span className="text-lg font-bold">{importResult.totalProcessed}</span>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-md">
                <span className="text-xs text-emerald-600 block">Importados / Atualizados</span>
                <span className="text-lg font-bold text-emerald-600">{importResult.imported}</span>
              </div>
              <div className="p-3 bg-muted/40 rounded-md">
                <span className="text-xs text-muted-foreground block">Ignorados / Inválidos</span>
                <span className="text-lg font-bold">{importResult.skipped}</span>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  {importResult.errors.length} linha(s) com avisos/erros:
                </div>
                <div className="max-h-36 overflow-y-auto text-xs space-y-1 bg-destructive/5 p-2 rounded border border-destructive/20 font-mono">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx}>
                      Linha {err.line}: {err.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
