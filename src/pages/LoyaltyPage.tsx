import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";
import {
  Award,
  Search,
  Settings,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Gift,
  Clock,
  Sparkles,
  Phone,
  User,
  History,
  Info,
  DollarSign,
  Percent,
  TrendingUp,
  Layers,
  BellRing,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import {
  loyaltyService,
  LoyaltyCard,
  LoyaltyProgram,
  LoyaltyProgramType,
  LoyaltyRewardRedemption,
} from "@/services/loyalty.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const PROGRAM_TYPES: {
  id: LoyaltyProgramType;
  title: string;
  badge: string;
  icon: any;
  desc: string;
  example: string;
}[] = [
  {
    id: "FREE_PRODUCT",
    title: "Produto Grátis",
    badge: "🎁 Selos",
    icon: Gift,
    desc: "O cliente acumula compras válidas e ganha um produto/brinde ao completar a cartela.",
    example: "Ex: A cada 10 compras, ganha 1 Pod Descartável.",
  },
  
  {
    id: "POINTS_DISCOUNT",
    title: "Desconto por Pontos",
    badge: "💰 Pontos",
    icon: DollarSign,
    desc: "Cada real gasto vira pontos que o cliente troca por descontos em dinheiro na sacola.",
    example: "Ex: R$ 1 = 1 ponto. 500 pontos = R$ 25 de desconto.",
  },
  {
    id: "CASHBACK",
    title: "Cashback",
    badge: "💳 Saldo",
    icon: Percent,
    desc: "Uma porcentagem do valor de cada compra volta como saldo para abater no próximo pedido.",
    example: "Ex: 5% de cashback sobre o total de produtos.",
  },
  {
    id: "PROGRESSIVE_DISCOUNT",
    title: "Desconto Progressivo",
    badge: "🛍️ Escadinha",
    icon: TrendingUp,
    desc: "Quanto mais compras o cliente acumula, maior o percentual de desconto exclusivo.",
    example: "Ex: 5ª compra = 5% off, 10ª compra = 10% off.",
  },
  {
    id: "HYBRID",
    title: "Sistema Híbrido",
    badge: "🎯 Pontos ou Brinde",
    icon: Layers,
    desc: "O cliente junta pontos e escolhe se prefere trocar por desconto ou pelo produto brinde.",
    example: "Ex: Escolher entre R$ 25 de desconto ou 1 Brinde.",
  },
];

export default function LoyaltyPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("cards");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modal de Configurações
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<LoyaltyProgram>>({});
  const [minOrderDisplay, setMinOrderDisplay] = useState("R$ 0,00");
  const [pointsRedemptionDisplay, setPointsRedemptionDisplay] = useState("R$ 0,05");

  // Modal de Ajuste Manual de Selos
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<LoyaltyCard | null>(null);
  const [adjustPhone, setAdjustPhone] = useState("");
  const [adjustName, setAdjustName] = useState("");
  const [adjustCount, setAdjustCount] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState("");

  useEffect(() => {
    const socketUrl = import.meta.env.VITE_ADMIN_API?.replace(/\/api$/, "") || "http://localhost:3000";
    const socket = io(socketUrl);

    const refreshLoyalty = () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-program"] });
    };

    socket.on("loyalty.refresh", refreshLoyalty);
    socket.on("loyalty.card_updated", refreshLoyalty);
    socket.on("loyalty.reward_delivered", refreshLoyalty);
    socket.on("loyalty.reward_redeemed", refreshLoyalty);
    socket.on("order.updated", refreshLoyalty);
    socket.on("order.new", refreshLoyalty);

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  // Query das Configurações do Programa
  const { data: program } = useQuery({
    queryKey: ["loyalty-program"],
    queryFn: loyaltyService.getProgram,
  });

  // Query dos Cartões
  const { data: cardsData, isLoading: isLoadingCards } = useQuery({
    queryKey: ["loyalty-cards", searchTerm, statusFilter, page],
    queryFn: () =>
      loyaltyService.listCards({
        search: searchTerm || undefined,
        status: statusFilter,
        page,
        limit: 15,
      }),
  });

  // Query dos Resgates de Brindes Pendentes
  const { data: redemptions = [], isLoading: isLoadingRedemptions } = useQuery({
    queryKey: ["loyalty-redemptions"],
    queryFn: () => loyaltyService.listRedemptions(),
  });

  const pendingRedemptionsCount = redemptions.filter((r) => r.status === "PENDING_DELIVERY").length;

  // Mutação para Atualizar Programa
  const updateProgramMutation = useMutation({
    mutationFn: (data: Partial<LoyaltyProgram>) => loyaltyService.updateProgram(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-program"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
      toast.success("Configurações do Programa salvas com sucesso!");
      setIsConfigOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao salvar configurações");
    },
  });

  // Mutação para Ajuste de Selos
  const adjustStampMutation = useMutation({
    mutationFn: loyaltyService.manualAdjust,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
      toast.success("Selos atualizados com sucesso!");
      setIsAdjustOpen(false);
      setSelectedCard(null);
      setAdjustCount(1);
      setAdjustReason("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao ajustar selos");
    },
  });

  // Mutação para confirmar entrega do brinde
  const deliverGiftMutation = useMutation({
    mutationFn: loyaltyService.markRedemptionDelivered,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-redemptions"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-cards"] });
      toast.success("Brinde marcado como entregue ao cliente!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar status do brinde");
    },
  });

  const formatBRL = (valueInReais: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valueInReais);
  };

  const formatPhoneNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleMinOrderChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    const cents = Number(digits) / 100;
    setMinOrderDisplay(formatBRL(cents));
    setConfigForm((prev) => ({ ...prev, minOrderValue: cents }));
  };

  const handlePointsRedemptionChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    const cents = Number(digits) / 100;
    setPointsRedemptionDisplay(formatBRL(cents));
    setConfigForm((prev) => ({ ...prev, pointsRedemptionValue: cents }));
  };

  const handleOpenConfig = () => {
    if (program) {
      const minVal = Number(program.minOrderValue) || 0;
      const pointVal = Number(program.pointsRedemptionValue) || 0.05;
      setMinOrderDisplay(formatBRL(minVal));
      setPointsRedemptionDisplay(formatBRL(pointVal));
      setConfigForm({
        isActive: program.isActive,
        type: program.type || "FREE_PRODUCT",
        stampsRequired: program.stampsRequired || 10,
        minOrderValue: minVal,
        validityDays: program.validityDays || 30,
        rewardText: program.rewardText || "Prêmio Especial",
        rewardCouponCode: program.rewardCouponCode || "",
        pointsPerReal: Number(program.pointsPerReal) || 1,
        pointsRedemptionValue: pointVal,
        minPointsToRedeem: Number(program.minPointsToRedeem) || 0,
        cashbackPercent: Number(program.cashbackPercent) || 5,
        progressiveTiers: Array.isArray(program.progressiveTiers) && program.progressiveTiers.length > 0
          ? program.progressiveTiers
          : [
              { minOrders: 3, discountPercent: 3 },
              { minOrders: 5, discountPercent: 5 },
              { minOrders: 10, discountPercent: 10 },
            ],
      });
    }
    setIsConfigOpen(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateProgramMutation.mutate({
      isActive: configForm.isActive,
      type: configForm.type || "FREE_PRODUCT",
      stampsRequired: Number(configForm.stampsRequired) || 10,
      minOrderValue: Number(configForm.minOrderValue) || 0,
      validityDays: Number(configForm.validityDays) || 30,
      rewardText: configForm.rewardText || "Prêmio Especial",
      rewardCouponCode: configForm.rewardCouponCode || undefined,
      pointsPerReal: Number(configForm.pointsPerReal) || 1,
      pointsRedemptionValue: Number(configForm.pointsRedemptionValue) || 0.05,
      minPointsToRedeem: Number(configForm.minPointsToRedeem) || 0,
      cashbackPercent: Number(configForm.cashbackPercent) || 5,
      progressiveTiers: configForm.progressiveTiers || [],
    });
  };

  const handleOpenAdjust = (card?: LoyaltyCard) => {
    if (card) {
      setSelectedCard(card);
      setAdjustPhone(formatPhoneNumber(card.customerPhone));
      setAdjustName(card.customerName || "");
    } else {
      setSelectedCard(null);
      setAdjustPhone("");
      setAdjustName("");
    }
    setAdjustCount(1);
    setAdjustReason("");
    setIsAdjustOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustPhone) {
      toast.error("Informe o telefone do cliente");
      return;
    }
    adjustStampMutation.mutate({
      customerPhone: adjustPhone.replace(/\D/g, ""),
      customerName: adjustName || undefined,
      stampsCount: adjustCount,
      reason: adjustReason || undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "COMPLETED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completo (Prêmio Pronto)
        </span>
      );
    }
    if (status === "EXPIRED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3.5 h-3.5" /> Expirado
        </span>
      );
    }
    if (status === "REDEEMED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Gift className="w-3.5 h-3.5" /> Resgatado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
        <Sparkles className="w-3.5 h-3.5" /> Em Progresso
      </span>
    );
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "America/Campo_Grande",
    });
  };

  const currentProgramType = PROGRAM_TYPES.find((t) => t.id === (program?.type || "FREE_PRODUCT")) || PROGRAM_TYPES[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Award className="h-7 w-7 text-primary shrink-0" /> Programa de Fidelidade
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fidelize seus clientes com produto grátis, cashback, pontos por desconto ou progressivo.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Button
            onClick={() => handleOpenAdjust()}
            variant="outline"
            className="h-11 rounded-xl border-slate-200 gap-2 font-medium justify-center"
          >
            <Plus className="w-4 h-4 text-emerald-600" /> Ajustar Pontos/Selos
          </Button>
          <Button
            onClick={handleOpenConfig}
            className="h-11 rounded-xl bg-primary hover:bg-primary/90 text-white gap-2 font-medium shadow-sm justify-center"
          >
            <Settings className="w-4 h-4" /> Configurar Regras
          </Button>
        </div>
      </div>

      {/* Banner de Status e Modo Ativo */}
      <div className="p-4 sm:p-5 rounded-2xl border bg-white shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              program?.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
            }`}
          >
            <currentProgramType.icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900">
                Modo: <span className="text-primary">{currentProgramType.title}</span> ({currentProgramType.badge})
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  program?.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                }`}
              >
                {program?.isActive ? "Ativo" : "Pausado"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {currentProgramType.desc} • Validade: <strong>{program?.validityDays || 30} dias</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 w-full md:w-auto justify-between md:justify-start">
          <Switch
            checked={!!program?.isActive}
            onCheckedChange={(val) => updateProgramMutation.mutate({ isActive: val })}
            disabled={updateProgramMutation.isPending}
          />
          <Label className="text-xs font-semibold cursor-pointer">
            {program?.isActive ? "Pontuando pedidos" : "Pausado"}
          </Label>
        </div>
      </div>

      {/* Navegação por Abas: Clientes e Resgates Pendentes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="bg-slate-100/80 p-1 rounded-xl w-full sm:w-auto inline-flex">
            <TabsTrigger value="cards" className="flex-1 sm:flex-initial rounded-lg font-semibold text-xs sm:text-sm gap-2 whitespace-nowrap">
              <User className="w-4 h-4" /> Clientes Participantes ({cardsData?.total || 0})
            </TabsTrigger>
            <TabsTrigger value="gifts" className="flex-1 sm:flex-initial rounded-lg font-semibold text-xs sm:text-sm gap-2 relative whitespace-nowrap">
              <Gift className="w-4 h-4 text-emerald-600" /> Brindes para Entregar
              {pendingRedemptionsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white rounded-full text-[10px] font-extrabold animate-pulse">
                  {pendingRedemptionsCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: Clientes e Cartões */}
        <TabsContent value="cards" className="space-y-4">
          {/* Toolbar de Busca e Filtros */}
          <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por cliente ou telefone..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10 h-11 rounded-xl bg-white border-slate-200 font-medium text-sm"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-11 rounded-xl bg-white border-slate-200 w-full sm:min-w-[170px] text-sm font-medium">
                  <SelectValue placeholder="Status do Cartão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos os status</SelectItem>
                  <SelectItem value="ACTIVE">Em Progresso</SelectItem>
                  <SelectItem value="COMPLETED">Completo (Prêmio)</SelectItem>
                  <SelectItem value="REDEEMED">Resgatado</SelectItem>
                  <SelectItem value="EXPIRED">Expirado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Cards Mobile (Padronização de Layout da Loja) */}
          <div className="grid md:hidden gap-3">
            {isLoadingCards ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/60 p-6">
                Carregando participantes...
              </div>
            ) : cardsData?.data?.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/60 p-6">
                Nenhum cliente encontrado com os filtros atuais.
              </div>
            ) : (
              cardsData?.data.map((card) => {
                const maxStamps = program?.stampsRequired || 10;
                const progressPct = Math.min(100, Math.round((card.currentStamps / maxStamps) * 100));

                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate flex items-center gap-1.5">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{card.customerName || "Cliente sem nome"}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatPhoneNumber(card.customerPhone)}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {getStatusBadge(card.status)}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between gap-3 border border-slate-100">
                      <div className="flex-1">
                        <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-1">
                          Progresso / Saldo
                        </span>
                        {program?.type === "CASHBACK" ? (
                          <div className="font-bold text-emerald-600 text-sm">
                            {formatBRL(Number(card.cashbackBalance) || 0)}
                          </div>
                        ) : program?.type === "POINTS_DISCOUNT" ? (
                          <div className="font-bold text-amber-600 text-sm">
                            {card.pointsBalance} pts
                            <span className="block text-[10px] text-slate-400 font-normal">
                              {formatBRL((Number(card.pointsBalance) || 0) * (Number(program.pointsRedemptionValue) || 0.05))}
                            </span>
                          </div>
                        ) : program?.type === "PROGRESSIVE_DISCOUNT" ? (
                          <div className="font-bold text-slate-900 text-sm">
                            {card.currentStamps} pedidos
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-sm">
                              {card.currentStamps} <span className="text-slate-400 font-normal">/ {maxStamps} selos</span>
                            </div>
                            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  card.currentStamps >= maxStamps ? "bg-emerald-500" : "bg-primary"
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="text-right shrink-0 border-l border-slate-200 pl-3">
                        <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider block mb-0.5">
                          Ciclos
                        </span>
                        <span className="font-bold text-slate-800 text-xs">
                          {card.totalCompleted}x 🏆
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {card.expiresAt ? `Validade: ${formatDate(card.expiresAt)}` : "Sem validade definida"}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAdjust(card)}
                        className="h-8 rounded-lg text-xs font-semibold text-slate-700 hover:text-primary shrink-0"
                      >
                        Ajustar
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Cliente / Contato</th>
                    <th className="px-5 py-4 text-center">Progresso / Saldo</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4">Validade do Ciclo</th>
                    <th className="px-5 py-4 text-center">Resgates</th>
                    <th className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingCards ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Carregando participantes...
                      </td>
                    </tr>
                  ) : cardsData?.data?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Nenhum cliente encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    cardsData?.data.map((card) => {
                      const maxStamps = program?.stampsRequired || 10;
                      const progressPct = Math.min(100, Math.round((card.currentStamps / maxStamps) * 100));

                      return (
                        <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-900 flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              {card.customerName || "Cliente sem nome"}
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {formatPhoneNumber(card.customerPhone)}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center min-w-[160px]">
                            {program?.type === "CASHBACK" ? (
                              <div className="font-bold text-emerald-600 text-sm">
                                {formatBRL(Number(card.cashbackBalance) || 0)}
                                <span className="block text-[11px] text-slate-400 font-normal">Saldo de cashback</span>
                              </div>
                            ) : program?.type === "POINTS_DISCOUNT" ? (
                              <div className="font-bold text-amber-600 text-sm">
                                {card.pointsBalance} pts
                                <span className="block text-[11px] text-slate-400 font-normal">
                                  equivale a {formatBRL((Number(card.pointsBalance) || 0) * (Number(program.pointsRedemptionValue) || 0.05))}
                                </span>
                              </div>
                            ) : program?.type === "PROGRESSIVE_DISCOUNT" ? (
                              <div className="flex flex-col items-center gap-1">
                                <div className="font-bold text-slate-900 text-sm">
                                  {card.currentStamps} {card.currentStamps === 1 ? "pedido" : "pedidos"}
                                </div>
                                <span className="text-[11px] text-emerald-600 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  {(() => {
                                    const tiers = Array.isArray(program?.progressiveTiers) ? [...program.progressiveTiers].sort((a: any, b: any) => a.minOrders - b.minOrders) : [];
                                    const qualified = tiers.filter((t: any) => card.currentStamps >= t.minOrders);
                                    const current = qualified.length > 0 ? qualified[qualified.length - 1] : null;
                                    return current ? `${current.discountPercent}% OFF Ativo` : "Sem desconto ainda";
                                  })()}
                                </span>
                              </div>
                            ) : program?.type === "HYBRID" ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="font-bold text-slate-900 text-sm">
                                  {card.currentStamps} <span className="text-slate-400 font-normal">/ {maxStamps} selos</span>
                                </div>
                                <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      card.currentStamps >= maxStamps ? "bg-emerald-500" : "bg-primary"
                                    }`}
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  {card.pointsBalance} pts ({formatBRL((Number(card.pointsBalance) || 0) * (Number(program.pointsRedemptionValue) || 0.05))})
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="font-bold text-slate-900 text-sm">
                                  {card.currentStamps} <span className="text-slate-400 font-normal">/ {maxStamps} selos</span>
                                </div>
                                <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full transition-all duration-300 ${
                                      card.currentStamps >= maxStamps ? "bg-emerald-500" : "bg-primary"
                                    }`}
                                    style={{ width: `${progressPct}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center">{getStatusBadge(card.status)}</td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5 text-xs text-slate-600">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {card.expiresAt ? (
                                <span>
                                  Até <strong>{formatDate(card.expiresAt)}</strong> (23:59)
                                </span>
                              ) : (
                                <span className="text-slate-400">Não iniciado</span>
                              )}
                            </div>
                            {card.startedAt && (
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Iniciado em: {formatDate(card.startedAt)}
                              </div>
                            )}
                          </td>

                          <td className="px-5 py-4 text-center font-semibold text-slate-800">
                            {card.totalCompleted}x 🏆
                          </td>

                          <td className="px-5 py-4 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAdjust(card)}
                              className="h-8 rounded-lg text-xs font-semibold gap-1 text-slate-700 hover:text-primary"
                            >
                              Ajustar
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ABA 2: Brindes Resgatados para o Dono Entregar */}
        <TabsContent value="gifts" className="space-y-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
            <Gift className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="text-xs sm:text-sm text-emerald-900">
              <strong>Atenção Lojista:</strong> Esta lista reúne os clientes que resgataram o brinde do cartão fidelidade.
              Separe o brinde na embalagem do pedido correspondente ou entregue no balcão e clique em <strong>"Marcar como Entregue"</strong>.
            </div>
          </div>

          {/* Cards Mobile para Brindes */}
          <div className="grid md:hidden gap-3">
            {isLoadingRedemptions ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/60 p-6">
                Carregando resgates...
              </div>
            ) : redemptions.length === 0 ? (
              <div className="py-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200/60 p-6">
                Nenhum brinde resgatado até o momento.
              </div>
            ) : (
              redemptions.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">
                        {item.customerName || "Cliente"}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        {formatPhoneNumber(item.customerPhone)}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {item.status === "PENDING_DELIVERY" ? (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          ⏳ Separar Brinde
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                          ✅ {item.rewardType === 'POINTS_DISCOUNT' || item.rewardType === 'CASHBACK' ? 'Aplicado' : 'Entregue'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl flex flex-col gap-1.5 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Recompensa:</span>
                      <span 
                        className={`font-semibold px-2 py-0.5 rounded-md border inline-flex items-center gap-1 max-w-[200px] truncate ${
                          item.rewardType === 'FREE_PRODUCT' || item.rewardType === 'HYBRID'
                            ? "text-emerald-700 bg-emerald-50/80 border-emerald-200"
                            : item.rewardType === 'CASHBACK'
                            ? "text-emerald-800 bg-emerald-50/80 border-emerald-300"
                            : "text-amber-800 bg-amber-50/80 border-amber-300"
                        }`}
                        title={item.rewardTitle}
                      >
                        <span>{item.rewardType === 'CASHBACK' ? '💸' : item.rewardType === 'POINTS_DISCOUNT' ? '💰' : '🎁'}</span>
                        <span className="truncate">{item.rewardTitle}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Pedido:</span>
                      <span className="font-mono font-bold text-slate-700">
                        {item.order ? `#${item.order.orderNumber}` : "Resgate Avulso"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span>Data:</span>
                      <span>
                        {new Date(item.createdAt).toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "America/Campo_Grande",
                        })}
                      </span>
                    </div>
                  </div>

                  {item.status === "PENDING_DELIVERY" && (
                    <Button
                      size="sm"
                      onClick={() => deliverGiftMutation.mutate(item.id)}
                      disabled={deliverGiftMutation.isPending}
                      className="w-full h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 mt-1"
                    >
                      <Check className="w-4 h-4" /> Marcar como Entregue
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50/80 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4">Data do Resgate</th>
                    <th className="px-5 py-4">Cliente / WhatsApp</th>
                    <th className="px-5 py-4">Brinde / Recompensa</th>
                    <th className="px-5 py-4">Pedido Vinculado</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoadingRedemptions ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Carregando resgates...
                      </td>
                    </tr>
                  ) : redemptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Nenhum brinde resgatado até o momento.
                      </td>
                    </tr>
                  ) : (
                    redemptions.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            timeZone: "America/Campo_Grande",
                          })}
                        </td>
                        <td className="px-5 py-3">
                          <div className="font-semibold text-slate-900 text-xs sm:text-sm">{item.customerName || "Cliente"}</div>
                          <div className="text-[11px] text-slate-500">{formatPhoneNumber(item.customerPhone)}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span 
                            className={`font-semibold text-xs px-2 py-0.5 rounded-md border inline-flex items-center gap-1 max-w-[240px] truncate ${
                              item.rewardType === 'FREE_PRODUCT' || item.rewardType === 'HYBRID'
                                ? "text-emerald-700 bg-emerald-50/80 border-emerald-200"
                                : item.rewardType === 'CASHBACK'
                                ? "text-emerald-800 bg-emerald-50/80 border-emerald-300"
                                : "text-amber-800 bg-amber-50/80 border-amber-300"
                            }`}
                            title={item.rewardTitle}
                          >
                            <span>{item.rewardType === 'CASHBACK' ? '💸' : item.rewardType === 'POINTS_DISCOUNT' ? '💰' : '🎁'}</span>
                            <span className="truncate">{item.rewardTitle}</span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-xs font-mono font-bold text-slate-600">
                          {item.order ? `#${item.order.orderNumber}` : "Resgate Avulso"}
                        </td>
                        <td className="px-5 py-3 text-center">
                          {item.status === "PENDING_DELIVERY" ? (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              ⏳ Separar Brinde
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                              ✅ {item.rewardType === 'POINTS_DISCOUNT' || item.rewardType === 'CASHBACK' ? 'Aplicado' : 'Entregue'}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right">
                          {item.status === "PENDING_DELIVERY" && (
                            <Button
                              size="sm"
                              onClick={() => deliverGiftMutation.mutate(item.id)}
                              disabled={deliverGiftMutation.isPending}
                              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Marcar Entregue
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Configurações das 5 Modalidades */}
      <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
        <DialogContent className="w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Settings className="w-5 h-5 text-primary" /> Regras do Programa de Fidelidade
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveConfig} className="space-y-5 py-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50">
              <div>
                <Label className="font-semibold text-slate-900">Ativar Programa de Fidelidade</Label>
                <p className="text-xs text-slate-500">
                  Permite aos clientes acumularem benefícios automáticos a cada compra confirmada.
                </p>
              </div>
              <Switch
                checked={!!configForm.isActive}
                onCheckedChange={(val) => setConfigForm((prev) => ({ ...prev, isActive: val }))}
              />
            </div>

            {/* Seleção do Tipo de Programa */}
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase text-slate-500">Escolha a Estratégia de Fidelização</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PROGRAM_TYPES.map((t) => {
                  const isSelected = (configForm.type || "FREE_PRODUCT") === t.id;
                  const Icon = t.icon;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setConfigForm((prev) => ({ ...prev, type: t.id }))}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-primary" : "text-slate-400"}`} />
                        <span className="font-bold text-xs text-slate-900">{t.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 leading-tight">{t.desc}</p>
                      <span className="text-[10px] text-primary font-semibold mt-1 block">{t.example}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Parâmetros Específicos por Tipo */}
            {(configForm.type === "FREE_PRODUCT" || configForm.type === "HYBRID") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center h-5">Selos p/ Ganhar Brinde</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={configForm.stampsRequired !== undefined ? String(configForm.stampsRequired) : "10"}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setConfigForm((prev) => ({ ...prev, stampsRequired: val ? parseInt(val, 10) : 0 }));
                    }}
                    className="h-10 rounded-xl bg-white"
                    placeholder="Ex: 10"
                    required
                  />
                  <p className="text-[11px] text-slate-400">Ex: 10 pedidos para completar.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center h-5">Descrição do Brinde</Label>
                  <Input
                    placeholder="Ex: Ganhe 1 Pod Ignite"
                    value={configForm.rewardText || ""}
                    onChange={(e) => setConfigForm((prev) => ({ ...prev, rewardText: e.target.value }))}
                    className="h-10 rounded-xl bg-white"
                    required
                  />
                </div>
              </div>
            )}

            {/* Configuração da Escadinha de Desconto Progressivo */}
            {configForm.type === "PROGRESSIVE_DISCOUNT" && (
              <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/70 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <Label className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-600" /> Níveis de Desconto Progressivo
                    </Label>
                    <p className="text-[11px] text-slate-500">
                      Defina a quantidade de compras necessárias para o cliente subir de nível e ganhar mais desconto.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const currentTiers = Array.isArray(configForm.progressiveTiers) ? [...configForm.progressiveTiers] : [];
                      const lastTier = currentTiers[currentTiers.length - 1];
                      const nextOrders = lastTier ? lastTier.minOrders + 5 : 5;
                      const nextDiscount = lastTier ? lastTier.discountPercent + 5 : 5;
                      setConfigForm((prev) => ({
                        ...prev,
                        progressiveTiers: [...currentTiers, { minOrders: nextOrders, discountPercent: nextDiscount }],
                      }));
                    }}
                    className="h-8 rounded-lg text-xs font-semibold gap-1 bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar Nível
                  </Button>
                </div>

                <div className="space-y-2.5">
                  {(Array.isArray(configForm.progressiveTiers) && configForm.progressiveTiers.length > 0
                    ? configForm.progressiveTiers
                    : [
                        { minOrders: 3, discountPercent: 3 },
                        { minOrders: 5, discountPercent: 5 },
                        { minOrders: 10, discountPercent: 10 },
                      ]
                  ).map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 p-3 bg-white rounded-xl border border-slate-200 shadow-2xs"
                    >
                      <span className="text-xs font-extrabold text-slate-700 w-14 shrink-0">Nível {idx + 1}</span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-slate-500">A partir de</span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={tier.minOrders !== undefined ? String(tier.minOrders) : ""}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            const updated = [...(configForm.progressiveTiers || [])];
                            updated[idx] = { ...updated[idx], minOrders: val ? parseInt(val, 10) : 0 };
                            setConfigForm((prev) => ({ ...prev, progressiveTiers: updated }));
                          }}
                          className="h-8 w-16 text-center font-bold rounded-lg text-xs"
                        />
                        <span className="text-xs text-slate-500">pedidos</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                        <span className="text-xs text-slate-500">Ganha</span>
                        <div className="relative w-20">
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={tier.discountPercent !== undefined ? String(tier.discountPercent) : ""}
                            onChange={(e) => {
                              const val = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                              const updated = [...(configForm.progressiveTiers || [])];
                              updated[idx] = { ...updated[idx], discountPercent: val === "" ? 0 : Number(val) };
                              setConfigForm((prev) => ({ ...prev, progressiveTiers: updated }));
                            }}
                            className="h-8 pr-6 text-center font-bold rounded-lg text-emerald-700 text-xs"
                          />
                          <Percent className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>
                        <span className="text-xs text-slate-500">off</span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const updated = (configForm.progressiveTiers || []).filter((_, i) => i !== idx);
                          setConfigForm((prev) => ({ ...prev, progressiveTiers: updated }));
                        }}
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg shrink-0 ml-auto"
                        title="Remover nível"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {configForm.type === "CASHBACK" && (
              <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-1.5">
                <Label className="text-xs font-semibold text-emerald-900">Porcentagem de Cashback (%)</Label>
                <div className="relative w-40">
                  <Input
                    type="text"
                    inputMode="decimal"
                    value={configForm.cashbackPercent !== undefined ? String(configForm.cashbackPercent) : "5"}
                    onChange={(e) => {
                      const val = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                      setConfigForm((prev) => ({ ...prev, cashbackPercent: val === "" ? 0 : Number(val) }));
                    }}
                    className="h-10 rounded-xl bg-white pr-8 font-bold"
                  />
                  <Percent className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <p className="text-[11px] text-emerald-700">Ex: 5% = em uma compra de R$ 100, o cliente ganha R$ 5 de saldo.</p>
              </div>
            )}

            {(configForm.type === "POINTS_DISCOUNT" || configForm.type === "HYBRID") && (
              <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-amber-900 flex items-center h-5">Pontos por R$ 1 Gasto</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={configForm.pointsPerReal !== undefined ? String(configForm.pointsPerReal) : "1"}
                      onChange={(e) => {
                        const val = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "");
                        setConfigForm((prev) => ({ ...prev, pointsPerReal: val === "" ? 0 : Number(val) }));
                      }}
                      className="h-10 rounded-xl bg-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-amber-900 flex items-center h-5">Valor de Cada 1 Ponto (R$)</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={pointsRedemptionDisplay}
                      onChange={(e) => handlePointsRedemptionChange(e.target.value)}
                      className="h-10 rounded-xl bg-white font-semibold"
                    />
                    <p className="text-[11px] text-amber-700">Ex: R$ 0,05 = 100 pontos valem R$ 5,00 de desconto.</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1 border-t border-amber-200/60">
                  <Label className="text-xs font-semibold text-amber-900 flex items-center justify-between">
                    <span>Mínimo de Pontos para Resgate</span>
                    <span className="text-[11px] text-amber-700 font-normal">0 = sem mínimo</span>
                  </Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={configForm.minPointsToRedeem !== undefined ? String(configForm.minPointsToRedeem) : "0"}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setConfigForm((prev) => ({ ...prev, minPointsToRedeem: val ? parseInt(val, 10) : 0 }));
                    }}
                    className="h-10 rounded-xl bg-white"
                    placeholder="Ex: 100 (equivale a R$ 5,00)"
                  />
                  <p className="text-[11px] text-amber-700">
                    O cliente só poderá aplicar o desconto se tiver atingido essa pontuação mínima.
                  </p>
                </div>
              </div>
            )}

            {/* Regras Gerais: Valor Mínimo e Validade */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center h-5">Valor Mínimo do Pedido (R$)</Label>
                <Input
                  type="text"
                  value={minOrderDisplay}
                  onChange={(e) => handleMinOrderChange(e.target.value)}
                  className="h-10 rounded-xl font-semibold"
                />
                <p className="text-[11px] text-slate-400">R$ 0,00 para pontuar em qualquer compra.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold flex items-center gap-1.5 h-5">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" /> Validade do Ciclo (em Dias)
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={configForm.validityDays !== undefined ? String(configForm.validityDays) : "30"}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setConfigForm((prev) => ({ ...prev, validityDays: val ? parseInt(val, 10) : 0 }));
                  }}
                  className="h-10 rounded-xl"
                  placeholder="Ex: 30"
                  required
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200/60 text-[11px] text-amber-800 flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Ajuste de fuso horário seguro:</strong> O ciclo expira pontualmente às 23:59:59 do último dia no
                horário local da loja (America/Campo_Grande), garantindo que o cliente possa aproveitar até o final do dia!
              </span>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsConfigOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateProgramMutation.isPending} className="font-semibold">
                Salvar Regras
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Ajuste Manual de Selos */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Award className="w-5 h-5 text-primary" /> Ajustar Pontuação Manualmente
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAdjust} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Telefone do Cliente (WhatsApp)</Label>
              <Input
                placeholder="(67) 99999-9999"
                value={adjustPhone}
                onChange={(e) => setAdjustPhone(formatPhoneNumber(e.target.value))}
                disabled={!!selectedCard}
                className="h-10 rounded-xl"
                maxLength={15}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nome do Cliente (Opcional)</Label>
              <Input
                placeholder="Nome completo"
                value={adjustName}
                onChange={(e) => setAdjustName(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Quantidade de Selos / Pontos</Label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustCount((prev) => prev - 1)}
                  className="h-10 w-10 rounded-xl"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={adjustCount}
                  onChange={(e) => setAdjustCount(Number(e.target.value))}
                  className="h-10 text-center font-bold rounded-xl"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setAdjustCount((prev) => prev + 1)}
                  className="h-10 w-10 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-[11px] text-slate-400">
                Use valores positivos para adicionar (ex: 1, 2) ou negativos para subtrair.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo / Observação</Label>
              <Input
                placeholder="Ex: Compra presencial no balcão, bônus de aniversário..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={adjustStampMutation.isPending} className="font-semibold">
                Confirmar Ajuste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
