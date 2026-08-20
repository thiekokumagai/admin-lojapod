import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Courier, couriersService } from "@/services/couriers.service";
import { formatCurrency, formatPhone } from "@/utils/formatters";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, Phone, Eye, Banknote, Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CouriersPage() {
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);
  
  // New Courier form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  // Edit Courier form
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCourier, setEditCourier] = useState<Courier | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Pay Courier form
  const [selectedCourier, setSelectedCourier] = useState<Courier | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDesc, setPayDesc] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const loadCouriers = async () => {
    setLoading(true);
    try {
      const data = await couriersService.getCouriers();
      setCouriers(data);
    } catch (error) {
      toast.error("Erro ao carregar motoboys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCouriers();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await couriersService.createCourier({ name: newName, phone: newPhone });
      toast.success("Motoboy cadastrado com sucesso");
      setIsNewOpen(false);
      setNewName("");
      setNewPhone("");
      loadCouriers();
    } catch (error) {
      toast.error("Erro ao cadastrar motoboy");
    }
  };

  const openEditModal = (courier: Courier) => {
    setEditCourier(courier);
    setEditName(courier.name);
    setEditPhone(formatPhone(courier.phone));
    setEditIsActive(courier.isActive ?? true);
    setIsEditOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCourier || isSavingEdit) return;
    try {
      setIsSavingEdit(true);
      await couriersService.updateCourier(editCourier.id, {
        name: editName,
        phone: editPhone,
        isActive: editIsActive,
      });
      toast.success("Motoboy atualizado com sucesso");
      setIsEditOpen(false);
      setEditCourier(null);
      loadCouriers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar motoboy");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourier || isPaying) return;
    try {
      setIsPaying(true);
      const amount = parseFloat(payAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error("Valor inválido");
        setIsPaying(false);
        return;
      }
      
      await couriersService.payCourier({ 
        courierId: selectedCourier.id, 
        amount, 
        description: payDesc || undefined 
      });
      toast.success("Pagamento registrado com sucesso!");
      setIsPayOpen(false);
      setPayAmount("");
      setPayDesc("");
      loadCouriers();
    } catch (error: any) {
      toast.error(error.message || "Erro ao pagar motoboy");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Motoboys</h1>
          <p className="text-sm text-slate-500 font-medium">Cadastre motoboys, gerencie taxas e acerte os pagamentos.</p>
        </div>
        <Button onClick={() => setIsNewOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
          <Plus className="w-4 h-4 mr-2" /> Novo Motoboy
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {couriers.map((courier) => (
            <Card key={courier.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-lg text-slate-800">{courier.name}</h3>
                      {!courier.isActive && (
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded">Inativo</span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" /> {formatPhone(courier.phone)}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-bold ${courier.balance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                    Saldo: {formatCurrency(courier.balance)}
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="text-xs font-bold h-9 px-3"
                    onClick={() => openEditModal(courier)}
                    title="Editar Motoboy"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Link to={`/motoboys/${courier.id}`} className="flex-1">
                    <Button variant="outline" className="w-full text-xs font-bold h-9">
                      <Eye className="w-3 h-3 mr-1.5" /> Detalhes
                    </Button>
                  </Link>
                  <Button 
                    variant="default" 
                    className="flex-1 text-xs font-bold h-9 bg-indigo-600 hover:bg-indigo-700"
                    onClick={() => {
                      setSelectedCourier(courier);
                      setPayAmount(courier.balance > 0 ? courier.balance.toString() : "");
                      setIsPayOpen(true);
                    }}
                    disabled={courier.balance <= 0}
                  >
                    <Banknote className="w-3 h-3 mr-1.5" /> Pagar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {couriers.length === 0 && (
            <div className="col-span-full bg-slate-50 p-8 rounded-xl text-center border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">Nenhum motoboy cadastrado.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal Novo Motoboy */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Motoboy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Nome</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Telefone / WhatsApp</label>
              <Input 
                value={newPhone} 
                onChange={(e) => setNewPhone(formatPhone(e.target.value))} 
                required 
                placeholder="(11) 99999-9999" 
                maxLength={15}
              />
            </div>
            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">Salvar</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Motoboy */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Motoboy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Nome</label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Telefone / WhatsApp</label>
              <Input 
                value={editPhone} 
                onChange={(e) => setEditPhone(formatPhone(e.target.value))} 
                required 
                placeholder="(11) 99999-9999" 
                maxLength={15}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="editIsActive"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label htmlFor="editIsActive" className="text-sm font-medium text-slate-700 cursor-pointer">
                Motoboy Ativo
              </label>
            </div>
            <Button type="submit" disabled={isSavingEdit} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {isSavingEdit ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Pagar Motoboy */}
      <Dialog open={isPayOpen} onOpenChange={setIsPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pagar {selectedCourier?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePay} className="space-y-4 pt-4">
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-100 flex justify-between items-center">
              <span className="text-sm font-semibold text-amber-800">Saldo Devedor:</span>
              <span className="text-lg font-bold text-amber-900">{selectedCourier ? formatCurrency(selectedCourier.balance) : 0}</span>
            </div>
            
            <div>
              <label className="text-sm font-semibold mb-1 block">Valor a Pagar (R$)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                <Input 
                  type="text" 
                  value={payAmount !== "" ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(payAmount)) : ""} 
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setPayAmount(digits ? (Number(digits) / 100).toString() : "");
                  }} 
                  className="pl-9"
                  placeholder="0,00"
                  required 
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">Este valor será descontado do saldo e lançado no Caixa atual como Saída (Motoboy / Frete).</p>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Descrição (Opcional)</label>
              <Input 
                value={payDesc} 
                onChange={(e) => setPayDesc(e.target.value)} 
                placeholder="Ex: Acerto da semana" 
              />
            </div>
            <Button type="submit" disabled={isPaying} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {isPaying ? "Confirmando..." : "Confirmar Pagamento"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
