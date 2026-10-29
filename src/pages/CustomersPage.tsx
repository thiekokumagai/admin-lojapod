import { useState, useEffect, useRef } from "react";
import { useInfiniteCustomers } from "@/hooks/useCustomers";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, Users, ArrowRight, X, ShieldAlert, Ban } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPhone } from "@/utils/formatters";
import { openWhatsApp } from "@/utils/whatsapp";

export default function CustomersPage() {
  const [search, setSearch] = useState(() => {
    return sessionStorage.getItem("customers_search") || "";
  });
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");

  const limit = 20;
  const isBlockedParam = statusFilter === "all" ? undefined : statusFilter === "blocked";

  const { data: paginatedData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteCustomers(search, limit, isBlockedParam);
  const navigate = useNavigate();

  const customers = paginatedData?.pages.flatMap(p => p.data || []) || [];

  const loaderRef = useRef<HTMLDivElement>(null);
  const isRestoredRef = useRef(false);

  // Restore scroll
  useEffect(() => {
    if (isRestoredRef.current) return;
    const savedScroll = sessionStorage.getItem("customers_scroll_top");
    if (savedScroll && customers.length > 0) {
      const top = parseInt(savedScroll, 10);
      const timer = setTimeout(() => {
        const mainEl = document.querySelector("main");
        if (mainEl) {
          mainEl.scrollTop = top;
          isRestoredRef.current = true;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [customers.length]);

  const handleOpenCustomer = (id: string) => {
    const mainEl = document.querySelector("main");
    if (mainEl) {
      sessionStorage.setItem("customers_scroll_top", mainEl.scrollTop.toString());
    }
    sessionStorage.setItem("customers_search", search);
    navigate(`/clientes/${id}`);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    sessionStorage.setItem("customers_search", val);
    sessionStorage.removeItem("customers_scroll_top");
    isRestoredRef.current = true;
  };

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Clientes</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Gerencie sua base de clientes, visualize históricos, contatos e gerencie a lista de bloqueio.
          </p>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Buscar por nome ou telefone..." 
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-11 border-slate-200 focus-visible:ring-violet-600 rounded-xl font-medium placeholder:text-slate-400"
            />
          </div>
          
          {search && (
            <Button 
              variant="ghost" 
              onClick={() => handleSearchChange("")} 
              className="h-11 px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors sm:ml-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar busca
            </Button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1">Status:</span>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "all" ? "default" : "outline"}
            onClick={() => setStatusFilter("all")}
            className="rounded-lg text-xs h-8 px-3"
          >
            Todos
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "active" ? "default" : "outline"}
            onClick={() => setStatusFilter("active")}
            className="rounded-lg text-xs h-8 px-3"
          >
            Ativos
          </Button>
          <Button
            type="button"
            size="sm"
            variant={statusFilter === "blocked" ? "destructive" : "outline"}
            onClick={() => setStatusFilter("blocked")}
            className="rounded-lg text-xs h-8 px-3 gap-1.5"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Bloqueados (Block List)
          </Button>
        </div>
      </div>

      {/* Main Panel */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white/40 border border-slate-200/50 rounded-2xl">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
          <p className="text-sm font-semibold text-slate-500">Carregando clientes...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/70 border border-slate-200/50 rounded-2xl text-center p-6 space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-lg">Nenhum cliente encontrado</h3>
            <p className="text-xs text-slate-400 max-w-xs font-medium">
              {statusFilter === "blocked"
                ? "Nenhum cliente está na block list no momento."
                : "Tente buscar por outro nome ou número de telefone."}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Grid View */}
          <div className="grid md:hidden gap-3">
            {customers.map((customer) => (
              <div 
                key={customer.id} 
                onClick={() => handleOpenCustomer(customer.id)}
                className={`bg-white rounded-xl border p-4 shadow-sm flex items-center justify-between active:bg-violet-50/40 cursor-pointer gap-2 ${
                  customer.isBlocked ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200/60'
                }`}
              >
                <div className="flex flex-col min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-sm truncate">{customer.name}</span>
                    {customer.isBlocked ? (
                      <Badge variant="destructive" className="text-[10px] h-5 px-1.5 gap-1">
                        <Ban className="h-2.5 w-2.5" />
                        Bloqueado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-emerald-600 border-emerald-200 bg-emerald-50">
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <span className="font-mono text-slate-500 text-xs mt-0.5">{formatPhone(customer.phone)}</span>
                  <span className="text-slate-400 text-[10px] mt-1">Cadastro: {new Date(customer.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {customer.phone && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openWhatsApp(customer.phone, `Olá ${customer.name}`);
                      }}
                      className="w-9 h-9 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 hover:text-emerald-700 transition-colors border border-emerald-200/60"
                      title="Chamar no WhatsApp"
                    >
                      <img src="/whatsapp.svg" alt="WhatsApp" className="h-4.5 w-4.5" />
                    </button>
                  )}
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto">
            <Table className="min-w-[650px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-600 pl-6">Nome</TableHead>
                <TableHead className="font-bold text-slate-600">Telefone</TableHead>
                <TableHead className="font-bold text-slate-600">Status</TableHead>
                <TableHead className="font-bold text-slate-600">Cadastro</TableHead>
                <TableHead className="w-[100px] text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  onClick={() => handleOpenCustomer(customer.id)}
                  className={`group cursor-pointer hover:bg-violet-50/40 transition-colors ${
                    customer.isBlocked ? 'bg-rose-50/15' : ''
                  }`}
                >
                  <TableCell className="pl-6">
                    <div className="font-bold text-slate-700 flex items-center gap-2">
                      <span>{customer.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-500 font-mono tracking-tight">{formatPhone(customer.phone)}</div>
                  </TableCell>
                  <TableCell>
                    {customer.isBlocked ? (
                      <Badge variant="destructive" className="font-semibold text-xs h-6 px-2 gap-1">
                        <Ban className="h-3 w-3" />
                        Bloqueado (Block List)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="font-semibold text-xs h-6 px-2 text-emerald-600 border-emerald-200 bg-emerald-50">
                        Ativo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-500">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center gap-2 justify-end">
                      {customer.phone && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openWhatsApp(customer.phone, `Olá ${customer.name}`);
                          }}
                          className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 hover:text-emerald-700 transition-colors border border-emerald-200/60"
                          title="Chamar no WhatsApp"
                        >
                          <img src="/whatsapp.svg" alt="WhatsApp" className="h-4 w-4" />
                        </button>
                      )}

                      <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all shrink-0">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Infinite Scroll Loader */}
        {hasNextPage && (
          <div ref={loaderRef} className="flex justify-center p-6">
            <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          </div>
        )}
        </>
      )}
    </div>
  );
}
