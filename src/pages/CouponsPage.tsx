import { useState } from "react";
import { useCoupons, useToggleCouponStatus } from "@/hooks/useCoupons";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Edit2, Ticket, CheckCircle2, XCircle } from "lucide-react";
import CouponFormModal from "@/components/coupons/CouponFormModal";
import { Coupon } from "@/services/coupon.service";

export default function CouponsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | undefined>(undefined);

  const { data: coupons = [], isLoading } = useCoupons();
  const toggleStatusMutation = useToggleCouponStatus();

  const handleCreateNew = () => {
    setSelectedCoupon(undefined);
    setIsModalOpen(true);
  };

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatusMutation.mutate(id);
  };

  const formatValue = (type: string, value?: number) => {
    if (type === "FREE_SHIPPING") return "Frete Grátis";
    if (!value) return "N/A";
    if (type === "VALUE") {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
      }).format(value);
    }
    if (type === "PERCENTAGE") return `${value}%`;
    return "";
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Cupons de Desconto</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">Gerencie promoções, limites de uso e validade dos cupons.</p>
        </div>
        <Button 
          onClick={handleCreateNew}
          className="rounded-xl shadow-sm h-11 px-5"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Cupom
        </Button>
      </div>

      {/* Main Panel */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white/40 border border-slate-200/50 rounded-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-slate-500">Carregando cupons...</p>
        </div>
      ) : coupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/70 border border-slate-200/50 rounded-2xl text-center p-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Ticket className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-lg">Nenhum cupom criado</h3>
            <p className="text-xs text-slate-400 max-w-xs font-medium">Crie seu primeiro cupom para oferecer descontos aos clientes.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleCreateNew}
            className="mt-2 rounded-xl text-violet-600 border-violet-200 hover:bg-violet-50"
          >
            Criar Cupom
          </Button>
        </div>
      ) : (
        <>
        {/* Mobile Grid View */}
        <div className="grid md:hidden gap-3">
          {coupons.map((coupon) => (
             <div key={coupon.id} className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{coupon.title}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{coupon.type === "VALUE" ? "Valor Fixo" : coupon.type === "PERCENTAGE" ? "Porcentagem" : "Frete Grátis"}</span>
                   </div>
                   <span className="font-black text-violet-600 text-lg">{formatValue(coupon.type, coupon.value)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Usos</span>
                      <span className="text-xs text-slate-600 font-medium">{coupon.currentUses} {coupon.maxUses ? `/ ${coupon.maxUses}` : ""}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Validade</span>
                      <span className="text-xs text-slate-600 font-medium">{coupon.validUntilDate ? new Date(coupon.validUntilDate).toLocaleDateString("pt-BR") : "Sem limite"}</span>
                   </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                   <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(coupon.id)}
                      className={`h-7 px-2 rounded-md ${coupon.status ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-400 bg-slate-100 hover:bg-slate-200"}`}
                    >
                      {coupon.status ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Ativo</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Inativo</>
                      )}
                    </Button>
                   <Button variant="ghost" size="sm" onClick={() => handleEdit(coupon)} className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                      <Edit2 className="h-4 w-4" />
                   </Button>
                </div>
             </div>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-600">Título</TableHead>
                <TableHead className="font-bold text-slate-600">Tipo</TableHead>
                <TableHead className="font-bold text-slate-600">Desconto</TableHead>
                <TableHead className="font-bold text-slate-600">Usos</TableHead>
                <TableHead className="font-bold text-slate-600">Validade</TableHead>
                <TableHead className="font-bold text-slate-600">Status</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id} className="hover:bg-violet-50/40 transition-colors">
                  <TableCell className="font-bold text-slate-700">{coupon.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-100 text-slate-600 border-0 rounded-md">
                      {coupon.type === "VALUE" ? "Valor Fixo" : coupon.type === "PERCENTAGE" ? "Porcentagem" : "Frete Grátis"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">
                    {formatValue(coupon.type, coupon.value)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-slate-600 font-medium">
                      {coupon.currentUses} {coupon.maxUses ? `/ ${coupon.maxUses}` : ""}
                    </span>
                  </TableCell>
                  <TableCell>
                    {coupon.validUntilDate ? (
                      <span className="text-sm text-slate-600 font-medium">
                        {new Date(coupon.validUntilDate).toLocaleDateString("pt-BR")}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">Sem limite</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(coupon.id)}
                      className={`h-7 px-2 rounded-md ${coupon.status ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100" : "text-slate-400 bg-slate-100 hover:bg-slate-200"}`}
                    >
                      {coupon.status ? (
                        <><CheckCircle2 className="w-3 h-3 mr-1" /> Ativo</>
                      ) : (
                        <><XCircle className="w-3 h-3 mr-1" /> Inativo</>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        </>
      )}

      {isModalOpen && (
        <CouponFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          coupon={selectedCoupon} 
        />
      )}
    </div>
  );
}
