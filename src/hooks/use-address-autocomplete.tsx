import { useState, useEffect, useRef } from "react";
export interface AddressPrediction {
    placeId: string;
    mainText: string;
    secondaryText: string;
    fullText: string;
}

interface Props {
    value: string;
    onSelect: (prediction: AddressPrediction) => void;
    searchSuffix?: string;
    searchCity?: string;
    searchState?: string;
    restrictToCity?: boolean;
    restrictToCampoGrande?: boolean; // Compatibilidade com chamadas legadas
}

const useAddressAutocomplete = ({
    value,
    onSelect,
    searchSuffix = "",
    searchCity,
    searchState,
    restrictToCity = false,
    restrictToCampoGrande = false,
}: Props) => {
    const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

    const effectiveRestrict = restrictToCity || restrictToCampoGrande;
    const effectiveCity = searchCity || (restrictToCampoGrande ? "Campo Grande" : undefined);
    const effectiveState = searchState || (restrictToCampoGrande ? "MS" : undefined);

    useEffect(() => {
        if (!value || value.trim().length < 3) {
            setPredictions([]);
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            setLoading(true);

            try {
                const body: any = {
                    input: value.trim() + (searchSuffix ? searchSuffix : ""),
                    includedRegionCodes: ["br"],
                    languageCode: "pt-BR",
                };

                const res = await fetch(
                    "https://places.googleapis.com/v1/places:autocomplete",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_KEY,
                        },
                        body: JSON.stringify(body),
                    }
                );

                if (!res.ok) {
                    console.error(await res.text());
                    setPredictions([]);
                    return;
                }

                const data = await res.json();

                let formatted: AddressPrediction[] = (data.suggestions || []).map((s: any) => ({
                    placeId: s.placePrediction.placeId,
                    mainText:
                        s.placePrediction.structuredFormat?.mainText?.text || "",
                    secondaryText:
                        s.placePrediction.structuredFormat?.secondaryText?.text || "",
                    fullText: s.placePrediction.text?.text || "",
                }));

                // Se houver restrição ao raio/cidade da loja, filtrar predições de outras cidades e outros estados
                if (effectiveRestrict && (effectiveCity || effectiveState)) {
                    const norm = (str: string) =>
                        str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

                    const targetCity = effectiveCity ? norm(effectiveCity) : "";
                    const targetState = effectiveState ? norm(effectiveState) : "";

                    const filtered = formatted.filter((p) => {
                        const sec = norm(p.secondaryText);
                        const full = norm(p.fullText);

                        const matchesCity = targetCity ? (sec.includes(targetCity) || full.includes(targetCity)) : true;
                        const matchesState = targetState ? (
                            sec.includes(`- ${targetState}`) ||
                            sec.includes(`, ${targetState}`) ||
                            sec.includes(` ${targetState},`) ||
                            sec.includes(`/${targetState}`) ||
                            full.includes(`- ${targetState}`) ||
                            full.includes(`, ${targetState}`)
                        ) : true;

                        return matchesCity && matchesState;
                    });

                    formatted = filtered;
                }

                setPredictions(formatted);
            } catch (err) {
                console.error(err);
                setPredictions([]);
            } finally {
                setLoading(false);
            }
        }, 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value, searchSuffix, effectiveRestrict, effectiveCity, effectiveState]);

    return {
        predictions,
        loading,
        handleSelect: (p: AddressPrediction) => {
            setPredictions([]);
            onSelect(p);
        },
    };
};

export default useAddressAutocomplete;