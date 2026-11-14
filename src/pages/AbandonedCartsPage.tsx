import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, MessageCircle, Search, ShoppingCart, Trash2, CheckCircle2, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/hooks/useSettings";
import {
  AbandonedCart,
  contactAbandonedCart,
  dismissAbandonedCart,
  getAbandonedCarts,
} from "@/services/abandoned-carts.service";
import { buildAbandonedCartMessage } from "@/utils/abandonedCartMessage";
import { matchesAbandonedCartSearch } from "@/utils/abandonedCartSearch";
import { summarizeAbandonedCarts } from "@/utils/abandonedCartStats";
import { formatCurrency, formatPhone } from "@/utils/formatters";
import { openWhatsApp } from "@/utils/whatsapp";

type StatusFilter = "ALL" | "NEW" | "CONTACTED";

export default function AbandonedCartsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const { data: carts = [], isLoading } = useQuery({
    queryKey: ["abandoned-carts"],
    queryFn: getAbandonedCarts,
    refetchInterval: 60_000,
  });

  const contactMutation = useMutation({
    mutationFn: (cart: AbandonedCart) => contactAbandonedCart(cart.id),
    onSuccess: (contact, cart) => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
      openWhatsApp({
        phone: contact.phone,
        message: buildAbandonedCartMessage(contact.name || cart.customerName, cart.items, settings?.storeName ?? ""),
      });
    },
    onError: () => toast.error("Não foi possível abrir o contato deste carrinho."),
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissAbandonedCart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["abandoned-carts"] });
      toast.success("Carrinho removido da lista. O contato foi apagado.");
    },
    onError: () => toast.error("Não foi possível remover o carrinho da lista."),
  });

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return carts.filter((cart) => {
      const matchesStatus =
        statusFilter === "ALL" || (statusFilter === "CONTACTED" ? !!cart.contactedAt : !cart.contactedAt);
      return matchesStatus && matchesAbandonedCartSearch(cart, searchTerm);
    });
  }, [carts, searchTerm, statusFilter]);

  const { inList, toCall, totalEstimated } = summarizeAbandonedCarts(carts);
  const hasFilters = Boolean(searchTerm || statusFilter !== "ALL");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Carrinhos abandonados</h1>
        <p className="text-sm text-muted-foreground">
          Clientes que informaram nome e telefone, deixaram itens no carrinho e não finalizaram o pedido em 10 minutos.
          Chame no WhatsApp para ajudar a fechar a compra. O contato é apagado após 30 dias sem atividade.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold">Para chamar</CardDescription>
            <CardTitle className="text-2xl font-bold">{toCall}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold">Na lista</CardDescription>
            <CardTitle className="text-2xl font-bold">{inList}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-emerald-500 shadow-sm">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold">Valor estimado no carrinho</CardDescription>
            <CardTitle className="text-2xl font-bold">{formatCurrency(totalEstimated)}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Buscar por cliente, telefone ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 border-slate-200 rounded-xl font-medium placeholder:text-slate-400"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200 font-medium">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="NEW">Para chamar</SelectItem>
              <SelectItem value="CONTACTED">Já chamados</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            className="h-11 rounded-xl"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("ALL");
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 bg-card rounded-2xl border">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Carregando carrinhos...
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2 bg-card rounded-2xl border">
          <ShoppingCart className="h-8 w-8 opacity-40" />
          Nenhum carrinho abandonado com contato por enquanto.
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((cart) => (
            <div
              key={cart.id}
              className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-xs flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-slate-900">{cart.customerName}</span>
                  <span className="text-xs text-slate-500 font-mono">{formatPhone(cart.customerPhone)}</span>
                  {cart.contactedAt ? (
                    <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Chamado em {format(new Date(cart.contactedAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50 text-[10px]">
                      Para chamar
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700 line-clamp-2">
                  {cart.items
                    .map((item) => `${item.quantity}x ${item.name}${item.variation ? ` (${item.variation})` : ""}`)
                    .join(", ") || "Itens indisponíveis"}
                </p>
                <p className="text-xs text-slate-500">
                  ~ {formatCurrency(cart.totalEstimated)} (estimativa) · parado{" "}
                  {formatDistanceToNow(new Date(cart.updatedAt), { locale: ptBR })}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  className="bg-[#25D366] hover:bg-[#20ba59] text-white"
                  disabled={contactMutation.isPending}
                  onClick={() => contactMutation.mutate(cart)}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chamar no WhatsApp
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  title="Tirar da lista e apagar o contato"
                  disabled={dismissMutation.isPending}
                  onClick={() => dismissMutation.mutate(cart.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
