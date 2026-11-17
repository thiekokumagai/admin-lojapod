import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StoreAddressesManager } from "./StoreAddressesManager";
import type { StoreSettings } from "@/types/settings";

// Nada de rede real: o Places (fetch) e o Geocoder do Google são mocks.
vi.mock("@/components/ui/use-toast", () => ({ toast: vi.fn(), useToast: () => ({ toast: vi.fn() }) }));

// Loja em Campo Grande/MS com restrição de entrega por raio: o caso do print.
const settings = {
  city: "Campo Grande",
  state: "MS",
  searchCity: "Campo Grande",
  searchState: "MS",
  restrictToCity: true,
  searchSuffix: ", Campo Grande, MS, Brasil",
  savedStoreAddresses: [],
} as unknown as StoreSettings;

const rondonopolis = {
  suggestions: [
    {
      placePrediction: {
        placeId: "place-rdo",
        text: { text: "Rua Goiânia, 2386 - Vila Birigui, Rondonópolis - MT, Brasil" },
        structuredFormat: {
          mainText: { text: "Rua Goiânia, 2386" },
          secondaryText: { text: "Vila Birigui, Rondonópolis - MT, Brasil" },
        },
      },
    },
  ],
};

const fetchMock = vi.fn();

function openNewLocationModal() {
  render(<StoreAddressesManager settings={settings} onSaveActiveAddress={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: /Adicionar Novo Local/ }));
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => rondonopolis, text: async () => "" });
  vi.stubGlobal("fetch", fetchMock);
  (window as unknown as { google?: unknown }).google = {
    maps: {
      Geocoder: class {
        geocode = vi.fn().mockResolvedValue({
          results: [
            {
              address_components: [
                { long_name: "Rondonópolis", short_name: "Rondonópolis", types: ["administrative_area_level_2", "political"] },
                { long_name: "Mato Grosso", short_name: "MT", types: ["administrative_area_level_1", "political"] },
                { long_name: "78700-000", short_name: "78700-000", types: ["postal_code"] },
              ],
            },
          ],
        });
      },
    },
  };
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete (window as unknown as { google?: unknown }).google;
});

describe("StoreAddressesManager - busca de endereço do local da loja", () => {
  it("abre o local novo sem cidade/UF fixas da loja (MS)", () => {
    openNewLocationModal();
    expect(screen.getByPlaceholderText("Ex: Campo Grande")).toHaveValue("");
    expect(screen.getByPlaceholderText("MS")).toHaveValue("");
  });

  it("mostra sugestões de outra cidade/UF mesmo com a loja em Campo Grande/MS", async () => {
    openNewLocationModal();
    fireEvent.change(screen.getByPlaceholderText(/Ou digite o nome da rua/), { target: { value: "rua goiânia, 2386 rondo" } });

    expect(await screen.findByText("Vila Birigui, Rondonópolis - MT, Brasil")).toBeInTheDocument();

    // Pedido ao provedor: só país BR, sem "Campo Grande/MS" no texto buscado
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://places.googleapis.com/v1/places:autocomplete");
    const body = JSON.parse(init.body);
    expect(body.includedRegionCodes).toEqual(["br"]);
    expect(body.input).toBe("rua goiânia, 2386 rondo, Brasil");
    expect(body.input).not.toMatch(/Campo Grande|MS/);
  });

  it("preenche cidade e UF do endereço escolhido (MT), não os da loja", async () => {
    openNewLocationModal();
    fireEvent.change(screen.getByPlaceholderText(/Ou digite o nome da rua/), { target: { value: "rua goiânia, 2386 rondo" } });
    fireEvent.click(await screen.findByText("Rua Goiânia, 2386"));

    await waitFor(() => expect(screen.getByPlaceholderText("MS")).toHaveValue("MT"));
    expect(screen.getByPlaceholderText("Ex: Campo Grande")).toHaveValue("Rondonópolis");
    expect(screen.getByPlaceholderText("00000-000")).toHaveValue("78700-000");
    expect(screen.getByPlaceholderText("Ex: Vila Olinda")).toHaveValue("Vila Birigui");
  });
});
