import { VendizapIntegrationForm } from "@/components/settings/VendizapIntegrationForm";

export default function ImportacaoPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Importação de Dados</h1>
        <p className="text-sm text-muted-foreground">
          Ferramenta interna para configuração de credenciais e importação de catálogo via Vendizap.
        </p>
      </div>

      <VendizapIntegrationForm />
    </div>
  );
}
