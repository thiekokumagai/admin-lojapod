import { useState, useEffect, useRef } from "react";
import { 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  CheckCircle2, 
  LocateFixed, 
  Search, 
  Loader2, 
  EyeOff, 
  Eye, 
  Navigation,
  Info
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import useAddressAutocomplete from "@/hooks/use-address-autocomplete";
import { SavedStoreAddress, StoreSettings } from "@/types/settings";

interface StoreAddressesManagerProps {
  settings: StoreSettings | undefined;
  onSaveActiveAddress: (updatedPayload: Partial<StoreSettings>) => Promise<void>;
  isSaving?: boolean;
}

const extractAddressPart = (components: any[], types: string[]) => {
  const component = components?.find((item) => types.some((type) => item.types.includes(type)));
  return component?.long_name ?? "";
};

const extractAddressShortPart = (components: any[], types: string[]) => {
  const component = components?.find((item) => types.some((type) => item.types.includes(type)));
  return component?.short_name ?? component?.long_name ?? "";
};

const waitForGoogleMaps = async () => {
  if (typeof window !== "undefined" && (window as any).google?.maps) return true;
  return new Promise<boolean>((resolve) => {
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts++;
      if ((window as any).google?.maps || attempts >= 30) {
        window.clearInterval(interval);
        resolve(!!(window as any).google?.maps);
      }
    }, 200);
  });
};

export function StoreAddressesManager({
  settings,
  onSaveActiveAddress,
  isSaving = false,
}: StoreAddressesManagerProps) {
  const [addresses, setAddresses] = useState<SavedStoreAddress[]>([]);
  const [hideAddress, setHideAddress] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);

  // Campos do formulário do modal
  const [formTitle, setFormTitle] = useState("");
  const [formCep, setFormCep] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formNeighborhood, setFormNeighborhood] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");
  const [formComplement, setFormComplement] = useState("");
  const [formSetAsActive, setFormSetAsActive] = useState(true);

  // Estados de busca por endereço
  const [searchQuery, setSearchQuery] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);

  // Inicialização e migração suave de endereços já cadastrados
  useEffect(() => {
    if (!settings) return;

    setHideAddress(!!settings.hideAddress);

    const saved = settings.savedStoreAddresses;
    if (Array.isArray(saved) && saved.length > 0) {
      setAddresses(saved);
    } else {
      // Se não há lista cadastrada ainda, aproveita os dados atuais da loja para não perder nada!
      const initialStreet = (settings.street || "").trim();
      const initialCep = (settings.deliveryOriginCep || settings.cep || "").trim();
      const initialNumber = (settings.deliveryOriginNumber || settings.number || "").trim();

      if (initialStreet || initialCep) {
        const defaultAddress: SavedStoreAddress = {
          id: "default-" + Math.random().toString(36).substring(2, 9),
          title: "Endereço Principal",
          street: initialStreet || "Endereço da Loja",
          number: initialNumber,
          neighborhood: settings.neighborhood || "",
          city: settings.city || "",
          state: settings.state || "",
          cep: initialCep,
          complement: settings.complement || "",
          isActive: true,
        };
        setAddresses([defaultAddress]);
      } else {
        setAddresses([]);
      }
    }
  }, [settings]);

  // Hook de autocomplete do Google
  const { predictions, loading: isSearchingGoogle, handleSelect } = useAddressAutocomplete({
    value: searchQuery,
    searchSuffix: settings?.searchSuffix,
    searchCity: settings?.searchCity,
    searchState: settings?.searchState,
    restrictToCity: settings?.restrictToCity,
    onSelect: async (p) => {
      setSearchQuery("");
      setFormStreet(p.mainText.split(",")[0].trim());
      setFormNeighborhood(p.secondaryText.split(",")[0]?.trim() || "");

      // Tenta extrair número digitado na busca
      const matchNumber = searchQuery.match(/(?:,|\s)(\d{1,6})\b/);
      if (matchNumber) {
        setFormNumber(matchNumber[1]);
      }

      try {
        const mapsReady = await waitForGoogleMaps();
        if (mapsReady) {
          const geocoder = new (window as any).google.maps.Geocoder();
          const response = await geocoder.geocode({ placeId: p.placeId });
          const result = response.results?.[0];
          if (result) {
            const comps = result.address_components;
            const fetchedCity = extractAddressPart(comps, ["administrative_area_level_2", "locality"]);
            const fetchedState = extractAddressShortPart(comps, ["administrative_area_level_1"]);
            const fetchedPostal = extractAddressPart(comps, ["postal_code"]);
            const fetchedStreetNum = extractAddressPart(comps, ["street_number"]);

            if (fetchedCity) setFormCity(fetchedCity);
            if (fetchedState) setFormState(fetchedState.toUpperCase());
            if (fetchedStreetNum && !matchNumber) setFormNumber(fetchedStreetNum);
            if (fetchedPostal) {
              const clean = fetchedPostal.replace(/\D/g, "");
              if (clean.length === 8) {
                setFormCep(`${clean.slice(0, 5)}-${clean.slice(5)}`);
              }
            }
          }
        }
      } catch (err) {
        console.error("Erro ao detalhar endereço selecionado", err);
      }

      setTimeout(() => numberInputRef.current?.focus(), 150);
    },
  });

  // Busca por GPS (Localização Atual)
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Não suportado",
        description: "Seu navegador não suporta geolocalização.",
      });
      return;
    }

    try {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const mapsReady = await waitForGoogleMaps();
            if (mapsReady) {
              const geocoder = new (window as any).google.maps.Geocoder();
              const response = await geocoder.geocode({
                location: { lat: latitude, lng: longitude },
              });
              const result = response.results?.[0];
              if (result) {
                const comps = result.address_components;
                const fetchedStreet = extractAddressPart(comps, ["route"]);
                const fetchedStreetNum = extractAddressPart(comps, ["street_number"]);
                const fetchedNeighborhood = extractAddressPart(comps, ["sublocality_level_1", "neighborhood"]);
                const fetchedCity = extractAddressPart(comps, ["administrative_area_level_2", "locality"]);
                const fetchedState = extractAddressShortPart(comps, ["administrative_area_level_1"]);
                const fetchedPostal = extractAddressPart(comps, ["postal_code"]);

                if (fetchedStreet) setFormStreet(fetchedStreet);
                if (fetchedStreetNum) setFormNumber(fetchedStreetNum);
                if (fetchedNeighborhood) setFormNeighborhood(fetchedNeighborhood);
                if (fetchedCity) setFormCity(fetchedCity);
                if (fetchedState) setFormState(fetchedState.toUpperCase());
                if (fetchedPostal) {
                  const clean = fetchedPostal.replace(/\D/g, "");
                  if (clean.length === 8) {
                    setFormCep(`${clean.slice(0, 5)}-${clean.slice(5)}`);
                  }
                }

                toast({
                  title: "Localização identificada!",
                  description: "Endereço preenchido com base na sua posição atual.",
                });
              } else {
                toast({
                  variant: "destructive",
                  title: "Endereço não localizado",
                  description: "Não foi possível converter a localização em endereço.",
                });
              }
            }
          } catch (err) {
            console.error(err);
            toast({
              variant: "destructive",
              title: "Erro no GPS",
              description: "Falha ao obter os dados da localização atual.",
            });
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          setIsLocating(false);
          toast({
            variant: "destructive",
            title: "Permissão de GPS negada",
            description: "Permita o acesso à localização nas configurações do seu navegador.",
          });
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (e) {
      setIsLocating(false);
    }
  };

  // Formatação de CEP
  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .substring(0, 9);
  };

  const handleCEPChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setFormCep(formatted);

    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();
        if (!data.erro) {
          if (data.logradouro) setFormStreet(data.logradouro);
          if (data.bairro) setFormNeighborhood(data.bairro);
          if (data.localidade) setFormCity(data.localidade);
          if (data.uf) setFormState(data.uf);
          setTimeout(() => numberInputRef.current?.focus(), 100);
        }
      } catch (err) {
        // Silêncio
      }
    }
  };

  // Abrir modal para novo endereço
  const handleOpenNewModal = () => {
    setEditingAddressId(null);
    setFormTitle(addresses.length === 0 ? "Endereço Principal" : "");
    setFormCep("");
    setFormStreet("");
    setFormNumber("");
    setFormNeighborhood("");
    setFormCity(settings?.city || "");
    setFormState(settings?.state || "");
    setFormComplement("");
    setFormSetAsActive(addresses.length === 0);
    setSearchQuery("");
    setIsModalOpen(true);
  };

  // Abrir modal para edição
  const handleOpenEditModal = (addr: SavedStoreAddress) => {
    setEditingAddressId(addr.id);
    setFormTitle(addr.title || "");
    setFormCep(addr.cep || "");
    setFormStreet(addr.street || "");
    setFormNumber(addr.number || "");
    setFormNeighborhood(addr.neighborhood || "");
    setFormCity(addr.city || "");
    setFormState(addr.state || "");
    setFormComplement(addr.complement || "");
    setFormSetAsActive(!!addr.isActive);
    setSearchQuery("");
    setIsModalOpen(true);
  };

  // Salvar novo endereço ou edição
  const handleSaveAddressModal = async () => {
    const cleanTitle = formTitle.trim();
    if (!cleanTitle) {
      toast({
        variant: "destructive",
        title: "Título obrigatório",
        description: "Dê um título ao endereço (ex: Loja Centro, Ponto Móvel).",
      });
      return;
    }

    const cleanStreet = formStreet.trim();
    const cleanCep = formCep.replace(/\D/g, "");

    if (!cleanStreet) {
      toast({
        variant: "destructive",
        title: "Logradouro obrigatório",
        description: "Informe a rua ou logradouro deste endereço.",
      });
      return;
    }

    if (cleanCep && cleanCep.length !== 8) {
      toast({
        variant: "destructive",
        title: "CEP inválido",
        description: "O CEP deve possuir 8 dígitos para o cálculo de frete.",
      });
      return;
    }

    const addressData: SavedStoreAddress = {
      id: editingAddressId || ("addr-" + Math.random().toString(36).substring(2, 9)),
      title: cleanTitle,
      cep: formCep.trim(),
      street: cleanStreet,
      number: formNumber.trim(),
      neighborhood: formNeighborhood.trim(),
      city: formCity.trim(),
      state: formState.trim().toUpperCase(),
      complement: formComplement.trim(),
      isActive: formSetAsActive || addresses.length === 0,
    };

    let updatedList: SavedStoreAddress[];

    if (editingAddressId) {
      updatedList = addresses.map((a) => {
        if (a.id === editingAddressId) {
          return {
            ...addressData,
            isActive: formSetAsActive ? true : a.isActive,
          };
        }
        return formSetAsActive ? { ...a, isActive: false } : a;
      });
    } else {
      if (formSetAsActive || addresses.length === 0) {
        updatedList = addresses.map((a) => ({ ...a, isActive: false }));
        updatedList.push({ ...addressData, isActive: true });
      } else {
        updatedList = [...addresses, addressData];
      }
    }

    // Se nenhum estiver ativo, ativa o primeiro
    if (!updatedList.some((a) => a.isActive) && updatedList.length > 0) {
      updatedList[0].isActive = true;
    }

    const activeAddr = updatedList.find((a) => a.isActive) || updatedList[0];

    try {
      await onSaveActiveAddress({
        savedStoreAddresses: updatedList,
        hideAddress,
        street: activeAddr.street,
        number: activeAddr.number,
        neighborhood: activeAddr.neighborhood,
        city: activeAddr.city,
        state: activeAddr.state,
        cep: activeAddr.cep,
        complement: activeAddr.complement || null,
        deliveryOriginCep: activeAddr.cep || null,
        deliveryOriginNumber: activeAddr.number || null,
      });

      setAddresses(updatedList);
      setIsModalOpen(false);

      toast({
        title: "Endereço salvo com sucesso!",
        description: `O local "${cleanTitle}" foi armazenado na sua lista.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: err.message || "Não foi possível salvar o endereço.",
      });
    }
  };

  // Alternar endereço ativo
  const handleSetActive = async (addrId: string) => {
    const updatedList = addresses.map((a) => ({
      ...a,
      isActive: a.id === addrId,
    }));

    const activeAddr = updatedList.find((a) => a.isActive);
    if (!activeAddr) return;

    try {
      await onSaveActiveAddress({
        savedStoreAddresses: updatedList,
        hideAddress,
        street: activeAddr.street,
        number: activeAddr.number,
        neighborhood: activeAddr.neighborhood,
        city: activeAddr.city,
        state: activeAddr.state,
        cep: activeAddr.cep,
        complement: activeAddr.complement || null,
        deliveryOriginCep: activeAddr.cep || null,
        deliveryOriginNumber: activeAddr.number || null,
      });

      setAddresses(updatedList);

      toast({
        title: "Ponto de partida atualizado!",
        description: `A loja agora opera em "${activeAddr.title}". O frete e o rodapé já utilizam este local.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao alternar local",
        description: err.message || "Falha ao definir endereço ativo.",
      });
    }
  };

  // Excluir endereço
  const handleDeleteAddress = async (addrId: string) => {
    if (addresses.length <= 1) {
      toast({
        variant: "destructive",
        title: "Não é possível excluir",
        description: "A loja precisa de pelo menos um endereço cadastrado.",
      });
      return;
    }

    const addrToDelete = addresses.find((a) => a.id === addrId);
    const updatedList = addresses.filter((a) => a.id !== addrId);

    // Se o que foi apagado era o ativo, ativa o primeiro restante
    if (addrToDelete?.isActive && updatedList.length > 0) {
      updatedList[0].isActive = true;
    }

    const activeAddr = updatedList.find((a) => a.isActive) || updatedList[0];

    try {
      await onSaveActiveAddress({
        savedStoreAddresses: updatedList,
        hideAddress,
        street: activeAddr.street,
        number: activeAddr.number,
        neighborhood: activeAddr.neighborhood,
        city: activeAddr.city,
        state: activeAddr.state,
        cep: activeAddr.cep,
        complement: activeAddr.complement || null,
        deliveryOriginCep: activeAddr.cep || null,
        deliveryOriginNumber: activeAddr.number || null,
      });

      setAddresses(updatedList);

      toast({
        title: "Endereço removido",
        description: `O endereço "${addrToDelete?.title}" foi removido da lista.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: err.message || "Falha ao excluir endereço.",
      });
    }
  };

  // Alternar hideAddress
  const handleToggleHideAddress = async (newValue: boolean) => {
    setHideAddress(newValue);
    try {
      await onSaveActiveAddress({
        hideAddress: newValue,
      });
      toast({
        title: newValue ? "Endereço oculto no rodapé" : "Endereço visível no rodapé",
        description: newValue
          ? "Os clientes não verão a rua/número no rodapé da loja pública."
          : "O endereço completo será exibido no rodapé da loja pública.",
      });
    } catch (err: any) {
      setHideAddress(!newValue);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: err.message || "Falha ao atualizar visibilidade.",
      });
    }
  };

  const activeAddress = addresses.find((a) => a.isActive);

  return (
    <div className="space-y-5">
      {/* Bloco de Apresentação e Cabeçalho da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-gradient-to-r from-muted/30 to-muted/10">
        <div>
          <h3 className="text-base font-bold flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Endereço da Loja &amp; Origem de Entregas
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cadastre os pontos de atendimento da sua loja. O endereço selecionado é a origem para o cálculo das rotas de frete e aparece no rodapé do seu site.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={handleOpenNewModal}
          className="shrink-0 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Adicionar Novo Local
        </Button>
      </div>

      {/* Switch: Ocultar endereço de loja física na loja pública */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-xs">
        <div className="space-y-0.5 pr-4">
          <div className="flex items-center gap-2">
            {hideAddress ? (
              <EyeOff className="h-4 w-4 text-amber-500" />
            ) : (
              <Eye className="h-4 w-4 text-emerald-500" />
            )}
            <Label className="font-semibold text-sm cursor-pointer select-none">
              Ocultar endereço físico na loja pública
            </Label>
          </div>
          <p className="text-xs text-muted-foreground">
            Quando ativado, os clientes não verão a rua e número no rodapé do site (mostra apenas Cidade - UF). O cálculo de frete por distância continua funcionando com precisão exata internamente.
          </p>
        </div>
        <Switch
          checked={hideAddress}
          onCheckedChange={handleToggleHideAddress}
          disabled={isSaving}
        />
      </div>

      {/* Lista de Endereços Cadastrados */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Locais Salvos ({addresses.length})
          </span>
          {activeAddress && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Operando agora: <strong>{activeAddress.title}</strong>
            </span>
          )}
        </div>

        {addresses.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed bg-muted/10 space-y-3">
            <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold text-sm">Nenhum endereço cadastrado ainda</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Cadastre o primeiro local para calcular o frete por distância e exibir no rodapé.
              </p>
            </div>
            <Button size="sm" onClick={handleOpenNewModal} className="mt-2">
              <Plus className="h-4 w-4 mr-1.5" />
              Cadastrar Endereço
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {addresses.map((addr) => {
              const isActive = !!addr.isActive;
              return (
                <div
                  key={addr.id}
                  className={`p-4 rounded-xl border transition-all duration-200 relative flex flex-col justify-between ${
                    isActive
                      ? "border-emerald-500 bg-emerald-500/5 shadow-sm ring-1 ring-emerald-500/30"
                      : "border-border/80 bg-card hover:border-muted-foreground/40 shadow-xs"
                  }`}
                >
                  <div className="space-y-2">
                    {/* Linha superior: Título e Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">
                            {addr.title}
                          </h4>
                          {isActive && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 text-white shadow-xs">
                              Ativo no Frete &amp; Rodapé
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação Rápida: Editar / Excluir */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenEditModal(addr)}
                          title="Editar este endereço"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {addresses.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteAddress(addr.id)}
                            title="Excluir este endereço"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Dados do Endereço */}
                    <div className="text-xs text-muted-foreground space-y-0.5 pt-1">
                      <p className="font-medium text-foreground/90">
                        {addr.street}
                        {addr.number ? `, ${addr.number}` : " (Sem número)"}
                        {addr.complement ? ` - ${addr.complement}` : ""}
                      </p>
                      <p>
                        {addr.neighborhood ? `${addr.neighborhood}, ` : ""}
                        {addr.city}
                        {addr.state ? ` - ${addr.state}` : ""}
                        {addr.cep ? ` | CEP: ${addr.cep}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Rodapé do Card: Ação de Ativação */}
                  <div className="pt-3 mt-3 border-t flex items-center justify-between">
                    {isActive ? (
                      <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4" />
                        Endereço ativo no momento
                      </span>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(addr.id)}
                        disabled={isSaving}
                        className="w-full text-xs font-medium hover:bg-primary hover:text-white transition-colors"
                      >
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                        Usar este endereço agora
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal / Dialog de Cadastro e Edição de Endereço */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto p-6">
          <DialogHeader className="space-y-1.5 pb-2 border-b">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {editingAddressId ? "Editar Local / Endereço" : "Adicionar Novo Local"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Cadastre o nome do ponto e a localização. Você poderá alternar de local quando quiser.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 1. Título do Endereço (Largura Total) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Título do Endereço <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ex: Loja Centro, Ponto Móvel, Depósito, Quiosque Shopping..."
                className="h-10 text-sm"
                autoFocus
              />
            </div>

            {/* 2. Busca Rápida: GPS e Autocomplete Google */}
            <div className="p-3.5 rounded-xl border bg-muted/20 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Buscar Endereço Automaticamente
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="h-8 text-xs flex items-center justify-center gap-1.5 bg-background font-medium hover:text-primary transition-colors shrink-0"
                >
                  {isLocating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="h-3.5 w-3.5 text-primary" />
                  )}
                  {isLocating ? "Identificando..." : "Usar minha localização atual (GPS)"}
                </Button>
              </div>

              {/* Input Autocomplete */}
              <div className="relative">
                <div className="relative">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ou digite o nome da rua, praça, ponto..."
                    className="pl-10 pr-9 h-10 bg-background text-sm"
                  />
                  {isSearchingGoogle && (
                    <Loader2 className="absolute right-3.5 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Lista de Previsões */}
                {predictions && predictions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-lg">
                    {predictions.map((p) => (
                      <div
                        key={p.placeId}
                        onClick={() => handleSelect(p)}
                        className="p-2.5 hover:bg-muted cursor-pointer text-xs border-b last:border-b-0 flex items-start gap-2"
                      >
                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-foreground">{p.mainText}</p>
                          <p className="text-muted-foreground text-[11px]">{p.secondaryText}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 3. Campos Detalhados do Endereço */}
            {/* Linha: CEP e Rua */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">CEP</Label>
                <Input
                  value={formCep}
                  onChange={handleCEPChange}
                  placeholder="00000-000"
                  className="h-10 font-medium text-sm"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Rua / Logradouro <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={formStreet}
                  onChange={(e) => setFormStreet(e.target.value)}
                  placeholder="Ex: Rua 14 de Julho, Av. Afonso Pena..."
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Linha: Número, Complemento e Bairro */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Número</Label>
                <Input
                  ref={numberInputRef}
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  placeholder="Ex: 539"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Complemento</Label>
                <Input
                  value={formComplement}
                  onChange={(e) => setFormComplement(e.target.value)}
                  placeholder="Ex: Sala 2, Bloco B, Box 10"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Bairro</Label>
                <Input
                  value={formNeighborhood}
                  onChange={(e) => setFormNeighborhood(e.target.value)}
                  placeholder="Ex: Vila Olinda"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Linha: Cidade e Estado */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-3 space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Cidade</Label>
                <Input
                  value={formCity}
                  onChange={(e) => setFormCity(e.target.value)}
                  placeholder="Ex: Campo Grande"
                  className="h-10 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">Estado (UF)</Label>
                <Input
                  value={formState}
                  onChange={(e) => setFormState(e.target.value.toUpperCase())}
                  placeholder="MS"
                  maxLength={2}
                  className="h-10 text-sm uppercase text-center font-bold"
                />
              </div>
            </div>

            {/* Opção de definir como ativo */}
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/20">
              <Label htmlFor="set-as-active" className="text-xs cursor-pointer select-none font-medium pr-4">
                Definir este endereço como <strong>ponto ativo da loja agora</strong>
              </Label>
              <Switch
                checked={formSetAsActive}
                onCheckedChange={setFormSetAsActive}
                id="set-as-active"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              className="h-9 px-4 text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveAddressModal}
              disabled={isSaving}
              className="h-9 px-5 text-xs font-medium"
            >
              {isSaving ? "Salvando..." : "Salvar Endereço"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
