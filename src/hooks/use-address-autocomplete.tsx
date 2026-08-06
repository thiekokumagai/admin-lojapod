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
    restrictToCampoGrande?: boolean;
}

const useAddressAutocomplete = ({
    value,
    onSelect,
    restrictToCampoGrande = false,
}: Props) => {
    const [predictions, setPredictions] = useState<AddressPrediction[]>([]);
    const [loading, setLoading] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout>>();

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
                    input: value.trim(),
                    includedRegionCodes: ["br"],
                    languageCode: "pt-BR",
                };
                if (restrictToCampoGrande) {
                    body.locationRestriction = {
                        circle: {
                            center: {
                                latitude: -20.4697,
                                longitude: -54.6201,
                            },
                            radius: 30000,
                        },
                    };

                    body.input = value.trim() + ", Campo Grande, MS, Brasil";
                }

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

                const formatted = (data.suggestions || []).map((s: any) => ({
                    placeId: s.placePrediction.placeId,
                    mainText:
                        s.placePrediction.structuredFormat?.mainText?.text || "",
                    secondaryText:
                        s.placePrediction.structuredFormat?.secondaryText?.text || "",
                    fullText: s.placePrediction.text?.text || "",
                }));

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
    }, [value, restrictToCampoGrande]);

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