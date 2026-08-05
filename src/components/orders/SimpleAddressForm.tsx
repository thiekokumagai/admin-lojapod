import { useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import useAddressAutocomplete from "@/hooks/use-address-autocomplete";
import type { CustomerAddress } from "@/services/customers.service";

interface SimpleAddressFormProps {
  onSave: (address: CustomerAddress) => void;
  onCancel: () => void;
}

const extractAddressPart = (components: any[], types: string[]) => {
  const component = components.find((item) => types.some((type) => item.types.includes(type)));
  return component?.long_name ?? "";
};

const extractAddressShortPart = (components: any[], types: string[]) => {
  const component = components.find((item) => types.some((type) => item.types.includes(type)));
  return component?.short_name ?? component?.long_name ?? "";
};

const waitForGoogleMaps = async () => {
  if (window.google?.maps) return true;
  await new Promise<void>((resolve) => {
    let attempts = 0;
    const interval = window.setInterval(() => {
      attempts++;
      if (window.google?.maps || window.__googleMapsLoaded || attempts >= 30) {
        window.clearInterval(interval);
        resolve();
      }
    }, 250);
  });
  return !!window.google?.maps;
};

export function SimpleAddressForm({ onSave, onCancel }: SimpleAddressFormProps) {
  const [query, setQuery] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cep, setCep] = useState("");
  const [complement, setComplement] = useState("");
  const [hasSelected, setHasSelected] = useState(false);

  const { predictions, loading: isSearching, handleSelect } = useAddressAutocomplete({
    value: query,
    restrictToCampoGrande: true,
    onSelect: async (p) => {
      const match = query.match(/(?:,|\s)(\d{1,6})\b/);
      const extractedNumber = match ? match[1] : "";

      setStreet(p.mainText.split(",")[0].trim());
      setNeighborhood(p.secondaryText.split(",")[0]?.trim() || "");
      if (extractedNumber) setNumber(extractedNumber);
      setQuery("");

      try {
        const mapsReady = await waitForGoogleMaps();
        if (mapsReady) {
          const geocoder = new window.google!.maps!.Geocoder();
          const response = await geocoder.geocode({ placeId: p.placeId });
          const result = response.results[0];
          if (result) {
            const components = result.address_components;
            const fetchedCity = extractAddressPart(components, ["administrative_area_level_2", "locality"]);
            const fetchedState = extractAddressShortPart(components, ["administrative_area_level_1"]);
            const fetchedPostalCode = extractAddressPart(components, ["postal_code"]);
            const fetchedStreetNumber = extractAddressPart(components, ["street_number"]);
            
            if (fetchedPostalCode) {
                let formatted = fetchedPostalCode.replace(/\D/g, "");
                if (formatted.length > 0 && formatted.length < 8) {
                    formatted = formatted.padEnd(8, "0");
                }
                if (formatted.length > 5) formatted = formatted.substring(0, 5) + "-" + formatted.substring(5, 8);
                setCep(formatted);
            }
            if (fetchedCity) setCity(fetchedCity);
            if (fetchedState) setState(fetchedState.toUpperCase());
            if (!extractedNumber && fetchedStreetNumber) setNumber(fetchedStreetNumber);
          }
        }
      } catch (err) {
        console.error("Failed to fetch place details", err);
      } finally {
        setHasSelected(true);
      }
    }
  });

  const handleSave = () => {
    onSave({
      id: "addr_" + Math.random().toString(36).substring(2, 11),
      street,
      number: number || "s/n",
      neighborhood,
      city,
      state,
      cep,
      complement,
      isDefault: false
    });
  };

  return (
    <div className="space-y-4 p-4 border border-slate-200 rounded-xl bg-slate-50 mt-3 relative">
      <div className="font-semibold text-slate-800">Novo Endereço</div>
      
      {/* Busca Google */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input 
          placeholder="Busque a rua no Google..." 
          className="pl-9 bg-white"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400" />
        )}
        
        {predictions.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {predictions.map((p, index) => (
              <div 
                key={p.placeId} 
                className={`p-3 cursor-pointer hover:bg-slate-50 flex items-start gap-3 ${index < predictions.length - 1 ? 'border-b border-slate-100' : ''}`}
                onClick={() => handleSelect(p)}
              >
                <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <div className="font-medium text-sm text-slate-700">{p.mainText}</div>
                  <div className="text-xs text-slate-500">{p.secondaryText}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {hasSelected && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Rua</Label>
              <Input value={street} onChange={e => setStreet(e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Número</Label>
              <Input value={number} onChange={e => setNumber(e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Bairro</Label>
              <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Complemento</Label>
              <Input value={complement} onChange={e => setComplement(e.target.value)} className="bg-white" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 font-semibold uppercase">Cidade</Label>
              <Input value={city} onChange={e => setCity(e.target.value)} className="bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase">Estado</Label>
                <Input value={state} onChange={e => setState(e.target.value)} maxLength={2} className="bg-white uppercase" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-500 font-semibold uppercase">CEP</Label>
                <Input value={cep} onChange={e => setCep(e.target.value)} className="bg-white" />
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-slate-200/60">
            <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
            <Button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white font-bold shadow-sm" disabled={!street}>
              Salvar Endereço
            </Button>
          </div>
        </>
      )}
      {!hasSelected && (
        <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-slate-200/60">
          <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        </div>
      )}
    </div>
  );
}
