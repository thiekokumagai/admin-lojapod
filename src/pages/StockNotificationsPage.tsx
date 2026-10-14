import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getStockNotifications,
  markStockNotificationAsNotified,
  deleteStockNotification,
  StockNotificationItem,
} from "@/services/stock-notifications.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BellRing,
  Search,
  MessageCircle,
  CheckCircle2,
  Trash2,
  Package,
  Layers,
  ArrowUpRight,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/useSettings";
import { buildImageUrl } from "@/utils/image-url";

export default function StockNotificationsPage() {
  const queryClient = useQueryClient();
  const { data: settings } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "NOTIFIED">("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<"ALL" | "IN_STOCK" | "OUT_OF_STOCK">("ALL");

  const { data: notifications = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["stock-notifications"],
    queryFn: () => getStockNotifications(),
  });

  const notifyMutation = useMutation({
    mutationFn: (id: string) => markStockNotificationAsNotified(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-notifications"] });
      toast.success("Marcado como notificado com sucesso!");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStockNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-notifications"] });
      toast.success("Solicitação removida com sucesso!");
    },
  });

  const handleOpenWhatsApp = (item: StockNotificationItem) => {
    const rawPhone = item.customerPhone.replace(/\D/g, "");
    const formattedPhone = rawPhone.length <= 11 ? `55${rawPhone}` : rawPhone;

    const storeName = settings?.storeName || "nossa loja";
    const productDesc = item.variationName
      ? `${item.productTitle} (${item.variationName})`
      : item.productTitle;

    const message = encodeURIComponent(
      `Olá ${item.customerName}! Tudo bem?\n\n` +
      `Boas notícias: o produto que você estava aguardando em ${storeName} (*${productDesc}*) já chegou e está com estoque disponível!\n\n` +
      `Acesse agora para garantir o seu antes que acabe! Qualquer dúvida estamos à disposição.`
    );

    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${message}`;
    window.open(whatsappUrl, "_blank");

    if (item.status === "PENDING") {
      notifyMutation.mutate(item.id);
    }
  };

  const filteredItems = notifications.filter((item) => {
    const matchesSearch =
      item.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customerPhone.includes(searchTerm) ||
      item.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.variationName && item.variationName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" || item.status === statusFilter;

    const matchesAvailability =
      availabilityFilter === "ALL" ||
      (availabilityFilter === "IN_STOCK" && item.isAvailable) ||
      (availabilityFilter === "OUT_OF_STOCK" && !item.isAvailable);

    return matchesSearch && matchesStatus && matchesAvailability;
  });

  const totalInStock = notifications.filter((n) => n.isAvailable && n.status === "PENDING").length;
  const totalPending = notifications.filter((n) => n.status === "PENDING").length;
  const hasFilters = Boolean(searchTerm || statusFilter !== "ALL" || availabilityFilter !== "ALL");

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setAvailabilityFilter("ALL");
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Avise-me quando chegar</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe clientes interessados em itens esgotados e notifique-os via WhatsApp assim que o estoque estiver disponível.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-full sm:w-auto"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-amber-500 shadow-sm">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold">Total Pendente</CardDescription>
            <CardTitle className="text-2xl font-bold">{totalPending}</CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm bg-emerald-50/20">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold text-emerald-700">
              Prontos para Notificar (Com Estoque)
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-600">
              {totalInStock}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="py-4">
            <CardDescription className="text-xs uppercase font-semibold">Total Geral de Pedidos</CardDescription>
            <CardTitle className="text-2xl font-bold">{notifications.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Barra de Filtros e Busca Padronizada */}
      <div className="flex flex-col md:flex-row flex-wrap gap-3 items-start md:items-center w-full">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente, telefone ou produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as any)}
        >
          <SelectTrigger className="w-full md:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos os status</SelectItem>
            <SelectItem value="PENDING">Pendentes</SelectItem>
            <SelectItem value="NOTIFIED">Notificados</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={availabilityFilter}
          onValueChange={(v) => setAvailabilityFilter(v as any)}
        >
          <SelectTrigger className="w-full md:w-52">
            <SelectValue placeholder="Estoque" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todo estoque</SelectItem>
            <SelectItem value="IN_STOCK">🟢 Em Estoque (&gt; 0)</SelectItem>
            <SelectItem value="OUT_OF_STOCK">🔴 Sem Estoque (0)</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full md:w-auto">
            <X className="h-3.5 w-3.5 mr-1" />
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Tabela Padronizada */}
      <div className="rounded-md border bg-card overflow-x-auto">
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            Carregando lista de espera...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
            <Package className="h-8 w-8 opacity-40" />
            Nenhuma solicitação de aviso encontrada.
          </div>
        ) : (
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Produto / Variação</TableHead>
                <TableHead>Cliente / WhatsApp</TableHead>
                <TableHead className="text-center">Estoque Atual</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const isReadyToNotify = item.isAvailable;

                return (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.productImage ? (
                          <img
                            src={buildImageUrl(item.productImage)}
                            alt={item.productTitle}
                            className="h-12 w-12 rounded-md object-cover border min-w-12 min-h-12 block"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-md bg-muted border flex items-center justify-center text-muted-foreground text-xs min-w-12 min-h-12">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-sm leading-tight text-foreground">{item.productTitle}</span>
                          {item.variationName && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 font-medium">
                              <Layers className="h-3 w-3" />
                              {item.variationName}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="font-semibold text-sm text-foreground">{item.customerName}</div>
                      <div className="text-xs text-muted-foreground">{item.customerPhone}</div>
                    </TableCell>

                    <TableCell className="text-center">
                      {item.currentStock > 0 ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 font-semibold text-xs border border-emerald-200">
                          {item.currentStock} un disp.
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground font-normal text-xs">
                          Esgotado (0)
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {item.status === "NOTIFIED" ? (
                        <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Notificado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                          Aguardando
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={!isReadyToNotify}
                          onClick={() => handleOpenWhatsApp(item)}
                          className={`gap-1.5 text-xs font-bold ${
                            isReadyToNotify
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                              : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                          }`}
                          title={
                            isReadyToNotify
                              ? "Abrir WhatsApp com mensagem pronta"
                              : "Estoque ainda zerado"
                          }
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                          <ArrowUpRight className="h-3 w-3 opacity-70" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            if (window.confirm("Deseja realmente remover este aviso?")) {
                              deleteMutation.mutate(item.id);
                            }
                          }}
                          title="Remover solicitação"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
