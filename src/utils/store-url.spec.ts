import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatStoreHost,
  getPlatformBaseDomain,
  getStoreDomainSuffix,
  getStoreUrl,
  getWebhookApiBaseUrl,
} from "./store-url";
import { getApiBaseUrl } from "@/services/api";

describe("admin-lojapod: domínio padrão podipedir.com.br e suporte a lojapod.com", () => {
  const originalLocation = window.location;

  function mockLocation(hostname: string) {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...originalLocation,
        hostname,
        protocol: "https:",
        port: "",
      },
    });
  }

  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
    vi.unstubAllEnvs();
  });

  it("usa podipedir.com.br por padrão (inclusive em admin.podipedir.com.br)", () => {
    mockLocation("admin.podipedir.com.br");
    expect(getPlatformBaseDomain()).toBe("podipedir.com.br");
    expect(getStoreDomainSuffix()).toBe(".podipedir.com.br");
    expect(formatStoreHost("demo")).toBe("demo.podipedir.com.br");
    expect(getStoreUrl("demo")).toBe("https://demo.podipedir.com.br");
    expect(getStoreUrl("demo", "minhaloja.com.br")).toBe("https://minhaloja.com.br");
  });

  it("mantém links e sufixos em lojapod.com quando o painel roda em admin.lojapod.com", () => {
    mockLocation("admin.lojapod.com");
    expect(getPlatformBaseDomain()).toBe("lojapod.com");
    expect(getStoreDomainSuffix()).toBe(".lojapod.com");
    expect(formatStoreHost("demo")).toBe("demo.lojapod.com");
    expect(getStoreUrl("demo")).toBe("https://demo.lojapod.com");
  });

  it("troca a base da API e webhook para api.podipedir.com.br quando acessado por admin.podipedir.com.br", () => {
    vi.stubEnv("VITE_ADMIN_API", "https://api.lojapod.com/api");

    mockLocation("admin.podipedir.com.br");
    expect(getApiBaseUrl()).toBe("https://api.podipedir.com.br/api");
    expect(getWebhookApiBaseUrl()).toBe("https://api.podipedir.com.br/api");

    mockLocation("admin.lojapod.com");
    expect(getApiBaseUrl()).toBe("https://api.lojapod.com/api");
    expect(getWebhookApiBaseUrl()).toBe("https://api.lojapod.com/api");
  });
});
