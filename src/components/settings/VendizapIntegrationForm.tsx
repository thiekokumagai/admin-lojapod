import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/hooks/useSettings";
import { apiFetch } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Save, Download, Box, Images, Copy, ListOrdered, CheckCircle2 } from "lucide-react";

export function VendizapIntegrationForm() {
  const { data: settings, isLoading } = useSettings();
  const updateSettingsMutation = useUpdateSettings();

  const [authId, setAuthId] = useState("");
  const [authSecret, setAuthSecret] = useState("");
  const [isImporting, setIsImporting] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setAuthId((settings as any).vendizapAuthId || "");
      setAuthSecret((settings as any).vendizapAuthSecret || "");
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      await updateSettingsMutation.mutateAsync({
        vendizapAuthId: authId,
        vendizapAuthSecret: authSecret,
      } as any);

      toast({
        title: "Credenciais salvas!",
        description: "As chaves do Vendizap foram atualizadas com sucesso.",
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Ocorreu um erro ao atualizar as credenciais.",
      });
    }
  };

  const handleImport = async (type: string, endpoint: string) => {
    setIsImporting(type);
    try {
      const response = await apiFetch(`/imports/vendizap/${endpoint}`, { method: 'POST' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || "Erro desconhecido na importação");
      }
      toast({
        title: "Importação Iniciada/Concluída",
        description: `Importação de ${type} processada com sucesso.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: `Erro ao importar ${type}`,
        description: err.message || "Ocorreu um erro na requisição.",
      });
    } finally {
      setIsImporting(null);
    }
  };

  const handleClearDB = async () => {
    if (!window.confirm("ATENÇÃO: ISSO IRÁ APAGAR TODOS OS PRODUTOS E PEDIDOS DA LOJA. Deseja continuar?")) return;
    setIsImporting("clear");
    try {
      const response = await apiFetch(`/imports/vendizap/clear`, { method: 'DELETE' });
      if (!response.ok) throw new Error("Erro ao limpar banco de dados");
      toast({ title: "Banco Limpo", description: "O banco de dados foi limpo para reimportação." });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setIsImporting(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-center text-muted-foreground">
          Carregando integrações...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Credenciais Vendizap</h2>
            <Button size="sm" onClick={handleSave} disabled={updateSettingsMutation.isPending}>
              <Save className="h-4 w-4 mr-1" />
              {updateSettingsMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="font-medium">X-Auth-Id</Label>
              <Input
                value={authId}
                onChange={(e) => setAuthId(e.target.value)}
                placeholder="Ex: 906795"
              />
            </div>
            <div>
              <Label className="font-medium">X-Auth-Secret</Label>
              <Input
                type="password"
                value={authSecret}
                onChange={(e) => setAuthSecret(e.target.value)}
                placeholder="Insira o seu secret do Vendizap"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-base">Ações de Importação</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Execute a importação dos seus dados armazenados no Vendizap. É recomendado importar na seguinte ordem: Categorias, Produtos, Variações, Imagens e por fim Pedidos.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => handleImport("Categorias", "categories")}
              disabled={!!isImporting}
            >
              <ListOrdered className="h-5 w-5 mr-3 text-indigo-500" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Importar Categorias</span>
                <span className="text-xs text-muted-foreground">Puxa a estrutura de categorias</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => handleImport("Produtos", "products")}
              disabled={!!isImporting}
            >
              <Box className="h-5 w-5 mr-3 text-blue-500" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Importar Produtos</span>
                <span className="text-xs text-muted-foreground">Importa produtos básicos</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => handleImport("Variações", "products/variations")}
              disabled={!!isImporting}
            >
              <Copy className="h-5 w-5 mr-3 text-orange-500" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Variações de Produtos</span>
                <span className="text-xs text-muted-foreground">Importa grades e estoques</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => handleImport("Imagens", "products/images")}
              disabled={!!isImporting}
            >
              <Images className="h-5 w-5 mr-3 text-pink-500" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Imagens de Produtos</span>
                <span className="text-xs text-muted-foreground">Faz o download das imagens</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => handleImport("Pedidos", "orders")}
              disabled={!!isImporting}
            >
              <Download className="h-5 w-5 mr-3 text-emerald-500" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Importar Pedidos</span>
                <span className="text-xs text-muted-foreground">Puxa o histórico de vendas</span>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4"
              onClick={() => handleImport("Corrigir Categorias", "products/fix-categories")}
              disabled={!!isImporting}
            >
              <CheckCircle2 className="h-5 w-5 mr-3 text-cyan-500" />
              <div className="flex flex-col items-start">
                <span className="font-semibold">Fix Categorias</span>
                <span className="text-xs text-muted-foreground">Sincroniza categorias via endpoint único</span>
              </div>
            </Button>
          </div>
          
          <div className="border-t pt-4 mt-4">
             <Button 
              variant="destructive" 
              onClick={handleClearDB}
              disabled={!!isImporting}
             >
               Limpar Banco de Dados (Reset de Catálogo)
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
