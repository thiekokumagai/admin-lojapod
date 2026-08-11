export interface FreightAddressInput {
  street?: string;
  logradouro?: string;
  mainText?: string;
  number?: string;
  numero?: string;
  neighborhood?: string;
  bairro?: string;
  city?: string;
  cidade?: string;
  state?: string;
  uf?: string;
  secondaryText?: string;
  fullText?: string;
  complement?: string;
  complemento?: string;
}

/**
 * Normaliza o endereço de destino para envio à API do Google Maps (computeRoutes).
 * Remove complementos/referências, trata números "s/n", evita duplicação de número na rua.
 */
export function formatFreightDestinationAddress(
  address: FreightAddressInput | string | null | undefined
): string {
  if (!address) return "";

  if (typeof address === "string") {
    return cleanAddressString(address);
  }

  const rawStreet = (address.street || address.logradouro || address.mainText || "").trim();
  const rawNum = (address.number || address.numero || "").trim();
  const neighborhood = (address.neighborhood || address.bairro || "").trim();
  const city = (address.city || address.cidade || "").trim();
  const state = (address.state || address.uf || "").trim();
  const secondaryText = (address.secondaryText || "").trim();
  const fullText = (address.fullText || "").trim();

  if (rawStreet) {
    let street = cleanStreetName(rawStreet);

    if (isValidNumber(rawNum)) {
      const numAtEndRegex = new RegExp(`(?:,\\s*|\\s+)(?:n[ºo]?\\s*)?${escapeRegExp(rawNum)}$`, "i");
      if (!numAtEndRegex.test(street)) {
        street = `${street}, ${rawNum}`;
      }
    }

    if (secondaryText) {
      const parts = [street, secondaryText].filter(Boolean);
      return cleanAddressString(parts.join(", "));
    }

    const parts = [street, neighborhood, city, state].filter(Boolean);
    return cleanAddressString(parts.join(", "));
  }

  if (fullText) {
    return cleanAddressString(fullText);
  }

  return "";
}

function isValidNumber(num: string): boolean {
  if (!num) return false;
  const clean = num.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean !== "" && clean !== "sn" && clean !== "0" && clean !== "semnumero";
}

function cleanStreetName(street: string): string {
  return street.replace(/,?\s*(?:s\/n|sn|sem\s*n[úu]mero)\.?$/i, "").trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cleanAddressString(addrStr: string): string {
  if (!addrStr) return "";

  let cleaned = addrStr.replace(/(?:,\s*|\s+)(?:s\/n|sn|sem\s*n[úu]mero)\.?(?=,|$)/gi, "");
  cleaned = cleaned.replace(/,\s*,/g, ",").replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/,\s*$/, "");

  return cleaned;
}
