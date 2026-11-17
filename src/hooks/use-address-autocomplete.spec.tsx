import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import useAddressAutocomplete from "./use-address-autocomplete";

// Provedor mockado: nenhuma chamada real ao Google.
const suggestion = (placeId: string, main: string, secondary: string) => ({
  placePrediction: {
    placeId,
    text: { text: `${main}, ${secondary}` },
    structuredFormat: { mainText: { text: main }, secondaryText: { text: secondary } },
  },
});

const response = {
  suggestions: [
    suggestion("cg", "Rua Goiânia", "Jardim Veraneio, Campo Grande - MS, Brasil"),
    suggestion("rdo", "Rua Goiânia", "Vila Birigui, Rondonópolis - MT, Brasil"),
  ],
};

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => response, text: async () => "" }));
});
afterEach(() => vi.unstubAllGlobals());

const ids = (list: { placeId: string }[]) => list.map((p) => p.placeId);

describe("useAddressAutocomplete", () => {
  it("sem restrição de cidade: sugestões de todo o Brasil", async () => {
    const { result } = renderHook(() =>
      useAddressAutocomplete({ value: "rua goiânia 2386", onSelect: vi.fn(), searchSuffix: ", Brasil" }),
    );
    await waitFor(() => expect(result.current.predictions).toHaveLength(2));
    expect(ids(result.current.predictions)).toEqual(["cg", "rdo"]);
  });

  it("com restrição à cidade da loja (entrega do cliente), continua filtrando por cidade e UF", async () => {
    const { result } = renderHook(() =>
      useAddressAutocomplete({
        value: "rua goiânia 2386",
        onSelect: vi.fn(),
        searchSuffix: ", Campo Grande, MS, Brasil",
        searchCity: "Campo Grande",
        searchState: "MS",
        restrictToCity: true,
      }),
    );
    await waitFor(() => expect(result.current.predictions).toHaveLength(1));
    expect(ids(result.current.predictions)).toEqual(["cg"]);
  });
});
