import { useState, useEffect, useCallback, useMemo } from "react";
import { GoogleMap, Marker, InfoWindow, DirectionsRenderer } from "@react-google-maps/api";
import { useOrders } from "@/hooks/useOrders";
import { useSettings } from "@/hooks/useSettings";
import { Loader2, MapPin } from "lucide-react";
import { Order } from "@/types/order";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import OrderDetailDrawer from "@/components/OrderDetailDrawer";
import { buildImageUrl } from "@/utils/image-url";
import { io } from "socket.io-client";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";
import { Courier, couriersService } from "@/services/couriers.service";
import { toast } from "sonner";
import { Send, Bike } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const paymentLabels: Record<string, string> = {
  PIX: "Pix",
  pix: "Pix",
  "Cartão de Crédito": "Cartão de Crédito",
  credit: "Cartão de Crédito",
  credito: "Cartão de Crédito",
  "Cartão de Débito": "Cartão de Débito",
  debit: "Cartão de Débito",
  debito: "Cartão de Débito",
  Dinheiro: "Dinheiro",
  cash: "Dinheiro",
  dinheiro: "Dinheiro",
};

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "1rem",
};

// Default center
const defaultCenter = {
  lat: -23.55052,
  lng: -46.633308,
};

// Simple Geocoding cache to avoid hitting limits
const geocodeCache: Record<string, google.maps.LatLngLiteral> = {};

type RouteGroup = {
  id: number;
  directions: google.maps.DirectionsResult;
  optimizedOrders: (Order & { lat: number; lng: number })[];
};

// Colors for multiple routes
const routeColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

export default function DeliveryMapPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [markers, setMarkers] = useState<(Order & { lat: number; lng: number })[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [routes, setRoutes] = useState<RouteGroup[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<(Order & { lat: number; lng: number }) | null>(null);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [storeLocation, setStoreLocation] = useState<{ lat: number; lng: number } | null>(null);

  const deleteTransactionMutation = useMutation({
    mutationFn: (txId: string) => couriersService.deleteTransaction(txId),
    onSuccess: () => {
      toast.success("Rota/Lançamento excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    }
  });

  const [sendRouteModal, setSendRouteModal] = useState<{ open: boolean, routeId: number | null }>({ open: false, routeId: null });
  const [selectedCourierId, setSelectedCourierId] = useState<string>("");
  const [deliveryFee, setDeliveryFee] = useState<string>("");

  const { data: couriers } = useQuery({
    queryKey: ['couriers'],
    queryFn: () => couriersService.getCouriers()
  });

  const registerFeeMutation = useMutation({
    mutationFn: (data: { courierId: string; amount: number; description: string }) => couriersService.registerFee(data),
    onSuccess: () => {
      toast.success("Taxa registrada para o motoboy!");
      if (sendRouteModal.routeId) {
        setRoutes((prev) => prev.filter((r) => r.id !== sendRouteModal.routeId));
      }
      setSendRouteModal({ open: false, routeId: null });
      setDeliveryFee("");
      setSelectedCourierId("");
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error("Erro ao registrar taxa")
  });

  // Fetch a generous amount of recent orders to find the active ones
  const { data: ordersData, isLoading: isLoadingOrders } = useOrders("", "ALL", "", "", 1, 200);
  const { data: settings } = useSettings();
  const queryClient = useQueryClient();

  // Socket.io for Real-time Orders Update
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_ADMIN_API?.replace(/\/api$/, '') || 'http://localhost:3000';
    const socket = io(socketUrl);

    socket.on('connect', () => {
      console.log('Connected to websocket server for order updates');
    });

    socket.on('order.new', () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    });

    socket.on('order.updated', (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      if (order && order.id) {
        queryClient.invalidateQueries({ queryKey: ["orders", order.id] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const activeOrders = useMemo(() => {
    if (!ordersData?.data) return [];
    return ordersData.data.filter(
      (order) => order.status === "PENDING" || order.status === "CONFIRMED" 
    );
  }, [ordersData]);

  useEffect(() => {
    if (!activeOrders.length) return;
    if (!window.google?.maps) return;

    const geocoder = new window.google.maps.Geocoder();
    let isMounted = true;

    const geocodeOrders = async () => {
      setGeocoding(true);
      const newMarkers: (Order & { lat: number; lng: number })[] = [];

      for (const order of activeOrders) {
        if (!isMounted) break;
        const addressStr = `${order.street}, ${order.number} - ${order.neighborhood}, ${order.city} - ${order.state}, ${order.cep}`;
        
        if (geocodeCache[addressStr]) {
          newMarkers.push({ ...order, ...geocodeCache[addressStr] });
          continue;
        }

        try {
          const result = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address: addressStr }, (results, status) => {
              if (status === "OK" && results) {
                resolve(results);
              } else {
                reject(status);
              }
            });
          });

          if (result && result.length > 0) {
            const location = result[0].geometry.location;
            const coords = { lat: location.lat(), lng: location.lng() };
            geocodeCache[addressStr] = coords;
            newMarkers.push({ ...order, ...coords });
          }
          
          await new Promise((r) => setTimeout(r, 300));
        } catch (error) {
          console.error("Geocoding error for address: ", addressStr, error);
        }
      }

      if (isMounted) {
        setMarkers(newMarkers);
        // Do not auto-select everything on refresh to allow multi-routes easily
        if (routes.length === 0 && selectedOrderIds.size === 0) {
          setSelectedOrderIds(new Set(newMarkers.map(m => m.id)));
        }
        setGeocoding(false);
      }
    };

    geocodeOrders();

    return () => {
      isMounted = false;
    };
  }, [activeOrders]); // purposefully excluded routes/selectedOrderIds to avoid refetch loops

  useEffect(() => {
    if (!settings || !window.google?.maps) return;
    
    let addressStr = "";
    if (settings.street && settings.city) {
      addressStr = `${settings.street}, ${settings.number || ""} - ${settings.neighborhood || ""}, ${settings.city} - ${settings.state || ""}, ${settings.cep || ""}`;
    } else if (settings.deliveryOriginCep) {
      addressStr = settings.deliveryOriginCep;
    } else if (settings.cep) {
      addressStr = settings.cep;
    } else if (settings.city) {
      addressStr = `${settings.city} - ${settings.state || "BR"}`;
    } else {
      return;
    }

    if (geocodeCache[addressStr]) {
      setStoreLocation(geocodeCache[addressStr]);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: addressStr }, (results, status) => {
      if (status === "OK" && results && results.length > 0) {
        const coords = { lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng() };
        geocodeCache[addressStr] = coords;
        setStoreLocation(coords);
      }
    });
  }, [settings, window.__googleMapsLoaded]);

  const routedOrderIds = useMemo(() => new Set(routes.flatMap(r => r.optimizedOrders.map(o => o.id))), [routes]);
  
  // Assigned orders grouped by courierTransactionId
  const assignedRoutes = useMemo(() => {
    const groups: Record<string, typeof markers> = {};
    markers.forEach(m => {
      if (m.courierTransactionId) {
        if (!groups[m.courierTransactionId]) groups[m.courierTransactionId] = [];
        groups[m.courierTransactionId].push(m);
      }
    });
    return Object.entries(groups).map(([txId, orders]) => ({
      txId,
      orders,
      courierName: (orders[0] as any).courier?.name || "Desconhecido"
    }));
  }, [markers]);

  const assignedOrderIds = useMemo(() => new Set(markers.filter(m => !!m.courierTransactionId).map(m => m.id)), [markers]);

  const availableMarkers = useMemo(() => markers.filter(m => !routedOrderIds.has(m.id) && !assignedOrderIds.has(m.id)), [markers, routedOrderIds, assignedOrderIds]);

  const handleCalculateRoute = useCallback(() => {
    const selectedMarkers = availableMarkers.filter(m => selectedOrderIds.has(m.id));
    if (!window.google?.maps || selectedMarkers.length < 1) return;

    const directionsService = new window.google.maps.DirectionsService();

    let origin: google.maps.LatLngLiteral;
    let destination: google.maps.LatLngLiteral;
    let waypoints: google.maps.DirectionsWaypoint[] = [];

    if (storeLocation) {
      origin = storeLocation;
      
      const requiresReturn = selectedMarkers.some(m => {
        if (m.paymentStatus === 'PAID') return false; // Já pago, não precisa voltar maquininha/troco
        const method = m.paymentMethod?.toLowerCase() || "";
        return !method.includes("pix"); // Se não for PIX, precisa voltar
      });

      if (requiresReturn) {
        // Volta pra loja
        destination = storeLocation;
        waypoints = selectedMarkers.map((m) => ({
          location: { lat: m.lat, lng: m.lng },
          stopover: true,
        }));
      } else {
        // Encontra o mais distante para ser o destino (TSP aberto)
        let furthestMarker = selectedMarkers[0];
        let maxDist = -1;
        selectedMarkers.forEach(m => {
           const dist = Math.pow(m.lat - storeLocation.lat, 2) + Math.pow(m.lng - storeLocation.lng, 2);
           if (dist > maxDist) { maxDist = dist; furthestMarker = m; }
        });
        destination = { lat: furthestMarker.lat, lng: furthestMarker.lng };
        waypoints = selectedMarkers.filter(m => m.id !== furthestMarker.id).map((m) => ({
          location: { lat: m.lat, lng: m.lng },
          stopover: true,
        }));
      }
    } else {
      origin = { lat: selectedMarkers[0].lat, lng: selectedMarkers[0].lng };
      destination = { lat: selectedMarkers[selectedMarkers.length - 1].lat, lng: selectedMarkers[selectedMarkers.length - 1].lng };
      waypoints = selectedMarkers.slice(1, -1).map((m) => ({
        location: { lat: m.lat, lng: m.lng },
        stopover: true,
      }));
    }

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        optimizeWaypoints: true,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK && result) {
          const order = result.routes[0].waypoint_order;
          let optimizedOrders: any[] = [];
          
          if (storeLocation) {
            const requiresReturn = selectedMarkers.some(m => {
              if (m.paymentStatus === 'PAID') return false;
              const method = m.paymentMethod?.toLowerCase() || "";
              return !method.includes("pix");
            });

            if (requiresReturn) {
              optimizedOrders = order.map((idx: number) => selectedMarkers[idx]);
            } else {
              // destination was furthest
              let furthestMarker = selectedMarkers[0];
              let maxDist = -1;
              selectedMarkers.forEach(m => {
                 const dist = Math.pow(m.lat - storeLocation.lat, 2) + Math.pow(m.lng - storeLocation.lng, 2);
                 if (dist > maxDist) { maxDist = dist; furthestMarker = m; }
              });
              const otherMarkers = selectedMarkers.filter(m => m.id !== furthestMarker.id);
              optimizedOrders = [...order.map((idx: number) => otherMarkers[idx]), furthestMarker];
            }
          } else {
            const waypointsArr = selectedMarkers.slice(1, -1);
            optimizedOrders = [selectedMarkers[0], ...order.map((idx: number) => waypointsArr[idx]), selectedMarkers[selectedMarkers.length - 1]];
          }

          setRoutes(prev => [...prev, {
            id: prev.length > 0 ? Math.max(...prev.map(r => r.id)) + 1 : 1,
            directions: result,
            optimizedOrders
          }]);
          setSelectedOrderIds(new Set()); // clean for next
        } else {
          console.error(`Error calculating directions: ${status}`);
        }
      }
    );
  }, [availableMarkers, selectedOrderIds, storeLocation]);

  const toggleOrderSelection = (id: string) => {
    const newSet = new Set(selectedOrderIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedOrderIds(newSet);
  };

  const toggleAllOrders = () => {
    if (selectedOrderIds.size === availableMarkers.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(availableMarkers.map(m => m.id)));
    }
  };

  if (!window.__googleMapsLoaded) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white/40 border border-slate-200/50 rounded-2xl">
        <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
        <p className="text-sm font-semibold text-slate-500">Aguardando o carregamento do Google Maps...</p>
      </div>
    );
  }

  const mapCenter = storeLocation || (markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Mapa de Entregas</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Agrupe pedidos em rotas e otimize as entregas.
          </p>
        </div>
        <div className="flex gap-2">
          {routes.length > 0 && (
            <Button
              variant="outline"
              className="rounded-xl h-11 px-5 font-bold shadow-sm md:w-auto"
              onClick={() => { setRoutes([]); setSelectedOrderIds(new Set(markers.map(m => m.id))); }}
            >
              Limpar Todas as Rotas
            </Button>
          )}
          <Button
            className="rounded-xl h-11 px-5 font-bold shadow-sm w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleCalculateRoute}
            disabled={selectedOrderIds.size < 1}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Criar Rota {routes.length + 1}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
        {/* Sidebar List */}
        <div className="lg:col-span-1 bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col h-full overflow-hidden">
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-4 pb-4">
              
              {routes.map((route, routeIndex) => {
                const color = routeColors[routeIndex % routeColors.length];
                return (
                  <div key={route.id} className="mb-6">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-extrabold uppercase tracking-wider" style={{ color }}>Rota {route.id}</h4>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 text-indigo-500 hover:text-indigo-600 px-2 text-[10px] font-bold" onClick={() => {
                          const fee = route.optimizedOrders.reduce((acc, o) => acc + (Number(o.freight) || 0), 0);
                          setDeliveryFee(fee > 0 ? fee.toString() : "");
                          
                          let defaultCourier = "";
                          if (couriers && couriers.filter(c => c.isActive).length === 1) {
                            defaultCourier = couriers.filter(c => c.isActive)[0].id;
                          }
                          setSelectedCourierId(defaultCourier);
                          setSendRouteModal({ open: true, routeId: route.id });
                        }}>
                          <Send className="w-3 h-3 mr-1" /> Enviar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-red-500 hover:text-red-600 px-2 text-[10px] font-bold" onClick={() => {
                          setRoutes(routes.filter(r => r.id !== route.id));
                        }}>Excluir</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {route.optimizedOrders.map((marker, index) => (
                        <div key={marker.id} className="flex flex-col p-3 rounded-lg border bg-white shadow-sm cursor-pointer hover:border-slate-300 transition-colors" style={{ borderLeftWidth: '4px', borderLeftColor: color }} onClick={() => setSelectedMarker(marker)}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Parada {index + 1} - {String.fromCharCode(65 + index)}</span>
                            <span className="text-xs font-mono font-bold text-slate-400">#{marker.orderNumber}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">{marker.customerName}</p>
                          <p className="text-[10px] uppercase font-bold mt-1" style={{ color: (marker.paymentMethod?.toLowerCase().includes("pix") || marker.paymentStatus === 'PAID') ? "#10b981" : "#f59e0b" }}>
                            {marker.paymentStatus === 'PAID' ? 'PAGO' : (paymentLabels[marker.paymentMethod] || marker.paymentMethod)}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">
                            {marker.street}, {marker.number} - {marker.neighborhood}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Rotas já salvas/atribuídas */}
              {assignedRoutes.map((ar, i) => {
                const color = "#94a3b8"; // cinza para rotas já salvas
                return (
                  <div key={ar.txId} className="mb-6 opacity-80">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-extrabold uppercase tracking-wider text-slate-500">
                        Atribuída: {ar.courierName}
                      </h4>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-6 text-blue-500 hover:text-blue-600 px-2 text-[10px] font-bold" onClick={() => {
                          const courier = couriers?.find(c => c.name === ar.courierName);
                          if (!courier) {
                            toast.error("Motoboy não encontrado para reenviar mensagem");
                            return;
                          }
                          
                          let wppText = `*ROTA DE ENTREGAS - Podemais (Reenvio)*\nMotoboy: ${courier.name}\n\n`;
                          
                          const stops = ar.orders.map((o: any) => `${o.lat},${o.lng}`);
                          if (storeLocation) {
                            stops.unshift(`${storeLocation.lat},${storeLocation.lng}`);
                          }
                          const mapsUrl = `https://www.google.com/maps/dir/${stops.join('/')}`;

                          ar.orders.forEach((o: any, i: number) => {
                            wppText += `*PARADA ${i + 1} - ${String.fromCharCode(65 + i)}*\n`;
                            wppText += `- Nome: ${o.customerName}\n`;
                            wppText += `- Fone: ${o.customerPhone}\n`;
                            wppText += `- Endereço: ${o.street}, ${o.number}${o.complement ? ` (${o.complement})` : ''} - ${o.neighborhood}, ${o.city}\n`;
                            wppText += `- Pagamento: ${o.paymentStatus === 'PAID' ? 'PAGO' : (paymentLabels[o.paymentMethod] || o.paymentMethod)}\n`;
                            if (o.paymentStatus !== 'PAID') {
                              wppText += `- Valor a cobrar: R$ ${Number(o.totalOrder).toFixed(2).replace('.', ',')}\n`;
                              if ((o.paymentMethod?.toLowerCase() === 'cash' || o.paymentMethod?.toLowerCase() === 'dinheiro') && o.changeAmount > 0) {
                                wppText += `  *Levar troco:* R$ ${Number(o.changeAmount).toFixed(2).replace('.', ',')}\n`;
                                wppText += `  (Cliente dará R$ ${Number(o.amountProvided).toFixed(2).replace('.', ',')})\n`;
                              }
                            }
                            wppText += `\n`;
                          });

                          wppText += `*Link da Rota no Maps:* \n${mapsUrl}\n`;

                          window.open(`https://wa.me/${courier.phone.replace(/\D/g, '')}?text=${encodeURIComponent(wppText)}`, '_blank');
                        }}>
                          <Send className="w-3 h-3 mr-1" /> Reenviar
                        </Button>
                        <Button variant="ghost" size="sm" className="h-6 text-red-500 hover:text-red-600 px-2 text-[10px] font-bold" onClick={() => {
                          if (confirm("Deseja excluir esta rota e o lançamento do motoboy?")) {
                            deleteTransactionMutation.mutate(ar.txId);
                          }
                        }}>Excluir</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {ar.orders.map((marker, index) => (
                        <div key={marker.id} className="flex flex-col p-3 rounded-lg border bg-slate-50 shadow-sm cursor-pointer" style={{ borderLeftWidth: '4px', borderLeftColor: color }} onClick={() => setSelectedMarker(marker)}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded uppercase tracking-wider">Salva - {index + 1}</span>
                            <span className="text-xs font-mono font-bold text-slate-400">#{marker.orderNumber}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-600 leading-tight">{marker.customerName}</p>
                          <p className="text-[10px] uppercase font-bold mt-1 text-slate-400">
                            {marker.paymentStatus === 'PAID' ? 'PAGO' : (paymentLabels[marker.paymentMethod] || marker.paymentMethod)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div>
                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                  <h4 className="text-sm font-extrabold text-slate-700 uppercase tracking-wider">
                    {routes.length > 0 ? "Fora das Rotas" : "Pedidos Pendentes"}
                  </h4>
                  {availableMarkers.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={toggleAllOrders} className="text-[10px] font-bold h-6 uppercase text-blue-600">
                      {selectedOrderIds.size === availableMarkers.length ? "Desmarcar Todos" : "Selecionar Todos"}
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {availableMarkers.length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">Nenhum pedido pendente.</p>
                  )}
                  {availableMarkers.map((marker) => (
                    <div key={marker.id} className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 bg-white shadow-sm hover:border-violet-300 transition-colors cursor-pointer" onClick={() => toggleOrderSelection(marker.id)}>
                      <Checkbox 
                        checked={selectedOrderIds.has(marker.id)} 
                        onCheckedChange={() => toggleOrderSelection(marker.id)}
                        className="mt-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                           <p className="text-sm font-bold text-slate-800 leading-tight">#{marker.orderNumber} - {marker.customerName}</p>
                           <span className="text-[10px] uppercase font-bold" style={{ color: (marker.paymentMethod?.toLowerCase().includes("pix") || marker.paymentStatus === 'PAID') ? "#10b981" : "#f59e0b" }}>
                             {marker.paymentStatus === 'PAID' ? 'PAGO' : (paymentLabels[marker.paymentMethod] || marker.paymentMethod)}
                           </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-snug">
                          {marker.street}, {marker.number} - {marker.neighborhood}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </ScrollArea>
        </div>

        {/* Map */}
        <div className="lg:col-span-3 bg-white/70 backdrop-blur-md p-2 md:p-4 rounded-2xl border border-slate-200/60 shadow-sm relative h-[400px] lg:h-full">
          {(isLoadingOrders || geocoding) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] rounded-2xl">
             <Loader2 className="h-10 w-10 animate-spin text-violet-600" />
             <p className="text-sm font-bold text-slate-700 mt-2">
               {isLoadingOrders ? "Buscando pedidos..." : "Localizando endereços no mapa..."}
             </p>
          </div>
        )}
        
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={14}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
          }}
        >
          {routes.map((route, i) => (
            <DirectionsRenderer
              key={route.id}
              directions={route.directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: routeColors[i % routeColors.length],
                  strokeWeight: 5,
                  strokeOpacity: 0.8
                }
              }}
            />
          ))}

          {/* Render custom markers for routed orders so Parada 1 is 'A', Parada 2 is 'B', etc. */}
          {routes.map((route, i) => {
            const color = routeColors[i % routeColors.length];
            return route.optimizedOrders.map((marker, index) => (
              <Marker
                key={`route-${route.id}-marker-${marker.id}`}
                position={{ lat: marker.lat, lng: marker.lng }}
                onClick={() => setSelectedMarker(marker)}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 14,
                  fillColor: color,
                  fillOpacity: 1,
                  strokeColor: "white",
                  strokeWeight: 2,
                }}
                label={{
                  text: String.fromCharCode(65 + index), // 0 -> 'A', 1 -> 'B', ...
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              zIndex={200 + i}
            />
          ));
        })}

        {assignedRoutes.map((ar) => (
          ar.orders.map((marker) => (
            <Marker
              key={`assigned-${marker.id}`}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelectedMarker(marker)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#94a3b8",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
              zIndex={150}
            />
          ))
        ))}

        {storeLocation && (
            <Marker
              position={storeLocation}
              icon={settings?.logoUrl ? {
                url: buildImageUrl(settings.logoUrl),
                scaledSize: new window.google.maps.Size(40, 40),
                origin: new window.google.maps.Point(0, 0),
                anchor: new window.google.maps.Point(20, 20),
              } : {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: "#4f46e5",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 3,
              }}
              label={{
                text: "LOJA",
                color: settings?.logoUrl ? "#1e293b" : "white",
                fontWeight: "bold",
                fontSize: "10px",
                className: settings?.logoUrl 
                  ? "mt-12 bg-white px-1.5 py-0.5 rounded shadow-md border border-slate-200" 
                  : "mt-8 bg-indigo-600 px-1 rounded",
              }}
              zIndex={999}
            />
          )}

          {availableMarkers.map((marker) => {
            const isSelected = selectedOrderIds.has(marker.id);
            return (
              <Marker
                key={marker.id}
                position={{ lat: marker.lat, lng: marker.lng }}
                onClick={() => setSelectedMarker(marker)}
                opacity={isSelected ? 1 : 0.85}
                label={{
                  text: marker.orderNumber.toString(),
                  color: isSelected ? "white" : "#ffe4e6", // a faint white/pink to contrast the red pin
                  fontWeight: "bold",
                  fontSize: "12px",
                }}
              />
            );
          })}

          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2 max-w-[200px] text-slate-800">
                <div className="font-bold text-sm mb-1">Pedido #{selectedMarker.orderNumber}</div>
                <div className="text-xs mb-1 font-semibold">{selectedMarker.customerName}</div>
                <div className="text-[10px] uppercase font-bold text-slate-500 mb-1">Pagamento: {selectedMarker.paymentMethod}</div>
                <div className="text-xs text-slate-500 mb-3 leading-snug">
                  {selectedMarker.street}, {selectedMarker.number}<br/>
                  {selectedMarker.neighborhood} - {selectedMarker.city}
                </div>
                <Button 
                  size="sm" 
                  className="w-full h-8 text-xs font-bold" 
                  onClick={() => setSelectedOrderId(selectedMarker.id)}
                >
                  Ver Detalhes
                </Button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
      </div>

      <OrderDetailDrawer 
        orderId={selectedOrderId} 
        isOpen={!!selectedOrderId} 
        onClose={() => setSelectedOrderId(null)}
      />

      <Dialog open={sendRouteModal.open} onOpenChange={(val) => setSendRouteModal({ open: val, routeId: sendRouteModal.routeId })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Rota para Motoboy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-sm font-semibold mb-1 block">Selecione o Motoboy</label>
              <Select value={selectedCourierId} onValueChange={setSelectedCourierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um motoboy" />
                </SelectTrigger>
                <SelectContent>
                  {couriers?.filter(c => c.isActive).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold mb-1 block">Valor da Entrega (Taxa para o Motoboy)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                <Input 
                  type="text" 
                  value={deliveryFee !== "" ? new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(deliveryFee)) : ""} 
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setDeliveryFee(digits ? (Number(digits) / 100).toString() : "");
                  }} 
                  className="pl-9"
                  placeholder="0,00" 
                />
              </div>
            </div>
            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700" 
              disabled={!selectedCourierId || !deliveryFee || registerFeeMutation.isPending}
              onClick={() => {
                if (!selectedCourierId || !deliveryFee) return;
                const route = routes.find(r => r.id === sendRouteModal.routeId);
                if (!route) return;

                const courier = couriers?.find(c => c.id === selectedCourierId);
                if (!courier) return;

                // 1. Generate text and open WhatsApp
                let wppText = `*ROTA DE ENTREGAS - Podemais*\nMotoboy: ${courier.name}\n\n`;
                
                // For Google Maps multi-stop
                const stops = route.optimizedOrders.map(o => `${o.lat},${o.lng}`);
                if (storeLocation) {
                  stops.unshift(`${storeLocation.lat},${storeLocation.lng}`);
                }
                const mapsUrl = `https://www.google.com/maps/dir/${stops.join('/')}`;

                route.optimizedOrders.forEach((o, i) => {
                  wppText += `*PARADA ${i + 1} - ${String.fromCharCode(65 + i)}*\n`;
                  wppText += `- Nome: ${o.customerName}\n`;
                  wppText += `- Fone: ${o.customerPhone}\n`;
                  wppText += `- Endereço: ${o.street}, ${o.number}${o.complement ? ` (${o.complement})` : ''} - ${o.neighborhood}, ${o.city}\n`;
                  wppText += `- Pagamento: ${o.paymentStatus === 'PAID' ? 'PAGO' : (paymentLabels[o.paymentMethod] || o.paymentMethod)}\n`;
                  if (o.paymentStatus !== 'PAID') {
                    wppText += `- Valor a cobrar: R$ ${Number(o.totalOrder).toFixed(2).replace('.', ',')}\n`;
                    if ((o.paymentMethod?.toLowerCase() === 'cash' || o.paymentMethod?.toLowerCase() === 'dinheiro') && (o as any).changeAmount > 0) {
                      wppText += `  *Levar troco:* R$ ${Number((o as any).changeAmount).toFixed(2).replace('.', ',')}\n`;
                      wppText += `  (Cliente dará R$ ${Number((o as any).amountProvided).toFixed(2).replace('.', ',')})\n`;
                    }
                  }
                  wppText += `\n`;
                });

                wppText += `*Valor Total Entrega:* R$ ${Number(deliveryFee).toFixed(2).replace('.', ',')}\n\n`;
                wppText += `*Link da Rota no Maps:* \n${mapsUrl}\n`;

                window.open(`https://wa.me/${courier.phone.replace(/\D/g, '')}?text=${encodeURIComponent(wppText)}`, '_blank');

                // 2. Register Fee in Backend
                registerFeeMutation.mutate({
                  courierId: selectedCourierId,
                  amount: parseFloat(deliveryFee.replace(',', '.')),
                  description: `Taxa Rota ${route.id} (${route.optimizedOrders.length} paradas)`,
                  orderIds: route.optimizedOrders.map(o => o.id)
                });
              }}
            >
              {registerFeeMutation.isPending ? "Registrando..." : (
                <><Bike className="w-4 h-4 mr-2" /> Enviar Rota e Registrar Taxa</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
