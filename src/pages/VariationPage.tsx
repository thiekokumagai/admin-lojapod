import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useVariations } from "@/hooks/useVariations";
import { VariationListCard } from "@/components/variations/VariationListCard";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/common/PageLoader";

export default function VariationPage() {
  const variationsQuery = useVariations();
  const variations = variationsQuery.data ?? [];

  if (variationsQuery.isLoading) {
    return <PageLoader message="Carregando variações..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Variações</h1>
          <p className="text-sm text-muted-foreground">
            Veja as variações cadastradas e abra cada uma para editar suas opções.
          </p>
        </div>

        <Button asChild>
          <Link to="/variacoes/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nova variação
          </Link>
        </Button>
      </div>

      <VariationListCard variations={variations} isLoading={false} />
    </div>
  );
}