import { CheckCircle2, PlusCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface OnboardingProps {
  hasConfiguredStore: boolean;
  hasCategory: boolean;
  hasProduct: boolean;
  hasOrder: boolean;
}

export function OnboardingWidget({
  hasConfiguredStore,
  hasCategory,
  hasProduct,
  hasOrder,
}: OnboardingProps) {
  const steps = [
    {
      id: "configure",
      title: "Configurar loja",
      subtitle: "Adicione logo, endereço e meios de pagamento.",
      isCompleted: hasConfiguredStore,
      link: "/configuracoes",
    },
    {
      id: "category",
      title: "Cadastrar categoria",
      subtitle: "Organize seus produtos por categorias.",
      isCompleted: hasCategory,
      link: "/categorias",
    },
    {
      id: "product",
      title: "Cadastrar produto",
      subtitle: "Cadastre seu primeiro produto para vender.",
      isCompleted: hasProduct,
      link: "/produtos/novo",
    },
    {
      id: "order",
      title: "Primeira venda",
      subtitle: "Faça sua primeira venda e veja como é fácil!",
      isCompleted: hasOrder,
      link: "/pedidos/novo",
    },
  ];

  const completedCount = steps.filter((s) => s.isCompleted).length;
  const totalCount = steps.length;
  const allCompleted = completedCount === totalCount;

  if (allCompleted) return null;

  return (
    <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="p-4 border-b border-border flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <h2 className="font-bold text-slate-800 text-sm sm:text-base">Primeiros passos</h2>
        </div>
        <div className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full text-xs font-bold">
          {completedCount}/{totalCount} concluídos
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full h-1 bg-slate-100">
        <div 
          className="h-full bg-emerald-500 transition-all duration-500 ease-in-out" 
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="flex flex-col">
        {steps.map((step, idx) => (
          <Link
            key={step.id}
            to={step.link}
            className={`flex items-center gap-3 md:gap-4 p-4 transition-colors hover:bg-slate-50 ${
              idx !== steps.length - 1 ? "border-b border-border" : ""
            } ${step.isCompleted ? "opacity-75 bg-slate-50/30" : ""}`}
          >
            <div className="shrink-0 flex items-center justify-center">
              {step.isCompleted ? (
                <div className="bg-emerald-100 p-1.5 rounded-full">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
              ) : (
                <div className="bg-emerald-50 p-1.5 rounded-full text-emerald-600 hover:bg-emerald-100 transition-colors">
                  <PlusCircle className="h-5 w-5" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className={`text-sm font-bold truncate ${step.isCompleted ? "text-slate-500 line-through" : "text-slate-800"}`}>
                {step.title}
              </h3>
              {!step.isCompleted && (
                <p className="text-xs text-slate-500 mt-0.5 truncate">{step.subtitle}</p>
              )}
            </div>

            {!step.isCompleted && (
              <ArrowRight className="h-4 w-4 text-slate-300 shrink-0" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
