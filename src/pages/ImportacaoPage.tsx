import { VendizapIntegrationForm } from "@/components/settings/VendizapIntegrationForm";
import { SheetOrdersImportForm } from "@/components/settings/SheetOrdersImportForm";

export default function ImportacaoPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importação de Dados</h1>
        <p className="text-sm text-muted-foreground">
          Ferramenta para importação de pedidos via planilha (Excel/CSV) e sincronização de catálogo.
        </p>
      </div>

      <SheetOrdersImportForm />

      <VendizapIntegrationForm />
    </div>
  );
}

