import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useCustomerDetails, useUpdateCustomer } from "@/hooks/useCustomers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, User, Phone, MapPin, CalendarDays, Edit2, Save, ArrowLeft, ShoppingBag, Copy, Check, DollarSign, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import OrderDetailDrawer from "@/components/OrderDetailDrawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPhone } from "@/utils/formatters";

export default function CustomerDetailsPage() {
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: customer, isLoading } = useCustomerDetails(customerId);
  const updateMutation = useUpdateCustomer();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ name: "", phone: "" });

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const defaultAddress = customer?.addresses?.find(a => a.isDefault);

  const handleCopyAddress = () => {
    if (!defaultAddress) return;
    let addressStr = `${defaultAddress.street}, ${defaultAddress.number}`;
    if (defaultAddress.neighborhood && defaultAddress.neighborhood.trim()) {
      const cleanNeigh = defaultAddress.neighborhood.trim().replace(/^bairro\s+/i, '');
      if (cleanNeigh) {
        addressStr += `, ${cleanNeigh}`;
      }
    }
    navigator.clipboard.writeText(addressStr);
    setCopiedAddress(true);
    toast({ title: "Endereço copiado!" });
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  useEffect(() => {
    if (customer) {
      setEditData({ name: customer.name, phone: formatPhone(customer.phone) });
      setIsEditing(false);
    }
  }, [customer]);

  const handleSave = async () => {
    if (!customerId) return;
    try {
      await updateMutation.mutateAsync({ id: customerId, data: editData });
      toast({ title: "Cliente atualizado com sucesso" });
      setIsEditing(false);
    } catch (e: any) {
      const msg = e?.message || e?.response?.data?.message || "Erro ao atualizar cliente";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const totalOrders = customer?.orders?.length || 0;
  const totalSpent = customer?.orders
    ?.filter(o => o.status !== 'CANCELLED')
    ?.reduce((acc, curr) => acc + (Number(curr.totalOrder) || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white/40 border border-slate-200/50 rounded-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-slate-500">Carregando detalhes do cliente...</p>
        </div>
      ) : !customer ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-400 bg-white/40 border border-slate-200/50 rounded-2xl">
          <User className="h-10 w-10" />
          <p className="text-sm font-semibold">Cliente não encontrado</p>
        </div>
      ) : (
        <div className="flex flex-col h-full gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate('/clientes')}
                className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-violet-700 hover:border-violet-200 hover:bg-violet-50 transition-all group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-0.5 transition-transform" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Detalhes do Cliente</h1>
                <p className="text-sm text-slate-500 font-medium">Visualize as informações e o histórico completo do cliente</p>
              </div>
            </div>
          </div>

          {/* Cards Resumo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total de Pedidos</p>
                <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200/60 p-5 flex items-center gap-4 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Valor Total Gasto</p>
                <p className="text-2xl font-bold text-slate-800">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSpent)}
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="dados" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 gap-2 h-auto p-1.5 bg-muted/60">
              <TabsTrigger value="dados" className="flex items-center gap-2 py-2 px-3 justify-center text-xs font-semibold">
                <User className="h-4 w-4" />
                Dados Pessoais
              </TabsTrigger>
              <TabsTrigger value="enderecos" className="flex items-center gap-2 py-2 px-3 justify-center text-xs font-semibold">
                <MapPin className="h-4 w-4" />
                Endereços Salvos
              </TabsTrigger>
              <TabsTrigger value="pedidos" className="flex items-center gap-2 py-2 px-3 justify-center text-xs font-semibold">
                <ShoppingBag className="h-4 w-4" />
                Histórico de Pedidos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pedidos" className="space-y-4 outline-none">
              {/* Pedidos */}
              <div className="space-y-4 bg-slate-50/50 p-5 rounded-2xl border border-slate-200/60 flex flex-col">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-slate-400" />
                  Histórico de Pedidos ({customer.orders?.length || 0})
                </h3>

                <div className="space-y-3">
                  {!customer.orders || customer.orders.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200/60 p-6 text-center text-slate-400 font-medium text-sm">
                      Nenhum pedido realizado.
                    </div>
                  ) : (
                    customer.orders.map((order) => (
                      <div 
                        key={order.id} 
                        onClick={() => setSelectedOrderId(order.id)}
                        className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex items-center justify-between hover:bg-violet-50/50 cursor-pointer transition-colors group"
                      >
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-violet-700 transition-colors">Pedido #{order.orderNumber}</p>
                          <p className="text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString('pt-BR')} às {new Date(order.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-violet-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.totalOrder)}
                          </p>
                          <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                            {order.status === 'PENDING' && 'PENDENTE'}
                            {order.status === 'CONFIRMED' && 'CONFIRMADO'}
                            {order.status === 'DISPATCHED' && 'DESPACHADO'}
                            {order.status === 'COMPLETED' && 'CONCLUÍDO'}
                            {order.status === 'CANCELLED' && 'CANCELADO'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="dados" className="space-y-4 outline-none">
              {/* Informações Pessoais */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    Dados Pessoais
                  </h3>
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="h-8 text-violet-600 hover:text-violet-700 hover:bg-violet-50">
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                  ) : (
                    <Button variant="default" size="sm" onClick={handleSave} disabled={updateMutation.isPending} className="h-8 bg-violet-600 hover:bg-violet-700">
                      {updateMutation.isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
                      Salvar
                    </Button>
                  )}
                </div>

                <div className="bg-white rounded-xl border border-slate-200/60 p-4 space-y-4 shadow-sm">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                    {isEditing ? (
                      <Input 
                        value={editData.name} 
                        onChange={e => setEditData(prev => ({...prev, name: e.target.value}))}
                        className="h-9 border-slate-200 focus-visible:ring-violet-600 rounded-xl"
                      />
                    ) : (
                      <div className="font-semibold text-slate-800 text-base">{customer.name}</div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                      Telefone
                    </label>
                    {isEditing ? (
                      <Input 
                        value={editData.phone} 
                        onChange={e => setEditData(prev => ({...prev, phone: formatPhone(e.target.value)}))}
                        placeholder="(00) 00000-0000"
                        maxLength={15}
                        className="h-9 border-slate-200 focus-visible:ring-violet-600 rounded-xl"
                      />
                    ) : (
                      <div className="font-semibold text-slate-800 text-base flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {formatPhone(customer.phone)}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-sm text-slate-500 font-medium">
                    <CalendarDays className="h-4 w-4" />
                    Cadastrado em {new Date(customer.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>

                {/* Último Endereço Usado (Principal) */}
                {defaultAddress && (
                  <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                      ÚLTIMO UTILIZADO (PRINCIPAL)
                    </div>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-base">{defaultAddress.street}, {defaultAddress.number}</p>
                        <p className="text-sm text-slate-500 font-medium">{defaultAddress.neighborhood}</p>
                        <p className="text-sm text-slate-500 font-medium">{defaultAddress.city} - {defaultAddress.state}</p>
                        <p className="text-sm text-slate-500 font-medium mt-1 tracking-widest">{defaultAddress.cep}</p>
                        {defaultAddress.complement && (
                          <p className="text-sm text-slate-400 mt-2 italic">{defaultAddress.complement}</p>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={handleCopyAddress}
                        className="h-8 w-8 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors shrink-0"
                        title="Copiar Endereço"
                      >
                        {copiedAddress ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="enderecos" className="space-y-4 outline-none">
              {/* Endereços */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  Endereços Salvos ({customer.addresses?.length || 0})
                </h3>

                <div className="space-y-3">
                  {customer.addresses?.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200/60 p-6 text-center text-slate-400 font-medium text-sm">
                      Nenhum endereço salvo.
                    </div>
                  ) : (
                    [...customer.addresses]
                      .sort((a, b) => {
                        if (a.isDefault && !b.isDefault) return -1;
                        if (!a.isDefault && b.isDefault) return 1;
                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return dateB - dateA; // Descending
                      })
                      .map((addr, index) => {
                        const isPrincipal = index === 0 && (addr.id === defaultAddress?.id || addr.isDefault);
                        return (
                          <div key={addr.id} className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm relative overflow-hidden">
                            {isPrincipal && (
                              <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                ÚLTIMO UTILIZADO (PRINCIPAL)
                              </div>
                            )}
                            <p className="font-bold text-slate-800 text-base">{addr.street}, {addr.number}</p>
                            <p className="text-sm text-slate-500 font-medium">{addr.neighborhood}</p>
                            <p className="text-sm text-slate-500 font-medium">{addr.city} - {addr.state}</p>
                            <p className="text-sm text-slate-500 font-medium mt-1 tracking-widest">{addr.cep}</p>
                            {addr.complement && (
                              <p className="text-sm text-slate-400 mt-2 italic">{addr.complement}</p>
                            )}
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}

        {/* Modal of Order Details (Read-only mode wrapper) */}
        <OrderDetailDrawer
          orderId={selectedOrderId}
          isOpen={!!selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
          readOnly={true}
        />
      </div>
  );
}
