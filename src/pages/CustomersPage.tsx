import { useState, useEffect, useRef } from "react";
import { useInfiniteCustomers } from "@/hooks/useCustomers";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Loader2, Users, ArrowRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatPhone } from "@/utils/formatters";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const limit = 20;

  const { data: paginatedData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteCustomers(search, limit);
  const navigate = useNavigate();

  const customers = paginatedData?.pages.flatMap(p => p.data || []) || [];

  const loaderRef = useRef<HTMLDivElement>(null);

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
            Gerencie sua base de clientes, visualize históricos e dados de contato.
          </p>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            type="text" 
            placeholder="Buscar por nome ou telefone..." 
            value={search}
            onChange={(e) => { setSearch(e.target.value); }}
            className="pl-10 h-11 border-slate-200 focus-visible:ring-violet-600 rounded-xl font-medium placeholder:text-slate-400"
          />
        </div>
        
        {search && (
          <Button 
            variant="ghost" 
            onClick={() => { setSearch(""); }} 
            className="h-11 px-3 text-slate-500 hover:bg-slate-100 hover:text-slate-700 rounded-xl transition-colors sm:ml-auto"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar
          </Button>
        )}
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
            <p className="text-xs text-slate-400 max-w-xs font-medium">Tente buscar por outro nome ou número de telefone.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Grid View */}
          <div className="grid md:hidden gap-3">
            {customers.map((customer) => (
              <div 
                key={customer.id} 
                onClick={() => navigate(`/clientes/${customer.id}`)}
                className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm flex items-center justify-between active:bg-violet-50/40 cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800 text-sm">{customer.name}</span>
                  <span className="font-mono text-slate-500 text-xs">{formatPhone(customer.phone)}</span>
                  <span className="text-slate-400 text-[10px] mt-1">Cadastro: {new Date(customer.createdAt).toLocaleDateString("pt-BR")}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden overflow-x-auto">
            <Table className="min-w-[600px]">
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-bold text-slate-600 pl-6">Nome</TableHead>
                <TableHead className="font-bold text-slate-600">Telefone</TableHead>
                <TableHead className="font-bold text-slate-600">Cadastro</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow 
                  key={customer.id} 
                  onClick={() => navigate(`/clientes/${customer.id}`)}
                  className="group cursor-pointer hover:bg-violet-50/40 transition-colors"
                >
                  <TableCell className="pl-6">
                    <div className="font-bold text-slate-700">{customer.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-500 font-mono tracking-tight">{formatPhone(customer.phone)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-500">
                      {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 group-hover:bg-violet-600 group-hover:text-white group-hover:border-violet-600 transition-all shrink-0">
                      <ArrowRight className="h-4 w-4" />
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
