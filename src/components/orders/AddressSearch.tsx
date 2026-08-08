import { useState, useRef } from "react";
import { MapPin, Search, Loader2, Check, ChevronLeft, X, Pencil, LocateFixed } from "lucide-react";
import { toast } from "sonner";
import useAddressAutocomplete from "@/hooks/use-address-autocomplete";
import { useSettings } from "@/hooks/useSettings";
type GeocoderAddressComponent = {
  long_name: string;
  types: string[];
};

type GeocoderResult = {
  place_id?: string;
  formatted_address: string;
  address_components: GeocoderAddressComponent[];
};

type BrowserGeocoder = {
  geocode: (request: { location: { lat: number; lng: number } }) => Promise<{ results: GeocoderResult[] }>;
};

export { };

declare global {
  interface Window {
    __googleMapsLoaded?: boolean;
  }
}

interface AddressPrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

export interface StructuredAddress {
  id?: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
  number?: string;
  complement: string;
  reference: string;
  noComplement: boolean;
  cep?: string;
  city?: string;
  state?: string;
}

interface AddressSearchProps {
  onSave: (address: StructuredAddress) => void;
  onCancel: () => void;
  initialAddress?: StructuredAddress | null;
}

const extractAddressPart = (components: GeocoderAddressComponent[], types: string[]) => {
  const component = components.find((item) => types.some((type) => item.types.includes(type)));
  return component?.long_name ?? "";
};

const extractAddressShortPart = (components: GeocoderAddressComponent[], types: string[]) => {
  const component = components.find((item) => types.some((type) => item.types.includes(type)));
  return (component as any)?.short_name ?? component?.long_name ?? "";
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

const AddressSearch = ({ onSave, onCancel, initialAddress }: AddressSearchProps) => {
  const [phase, setPhase] = useState<"search" | "details">("search");
  const [query, setQuery] = useState(initialAddress?.fullText || "");
  const [isLocating, setIsLocating] = useState(false);
  const { data: storeSettings } = useSettings();
  
  const [selected, setSelected] = useState<AddressPrediction | null>(
    initialAddress
      ? {
        placeId: initialAddress.id || "",
        mainText: initialAddress.mainText,
        secondaryText: initialAddress.secondaryText,
        fullText: initialAddress.fullText,
      }
      : null,
  );
  const [street, setStreet] = useState(initialAddress?.mainText || "");
  const [neighborhood, setNeighborhood] = useState(initialAddress?.secondaryText.split(",")[0]?.trim() || "");
  const [city, setCity] = useState(initialAddress?.city || storeSettings?.searchCity || "Campo Grande");
  const [state, setState] = useState(initialAddress?.state || "MS");
  const [number, setNumber] = useState("");
  const [cep, setCep] = useState(initialAddress?.cep || "");
  const [complement, setComplement] = useState(initialAddress?.complement || "");
  const [reference, setReference] = useState(initialAddress?.reference || "");
  const [noNumber, setNoNumber] = useState(false);
  const [noComplement, setNoComplement] = useState(initialAddress?.noComplement || false);
  const [manualEditAddress, setManualEditAddress] = useState(false);
  const [selectionMode, setSelectionMode] = useState<"manual" | "location" | null>(null);
  const [hasExtractedNumber, setHasExtractedNumber] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const extractNumberFromQuery = (text: string) => {
    const match = text.match(/(?:,|\s)(\d{1,6})\b/);
    return match ? match[1] : "";
  };
  const { predictions, loading: isLoading, handleSelect } = useAddressAutocomplete({
    value: query,
    searchSuffix: storeSettings?.searchSuffix,
    onSelect: async (p) => {
      const extractedNumber = extractNumberFromQuery(query);

      setSelected(p);
      setStreet(p.mainText);
      setNeighborhood(p.secondaryText.split(",")[0]?.trim() || "");

      try {
        const mapsReady = await waitForGoogleMaps();
        if (mapsReady) {
            const geocoder = new window.google!.maps!.Geocoder();
            const response = await geocoder.geocode({ placeId: p.placeId });
            const result = response.results[0];
            if (result) {
                const components = result.address_components;
                const fetchedCity = extractAddressPart(components, ["administrative_area_level_2"]);
                const fetchedState = extractAddressShortPart(components, ["administrative_area_level_1"]);
                const fetchedPostalCode = extractAddressPart(components, ["postal_code"]);
                if (fetchedPostalCode) {
                    let formatted = fetchedPostalCode.replace(/\D/g, "");
                    if (formatted.length > 0 && formatted.length < 8) {
                        formatted = formatted.padEnd(8, "0");
                    }
                    if (formatted.length > 5) formatted = formatted.substring(0, 5) + "-" + formatted.substring(5, 8);
                    setCep(formatted);
                }
                if (fetchedCity) setCity(fetchedCity);
                if (fetchedState) {
                  setState(fetchedState.toUpperCase());
                }
            }
        }
      } catch (err) {
        console.error("Failed to fetch place details", err);
      }

      if (extractedNumber) {
        setNumber(extractedNumber);
        setNoNumber(false);
        setHasExtractedNumber(true);
      } else {
        setHasExtractedNumber(false);
      }

      setSelectionMode("manual");
      setManualEditAddress(false);
      setPhase("details");
    }
  });
  const handleInputChange = (value: string) => {
    setQuery(value);
  };

  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Seu navegador não suporta localização.");
      return;
    }

    try {
      const permission = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });

      if (permission.state === "denied") {
        toast.error("Você bloqueou a localização. Ative nas configurações do navegador.");
        return;
      }

      setIsLocating(true);

      const mapsReady = await waitForGoogleMaps();

      if (!mapsReady) {
        toast.error("Google Maps não carregou.");
        setIsLocating(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async ({ coords }) => {
          try {
            const geocoder = new window.google!.maps!.Geocoder();

            const response = await geocoder.geocode({
              location: {
                lat: coords.latitude,
                lng: coords.longitude,
              },
            });

            const result = response.results[0];

            if (!result) {
              toast.error("Endereço não encontrado.");
              return;
            }

            const components = result.address_components;

            const route = extractAddressPart(components, ["route"]);
            const streetNumber = extractAddressPart(components, ["street_number"]);
            const neighborhood = extractAddressPart(components, [
              "sublocality",
              "neighborhood",
            ]);
            const city = extractAddressPart(components, ["administrative_area_level_2"]);
            const state = extractAddressShortPart(components, ["administrative_area_level_1"]);
            const postalCode = extractAddressPart(components, ["postal_code"]);

            const mainText = route || result.formatted_address.split(",")[0];
            const secondaryText = [neighborhood, city, state].filter(Boolean).join(", ");

            setSelected({
              placeId: result.place_id || crypto.randomUUID(),
              mainText,
              secondaryText,
              fullText: result.formatted_address,
            });

            setStreet(mainText);
            setNeighborhood(neighborhood);
            if (city) setCity(city);
            if (state) setState(state.toUpperCase());
            setNumber(streetNumber);
            if (postalCode) {
                let formatted = postalCode.replace(/\D/g, "");
                if (formatted.length > 0 && formatted.length < 8) {
                    formatted = formatted.padEnd(8, "0");
                }
                if (formatted.length > 5) formatted = formatted.substring(0, 5) + "-" + formatted.substring(5, 8);
                setCep(formatted);
            }
            setSelectionMode("location");
            setHasExtractedNumber(false);
            setPhase("details");
          } catch (err) {
            console.error(err);
            toast.error("Erro ao buscar endereço.");
          } finally {
            setIsLocating(false);
          }
        },
        (error) => {
          setIsLocating(false);

          switch (error.code) {
            case error.PERMISSION_DENIED:
              toast.error("Permissão negada.");
              break;
            case error.POSITION_UNAVAILABLE:
              toast.error("Localização indisponível.");
              break;
            case error.TIMEOUT:
              toast.error("Tempo esgotado.");
              break;
            default:
              toast.error("Erro ao obter localização.");
          }
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (err) {
      console.error(err);
      toast.error("Erro ao verificar permissão.");
    }
  };

  const handleSave = () => {
    if (!selected) return;

    if (!number.trim() && !noNumber) {
      toast.error("Informe o número");
      return;
    }

    let baseMainText = manualEditAddress && street.trim()
      ? street.trim()
      : selected.mainText;

    const secondaryText = manualEditAddress && neighborhood.trim()
      ? neighborhood.trim()
      : selected.secondaryText;

    const finalNumber = noNumber ? "s/n" : number.trim();

    const mainText = baseMainText.includes(finalNumber)
      ? baseMainText
      : `${baseMainText}, ${finalNumber}`;

    let streetWithoutNumber = baseMainText;
    if (finalNumber && finalNumber !== "s/n") {
       const regex = new RegExp(`(?:,\\s*|\\s+)${finalNumber}\\b\\s*$`, 'i');
       streetWithoutNumber = streetWithoutNumber.replace(regex, "").trim();
    }

    const fullText = [
      mainText,
      secondaryText
    ]
      .filter(Boolean)
      .join(", ");

    onSave({
      id: selected.placeId || crypto.randomUUID(),
      mainText: streetWithoutNumber,
      number: finalNumber,
      secondaryText,
      fullText,
      complement,
      reference,
      cep,
      city,
      state,
      noComplement,
    });
  };
  if (phase === "details" && selected) {
    const isLocationMode = selectionMode === "location";
    const showNumberField = true;
    const canSave = showNumberField
      ? (number || noNumber) && (complement || noComplement)
      : (complement || noComplement);

    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex items-center gap-3 border-b border-border px-4 py-4">
          <button
            type="button"
            onClick={() => setPhase("search")}
            className="rounded-full p-1 text-muted-foreground"
            aria-label="Voltar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-foreground">
              {isLocationMode && manualEditAddress ? street || selected.mainText : selected.mainText}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {isLocationMode && manualEditAddress ? neighborhood || selected.secondaryText : selected.secondaryText}
            </p>
          </div>
          {isLocationMode && (
            <button
              type="button"
              onClick={() => setManualEditAddress((current) => !current)}
              className="rounded-full p-1 text-muted-foreground"
              aria-label="Editar endereço"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
          {isLocationMode && manualEditAddress && (
            <>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Rua *</label>
                <input
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Rua"
                  className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Bairro *</label>
                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Bairro"
                  className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus:outline-none"
                />
              </div>
            </>
          )}

          {showNumberField && (
            <div>
              <input
                value={number}
                onChange={(e) => {
                  setNumber(e.target.value);
                  if (e.target.value) setNoNumber(false);
                }}
                placeholder="Número *"
                disabled={noNumber}
                className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus:outline-none disabled:opacity-50"
              />
              <label className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={noNumber}
                  onChange={(e) => {
                    setNoNumber(e.target.checked);
                    if (e.target.checked) setNumber("");
                  }}
                  className="h-5 w-5 rounded border-border accent-primary"
                />
                Endereço sem número
              </label>
            </div>
          )}

          <div>
            <input
              value={complement}
              onChange={(e) => {
                setComplement(e.target.value);
                if (e.target.value) setNoComplement(false);
              }}
              placeholder="Complemento *"
              disabled={noComplement}
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus:outline-none disabled:opacity-50"
            />
            <label className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={noComplement}
                onChange={(e) => {
                  setNoComplement(e.target.checked);
                  if (e.target.checked) setComplement("");
                }}
                className="h-5 w-5 rounded border-border accent-primary"
              />
              Endereço sem complemento
            </label>
          </div>

          <div>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ponto de referência (opcional)"
              className="h-14 w-full rounded-2xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground outline-none focus:outline-none"
            />
          </div>
        </div>

        <div className="border-t border-border p-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-2xl border border-border bg-background py-3 text-sm font-medium text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 text-sm font-semibold ${canSave ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
            >
              <Check className="h-4 w-4" />
              Salvar endereço
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex items-center gap-3 border-b border-border px-4 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1 text-muted-foreground"
          aria-label="Fechar busca de endereço"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="relative flex-1 rounded-xl border border-border bg-secondary">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            autoComplete="street-address"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Buscar endereço e número"
            className="h-12 w-full rounded-xl border-0 bg-transparent pl-11 pr-10 text-base text-foreground placeholder:text-muted-foreground outline-none focus:outline-none focus:ring-0"
          />
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {(isLoading || isLocating) && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="mb-4 flex w-full items-start gap-3 rounded-2xl border border-border bg-background px-4 py-4 text-left disabled:opacity-60"
        >
          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground">
            <LocateFixed className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Usar minha localização</p>
            <p className="text-sm text-muted-foreground">Preencher rua atual e continuar com número, complemento e referência</p>
          </div>
        </button>

        {query.length >= 3 && (
          <p className="mb-3 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
            powered by <span className="font-medium">Google</span>
          </p>
        )}

        {predictions.length > 0 && (
          <div className="space-y-1">
            {predictions.map((prediction, index) => (
              <button
                key={prediction.placeId}
                type="button"
                onClick={() => handleSelect(prediction)}
                className={`flex w-full items-start gap-3 py-4 text-left ${index !== predictions.length - 1 ? "border-b border-border" : ""
                  }`}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{prediction.mainText}</p>
                  <p className="text-sm text-muted-foreground">{prediction.secondaryText}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 3 && predictions.length === 0 && !isLoading && (
          <p className="rounded-2xl bg-background px-4 py-4 text-center text-sm text-muted-foreground">
            Nenhum endereço encontrado
          </p>
        )}
      </div>
    </div>
  );
};

export default AddressSearch;