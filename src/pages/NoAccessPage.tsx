import { useNavigate } from "react-router-dom";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearSession } from "@/services/auth.service";

export default function NoAccessPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <ShieldOff className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Sem telas liberadas</h1>
        <p className="mt-2 text-sm text-slate-500">
          Seu usuário ainda não tem acesso a nenhuma tela do painel. Peça ao administrador da loja para liberar as permissões.
        </p>
        <Button onClick={handleLogout} className="mt-6 bg-indigo-600 font-bold hover:bg-indigo-700">
          Sair e entrar novamente
        </Button>
      </div>
    </div>
  );
}
