import { useCallback, useState } from "react";
import { useSettings } from "@/hooks/useSettings";

type FreightResult = {
    distanceKm: number;
    duration: string;
    freightPrice: number | null;
    error: string | null;
};

type FreightError = {
    error: string;
    distanceKm?: number;
};

type DeliveryRange = {
    id: string;
    distancia: number;
    valor: number;
};

function getFreightPrice(distanceKm: number, ranges: DeliveryRange[]): number | null {
    if (!ranges || ranges.length === 0) return null;
    
    // Assegurar que as faixas estão ordenadas por distância
    const sortedRanges = [...ranges].sort((a, b) => a.distancia - b.distancia);
    
    for (const tier of sortedRanges) {
        if (distanceKm <= tier.distancia) return tier.valor;
    }
    return null;
}

function validateDistance(
    distanceKm: number, 
    ranges: DeliveryRange[], 
    allowAboveMax: boolean
): FreightError | null {
    if (!ranges || ranges.length === 0) return null;

    const km = Math.round(distanceKm * 10) / 10;
    const maxDistance = Math.max(...ranges.map(r => r.distancia));

    if (km > maxDistance && !allowAboveMax) {
        return {
            error: `Endereço fora da área de entrega (máximo ${maxDistance}km).`,
            distanceKm: km,
        };
    }

    return null;
}

async function fetchRoute(origin: string, destination: string) {
    const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": import.meta.env.VITE_GOOGLE_MAPS_KEY,
                "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
            },
            body: JSON.stringify({
                origin: { address: origin },
                destination: { address: destination },
                travelMode: "DRIVE",
            }),
        }
    );

    const data = await response.json();

    if (!response.ok || !data.routes?.length) {
        throw new Error("Não foi possível calcular a rota");
    }

    return data.routes[0];
}

export function useFreight() {
    const { data: storeSettings } = useSettings();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [distanceKm, setDistanceKm] = useState<number | null>(null);
    const [price, setPrice] = useState<number | null>(null);

    const calculate = useCallback(async (destination: string) => {
        try {
            setLoading(true);
            setError(null);

            if (!destination) {
                setError("Endereço de destino é obrigatório");
                return null;
            }

            // Fallback origin if missing
            const cep = storeSettings?.deliveryOriginCep || "79000-000";
            const num = storeSettings?.deliveryOriginNumber || "";
            const originAddress = `CEP ${cep}, ${num}, Brasil`;

            const route = await fetchRoute(originAddress, destination);

            const km = route.distanceMeters / 1000;
            const duration = route.duration;

            const ranges = storeSettings?.deliveryRanges?.ranges || [];
            const allowAboveMax = !!storeSettings?.deliveryRanges?.allowAboveMax;

            const validationError = validateDistance(km, ranges, allowAboveMax);
            if (validationError) return validationError;
            
            const freightPrice = getFreightPrice(km, ranges);

            const result: FreightResult = {
                distanceKm: Math.round(km * 10) / 10,
                duration,
                freightPrice,
                error: null,
            };

            setDistanceKm(result.distanceKm);
            setPrice(result.freightPrice);
            setError(null);

            return result;
        } catch (err) {
            setError("Erro ao calcular frete");
            return null;
        } finally {
            setLoading(false);
        }
    }, [storeSettings]);

    return {
        calculate,
        loading,
        error,
        distanceKm,
        price,
    };
}